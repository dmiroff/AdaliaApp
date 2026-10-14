import React, {useEffect, useState} from 'react';
import {Alert, Button, Card, Col, Container, Form, Row, Spinner, Table} from 'react-bootstrap';
import api from '../http/apiClient';

const labels={vk:'ВКонтакте',telegram:'Telegram',max:'MAX',discord:'Discord'};
const activePlatforms=['vk','telegram','max'];
const phases={draft:'Черновик',planned:'Запланирован',pending:'Ожидает',sending:'Отправляется',posted:'Отправлен',unknown:'Нужна проверка',failed:'Ошибка'};
const moscowInput=stamp=>stamp?new Date(stamp*1000+3*3600000).toISOString().slice(0,16):'';
const toTimestamp=value=>value?Math.floor(new Date(value+':00+03:00').getTime()/1000):null;
const tomorrow=()=>new Date(Date.now()+86400000+3*3600000).toISOString().slice(0,10);

export default function Admin(){
 const [data,setData]=useState(null),[config,setConfig]=useState(null),[selected,setSelected]=useState(null);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[start,setStart]=useState(tomorrow);
 const [image,setImage]=useState('');
 const selectedId=selected?.id,selectedImage=selected?.image;
 useEffect(()=>{if(selectedId)document.getElementById('post-editor')?.scrollIntoView({behavior:'smooth',block:'start'});},[selectedId]);
 const accept=value=>{setData(value);setConfig({...value.settings,platforms:value.settings.platforms.filter(p=>activePlatforms.includes(p))});};
 const act=async(callback)=>{setBusy(true);setError('');try{await callback();}catch(e){setError(e.response?.data?.detail||'Не удалось выполнить действие.');}finally{setBusy(false);}};
 useEffect(()=>{act(async()=>accept((await api.get('/admin/posts')).data));},[]);
 useEffect(()=>{
  let url;let stopped=false;setImage('');
  if(selectedId) api.get(`/admin/posts/${selectedId}/image`,{responseType:'blob'}).then(r=>{
   if(!stopped){url=URL.createObjectURL(r.data);setImage(url);}
  }).catch(()=>{});
  return()=>{stopped=true;if(url)URL.revokeObjectURL(url);};
 },[selectedId,selectedImage]);
 const refresh=async()=>accept((await api.get('/admin/posts')).data);
 const save=()=>act(async()=>{
  accept((await api.put(`/admin/posts/${selected.id}`,{revision:selected.revision,title:selected.title,text:selected.text,image:selected.image,date:toTimestamp(selected.localDate)})).data);
  setSelected(null);setNotice('Пост сохранён.');
 });
 const resolve=(post,platform)=>act(async()=>{
  const id=window.prompt('ID уже опубликованной записи. Для повторной отправки введите ПОВТОР только после проверки, что записи нет.');
  if(!id)return;
  if(id==='ПОВТОР'&&!window.confirm('Вы проверили площадку и убедились, что неотправленных частей поста там нет?'))return;
  accept((await api.post(`/admin/posts/${post.id}/resolve`,{platform,remote_id:id==='ПОВТОР'?null:id,retry:id==='ПОВТОР'})).data);
 });
 if(!data)return <Container className="mt-5 pt-4">{error?<Alert variant="danger">{error}</Alert>:<Spinner animation="border"/>}</Container>;
 return <Container className="mt-5 pt-4 pb-5">
  <div className="fantasy-paper p-3 mb-3"><h1>Публикации Адалии</h1><p className="text-muted mb-0">{data.posts.length} тем #Правки · расписание и даты по московскому времени</p></div>
  {error&&<Alert variant="danger">{error}</Alert>}{notice&&<Alert variant="success" dismissible onClose={()=>setNotice('')}>{notice}</Alert>}
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
   <Button variant="outline-secondary" disabled={busy} onClick={()=>act(async()=>{const r=await api.get('/admin/posts/vk-check');if(r.data.ok){setNotice(r.data.message);if(r.data.catalogue)accept(r.data.catalogue);}else setError(r.data.message);})}>Проверить ВК</Button>
   <p className="mt-3 mb-0 text-muted">Для ВК нужен пользовательский токен администратора с правами wall и photos в VK_WALL_TOKEN. Токены вводятся в окружение сервера.</p>
  </Card.Body></Card>
  <Row className="align-items-end mb-4"><Col xs={12} md={4}><Form.Label>Начать серию с даты, МСК</Form.Label><Form.Control type="date" value={start} onChange={e=>setStart(e.target.value)}/></Col><Col className="mt-2"><Button disabled={busy} onClick={()=>act(async()=>{
   if(!window.confirm('Распределить все неотправленные посты по двум выбранным временам в день?'))return;
   await api.put('/admin/posts/settings',{...config,enabled:false});
   accept((await api.post('/admin/posts/schedule',{start_day:start})).data);setNotice('Расписание сохранено. Проверьте даты и включите автопубликацию.');
  })}>Назначить даты: 2 поста в день</Button>{' '}<Button variant="outline-secondary" disabled={busy} onClick={()=>act(refresh)}>Обновить статусы</Button></Col></Row>
  {selected&&<Card id="post-editor" className="mb-4" style={{scrollMarginTop:100}}><Card.Body><h2 className="h5">Пост {selected.id}</h2>
   {!selected.editable&&<Alert variant="info">Запись уже отправлена или требует проверки. Текст доступен для просмотра.</Alert>}
   {image&&<img alt={selected.title} src={image} style={{maxWidth:'100%',maxHeight:320,objectFit:'contain'}}/>}
   <Form.Group controlId="post-title" className="mb-3"><Form.Label>Заголовок</Form.Label><Form.Control value={selected.title} disabled={!selected.editable} onChange={e=>setSelected({...selected,title:e.target.value})}/></Form.Group>
   <Form.Group controlId="post-text" className="mb-3"><Form.Label>Текст</Form.Label><Form.Control as="textarea" rows={14} maxLength={3500} value={selected.text} disabled={!selected.editable} onChange={e=>setSelected({...selected,text:e.target.value})}/><small>{selected.text.length}/3500</small></Form.Group>
   <Form.Group controlId="post-image" className="mb-3"><Form.Label>Картинка</Form.Label><Form.Control type="file" accept="image/png,image/jpeg,image/webp" disabled={!selected.editable||busy} onChange={e=>{const file=e.target.files[0];if(file)act(async()=>{const r=await api.post('/admin/media/images?category=posts',file,{headers:{'Content-Type':file.type}});setSelected({...selected,image:r.data.path});});}}/></Form.Group>
   <Form.Group controlId="post-date" className="mb-3"><Form.Label>Дата и время, МСК</Form.Label><Form.Control type="datetime-local" value={selected.localDate} disabled={!selected.editable} onChange={e=>setSelected({...selected,localDate:e.target.value})}/></Form.Group>
   <Button disabled={busy||!selected.editable} onClick={save}>Сохранить пост</Button>{' '}<Button variant="outline-secondary" onClick={()=>setSelected(null)}>Закрыть</Button>
  </Card.Body></Card>}
  <Table responsive hover><thead><tr><th>Тема</th><th>Дата, МСК</th><th>Площадки</th><th/></tr></thead><tbody>{data.posts.map(p=><tr key={p.key}>
   <td>{p.id}. {p.title}<br/><small>{phases[p.phase]||p.phase}</small></td>
   <td>{p.date?new Date(p.date*1000).toLocaleString('ru-RU',{timeZone:'Europe/Moscow'}):'Не задана'}</td>
   <td>{Object.entries(p.deliveries).map(([platform,d])=><div key={platform}>{labels[platform]}: {phases[d.phase]||d.phase}{d.remote_id&&` · ${d.remote_id}`}{d.error&&<small className="d-block text-danger">{d.error}</small>}{['unknown','failed','sending'].includes(d.phase)&&<Button size="sm" variant="outline-warning" disabled={busy} onClick={()=>resolve(p,platform)}>Проверено: привязать / повторить</Button>}</div>)}</td>
   <td><Button size="sm" variant="outline-primary" onClick={()=>setSelected({...p,localDate:moscowInput(p.date)})}>Открыть</Button></td>
  </tr>)}</tbody></Table>

 </Container>;
}
