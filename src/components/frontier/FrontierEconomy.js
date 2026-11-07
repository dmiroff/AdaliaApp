import React,{useCallback,useEffect,useState} from 'react';
import {Alert,Button,Form,Modal,Table} from 'react-bootstrap';
import api from '../../http/apiClient';
import FrontierObservation from './FrontierObservation';
import {isFrontierObservationHost} from './observation';
import './FrontierObservation.css';
const fmt=v=>v===null||v===undefined?'—':Number(v).toLocaleString('ru-RU',{maximumFractionDigits:3});
const date=v=>typeof v==='number'?new Date(v*1000).toLocaleString('ru-RU'):new Date(v).toLocaleString('ru-RU');
const pendingKey=()=>`frontier-b-pending:${localStorage.getItem('id')||'session'}`;
const readPending=()=>{try{return JSON.parse(localStorage.getItem(pendingKey())||'null');}catch{return null;}};
const kindNames={bootstrap:'Стартовый запас',hourly:'Производство и содержание',registry:'Изменение реестра',deposit:'Внесение в казну',withdraw:'Получение из казны',buy:'Покупка обеспечения'};
export default function FrontierEconomy({full=false}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[projects,setProjects]=useState(false);
 const [currency,setCurrency]=useState('gold'),[amount,setAmount]=useState(''),[resource,setResource]=useState('food'),[quantity,setQuantity]=useState('');
 const [pending,setPending]=useState(readPending),[uncertain,setUncertain]=useState(()=>!!readPending()?.uncertain),[sending,setSending]=useState(false),[success,setSuccess]=useState('');
 const active=isFrontierObservationHost();
 const load=useCallback(async()=>{setLoading(true);setError('');try{setData((await api.get('/frontier-economy/state')).data);}
 catch(e){setError(e.response?.status===404?'Стадия Б ещё не развёрнута на сервере зеркала. Нужен deploy_bot mirror.':e.response?.status===403?'Нет доступа к данным гильдии.':'Не удалось загрузить экономику поселения.');}finally{setLoading(false);}},[]);
 useEffect(()=>{if(active)load();},[active,load]);
 if(!active)return null;
 const a=data?.account,d=a?.daily||{},canAct=data?.available&&a?.status==='active';
 const propose=(kind,cur,raw)=>{const count=Number(raw);if(!Number.isSafeInteger(count)||count<1||count>1e9){setError('Введите целое количество от 1 до 1 000 000 000.');return;}
  setError('');setSuccess('');setUncertain(false);const request={kind,currency:cur,amount:count,guild_id:data.guild_id,request_id:crypto.randomUUID()};localStorage.setItem(pendingKey(),JSON.stringify(request));setPending(request);};
 const cancel=()=>{if(sending||uncertain)return;localStorage.removeItem(pendingKey());setPending(null);};
 const submit=async()=>{if(!pending||sending)return;setSending(true);setError('');try{const request={...pending};delete request.uncertain;await api.post('/frontier-economy/action',request);localStorage.removeItem(pendingKey());setUncertain(false);setPending(null);setAmount('');setQuantity('');setSuccess('Операция сохранена.');await load();}
 catch(e){const unknown=!e.response||e.response.status>=500;setUncertain(unknown);const retained={...pending,uncertain:unknown};setPending(retained);localStorage.setItem(pendingKey(),JSON.stringify(retained));setError(e.response?.data?.detail||'Ответ не получен. Повторите подтверждение: номер операции сохранён, в том числе после обновления страницы.');}finally{setSending(false);}};
 return <section className="frontier-observation fantasy-paper" aria-label="Экономика поселения">
  <div className="frontier-observation-title"><h2>{full?'Казна и обеспечение':'Армии и казна · стадия Б'}</h2><Button onClick={load} disabled={loading}>{loading?'Загрузка…':'Обновить'}</Button></div>
  <p>{full?'Казна гильдии и содержание домашнего гарнизона. Походные отряды учитываются отдельно.':'Тестовый баланс зеркала: реестр гарнизона, обеспечение и казна.'}</p>
  {error&&<Alert variant="danger">{error}</Alert>}{success&&<Alert variant="success">{success}</Alert>}
  <div hidden={full} className="d-flex flex-wrap gap-2 mb-3"><Button onClick={()=>setProjects(false)} aria-pressed={!projects}>Экономика</Button><Button onClick={()=>setProjects(true)} aria-pressed={projects}>Проекты армий и войн</Button></div>
  {projects?<FrontierObservation stageB/>:<>
   {!data&&!error&&<p role="status">Получаем сведения…</p>}
   {data?.available===false&&<p>{data.reason}</p>}
   {data?.available&&<>
    <h3>{data.guild_name}</h3>
    {a.status!=='active'&&<Alert variant="warning">Начисления приостановлены: {(a.warnings||[]).join(' ')}</Alert>}
    <div className="frontier-summary"><span>Провиант: <strong>{fmt(a.food)}</strong></span><span>Эссенция содержания: <strong>{fmt(a.essence)}</strong></span><span>Казна: <strong>{fmt(a.gold)} монет · {fmt(a.daleons)} далеонов</strong></span></div>
    <p>За сутки: {fmt(d.food_need)} провианта, {fmt(d.essence_need)} эссенции и {fmt(d.gold_need)} монет жалованья. Готовность по обеспечению: {fmt(a.readiness*100)}%.</p>
    <p>Производство: {data.production.name||'Первая постройка найма'} — {fmt(data.production.food_day)} провианта и {fmt(data.production.essence_day)} эссенции в сутки вместо прежнего ресурса.</p>
    <p className="frontier-note">Эссенция содержания отделена от сердца поселения и найма. Проверка каждый час; старые боевые параметры не меняются. Готовность походных отрядов зависит от их собственного обеспечения.</p>
    <p>Стартовый запас на {a.bootstrap.days} суток: {a.bootstrap.credited?'выдан однократно':'ещё не выдан'} — {fmt(a.bootstrap.food)} провианта, {fmt(a.bootstrap.essence)} эссенции. Последний расчёт: {date(a.last_settled)}.</p>
    {a.wage_debt>0&&<Alert variant="warning">Долг по жалованью: {fmt(a.wage_debt)} монет. Новые взносы монет сначала погашают долг.</Alert>}
    {(a.food_ratio<1||a.essence_ratio<1)&&<Alert variant="warning">Обеспечения не хватило на последний расчётный интервал. Пополните запас. Мгновенной гибели гарнизона нет.</Alert>}
    <h3>Казначейство</h3><p>У персонажа: {fmt(data.wallet.gold)} монет и {fmt(data.wallet.daleons)} далеонов.</p>
    <div className="frontier-route-fields"><Form.Group><Form.Label htmlFor="frontier-currency">Валюта</Form.Label><Form.Select id="frontier-currency" value={currency} onChange={e=>setCurrency(e.target.value)}><option value="gold">Монеты</option><option value="daleons">Далеоны</option></Form.Select></Form.Group><Form.Group><Form.Label htmlFor="frontier-amount">Количество для казны</Form.Label><Form.Control id="frontier-amount" type="number" min="1" max="1000000000" value={amount} onChange={e=>setAmount(e.target.value)}/></Form.Group></div>
    <div className="d-flex flex-wrap gap-2"><Button disabled={!canAct||sending} onClick={()=>propose('deposit',currency,amount)}>Внести в казну</Button>{data.can_manage&&<Button disabled={!canAct||sending} onClick={()=>propose('withdraw',currency,amount)}>Получить из казны</Button>}</div>
    {data.can_manage&&<><h3>Покупка обеспечения</h3><div className="frontier-route-fields"><Form.Group><Form.Label htmlFor="frontier-resource">Обеспечение</Form.Label><Form.Select id="frontier-resource" value={resource} onChange={e=>setResource(e.target.value)}><option value="food">Провиант</option><option value="essence">Эссенция содержания</option></Form.Select></Form.Group><Form.Group><Form.Label htmlFor="frontier-quantity">Количество для покупки</Form.Label><Form.Control id="frontier-quantity" type="number" min="1" max="1000000000" value={quantity} onChange={e=>setQuantity(e.target.value)}/></Form.Group></div>
     <p>Предварительная цена: {fmt(a.prices[resource])} монет за единицу. Итого: {fmt((Number(quantity)||0)*a.prices[resource])} монет из казны.</p><Button disabled={!canAct||sending} onClick={()=>propose('buy',resource,quantity)}>Купить обеспечение</Button></>}
    <p className="frontier-note">Взносы доступны участникам. Получение из казны и закупки — главе. Закупка отправляется караваном из Фаргоса и поступает по прибытии. За просмотр, расчёт и обычные походы далеоны не списываются.</p>
    <h3>Реестр гарнизона</h3><p>Доступных бойцов: {fmt(data.observation.roster_count)}. Предварительный индекс силы: {fmt(data.observation.power)}.</p>
    <div className="frontier-roster"><Table size="sm" striped><thead><tr><th>Партия</th><th>Бойцы</th><th>Число</th><th>Состояние</th></tr></thead><tbody>{data.batches.map(b=><tr key={b.id}><td>{b.id}</td><td>{data.observation.rows.find(r=>r.id===b.unit_id)?.name||b.unit_id}</td><td>{b.amount}</td><td>{b.state==='available'?'В гарнизоне':b.state}</td></tr>)}</tbody></Table></div>
    <p className="frontier-note">Старый найм остаётся источником состава; реестр синхронизируется примерно раз в минуту. Очередь найма и занятые герои не дублируются. Домашние бойцы готовы к бою; походные раненые учитываются отдельно.</p>
    <details className="mb-3"><summary>Составы гарнизонов Обителей</summary><p>Состав подбирается по типу Обители, с разными бойцами и ролями. Нейтральные гарнизоны используют эти составы; исход решает боевой симулятор.</p><div className="frontier-roster"><Table size="sm" striped><thead><tr><th>Обитель</th><th>Основной состав</th></tr></thead><tbody>{(data.garrison_templates||[]).map(t=><tr key={t.element}><td>{t.name}</td><td>{t.units.map(u=>u.name).join(', ')}</td></tr>)}</tbody></Table></div></details>
    <h3>Журнал</h3><div className="frontier-roster"><Table size="sm" striped><thead><tr><th>Когда</th><th>Событие</th><th>Результат</th></tr></thead><tbody>{data.ledger.map(l=><tr key={l.id}><td>{date(l.created_at)}</td><td>{kindNames[l.kind]||l.kind}</td><td>{l.kind==='bootstrap'?`${l.payload.days} суток запаса`:l.kind==='hourly'?`${l.payload.hours} ч.; оплачено ${(l.payload.gold_paid||0)/1e6} монет`:l.kind==='registry'?`${l.payload.changes?.length||0} изменений`: `${l.payload.amount} ${l.payload.currency}`}</td></tr>)}</tbody></Table></div>
   </>}
  </>}
  <Modal className="frontier-operation-modal" backdropClassName="frontier-operation-backdrop" centered show={!!pending} onHide={cancel} backdrop="static" aria-labelledby="frontier-confirm-title"><Modal.Header closeButton={!sending&&!uncertain}><Modal.Title id="frontier-confirm-title">Подтвердить операцию</Modal.Title></Modal.Header><Modal.Body>{pending&&<p>{pending.kind==='deposit'?'Внести в казну':pending.kind==='withdraw'?'Получить из казны':'Купить обеспечение'}: {fmt(pending.amount)} {pending.currency==='gold'?'монет':pending.currency==='daleons'?'далеонов':pending.currency==='food'?'провианта':'эссенции содержания'}.{pending.kind==='buy'&&` Цена: ${fmt(pending.amount*(a?.prices[pending.currency]||0))} монет из казны.`}</p>}{error&&<Alert variant="danger">{error}</Alert>}</Modal.Body><Modal.Footer><Button variant="secondary" disabled={sending||uncertain} onClick={cancel}>Отмена</Button><Button disabled={sending||loading||!canAct} onClick={submit}>{sending?'Сохранение…':'Подтвердить'}</Button></Modal.Footer></Modal>
 </section>;
}
