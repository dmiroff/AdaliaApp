import React, {useEffect, useState} from 'react';
import {Alert, Button, Card, Col, Container, Form, Row, Spinner, Table} from 'react-bootstrap';
import api from '../http/apiClient';

const labels={vk:'ВКонтакте',telegram:'Telegram',max:'MAX',discord:'Discord'};
const activePlatforms=['vk','telegram','max'];
const phases={draft:'Черновик',planned:'Запланирован',pending:'Ожидает',sending:'Отправляется',posted:'Отправлен',scheduled:'Отложен в ВК',excluded:'Исключён',unknown:'Нужна проверка',failed:'Ошибка'};
const moscowInput=stamp=>stamp?new Date(stamp*1000+3*3600000).toISOString().slice(0,16):'';
const toTimestamp=value=>value?Math.floor(new Date(value+':00+03:00').getTime()/1000):null;
const tomorrow=()=>new Date(Date.now()+86400000+3*3600000).toISOString().slice(0,10);

export default function Admin(){
 const [data,setData]=useState(null),[config,setConfig]=useState(null),[selected,setSelected]=useState(null);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[start,setStart]=useState(tomorrow);
 const [image,setImage]=useState('');
 const selectedId=selected?.isNew?'new':selected?.id,selectedImage=selected?.image,previewFile=selected?.previewFile;
 useEffect(()=>{if(selectedId)document.getElementById('post-editor')?.scrollIntoView({behavior:'smooth',block:'start'});},[selectedId]);
 const accept=value=>{setData(value);setConfig({...value.settings,platforms:value.settings.platforms.filter(p=>activePlatforms.includes(p))});};
 const act=async(callback)=>{setBusy(true);setError('');try{await callback();}catch(e){setError(e.response?.data?.detail||'Не удалось выполнить действие.');}finally{setBusy(false);}};
 useEffect(()=>{act(async()=>accept((await api.get('/admin/posts')).data));},[]);
 useEffect(()=>{
  let url;let stopped=false;setImage('');
  if(selectedId==='new'&&previewFile){url=URL.createObjectURL(previewFile);setImage(url);}
  else if(selectedId&&selectedId!=='new') api.get(`/admin/posts/${selectedId}/image`,{responseType:'blob'}).then(r=>{
   if(!stopped){url=URL.createObjectURL(r.data);setImage(url);}
  }).catch(()=>{});
  return()=>{stopped=true;if(url)URL.revokeObjectURL(url);};
 },[selectedId,selectedImage,previewFile]);
 const refresh=async()=>accept((await api.get('/admin/posts')).data);
 const save=()=>act(async()=>{
  const body={title:selected.title,text:selected.text,image:selected.image,date:toTimestamp(selected.localDate)};
  const response=selected.isNew?await api.post('/admin/posts',body):await api.put(`/admin/posts/${selected.id}`,{...body,revision:selected.revision},{timeout:180000});
  accept(response.data);setSelected(null);setNotice('Пост сохранён.');
 });
 const include=(post,value)=>act(async()=>{
  if(!value&&post.deliveries.vk?.phase==='scheduled'&&!window.confirm('Исключить пост из очереди и убрать его отложенную запись из ВК?'))return;
  const before=data;
  setData({...data,posts:data.posts.map(p=>p.id===post.id?{...p,included:value}:p)});
  try{accept((await api.post(`/admin/posts/${post.id}/included`,{revision:post.revision,included:value},{timeout:60000})).data);}
  catch(error){setData(before);throw error;}
 });
 const move=(post,direction)=>act(async()=>{try{accept((await api.post(`/admin/posts/${post.id}/move`,{direction},{timeout:180000})).data);}catch(error){await refresh();throw error;}});
 const resolve=(post,platform)=>act(async()=>{
  const id=window.prompt('ID уже опубликованной записи. Для повторной отправки введите ПОВТОР только после проверки, что записи нет.');
  if(!id)return;
  if(id==='ПОВТОР'&&!window.confirm('Вы проверили площадку и убедились, что неотправленных частей поста там нет?'))return;
  accept((await api.post(`/admin/posts/${post.id}/resolve`,{platform,remote_id:id==='ПОВТОР'?null:id,retry:id==='ПОВТОР'})).data);
 });
 if(!data)return <Container className="mt-5 pt-4">{error?<Alert variant="danger">{error}</Alert>:<Spinner animation="border"/>}</Container>;
 return <Container className="mt-5 pt-4 pb-5">
  <div className="fantasy-paper p-3 mb-3"><h1>Публикации Адалии</h1><p className="text-muted mb-0">{data.posts.length} тем #Правки · в очереди {data.posts.filter(p=>p.included!==false).length} · даты по московскому времени</p></div>
  {error&&<Alert variant="danger">{error}</Alert>}{notice&&<Alert variant="success" dismissible onClose={()=>setNotice('')}>{notice}</Alert>}
  {data.vk_sync_warning&&<Alert variant="warning">{data.vk_sync_warning}</Alert>}
  {data.queue_warning&&<Alert variant="warning">{data.queue_warning}</Alert>}
  {!data.main_deployment&&<Alert variant="info">Тестовый редактор: автоматическая отправка отсюда отключена. Для публикаций используйте основной сайт.</Alert>}
  <Card className="mb-4"><Card.Body>
   <h2 className="h5">Каналы и расписание</h2>
   <Row>{Object.entries(labels).filter(([p])=>activePlatforms.includes(p)).map(([p,label])=><Col md={6} key={p} className="mb-3">
    <Form.Check label={label} checked={config.platforms.includes(p)} disabled={busy} onChange={e=>setConfig({...config,platforms:e.target.checked?[...config.platforms,p]:config.platforms.filter(x=>x!==p)})}/>
    <Form.Control aria-label={`Канал ${label}`} placeholder={p==='telegram'?'@канал или числовой ID':'Числовой ID канала'} value={config.targets[p]||''} disabled={p==='vk'||busy} onChange={e=>setConfig({...config,targets:{...config.targets,[p]:e.target.value}})}/>
    <small className="text-muted">{data.credentials[p]?'Токен настроен на сервере':'Токен не настроен'}</small>
    {p==='max'&&<div className="mt-2">
     {!!data.max_channels?.length&&<Form.Select aria-label="Найденный канал MAX" value={config.targets.max||''} disabled={busy} onChange={e=>setConfig({...config,targets:{...config.targets,max:e.target.value}})}>
      <option value="">Выберите найденный канал</option>{data.max_channels.map(channel=><option key={channel.target} value={channel.target}>{channel.title} · {channel.target}</option>)}
     </Form.Select>}
     <small className="text-muted d-block">Чтобы канал появился здесь, добавьте бота администратором с правом публикации, затем разместите сообщение в канале и обновите список.</small>
     <Button size="sm" className="mt-1" variant="outline-secondary" disabled={busy} onClick={()=>act(async()=>{const value=(await api.get('/admin/posts')).data;setData(value);setNotice('Список найденных каналов обновлён.');})}>Обновить найденные каналы</Button>
    </div>}

    {p!=='vk'&&<div className="mt-2"><Button size="sm" variant="outline-secondary" disabled={busy||!config.targets[p]} onClick={()=>act(async()=>{
     const r=await api.post('/admin/posts/channel-check',{platform:p,target:config.targets[p]});
     if(r.data.ok)setNotice(`${label}: ${r.data.message}`);else setError(`${label}: ${r.data.message}`);
    })}>Проверить канал и права бота</Button></div>}
   </Col>)}</Row>
   <Row className="mb-3">{config.times.map((value,i)=><Col key={i} xs={6} md={3}><Form.Label>Пост {i+1}, МСК</Form.Label><Form.Control type="time" value={value} onChange={e=>setConfig({...config,times:config.times.map((v,j)=>i===j?e.target.value:v)})}/></Col>)}</Row>
   <Form.Check className="mb-3" type="switch" label="Автоматически публиковать по расписанию" checked={config.enabled} disabled={!data.main_deployment||busy} onChange={e=>setConfig({...config,enabled:e.target.checked})}/>
   <Button disabled={busy} onClick={()=>act(async()=>{accept((await api.put('/admin/posts/settings',config)).data);setNotice('Настройки сохранены.');})}>Сохранить настройки</Button>{' '}
   <Button variant="outline-secondary" disabled={busy} onClick={()=>act(async()=>{const r=await api.get('/admin/posts/vk-check',{timeout:60000});if(r.data.ok){setNotice(r.data.message);if(r.data.catalogue)accept(r.data.catalogue);}else setError(r.data.message);})}>Проверить ВК</Button>
   <p className="mt-3 mb-0 text-muted">Для ВК используется настроенный пользовательский токен администратора сообщества с правами на стену и фотографии.</p>
  </Card.Body></Card>
  <Row className="align-items-end mb-4"><Col xs={12} md={4}><Form.Label>Начать серию с даты, МСК</Form.Label><Form.Control type="date" value={start} onChange={e=>setStart(e.target.value)}/></Col><Col className="mt-2"><Button disabled={busy} onClick={()=>act(async()=>{
   if(!window.confirm('Распределить все неотправленные посты по двум выбранным временам в день?'))return;
   await api.put('/admin/posts/settings',{...config,enabled:false});
   accept((await api.post('/admin/posts/schedule',{start_day:start})).data);setNotice('Расписание сохранено. Проверьте даты и включите автопубликацию.');
  })}>Назначить даты: 2 поста в день</Button>{' '}<Button variant="outline-secondary" disabled={busy} onClick={()=>act(refresh)}>Обновить статусы</Button></Col></Row>
  <div className="d-flex flex-wrap gap-2 mb-4">
   <Button disabled={busy} onClick={()=>setSelected({isNew:true,title:'',text:'',image:'',localDate:'',editable:true})}>Добавить пост</Button>
   <Button variant="outline-primary" disabled={busy||!data.main_deployment||data.settings.enabled||!data.credentials.vk} onClick={()=>act(async()=>{
    if(!window.confirm('Создать отложенные записи в ВК для включённых постов с назначенными датами? ВК опубликует их по расписанию.'))return;
    try {
     accept((await api.post('/admin/posts/vk-postpone',null,{timeout:1800000})).data);
     setNotice('Отложенные записи созданы в ВК. Их публикацией управляет ВКонтакте.');
    } catch(error) {
     try {await refresh();} catch(refreshError) { /* Keep the original publication error. */ }
     throw error;
    }
   })}>Создать отложенные записи ВК</Button>
   <Button variant="success" disabled={busy||!data.main_deployment} onClick={()=>act(async()=>{
    if(!window.confirm('Включить автопубликацию ВК для всех включённых постов, по 2 в день? Уже опубликованные и отложенные записи сохранятся.'))return;
    await api.put('/admin/posts/settings',{...config,enabled:false,platforms:['vk']});
    accept((await api.post('/admin/posts/vk-series',{start_day:start},{timeout:60000})).data);
    setNotice('Автопостинг ВК включён для всей очереди. Расписание: 10:00 и 18:00 МСК либо выбранные вами два времени.');
   })}>ВК: автопостинг всей очереди</Button>
  </div>
  {data.settings.enabled&&<p className="text-muted">Для создания отложенных записей ВК выключите автоматическую публикацию и сохраните настройки.</p>}
  <p className="text-muted">Включайте и исключайте темы ниже. Стрелки меняют порядок черновиков и переставляют даты у двух запланированных тем. Для новой темы сначала можно выбрать дату в карточке. Отложенный в ВК пост можно изменить до публикации.</p>
  {selected&&<Card id="post-editor" className="mb-4" style={{scrollMarginTop:100}}><Card.Body><h2 className="h5">{selected.isNew?'Новый пост':`Пост ${selected.id}`}</h2>
   {!selected.editable&&<Alert variant="info">Запись уже отправлена или требует проверки. Текст доступен для просмотра.</Alert>}
   {image&&<img alt={selected.title} src={image} style={{maxWidth:'100%',maxHeight:320,objectFit:'contain'}}/>}
   <Form.Group controlId="post-title" className="mb-3"><Form.Label>Заголовок</Form.Label><Form.Control value={selected.title} disabled={!selected.editable} onChange={e=>setSelected({...selected,title:e.target.value})}/></Form.Group>
   <Form.Group controlId="post-text" className="mb-3"><Form.Label>Текст</Form.Label><Form.Control as="textarea" rows={14} maxLength={3500} value={selected.text} disabled={!selected.editable} onChange={e=>setSelected({...selected,text:e.target.value})}/><small>{selected.text.length}/3500</small></Form.Group>
   <Form.Group controlId="post-image" className="mb-3"><Form.Label>Картинка</Form.Label><Form.Control type="file" accept="image/png,image/jpeg,image/webp" disabled={!selected.editable||busy} onChange={e=>{const file=e.target.files[0];if(file)act(async()=>{const r=await api.post('/admin/media/images?category=posts',file,{headers:{'Content-Type':file.type}});setSelected({...selected,image:r.data.path,previewFile:selected.isNew?file:undefined});});}}/></Form.Group>
   <Form.Group controlId="post-date" className="mb-3"><Form.Label>Дата и время, МСК</Form.Label><Form.Control type="datetime-local" value={selected.localDate} disabled={!selected.editable} onChange={e=>setSelected({...selected,localDate:e.target.value})}/></Form.Group>
   <Button disabled={busy||!selected.editable||!selected.title.trim()||!selected.text.trim()||!selected.image} onClick={save}>Сохранить пост</Button>{' '}<Button variant="outline-secondary" onClick={()=>setSelected(null)}>Закрыть</Button>
  </Card.Body></Card>}
  <Table responsive hover><thead><tr><th>В очереди</th><th>Тема</th><th>Дата, МСК</th><th>Площадки</th><th/></tr></thead><tbody>{data.posts.map((p,index)=><tr key={p.key}>
   <td><Form.Check aria-label={`Включить пост ${p.id}`} checked={p.included!==false} disabled={busy||!!p.remote_change||Object.values(p.deliveries).some(d=>['sending','unknown'].includes(d.phase))} onChange={e=>include(p,e.target.checked)}/></td>
   <td>{index+1}. {p.title}<br/><small>{p.included===false?'Исключён из очереди':phases[p.phase]||p.phase}</small>{p.remote_change&&<small className="d-block text-warning">Изменение ВК требует проверки. Нажмите «Проверить ВК».</small>}</td>
   <td>{p.date?new Date(p.date*1000).toLocaleString('ru-RU',{timeZone:'Europe/Moscow'}):'Не задана'}</td>
   <td>{Object.entries(p.deliveries).map(([platform,d])=><div key={platform}>{labels[platform]}: {phases[d.phase]||d.phase}{d.remote_id&&(platform==='vk'&&/^\d+$/.test(String(d.remote_id))?<a className="ms-1" href={`https://vk.com/wall-218992880_${d.remote_id}`} target="_blank" rel="noopener noreferrer">Открыть в ВК</a>:` · ${d.remote_id}`)}{d.error&&<small className="d-block text-danger">{d.error}</small>}{['unknown','failed','sending'].includes(d.phase)&&<Button size="sm" variant="outline-warning" disabled={busy} onClick={()=>resolve(p,platform)}>Проверено: привязать / повторить</Button>}</div>)}</td>
   <td><div className="d-flex gap-1 mb-1"><Button size="sm" variant="outline-secondary" aria-label={`Поднять пост ${p.id}`} disabled={busy||index===0} onClick={()=>move(p,'up')}>↑</Button><Button size="sm" variant="outline-secondary" aria-label={`Опустить пост ${p.id}`} disabled={busy||index===data.posts.length-1} onClick={()=>move(p,'down')}>↓</Button></div><Button size="sm" variant="outline-primary" onClick={()=>setSelected({...p,localDate:moscowInput(p.date)})}>Открыть</Button></td>
  </tr>)}</tbody></Table>

 </Container>;
}
