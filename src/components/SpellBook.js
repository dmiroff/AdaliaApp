import React,{useEffect,useState} from 'react';
import api from '../http/apiClient';
import {elementName,spellElement,groupOrder,moveSpell} from '../utils/spellBook';
import './SpellBook.css';

export default function SpellBook({spells={},onSaved,renderSpell}) {
 const [book,setBook]=useState(spells),[order,setOrder]=useState(Object.keys(spells)),[saved,setSaved]=useState(Object.keys(spells));
 const [busy,setBusy]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [dragged,setDragged]=useState(null);
 const accept=data=>{setBook(data.prepared_magic||{});const keys=data.order||Object.keys(data.prepared_magic||{});setOrder(keys);setSaved(keys);setReady(true);};
 useEffect(()=>{
  const controller=new AbortController();
  api.get('/player/spells',{signal:controller.signal}).then(response=>{if(!controller.signal.aborted)accept(response.data);}).catch(e=>{if(!controller.signal.aborted)setError('Не удалось загрузить порядок заклинаний. Нажмите «Обновить список».');});
  return()=>controller.abort();
 },[]);
 const reload=async()=>{setBusy(true);setError('');try{accept((await api.get('/player/spells')).data);}catch{setError('Не удалось загрузить заклинания. Попробуйте ещё раз.');}finally{setBusy(false);}};
 const dirty=JSON.stringify(order)!==JSON.stringify(saved);
 const change=(key,index)=>{setOrder(current=>moveSpell(current,key,index));setNotice('');};
 const save=async()=>{
  if(!ready||busy)return;setBusy(true);setError('');setNotice('');
  try{
   const data=(await api.post('/player/spells/order',{order})).data;
   accept(data);onSaved?.(data.prepared_magic);setNotice('Порядок сохранён. Он применяется к выбору заклинаний в бою, в том числе в боте.');
  }catch(e){setError(e.response?.data?.detail||'Не удалось сохранить порядок. Повторное сохранение безопасно.');}
  finally{setBusy(false);}
 };
 return <section className="spell-book" aria-label="Книга заклинаний">
  <p>Сгруппируйте заклинания по стихиям или расставьте в своём порядке. На компьютере можно перетаскивать карточки, на телефоне — выбрать номер позиции.</p>
  <div className="spell-book-tools">
   <button type="button" disabled={busy||!ready||!order.length} onClick={()=>{setOrder(groupOrder(order,book));setNotice('');}}>По стихиям</button>
   <button type="button" disabled={busy||!dirty} onClick={()=>{setOrder(saved);setNotice('');}}>Отменить изменения</button>
   <button type="button" disabled={busy||!dirty||!ready} onClick={save}>{busy?'Сохранение…':'Сохранить порядок'}</button>
   <button type="button" disabled={busy} onClick={reload}>Обновить список</button>
  </div>
  {error&&<p role="alert" className="spell-book-error">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {!ready&&!error&&<p role="status">Загрузка заклинаний…</p>}
  {ready&&!order.length&&<p>Подготовленных заклинаний пока нет.</p>}
  <div className="spell-book-grid">
   {order.map((key,index)=><div key={key} className="spell-book-card" draggable={ready&&!busy}
     onDragStart={e=>{setDragged(key);e.dataTransfer.setData('text/plain',key);}}
     onDragOver={e=>e.preventDefault()} onDragEnd={()=>setDragged(null)}
     onDrop={e=>{e.preventDefault();if(dragged&&order.includes(dragged))change(dragged,index);setDragged(null);}}>
    <div className="spell-book-position"><span>{elementName(spellElement(book[key]))}</span>
     <label>Позиция <select aria-label={`Позиция: ${key}`} value={index} disabled={busy||!ready} onChange={e=>change(key,Number(e.target.value))}>
      {order.map((_,position)=><option key={position} value={position}>{position+1}</option>)}
     </select></label>
    </div>
    {renderSpell ? renderSpell(key,book[key]) : <h3>{book[key]?.name||key}</h3>}
   </div>)}
  </div>
 </section>;
}
