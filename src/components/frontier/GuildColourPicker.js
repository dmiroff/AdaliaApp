import React,{useEffect,useState} from 'react';
import {Alert,Button} from 'react-bootstrap';
import api from '../../http/apiClient';

export default function GuildColourPicker({data,onSaved}){
 const [colour,setColour]=useState(data.guild_colour),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>setColour(data.guild_colour),[data.guild_colour]);
 const owners=[{id:data.guild_id,name:data.guild_name,colour:data.guild_colour},...(data.guilds||[])];
 const occupied=owners.find(g=>g.id!==data.guild_id&&g.colour?.toLowerCase()===colour?.toLowerCase());
 const rgb=/^#[0-9a-f]{6}$/i.test(colour||'')?[1,3,5].map(i=>parseInt(colour.slice(i,i+2),16)):[];
 const grey=rgb.length===3&&Math.max(...rgb)-Math.min(...rgb)<30;
 const save=async()=>{
  if(busy||occupied||grey)return;setBusy(true);setError('');setNotice('');
  try{
   const result=await api.post('/frontier-strategy/order',{kind:'set_colour',guild_id:data.guild_id,request_id:crypto.randomUUID(),args:{colour}});
   await onSaved();setNotice(result.data.message||'Цвет сохранён.');
  }catch(e){setError(e.response?.data?.detail||'Не удалось сохранить цвет. Обновите карту и повторите.');}
  finally{setBusy(false);}
 };
 return <details className="frontier-colour-picker" aria-label="Цвет гильдии на карте">
  <summary><strong>Цвет вашей гильдии</strong> <span className="frontier-colour-chip" style={{background:data.guild_colour}}/> {data.guild_colour}</summary>
  {data.leader?<><p>Выберите свободный цвет. Серые оттенки оставлены защитникам Диких Земель.</p>
   <div className="frontier-colour-palette">{(data.colour_palette||[]).map(c=>{const holder=owners.find(g=>g.colour===c&&g.id!==data.guild_id);return <button key={c} type="button" style={{background:c}} aria-label={`${c}${holder?` — занят: ${holder.name}`:''}`} aria-pressed={colour===c} disabled={busy||!!holder} title={holder?`Занят: ${holder.name}`:c} onClick={()=>{setColour(c);setNotice('');}}/>;})}</div>
   <label>Свой цвет <input type="color" value={colour} disabled={busy} onChange={e=>{setColour(e.target.value);setNotice('');}}/></label>
   {occupied&&<p role="status">Этот цвет уже занят: {occupied.name}.</p>}{grey&&<p role="status">Серый цвет оставлен защитникам Диких Земель.</p>}
   <Button disabled={busy||!!occupied||grey||colour===data.guild_colour} onClick={save}>{busy?'Сохраняем цвет…':'Сохранить цвет гильдии'}</Button>
  </>:<p>Цвет может изменить глава гильдии.</p>}
  {error&&<Alert variant="danger" role="alert">{error}</Alert>}{notice&&<Alert variant="success" role="status">{notice}</Alert>}
  <details><summary>Занятые цвета гильдий</summary><div className="frontier-legend">{owners.map(g=><span key={g.id}><i style={{background:g.colour}}/>{g.name}</span>)}</div></details>
 </details>;
}
