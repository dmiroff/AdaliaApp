import React, { useCallback, useEffect, useState } from 'react';
import api from '../http/apiClient';
import './PlayerEvents.css';

const statusNames = {open: 'Регистрация', active: 'Идёт', finished: 'Завершён', cancelled: 'Отменён'};
const kinds = {event: 'Событие', kill: 'Убийство монстра', kill_race: 'Убийство по расе', item: 'Получение предмета'};
const key = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const localDate = (minutes) => {
    const date = new Date(Date.now() + minutes * 60000);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const initialForm = () => ({title: '', rules: '', tie_rule: '', starts_at: localDate(10), ends_at: localDate(1450), limit: 20, prizes: '100', participation_gold: 0});
const errorMessage = e => e.response?.status === 404 ? 'Ивенты ещё не включены на сервере.' : typeof e.response?.data?.detail === 'string' ? e.response.data.detail : 'Не удалось выполнить действие. Проверьте данные и соединение.';

function EventForm({onCreate, busy, money}) {
    const [form, setForm] = useState(initialForm);
    const [conditions, setConditions] = useState([]);
    const [kind, setKind] = useState('event');
    const [query, setQuery] = useState('');
    const [targets, setTargets] = useState([]);
    const [target, setTarget] = useState('');
    const [points, setPoints] = useState(1);
    const [searchError, setSearchError] = useState('');
    useEffect(() => {
        let live = true;
        const timer = setTimeout(() => {
            api.get('/player-events/targets', {params: {kind, q: query}}).then(r => {
                if (live) { setTargets(r.data); setTarget(''); setSearchError(''); }
            }).catch(() => { if (live) setSearchError('Не удалось загрузить цели'); });
        }, 300);
        return () => { live = false; clearTimeout(timer); };
    }, [kind, query]);
    const change = e => setForm({...form, [e.target.name]: e.target.value});
    const prizes = form.prizes.split(',').map(n => Number(n.trim()));
    const reserve = prizes.reduce((a, b) => a + b, 0) + Number(form.limit) * Number(form.participation_gold);
    const shortfall = Math.max(0, reserve - money);
    const durationValid = new Date(form.ends_at) - new Date(form.starts_at) >= 86400000;
    return <form className="fantasy-paper player-events-form" onSubmit={e => {
        e.preventDefault();
        if (shortfall > 0 || !durationValid) return;
        onCreate({...form, starts_at: new Date(form.starts_at).getTime()/1000, ends_at: new Date(form.ends_at).getTime()/1000,
            limit: Number(form.limit), participation_gold: Number(form.participation_gold), prizes,
            conditions: conditions.map(({label, ...c}) => c)});
    }}>
        <h2>Создать ивент</h2><p>Ивент длится не менее суток. Завершение и выдача наград доступны после объявленного окончания.</p>
        {!durationValid && <p role="alert">Между началом и окончанием должно пройти не менее суток.</p>}
        <label>Название<input required maxLength={100} name="title" value={form.title} onChange={change}/></label>
        <label>Правила<textarea required maxLength={2000} name="rules" value={form.rules} onChange={change}/></label>
        <label>Как разрешаем ничью<textarea required maxLength={500} name="tie_rule" value={form.tie_rule} onChange={change}/></label>
        <div className="player-events-grid">
            <label>Начало (ваше местное время)<input required type="datetime-local" name="starts_at" value={form.starts_at} onChange={change}/></label>
            <label>Окончание<input required type="datetime-local" name="ends_at" value={form.ends_at} onChange={change}/></label>
            <label>Лимит участников<input required type="number" min="2" max="100" name="limit" value={form.limit} onChange={change}/></label>
            <label>Золото за места через запятую<input required name="prizes" value={form.prizes} onChange={change} placeholder="100, 50, 25"/></label>
            <label>Золото каждому участнику<input required type="number" min="0" step="1" name="participation_gold" value={form.participation_gold} onChange={change}/></label>
        </div>
        <fieldset><legend>Автоматические очки</legend>
            <p>Успешное игровое событие, убийство базового вида монстра, убийство по расе или получение предмета из добычи. За каждый полученный предмет — свои очки. Убийства вида учитываются на любом усилении; для расы считаются все её виды, включая боссов. Очки идут после нажатия «Начать ивент» и до времени окончания. Можно оставить пустым и начислять очки вручную.</p>
            <div className="player-events-grid">
                <label>Условие<select value={kind} onChange={e => {setKind(e.target.value); setTarget(''); setTargets([]); setQuery('');}}>{Object.entries(kinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                <label>Поиск цели<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Название"/></label>
                <label>Цель<select value={target} onChange={e => setTarget(e.target.value)}><option value="">Выберите цель</option>{targets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
                <label>Очки за одно выполнение<input type="number" min="1" max="1000000" value={points} onChange={e => setPoints(Number(e.target.value))}/></label>
            </div>
            {searchError && <p role="alert">{searchError}</p>}
            <button className="fantasy-btn" type="button" disabled={!target || points < 1 || conditions.length >= 20} onClick={() => {
                if (!conditions.some(c => c.kind === kind && c.target === target)) setConditions([...conditions, {kind, target, points, label: targets.find(t => t.id === target)?.name || target}]);
            }}>Добавить условие</button>
            <ul>{conditions.map((c, i) => <li key={`${c.kind}:${c.target}`}>{kinds[c.kind]}: {c.label} — {c.points} очк. <button type="button" onClick={() => setConditions(conditions.filter((_, n) => n !== i))}>Убрать</button></li>)}</ul>
        </fieldset>
        <p>Будет зарезервировано: <strong>{Number.isFinite(reserve) ? reserve.toLocaleString('ru-RU') : '—'} золота</strong>. Неиспользованный остаток возвращается. После создания правила и призы зафиксированы.</p>
        <p>После создания зарегистрируйте участников и нажмите «Начать ивент» в объявленное время.</p>
        {shortfall > 0 && <p role="alert">Не хватает {shortfall.toLocaleString('ru-RU')} золота для призового фонда.</p>}
        <button className="fantasy-btn" disabled={busy || shortfall > 0 || !durationValid}>Создать и уведомить администраторов</button>
    </form>;
}

function EventDetails({event, viewer, busy, act}) {
    const [player, setPlayer] = useState('');
    const [delta, setDelta] = useState(1);
    const [reason, setReason] = useState('');
    const [order, setOrder] = useState('');
    const [cancelOpen, setCancelOpen] = useState(false);
    const [participantId, setParticipantId] = useState('');
    const host = viewer === event.host_id;
    const rows = event.leaderboard;
    const closed = ['finished', 'cancelled'].includes(event.status);
    return <section className="fantasy-paper player-event-detail">
        <h2>{event.title}</h2><p>{statusNames[event.status]} · Организатор: {event.host_name}</p>
        <p className="player-event-prose">{event.rules}</p>
        <p>{new Date(event.starts_at*1000).toLocaleString('ru-RU')} — {new Date(event.ends_at*1000).toLocaleString('ru-RU')}</p>
        <p>Ничья: {event.tie_rule}</p>
        <p>Призы за места: {event.prizes.join(', ')} золота. Каждому: {event.participation_gold} золота. В резерве: {event.escrow}.</p>
        <p>Участники: {rows.length}/{event.limit}. Достижения: «За любой движ», победителю «Победитель», организатору «Контентмейкер».</p>
        <ul>{event.conditions.map(c => <li key={`${c.kind}:${c.target}`}>{kinds[c.kind]}: {c.label || c.target} — {c.points} очк.</li>)}</ul>
        {!host && event.status === 'open' && !event.participants[String(viewer)] && <button className="fantasy-btn" disabled={busy} onClick={() => act('join')}>Участвовать</button>}
        {event.participants[String(viewer)] && <p>Вы участвуете в этом ивенте.</p>}
        {host && event.status === 'open' && <button className="fantasy-btn" disabled={busy} onClick={() => act('start')}>Начать ивент</button>}
        {host && event.status === 'open' && <form className="mt-3" onSubmit={e => {e.preventDefault(); act('add-participant', {player_id: Number(participantId)});}}>
            <label>ID участника для ручной записи<input required type="number" step="1" value={participantId} onChange={e => setParticipantId(e.target.value)}/></label>
            <button className="fantasy-btn" disabled={busy}>Записать участника</button>
        </form>}
        <h3>Таблица результатов</h3>
        <div className="player-event-table"><table><thead><tr><th>Место</th><th>Игрок</th><th>Очки</th>{event.status === 'finished' && <th>Золото</th>}</tr></thead><tbody>{(event.order ? event.order.map(id => rows.find(r => r.player_id === id)) : rows).map((row, i) => <tr key={row.player_id}><td>{event.order ? i+1 : row.place}</td><td>{row.name} <small>({row.player_id})</small></td><td>{row.score}</td>{event.status === 'finished' && <td>{event.payouts[String(row.player_id)]}</td>}</tr>)}</tbody></table></div>
        {!rows.length && <p>Пока никто не записался.</p>}
        {host && event.status === 'active' && <>
            <form onSubmit={e => {e.preventDefault(); act('score', {player_id: Number(player), delta: Number(delta), reason});}}>
                <h3>Изменить очки</h3><div className="player-events-grid">
                    <label>Участник<select required value={player} onChange={e => setPlayer(e.target.value)}><option value="">Выберите</option>{rows.map(p => <option key={p.player_id} value={p.player_id}>{p.name}</option>)}</select></label>
                    <label>Изменение<input required type="number" min="-1000000" max="1000000" value={delta} onChange={e => setDelta(e.target.value)}/></label>
                    <label>Причина<input required maxLength={300} value={reason} onChange={e => setReason(e.target.value)}/></label>
                </div><button className="fantasy-btn" disabled={busy}>Начислить</button>
            </form>
            <h3>Подтвердить результаты</h3>{Date.now() < event.ends_at * 1000 && <p>Награды можно выдать после объявленного окончания ивента.</p>}<p>При ничьей укажите ID всех участников по порядку мест через запятую, соблюдая объявленное правило. Участники с разными очками сохраняют свой порядок.</p>
            <label>Порядок мест при ничьей<input value={order} onChange={e => setOrder(e.target.value)} placeholder={rows.map(r => r.player_id).join(', ')}/></label>
            <button className="fantasy-btn" disabled={busy || !rows.length || Date.now() < event.ends_at * 1000} onClick={() => act('finish', {order: order.trim() ? order.split(',').map(n => Number(n.trim())) : null})}>Завершить и выдать награды</button>
        </>}
        {host && !closed && <div className="mt-3">{cancelOpen ? <><p>Отменить ивент и вернуть призовой фонд?</p><button className="fantasy-btn" disabled={busy} onClick={() => act('cancel')}>Да, отменить ивент</button> <button onClick={() => setCancelOpen(false)}>Продолжить ивент</button></> : <button disabled={busy} onClick={() => setCancelOpen(true)}>Отменить ивент</button>}</div>}
        <h3>{host ? 'История начислений' : 'Мои начисления'}</h3>
        <ul>{event.history.map(e => <li key={e.id}>{event.participants[String(e.player_id)]}: {e.delta > 0 ? '+' : ''}{e.delta} · {e.reason} · {new Date(e.at*1000).toLocaleString('ru-RU')} {e.revoked ? '(отменено)' : host && event.status === 'active' && <button disabled={busy} onClick={() => act('revoke', {entry_id: e.id})}>Отменить начисление</button>}</li>)}</ul>
    </section>;
}

export default function PlayerEvents() {
    const [state, setState] = useState({events: [], player_id: null, money: 0});
    const [selected, setSelected] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [closed, setClosed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    // Retain keys after a lost response; explicit subsequent actions get new keys.
    const [pending, setPending] = useState(null);
    const load = useCallback(async () => {
        const response = await api.get('/player-events', {params: {closed}});
        setState(response.data);
        if (selected) {
            const detail = await api.get(`/player-events/${selected.id}`);
            setSelected(detail.data);
        }
    }, [closed, selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        let live = true;
        setLoading(true);
        load().catch(e => {if (live) setError(errorMessage(e));}).finally(() => {if (live) setLoading(false);});
        const timer = setInterval(() => {load().catch(() => {});}, 15000);
        return () => {live = false; clearInterval(timer);};
    }, [load]);
    const mutate = async (path, body) => {
        if (busy) return;
        const fingerprint = JSON.stringify({path, body});
        const requestId = pending?.fingerprint === fingerprint ? pending.requestId : key();
        setPending({fingerprint, requestId});
        setBusy(true); setError(''); setNotice('');
        try {
            const response = await api.post(path, {...body, request_id: requestId});
            setSelected(response.data); setShowCreate(false); setPending(null);
            setNotice('Сохранено');
            await load();
        } catch (e) {setError(errorMessage(e));}
        finally {setBusy(false);}
    };
    return <main className="container player-events-page">
        <header className="fantasy-paper player-event-intro"><h1>Ивенты игроков</h1><p>Соревнуйтесь по правилам игроков, зарабатывайте очки и получайте призы организатора.</p>
        <p>Ваше золото: {state.money.toLocaleString('ru-RU')}</p>
        <div className="player-event-toolbar"><button className="fantasy-btn" disabled={busy} onClick={() => {setShowCreate(!showCreate); setSelected(null);}}>Создать ивент</button><button disabled={busy} onClick={() => load().catch(e => setError(errorMessage(e)))}>Обновить</button><label><input type="checkbox" checked={closed} onChange={e => setClosed(e.target.checked)}/> Включая завершённые</label></div></header>
        {error && <p role="alert" className="player-event-error">{error}</p>}{notice && <p role="status">{notice}</p>}
        {loading && <p role="status">Загрузка ивентов…</p>}
        {showCreate && <EventForm busy={busy} money={state.money} onCreate={body => mutate('/player-events', body)}/>}
        <div className="player-events-grid">{state.events.map(event => <button className="fantasy-paper player-event-card" key={event.id} disabled={busy} onClick={() => {setSelected(event); setShowCreate(false);}}><strong>{event.title}</strong><span>{statusNames[event.status]} · {event.host_name}</span><span>{new Date(event.starts_at*1000).toLocaleString('ru-RU')}</span><span>{Object.keys(event.participants).length}/{event.limit} участников · призы {event.prizes.join(', ')} золота</span></button>)}</div>
        {!loading && !state.events.length && <p>Сейчас нет ивентов. Создайте первый!</p>}
        {selected && !showCreate && <EventDetails key={selected.id} event={selected} viewer={state.player_id} busy={busy} act={(action, body = {}) => mutate(`/player-events/${selected.id}/${action}`, body)}/>}
    </main>;
}
