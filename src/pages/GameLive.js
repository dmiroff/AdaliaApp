import React,{useEffect,useRef,useState} from 'react';
import api from '../http/apiClient';
import GameDraftKeyboard from '../components/GameDraftKeyboard';
import {normalizeKeyboard} from '../utils/gameDraftProtocol';
import {normalizeGameHistory} from '../utils/gameLiveHistory';
import './GameDraft.css';

const freshId=()=>{
  if(window.crypto.randomUUID)return window.crypto.randomUUID();
  const b=window.crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
  const hex=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
};
const startupKeyboard=normalizeKeyboard({buttons:[[{action:{type:'text',label:'Где я'}},{action:{type:'text',label:'Персонаж'}}]]});

function MessageImage({url,onLoad}){
  const element=useRef(null);
  const [src,setSrc]=useState(''),[failed,setFailed]=useState(false);
  useEffect(()=>{
    let blobUrl,started=false,stopped=false;
    const controller=new AbortController();
    const load=async()=>{
      if(started)return;started=true;
      try{
        const response=await api.get(url.replace(/^\/api/,''),{responseType:'blob',signal:controller.signal});
        if(!stopped){blobUrl=URL.createObjectURL(response.data);setSrc(blobUrl);}
      }catch(error){if(!stopped)setFailed(true);}
    };
    const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){load();observer.disconnect();}
    },{rootMargin:'200px'}):null;
    if(observer)observer.observe(element.current);else load();
    return()=>{stopped=true;controller.abort();observer?.disconnect();if(blobUrl)URL.revokeObjectURL(blobUrl);};
  },[url]);
  return <div ref={element} className="game-live-image">{src?<img className="game-draft-message__image" src={src} alt="Иллюстрация игрового события" onLoad={onLoad}/>:<span>{failed?'Картинка недоступна':'Загружаем иллюстрацию…'}</span>}</div>;
}

export default function GameLive(){
  const [data,setData]=useState(null),[error,setError]=useState(''),[commandError,setCommandError]=useState(''),[text,setText]=useState('');
  const [pending,setPending]=useState(null),[retry,setRetry]=useState(null),[loading,setLoading]=useState(true);
  const log=useRef(null),sending=useRef(false),mounted=useRef(true),keepBottom=useRef(true);
  const authenticated=Boolean(localStorage.getItem('access_token'));
  const refresh=async(signal)=>{
    const response=await api.get('/game/messages',{signal});
    if(mounted.current){setData(normalizeGameHistory(response.data));setPending(response.data.pending_command);setError('');setLoading(false);}
    return response.data;
  };
  useEffect(()=>{
    mounted.current=true;
    if(!authenticated){setLoading(false);return()=>{mounted.current=false;};}
    const controller=new AbortController();let timer;
    const poll=async()=>{
      try{await refresh(controller.signal);}catch(e){if(mounted.current&&e.code!=='ERR_CANCELED'){
        setLoading(false);
        setError(e.response?.status===404?'Канал игры ещё не включён на API зеркала.':e.response?.status===401?'Войдите в приложение заново по ссылке из бота.':'Не удалось получить сообщения. Повторим подключение автоматически.');
      }}
      if(mounted.current)timer=setTimeout(poll,2500);
    };
    poll();return()=>{mounted.current=false;controller.abort();clearTimeout(timer);};
  },[authenticated]); // One polling loop per authenticated session.
  const scrollBottom=()=>{if(log.current&&keepBottom.current)log.current.scrollTop=log.current.scrollHeight;};
  useEffect(scrollBottom,[data]);
  const deliver=async(body)=>{
    if(sending.current)return;
    sending.current=true;setCommandError('');setPending({request_id:body.request_id,status:'running'});keepBottom.current=true;
    try{
      const result=await api.post('/game/commands',body,{timeout:20000});
      setRetry(null);setText('');
      const next=await refresh();
      if(result.data.status==='running'&&!next.pending_command)setPending({request_id:body.request_id,status:'running'});
    }catch(e){
      if(e.response&&[400,401,403,409,422].includes(e.response.status)){
        setCommandError(typeof e.response.data?.detail==='string'?e.response.data.detail:'Команда не принята. Обновите сообщения.');
        setPending(null);setRetry(null);
      }else{
        setRetry(body);setPending({request_id:body.request_id,status:'unknown'});
        setCommandError('Ответ не получен. Проверка отправит тот же идентификатор запроса и не выполнит команду второй раз.');
      }
    }finally{sending.current=false;}
  };
  const send=(command,revision,label,payload,sourceId)=>{
    if(!command?.trim()||pending||retry||sending.current)return;
    // A plain VK text button is also a valid typed command. If an old worker
    // dated its latest keyboard before the input, the API still identifies
    // an earlier keyboard. Preserve payload provenance; send only the current
    // plain text action through the ordinary text-command path in this case.
    const source=data?.messages.find(message=>message.id===sourceId);
    const expectedSource=source?.keyboard?.inline?data?.revision:data?.keyboard_source;
    const legacyText=source&&data.legacySources.includes(sourceId)&&sourceId!==expectedSource&&!payload;
    deliver({request_id:freshId(),text:command.trim(),revision:data?.revision||'0',source_message_id:legacyText?null:sourceId||null});
  };
  const acknowledge=async()=>{
    if(!window.confirm('Вы проверили сообщения и состояние персонажа? Это разрешит новые команды, прежняя команда повторяться не будет.'))return;
    try{setData(normalizeGameHistory((await api.post(`/game/commands/${pending.request_id}/acknowledge`,{checked:true})).data));setRetry(null);setPending(null);setCommandError('');}
    catch(e){setCommandError('Не удалось подтвердить проверку результата.');}
  };
  const player=data?.player;
  const health=Number(player?.current_health)||0,maxHealth=Number(player?.max_health)||1;
  return <section className="game-draft" aria-labelledby="game-live-title">
    <header className="game-draft-heading"><div><span className="game-draft-eyebrow">АДАЛИЯ · БОТ</span><h1 id="game-live-title">Игровой чат</h1><p>Сообщения и действия вашего персонажа.</p></div><a className="game-draft-app-link" href="/">Открыть приложение ↗</a></header>
    {!authenticated?<div className="game-draft-banner"><strong>Войдите в приложение</strong><span>Откройте свою ссылку из бота, затем вернитесь в игровой чат.</span></div>:<>
      <div className="game-draft-banner" role="status"><strong>{pending?.status==='running'?'Бот выполняет команду':data?'Подключено к боту зеркала':'Подключаемся к боту'}</strong><span>Здесь действия изменяют вашего персонажа на зеркале.</span></div>
      {error&&<div className="game-live-error" role="alert">{error}</div>}
      {(commandError||retry)&&<div className="game-live-error" role="alert">{commandError}{retry&&<button type="button" className="game-draft-action" disabled={sending.current} onClick={()=>deliver(retry)}>Проверить отправку</button>}</div>}
      {pending?.status==='unknown'&&!retry&&<div className="game-live-error" role="alert">Результат предыдущей команды требует проверки. Посмотрите сообщения и персонажа перед продолжением.<button type="button" className="game-draft-action" onClick={acknowledge}>Проверено: продолжить</button></div>}
      <div className="game-draft-layout"><aside className="game-draft-side"><div className="game-draft-hero"><span className="game-draft-hero__crest" aria-hidden="true">А</span><div><h2>{player?.name||'Ваш персонаж'}</h2><span>{player?`Уровень ${player.level}`:'Загружаем данные'}</span></div></div>
        <div className="game-draft-stats"><span>Здоровье <strong>{health}/{maxHealth}</strong></span><span>Монеты <strong>{player?.money??'—'}</strong></span></div>
        <div className="game-draft-health" role="progressbar" aria-label="Здоровье персонажа" aria-valuenow={Math.max(0,health)} aria-valuemin={0} aria-valuemax={maxHealth}><span style={{width:`${Math.max(0,Math.min(100,health/maxHealth*100))}%`}}/></div>
        <p className="game-draft-location">{player?.location}</p>{player?.in_fight&&<p className="game-draft-enemy">Вы в бою</p>}
        <button type="button" className="game-draft-action mt-3" disabled={!data||!!pending||!!retry} onClick={()=>send('Где я')}>Обновить игровую клавиатуру</button>
      </aside><div className="game-draft-chat"><div className="game-draft-chat__heading"><span>Адалия · зеркало</span><span>{pending?'Ожидаем ответ':'История сообщений'}</span></div>
        <div ref={log} className="game-draft-log" role="log" aria-label="Сообщения бота" aria-live="polite" aria-relevant="additions" onScroll={()=>{keepBottom.current=log.current.scrollHeight-log.current.scrollTop-log.current.clientHeight<60;}}>
          {loading&&<p>Загружаем сообщения…</p>}{data&&!data.messages.length&&<p>Начните с «Где я», чтобы получить текущую локацию и клавиатуру бота.</p>}
          {data?.messages.map(message=><article className={`game-draft-message game-draft-message--${message.role}`} key={message.id}><div className="game-draft-message__meta"><strong>{message.role==='user'?'Вы':'Адалия'}</strong><time dateTime={new Date(message.time).toISOString()}>{new Date(message.time).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</time></div>
            {message.image_url&&<MessageImage url={message.image_url} onLoad={scrollBottom}/>}<p>{message.text}</p>
            {message.keyboard&&normalizeKeyboard(message.keyboard).inline&&<GameDraftKeyboard keyboard={normalizeKeyboard(message.keyboard)} revision={data.revision} sourceId={message.id} disabled={!!pending||!!retry||message.id!==data.displayRevision} onCommand={send}/>}
          </article>)}
        </div><div className="game-draft-controls"><span className="game-draft-controls__label">Действия бота</span><GameDraftKeyboard keyboard={data?.displayKeyboard?normalizeKeyboard(data.displayKeyboard):startupKeyboard} revision={data?.revision} sourceId={data?.displayKeyboardSource} disabled={!data||!!pending||!!retry} onCommand={send}/>
          <form className="game-draft-composer" onSubmit={e=>{e.preventDefault();send(text);}}><label className="visually-hidden" htmlFor="game-live-command">Команда боту</label><input id="game-live-command" value={text} maxLength={500} disabled={!data||!!pending||!!retry} autoComplete="off" placeholder="Введите команду боту…" onChange={e=>setText(e.target.value)}/><button type="submit" disabled={!data||!!pending||!!retry||!text.trim()}>Отправить</button></form>
        </div></div></div>
    </>}
  </section>;
}
