import React, {useCallback,useEffect,useRef,useState} from 'react';
import {Alert,Button,Modal,Spinner} from 'react-bootstrap';
import api from '../../http/apiClient';
import {nearestBoundary} from './geometry';
import {WESTERN_ROAD_PATH} from './westernRoad';
import './FrontierMap.css';

const HOME={x:210,y:0,w:1460,h:1341};
export default function FrontierMap() {
  const [grid,setGrid]=useState(null),[state,setState]=useState(null),[error,setError]=useState('');
  const [selected,setSelected]=useState(null),[confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const [view,setView]=useState(HOME),[labels,setLabels]=useState(false);
  const svg=useRef(null),pointers=useRef(new Map()),gesture=useRef(null),viewRef=useRef(HOME);
  const updateView=useCallback(v=>{viewRef.current=v;setView(v);},[]);
  useEffect(()=>{
    let live=true;
    fetch(`${process.env.PUBLIC_URL || ''}/maps/westlands-grid.json`).then(r=>{if(!r.ok)throw new Error('Не удалось загрузить сетку карты.');return r.json();})
      .then(data=>{if(live)setGrid(data);}).catch(e=>{if(live)setError(e.message);});
    api.get('/frontier-map/state').then(r=>{if(live)setState(r.data);})
      .catch(e=>{if(live)setError(e.response?.data?.detail || 'Не удалось загрузить данные поселения.');});
    return ()=>{live=false;};
  },[]);
  const point=useCallback((x,y)=>{
    const p=svg.current.createSVGPoint();p.x=x;p.y=y;
    const q=p.matrixTransform(svg.current.getScreenCTM().inverse());return {x:q.x,y:q.y};
  },[]);
  const zoom=useCallback((factor,center)=>{
    const old=viewRef.current, w=Math.max(220,Math.min(2560,old.w*factor)),ratio=w/old.w;
    const c=center || {x:old.x+old.w/2,y:old.y+old.h/2};
    updateView({x:c.x+(old.x-c.x)*ratio,y:c.y+(old.y-c.y)*ratio,w,h:old.h*ratio});
  },[updateView]);
  useEffect(()=>{
    const el=svg.current;if(!el)return;
    const wheel=e=>{e.preventDefault();zoom(e.deltaY>0?1.15:.87,point(e.clientX,e.clientY));};
    el.addEventListener('wheel',wheel,{passive:false});
    return ()=>el.removeEventListener('wheel',wheel);
  },[grid,point,zoom]);
  const start=e=>{
    if(e.button && e.button!==0)return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const values=[...pointers.current.values()];
    gesture.current={view:{...viewRef.current},start:{x:e.clientX,y:e.clientY},moved:values.length>1,
      span:values.length===2 ? Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y):null,
      center:values.length===2 ? point((values[0].x+values[1].x)/2,(values[0].y+values[1].y)/2):null};
  };
  const move=e=>{
    if(!pointers.current.has(e.pointerId)||!gesture.current)return;
    pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const values=[...pointers.current.values()],g=gesture.current;
    if(values.length===2 && g.span){
      const ratio=g.span/Math.max(1,Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y));
      const w=Math.max(220,Math.min(2560,g.view.w*ratio)),r=w/g.view.w,c=g.center;
      updateView({x:c.x+(g.view.x-c.x)*r,y:c.y+(g.view.y-c.y)*r,w,h:g.view.h*r});g.moved=true;
    } else if(values.length===1 && !g.span){
      const dx=e.clientX-g.start.x,dy=e.clientY-g.start.y;
      if(Math.hypot(dx,dy)<6 && !g.moved)return;
      g.moved=true;
      const scale=svg.current.getScreenCTM().a;
      updateView({...g.view,x:g.view.x-dx/scale,y:g.view.y-dy/scale});
    }
  };
  const end=e=>{
    const g=gesture.current;pointers.current.delete(e.pointerId);
    if(g && !g.moved && state?.can_place && !busy && grid){
      const found=nearestBoundary(grid,state.biome,point(e.clientX,e.clientY));
      if(found && found.distance<30){setSelected(found);setNotice('');setError('');}
      else setError('Выберите границу секторов своего биома.');
    }
    if(!pointers.current.size)gesture.current=null;
  };
  const save=async()=>{
    if(busy||!selected)return;
    setBusy(true);setError('');
    try {
      const {data}=await api.post('/frontier-map/settlement',{boundary_id:selected.boundary_id,x:selected.x,y:selected.y,version:grid.version,intent:state.intent});
      setState({...state,can_place:false,position:data.position,reason:'Место поселения уже выбрано.'});
      setSelected(null);setNotice(data.message);setConfirm(false);
    }catch(e){setError(e.response?.data?.detail || 'Не удалось сохранить место. Повторите запрос.');setConfirm(false);}
    finally{setBusy(false);}
  };
  if(!grid)return error ? <Alert variant="danger">{error}</Alert> : <Spinner role="status" animation="border"/>;
  const biome=grid.biomes.find(b=>b.id===state?.biome),placed=state?.position;
  return <section className="frontier-map-panel fantasy-paper" aria-label="Карта Западных Диких Земель">
    <h2>Западные Дикие Земли</h2>
    <p>512 секторов · по 128 в каждом биоме. Перетаскивайте карту и меняйте масштаб, чтобы рассмотреть границы.</p>
    <div className="frontier-tools">
      <Button onClick={()=>zoom(.7)} aria-label="Приблизить карту">＋</Button><Button onClick={()=>zoom(1.4)} aria-label="Отдалить карту">−</Button>
      <Button onClick={()=>updateView(HOME)}>Вся область</Button>
      {state?.position && <Button onClick={()=>updateView({x:state.position.x-200,y:state.position.y-180,w:400,h:360})}>К поселению</Button>}
      <label><input type="checkbox" checked={labels} onChange={e=>setLabels(e.target.checked)}/> Номера секторов</label>
    </div>
    <div className="frontier-legend">{grid.biomes.map(b=><span key={b.id}><i style={{background:b.colour}}/>{b.name}</span>)}</div>
    {error && <Alert variant="danger" role="alert">{error}</Alert>}{notice && <Alert variant="success" role="status">{notice}</Alert>}
    {state?.can_place ? <p><strong>{state.intent==='found'?'Основание поселения':'Выбор места поселения'}: {biome?.name}.</strong> Нажмите рядом с границей соседних секторов этого биома. Место выбирается один раз.</p> : state && <p>{state.reason}</p>}
    <svg ref={svg} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} className="frontier-map-canvas" role="img" aria-label="Секторы Диких Земель"
      onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={e=>{pointers.current.delete(e.pointerId);gesture.current=null;}}>
      <image href={`${process.env.PUBLIC_URL || ''}/maps/westlands-base.jpg`} width={grid.width} height={grid.height}/>
      {grid.sectors.map(s=><polygon key={s.id} points={s.polygon.map(p=>p.join(',')).join(' ')} fill={state?.can_place && s.biome===state.biome ? '#efd06b22':'none'} stroke={grid.biomes.find(b=>b.id===s.biome).colour} strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>)}
      <g aria-label="Западная дорога" fill="none" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none">
        <path d={WESTERN_ROAD_PATH} stroke="#573a21" strokeWidth="12"/>
        <path d={WESTERN_ROAD_PATH} stroke="#efb34e" strokeWidth="6"/>
      </g>
      {labels && grid.sectors.map(s=><text key={s.id} x={s.label[0]} y={s.label[1]} textAnchor="middle" className="frontier-sector-label">{s.id}</text>)}
      <circle cx={grid.fargos.x} cy={grid.fargos.y} r="8" fill="#8c3226" stroke="#fff" strokeWidth="2"/><text x={grid.fargos.x+12} y={grid.fargos.y+18} className="frontier-city-label">Фаргос</text>
      {placed && <g aria-label="Поселение вашей гильдии"><circle cx={placed.x} cy={placed.y} r="10" fill="#8c3226" stroke="#fff3cf" strokeWidth="3"/><text x={placed.x+14} y={placed.y-12} className="frontier-city-label">{state.guild_name}</text></g>}
      {selected && <g aria-label="Выбранное место"><circle cx={selected.x} cy={selected.y} r="10" fill="#f6bd38" stroke="#35291a" strokeWidth="3"/><circle cx={selected.x} cy={selected.y} r="18" fill="none" stroke="#fff8dd" strokeWidth="2"/></g>}
    </svg>
    {selected && state?.can_place && <div className="frontier-selection"><p>Выбрана граница: <strong>{selected.sectors.join(' / ')}</strong> · {biome?.name}</p>
      <Button className="fantasy-btn" disabled={busy} onClick={()=>setConfirm(true)}>{state.intent==='found'?'Основать поселение здесь':'Закрепить место поселения'}</Button></div>}
    <Modal show={confirm} onHide={()=>!busy&&setConfirm(false)} centered backdrop={busy?'static':true}>
      <Modal.Header closeButton={!busy}><Modal.Title>Подтвердить место поселения</Modal.Title></Modal.Header>
      <Modal.Body>{biome?.name}, граница {selected?.sectors.join(' / ')}. Перенос поселения после подтверждения недоступен.</Modal.Body>
      <Modal.Footer><Button disabled={busy} onClick={()=>setConfirm(false)}>Назад</Button><Button disabled={busy} onClick={save}>{busy?'Сохраняем…':'Подтвердить место'}</Button></Modal.Footer>
    </Modal>
  </section>;
}
