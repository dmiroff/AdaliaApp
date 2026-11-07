import React,{useCallback,useEffect,useState} from 'react';
import {Alert,Button,Form,Tab,Tabs,Table} from 'react-bootstrap';
import {findRoute,isFrontierObservationHost,loadObservation} from './observation';
import './FrontierObservation.css';
const fmt=v=>v===null||v===undefined?'Не определено':Number(v).toLocaleString('ru-RU',{maximumFractionDigits:2});
export function WarScore({score=0}){
 const value=Math.max(-100,Math.min(100,Number(score)||0));
 return <div className="frontier-war-score" aria-label={`Счёт войны: ${value}`}><div className="frontier-war-scale"><span style={{left:`${(value+100)/2}%`}}/></div><div className="d-flex justify-content-between"><span>−100 · сторона 2</span><strong>{value>0?'+':''}{value}</strong><span>+100 · сторона 1</span></div></div>;
}
export default function FrontierObservation({stageB=false}){
 const [data,setData]=useState(null),[grid,setGrid]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const [commander,setCommander]=useState('player'),[quantities,setQuantities]=useState({}),[from,setFrom]=useState(''),[to,setTo]=useState(''),[score,setScore]=useState(0);
 const [objectiveType,setObjectiveType]=useState('sector'),[objectiveSector,setObjectiveSector]=useState(''),[objectiveCastle,setObjectiveCastle]=useState('');
 const enabled=isFrontierObservationHost();
 const load=useCallback(async()=>{setLoading(true);setError('');try{
  const [snapshot,map]=await Promise.all([loadObservation(),fetch(`${process.env.PUBLIC_URL||''}/maps/westlands-grid.json`).then(r=>{if(!r.ok)throw new Error();return r.json();})]);
  setData(snapshot);setGrid(map);setQuantities({});
 }catch(e){setError(e.response?.status===403?'Недостаточно прав для просмотра поселения.':'Не удалось получить состав поселения. Повторите загрузку.');}finally{setLoading(false);}},[]);
 useEffect(()=>{if(enabled)load();},[enabled,load]);
 if(!enabled)return null;
 const chosen=data?.commanders?.find(c=>c.id===commander)||data?.commanders?.[0];
 const project=(data?.rows||[]).reduce((a,r)=>{
  const count=Math.max(0,Math.min(r.count,Math.floor(Number(quantities[r.id])||0))),ratio=r.count?count/r.count:0;
  return {count:a.count+count,power:a.power+(r.power||0)*ratio,weight:a.weight+(r.command_weight||0)*ratio,incomplete:a.incomplete||(count>0&&r.power===null)};
 },{count:0,power:0,weight:0,incomplete:false});
 const route=grid&&from&&to?findRoute(grid,from,to):null;
 return <section className="frontier-observation fantasy-paper" aria-label="Наблюдение за армиями">
  <div className="frontier-observation-title"><h2>Владения гильдии · наблюдение</h2><Button disabled={loading} onClick={load}>{loading?'Загрузка…':'Обновить состав'}</Button></div>
  <p>Изучайте гарнизон и рассчитывайте состав похода. Войска, запасы и деньги сохраняются; фактические походы и войны пока не запускаются.</p>
  {error&&<Alert variant="danger">{error}</Alert>}
  {!data&&!error&&<p role="status">Получаем сведения поселения…</p>}
  {data?.available===false&&<p>{data.reason}</p>}
  <Tabs defaultActiveKey="army" className="mb-3">
   <Tab eventKey="army" title="Армия">
    {data?.available&&<><h3>{data.guild_name||'Ваша гильдия'}</h3>
     <div className="frontier-summary"><span>В гарнизоне: <strong>{fmt(data.roster_count)}</strong></span><span>Индекс силы: <strong>{fmt(data.power)}</strong></span><span>Командная нагрузка: <strong>{fmt(data.command_load)}</strong></span></div>
     <p className="frontier-note">{data.catalog_live?'Параметры сверены с текущими существами зеркала.':'Состав получен из поселения, параметры взяты из каталога. Оценка предварительная.'} Старый гарнизон не хранит индивидуальное здоровье: расчёт при полной готовности. Очередь найма и занятые герои не добавляются к свободным силам.</p>
     {(data.warnings||[]).map((w,i)=><Alert key={i} variant="warning">{w}</Alert>)}
     <Form.Group className="mb-3"><Form.Label htmlFor="frontier-commander">Командир проекта</Form.Label><Form.Select id="frontier-commander" value={chosen?.id||''} onChange={e=>setCommander(e.target.value)}>{data.commanders.map(c=><option key={c.id} value={c.id}>{c.name} · {c.kind==='strategist'?'стратег':c.kind==='combat'?'герой-боец':'игрок'} · вместимость {c.capacity}</option>)}</Form.Select></Form.Group>
     {chosen?.breakdown&&<p>Вместимость: база {chosen.breakdown.base} + уровень {chosen.breakdown.level} + харизма {chosen.breakdown.charisma} + воодушевление {chosen.breakdown.inspiration}. Воодушевление использует действующий навык убеждения.</p>}
     <div className="frontier-roster"><Table striped size="sm"><thead><tr><th>Бойцы</th><th>В наличии</th><th>Сила</th><th>В проект</th></tr></thead><tbody>{data.rows.map(r=><tr key={r.id}><td>{r.name}</td><td>{fmt(r.count)}</td><td>{fmt(r.power)}</td><td><Form.Control type="number" min="0" max={r.count} value={quantities[r.id]??0} aria-label={`В проект: ${r.name}`} onChange={e=>setQuantities({...quantities,[r.id]:e.target.value})}/></td></tr>)}</tbody></Table></div>
     <p role="status">Проект: {project.count} бойцов · сила {project.incomplete?'неполная оценка':fmt(project.power)} · нагрузка {fmt(project.weight)} / {chosen?.capacity||0}.</p>
     {project.weight>(chosen?.capacity||0)&&<Alert variant="warning">Вместимость командира превышена. Уменьшите состав или выберите другого командира.</Alert>}
     <p className="frontier-note">Вместимости и нормы содержания предварительные. Поддержка игроков и способности героя будут учитываться перед ставочной симуляцией; общий индекс не определяет победителя.</p>
    </>}
   </Tab>
   <Tab eventKey="route" title="Поход">
    <p>Выберите войско во вкладке «Армия», затем направление. Это расчёт проекта, без отправки и блокировки персонажа.</p>
    {grid&&<div className="frontier-route-fields">{[['Старт',from,setFrom],['Цель',to,setTo]].map(([label,value,setter])=><Form.Group key={label}><Form.Label>{label}</Form.Label><Form.Select aria-label={label} value={value} onChange={e=>setter(e.target.value)}><option value="">Выберите сектор</option>{grid.sectors.map(s=><option key={s.id} value={s.id}>{s.id} · {grid.biomes.find(b=>b.id===s.biome)?.name}</option>)}</Form.Select></Form.Group>)}</div>}
    {route&&<p role="status">Маршрут: {route.join(' → ')}. Переходов: {route.length-1}; время: {route.length-1} мин.</p>}
    {from&&to&&!route&&<p>Известного сухопутного маршрута нет.</p>}
    <p className="frontier-note">Старт проекта задаётся вручную. Географический маршрут не означает права прохода или наличия разведки. В действующей системе союзная цель усилит гарнизон; у вражеской появится выбор захвата или набега. В первом выпуске одно ребро занимает минуту.</p>
   </Tab>
   <Tab eventKey="wars" title="Войны и договоры">
    <p>Активных войн новой системы пока нет. Цель будущей войны — сектор или замок; удержание, захваты, разгром войск и допустимые PvP-победы дают счёт. Набеги дают меньше.</p>
    <h3>Цель войны · проект</h3>
    <Form.Group className="mb-3"><Form.Label htmlFor="frontier-objective-type">Тип цели</Form.Label><Form.Select id="frontier-objective-type" value={objectiveType} onChange={e=>setObjectiveType(e.target.value)}><option value="sector">Удержание сектора</option><option value="castle">Захват замка</option></Form.Select></Form.Group>
    {objectiveType==='sector'?<Form.Group className="mb-3"><Form.Label htmlFor="frontier-objective-sector">Сектор цели</Form.Label><Form.Select id="frontier-objective-sector" value={objectiveSector} onChange={e=>setObjectiveSector(e.target.value)}><option value="">Выберите сектор</option>{grid?.sectors.map(s=><option key={s.id} value={s.id}>{s.id}</option>)}</Form.Select></Form.Group>:<Form.Group className="mb-3"><Form.Label htmlFor="frontier-objective-castle">Название известного замка</Form.Label><Form.Control id="frontier-objective-castle" maxLength={80} value={objectiveCastle} onChange={e=>setObjectiveCastle(e.target.value)} placeholder="Введите название"/></Form.Group>}
    <p role="status">Цель проекта: {objectiveType==='sector'?(objectiveSector?`удержание сектора ${objectiveSector}`:'сектор не выбран'):(objectiveCastle.trim()?`захват замка «${objectiveCastle.trim()}»`:'замок не указан')}.</p>
    <p className="frontier-note">Выбор хранится только в этом просмотре и не объявляет войну. При запуске цель будет проверяться по разведке и владению; скрытые замки здесь не раскрываются.</p>
    <Form.Label htmlFor="frontier-score-preview">Предпросмотр шкалы войны</Form.Label><Form.Range id="frontier-score-preview" min="-100" max="100" value={score} onChange={e=>setScore(Number(e.target.value))}/><WarScore score={score}/>
    <p>При +100 побеждает сторона 1, при −100 — сторона 2. Мир закрепляет фактически занятые владения. Незахваченный сектор или замок автоматически победителю не передаётся.</p>
    <ul><li>Пакт о ненападении запрещает атаки. После разрыва — ещё 3 суток запрета.</li><li>После войны — перемирие 7 суток.</li><li>Проход и союз оформляются отдельными договорами.</li><li>Заявка на осаду замка требует войны.</li><li>Оформление войны или договора в Фаргосе: предварительно 100 далеонов. Перемещения без этой платы.</li></ul>
   </Tab>
   <Tab eventKey="supply" title="Казна и караваны">
    {stageB?<p>Казна и обеспечение доступны во вкладке «Экономика». Караваны относятся к следующей стадии.</p>:<><p>Казначейство новой системы ещё не открыто: далеоны понадобятся для оформления дипломатии, монеты — для жалованья. Здесь средства не списываются.</p>
    {data?.available&&<><p>Предварительное содержание в казармах за сутки: {fmt(data.maintenance_preview.food_day)} провианта, {fmt(data.maintenance_preview.essence_day)} эссенции, {fmt(data.maintenance_preview.gold_day)} монет.</p><p>При включении провианта: разовое обеспечение на {data.bootstrap_preview.days} суток — {fmt(data.bootstrap_preview.food)} еды и {fmt(data.bootstrap_preview.essence)} эссенции. Сейчас это расчёт, запас ещё не выдан.</p></>}</>}
    <p>Добыча проверяется каждый час. В полночь караваны забирают остаток местного склада за вычетом выбранного резерва гарнизона. Охрана выделяется отдельно; возможны нападения местных и воюющих гильдий.</p>
    <p>Пропускную способность поставок и усталость в первый выпуск не включаем. Некрополь получает отдельное обеспечение эссенцией; одна подходящая постройка остальных поселений будет производить провиант вместо прежнего ресурса.</p>
   </Tab>
  </Tabs>
 </section>;
}
