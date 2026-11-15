import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Button, Form, Modal, Table} from 'react-bootstrap';
import api from '../http/apiClient';
import './frontier/FrontierObservation.css';

const storageKey = () => `guild-treasury-confirmation:${localStorage.getItem('id') || 'session'}`;
const readPending = () => {try {return JSON.parse(localStorage.getItem(storageKey()) || 'null');} catch {return null;}};
const fmt = value => Number(value || 0).toLocaleString('ru-RU', {maximumFractionDigits: 3});
const errorText = error => error.response?.data?.detail || 'Ответ не получен. Повторите подтверждение: номер операции сохранён.';

export default function GuildTreasury() {
  const [data, setData] = useState(null), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false), [sending, setSending] = useState(false);
  const [currency, setCurrency] = useState('daleons'), [amount, setAmount] = useState(''), [brief, setBrief] = useState('');
  const [pending, setPending] = useState(readPending);
  const load = useCallback(async () => {
    setLoading(true);
    try {setData((await api.get('/frontier-economy/guild-state')).data);}
    catch (e) {setError(e.response?.data?.detail || 'Не удалось загрузить казну гильдии.');}
    finally {setLoading(false);}
  }, []);
  useEffect(() => {load();}, [load]);
  const remember = value => {
    if (value) localStorage.setItem(storageKey(), JSON.stringify(value));
    else localStorage.removeItem(storageKey());
    setPending(value);
  };
  const propose = kind => {
    const count = Number(amount);
    if (!Number.isSafeInteger(count) || count < 1 || count > 1e9) {setError('Введите целое количество от 1 до 1 000 000 000.'); return;}
    setError(''); setSuccess('');
    remember({kind, currency, amount: count, guild_id: data.guild_id, request_id: crypto.randomUUID()});
  };
  const draftAvatar = async () => {
    if (!brief.trim()) {setError('Опишите желаемую аватарку.'); return;}
    setSending(true); setError(''); setSuccess('');
    try {
      const order = (await api.post('/frontier-economy/avatar/draft', {brief: brief.trim()})).data;
      remember({kind: 'avatar', request_id: order.id, guild_id: order.guild_id, brief: order.brief});
    } catch (e) {setError(errorText(e));}
    finally {setSending(false);}
  };
  const cancelBlocked = sending || (pending?.uncertain && (!data || data.guild_id === pending.guild_id));
  const cancel = () => {if (!cancelBlocked) remember(null);};
  const submit = async () => {
    if (!pending || sending) return;
    setSending(true); setError('');
    try {
      let avatarStatus;
      if (pending.kind === 'avatar') avatarStatus = (await api.post('/frontier-economy/avatar/confirm', {request_id: pending.request_id})).data.status;
      else {
        const request = {...pending}; delete request.uncertain;
        await api.post('/frontier-economy/treasury-action', request);
      }
      setSuccess(pending.kind === 'avatar' ? (avatarStatus === 'rejected' ? 'Заявка отклонена. Оплаченные далеоны возвращены в казну.' : avatarStatus === 'completed' ? 'Аватарка уже установлена.' : 'Заявка на аватарку оплачена из казны и добавлена в очередь администраторам.') : 'Операция сохранена.');
      remember(null); setAmount(''); setBrief(''); await load();
    } catch (e) {
      remember({...pending, uncertain: !e.response || e.response.status >= 500});
      setError(errorText(e));
    } finally {setSending(false);}
  };
  const disabled = !data || loading || sending || !!pending;
  return <section className="fantasy-paper p-3" aria-label="Казна гильдии">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h2>Казна гильдии</h2><Button onClick={load} disabled={loading || sending}>{loading ? 'Загрузка…' : 'Обновить'}</Button>
    </div>
    {error && <Alert variant="danger">{error}</Alert>}{success && <Alert variant="success">{success}</Alert>}
    {data && <>
      <h3>{data.guild_name}</h3>
      <p>В казне: <strong>{fmt(data.account.gold)} монет · {fmt(data.account.daleons)} далеонов</strong>.</p>
      <p>У персонажа: {fmt(data.wallet.gold)} монет · {fmt(data.wallet.daleons)} далеонов.</p>
      <p>Все участники могут пополнять казну. Снимать средства и заказывать аватарку может только глава.</p>
      <Form.Group className="mb-2"><Form.Label htmlFor="guild-treasury-currency">Валюта</Form.Label>
        <Form.Select id="guild-treasury-currency" value={currency} onChange={e => setCurrency(e.target.value)}>
          <option value="daleons">Далеоны</option><option value="gold">Монеты</option>
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3"><Form.Label htmlFor="guild-treasury-amount">Количество</Form.Label>
        <Form.Control id="guild-treasury-amount" type="number" min="1" max="1000000000" value={amount} onChange={e => setAmount(e.target.value)}/>
      </Form.Group>
      <div className="d-flex flex-wrap gap-2 mb-4">
        <Button disabled={disabled} onClick={() => propose('deposit')}>Внести в казну</Button>
        {data.can_manage && <Button disabled={disabled} onClick={() => propose('withdraw')}>Получить из казны</Button>}
      </div>
      <h3>Аватарка гильдии</h3>
      <p>Заказ у администраторов — <strong>1000 далеонов из казны</strong>. Картинка появится в списке гильдий. При отказе 1000 далеонов вернутся в казну.</p>
      {(data.avatar_orders || []).map(order => <Alert key={order.id} variant="info">Оплаченная заявка: {order.brief}<br/>Номер: {order.id}</Alert>)}
      {data.can_manage && <>
        <Form.Group className="mb-3"><Form.Label htmlFor="guild-avatar-brief">Какую аватарку нарисовать?</Form.Label>
          <Form.Control as="textarea" id="guild-avatar-brief" maxLength={1000} value={brief} onChange={e => setBrief(e.target.value)}/>
        </Form.Group>
        <Button disabled={disabled || !!data.avatar_orders?.length} onClick={draftAvatar}>Заказать аватарку за 1000 далеонов</Button>
      </>}
      {data.ledger?.length > 0 && <><h3 className="mt-4">Журнал казны</h3><Table responsive size="sm"><thead><tr><th>Когда</th><th>Кто</th><th>Операция</th><th>Изменение</th></tr></thead><tbody>
        {data.ledger.map(entry => <tr key={entry.id}><td>{new Date(entry.created_at).toLocaleString('ru-RU')}</td><td>{entry.actor_name || 'Игрок'} (ID {entry.actor_id})</td><td>{{deposit:'Взнос',withdraw:'Снятие',avatar_order:'Заказ аватарки',avatar_refund:'Возврат за аватарку'}[entry.kind] || entry.kind}</td><td>{entry.payload.daleons !== undefined ? `${entry.payload.daleons} далеонов` : `${entry.payload.amount} ${entry.payload.currency === 'gold' ? 'монет' : 'далеонов'}`}</td></tr>)}
      </tbody></Table></>}
    </>}
    <Modal className="frontier-operation-modal" backdropClassName="frontier-operation-backdrop" show={!!pending} onHide={cancel} backdrop="static" centered aria-labelledby="guild-treasury-confirm-title">
      <Modal.Header closeButton={!cancelBlocked}><Modal.Title id="guild-treasury-confirm-title">Подтвердить операцию</Modal.Title></Modal.Header>
      <Modal.Body>
        {pending?.kind === 'avatar' ? <><p>{pending.brief}</p><p>Списать 1000 далеонов из казны и отправить заказ администраторам?</p></> : <p>{pending?.kind === 'deposit' ? 'Внести в казну' : 'Получить из казны'}: {fmt(pending?.amount)} {pending?.currency === 'gold' ? 'монет' : 'далеонов'}.</p>}
        {pending?.guild_id !== undefined && data && pending.guild_id !== data.guild_id && <Alert variant="danger">Гильдия изменилась. Эта операция относится к прежней гильдии.</Alert>}
        {pending?.uncertain && <p>Ответ не получен. Повторное подтверждение использует тот же номер операции и не спишет средства дважды.</p>}
        {error && <Alert variant="danger">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer><Button variant="secondary" onClick={cancel} disabled={cancelBlocked}>Отмена</Button>
        <Button onClick={submit} disabled={sending || loading || !data || data.guild_id !== pending?.guild_id}>{sending ? 'Сохранение…' : 'Подтвердить'}</Button>
      </Modal.Footer>
    </Modal>
  </section>;
}
