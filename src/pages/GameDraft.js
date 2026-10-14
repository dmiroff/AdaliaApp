import GameLive from './GameLive';
import React, {useEffect,useRef,useState} from 'react';
import api from '../http/apiClient';
import GameDraftKeyboard from '../components/GameDraftKeyboard';
import {normalizeKeyboard} from '../utils/gameDraftProtocol';
import {createDemoSession,demoCommand,DRAFT_STORAGE_KEY,restoreDemoSession,sceneKeyboard} from '../services/gameDraftDemo';
import city from '../assets/Images/GameDraft/city.png';
import forest from '../assets/Images/GameDraft/forest.png';
import encounter from '../assets/Images/GameDraft/encounter.png';
import './GameDraft.css';

const pictures = {city,forest,encounter};
const sceneNames = {city:'Ворота Фаргоса',trail:'Лесная тропа',fight:'Лесная тропа · бой',reward:'Тропа · награда',tavern:'Таверна Фаргоса'};
const load = () => {try {return restoreDemoSession(localStorage.getItem(DRAFT_STORAGE_KEY));} catch {return createDemoSession();}};

export function GameDemo() {
  const [session,setSession] = useState(load);
  const [command,setCommand] = useState('');
  const [profile,setProfile] = useState(null);
  const [profileLoading,setProfileLoading] = useState(false);
  const [profileError,setProfileError] = useState('');
  const [storageWarning,setStorageWarning] = useState(false);
  const log = useRef(null);
  const profileRequest = useRef(false);
  useEffect(() => {
    try {localStorage.setItem(DRAFT_STORAGE_KEY,JSON.stringify(session));setStorageWarning(false);} catch {setStorageWarning(true);}
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  },[session]);
  const send = (text,revision,label) => {
    setSession(previous => demoCommand(previous,text,revision ?? previous.revision,label || text));
    setCommand('');
  };
  const readProfile = async () => {
    if (profileRequest.current) return;
    if (!localStorage.getItem('access_token')) {
      setProfileError('Сначала войдите в приложение по своей ссылке из бота. Демосценарий доступен без входа.');return;
    }
    profileRequest.current = true;setProfileLoading(true);setProfileError('');
    try {
      const response = await api.get('/player');
      if (!response.data?.data || response.data.status !== 200) throw new Error('Invalid player response');
      setProfile(response.data.data);
    } catch {setProfileError('Не удалось загрузить персонажа. Проверьте вход и соединение, затем повторите.');}
    finally {profileRequest.current = false;setProfileLoading(false);}
  };
  return <section className="game-draft" aria-labelledby="game-draft-title">
    <header className="game-draft-heading">
      <div><span className="game-draft-eyebrow">АДАЛИЯ · DRAFT</span><h1 id="game-draft-title">Игровой чат</h1><p>История приключения, сообщения и действия в одном месте.</p></div>
      <a href="/" className="game-draft-app-link">Открыть приложение ↗</a>
    </header>
    <div className="game-draft-banner" role="note"><strong>Демосценарий</strong><span>Команды выполняются в этом браузере. Прогресс вашего персонажа не меняется.</span></div>
    <div className="game-draft-layout">
      <aside className="game-draft-side" aria-label="Состояние персонажа">
        <div className="game-draft-hero"><span className="game-draft-hero__crest" aria-hidden="true">А</span><div><h2>Странник</h2><span>Герой демосценария</span></div></div>
        <div className="game-draft-stats"><span>Здоровье <strong>{session.health}/{session.maxHealth}</strong></span><span>Монеты <strong>{session.gold}</strong></span></div>
        <div className="game-draft-health" role="progressbar" aria-label="Здоровье демоперсонажа" aria-valuenow={session.health} aria-valuemin={0} aria-valuemax={session.maxHealth}><span style={{width:`${session.health/session.maxHealth*100}%`}}/></div>
        <p className="game-draft-location">{sceneNames[session.scene]}</p>
        {session.scene === 'fight' && <p className="game-draft-enemy" role="status">Противник: {session.enemyHealth}/24 здоровья</p>}
        <div className="game-draft-profile"><h2>Ваш персонаж</h2><p>Посмотреть данные из приложения.</p>
          <button type="button" className="game-draft-action" disabled={profileLoading} onClick={readProfile}>{profileLoading ? 'Загружаем…' : profile ? 'Обновить персонажа' : 'Показать персонажа'}</button>
          {profileError && <p className="game-draft-error" role="alert">{profileError}</p>}
          {profile && <dl><dt>Имя</dt><dd>{profile.name || 'Без имени'}</dd><dt>Уровень</dt><dd>{profile.level}</dd><dt>Здоровье</dt><dd>{profile.current_health}/{profile.max_health}</dd><dt>Локация</dt><dd>{profile.location}</dd></dl>}
        </div>
        <button type="button" className="game-draft-reset" onClick={() => {if(window.confirm('Начать демосценарий заново и очистить его историю?')) setSession(createDemoSession());}}>Начать демо заново</button>
      </aside>
      <div className="game-draft-chat">
        <div className="game-draft-chat__heading"><span><span className="game-draft-dot" aria-hidden="true"/>Приключение</span><span>История в этом браузере</span></div>
        <div className="game-draft-log" ref={log} role="log" aria-label="История приключения" aria-live="polite" aria-relevant="additions">
          {session.messages.map(message => <article className={`game-draft-message game-draft-message--${message.role}`} key={message.id}>
            <div className="game-draft-message__meta"><strong>{message.role === 'user' ? 'Вы' : 'Адалия'}</strong><time dateTime={new Date(message.time).toISOString()}>{new Date(message.time).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</time></div>
            {pictures[message.image] && <img src={pictures[message.image]} alt={message.image === 'city' ? 'Фаргос' : message.image === 'forest' ? 'Лесная тропа' : 'Встреча в лесу'} className="game-draft-message__image"/>}
            <p>{message.text}</p>
            {message.keyboard && <GameDraftKeyboard keyboard={normalizeKeyboard(message.keyboard)} revision={message.sceneRevision} disabled={message.sceneRevision !== session.revision} onCommand={send}/>}
          </article>)}
        </div>
        <div className="game-draft-controls">
          <span className="game-draft-controls__label">Что будем делать?</span>
          <GameDraftKeyboard keyboard={sceneKeyboard(session.scene)} revision={session.revision} onCommand={send}/>
          <form className="game-draft-composer" onSubmit={event => {event.preventDefault();send(command);}}>
            <label className="visually-hidden" htmlFor="game-draft-command">Команда</label>
            <input id="game-draft-command" type="text" value={command} maxLength={500} autoComplete="off" placeholder="Введите команду…" onChange={event => setCommand(event.target.value)}/>
            <button type="submit" disabled={!command.trim()} aria-label="Отправить команду">Отправить</button>
          </form>
          {storageWarning && <p className="game-draft-error" role="status">Браузер не сохраняет историю. После закрытия страницы демо начнётся заново.</p>}
        </div>
      </div>
    </div>
  </section>;
}


export default function GameDraft(){
  const [demo,setDemo]=useState(false);
  return <><nav className="game-live-tabs" aria-label="Режим игрового чата"><button type="button" aria-pressed={!demo} onClick={()=>setDemo(false)}>Игровой бот</button><button type="button" aria-pressed={demo} onClick={()=>setDemo(true)}>Демосценарий</button></nav>{demo?<GameDemo/>:<GameLive/>}</>;
}
