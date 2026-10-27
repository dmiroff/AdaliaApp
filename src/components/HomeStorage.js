import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import apiClient from '../http/apiClient';
import { dict_translator } from '../utils/Helpers';
import './HomeStorage.css';

const kg = value => Number(value || 0).toLocaleString('ru-RU', {maximumFractionDigits: 2});
const searchText = value => String(value || '').toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').trim();
const errorText = error => [404, 502].includes(error.response?.status)
  ? 'Хранилище временно недоступно. Попробуйте обновить позже.'
  : (typeof error.response?.data?.detail === 'string' ? error.response.data.detail : 'Не удалось связаться с хранилищем. Обновите список перед повторной попыткой.');

export default function HomeStorage({onInventoryChanged}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState('deposit');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState({});
  const [notice, setNotice] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const receipt = useRef(null);
  useEffect(() => {
    if (notice) receipt.current?.scrollIntoView?.({block: 'start', behavior: 'smooth'});
  }, [notice]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/home-storage');
      setData(response.data);
      if (response.data.can_deposit === false && response.data.can_withdraw) setDirection("withdraw");
      setSelected({});
    } catch (error) {
      setData(null);
      setNotice({variant: 'danger', text: errorText(error)});
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const source = useMemo(() => data ? data[direction === 'deposit' ? 'inventory' : 'storage'] : [], [data, direction]);
  const categories = [...new Set(source.map(item => item.type).filter(Boolean))].sort();
  const terms = searchText(query).split(/\s+/).filter(Boolean);
  const filtered = source.filter(item => {
    const text = searchText([item.name, item.type, dict_translator[item.type]].filter(Boolean).join(' '));
    return (!category || item.type === category) && terms.every(term => text.includes(term));
  });
  const chosen = source.filter(item => selected[item.id] !== undefined);
  const selectedWeight = chosen.reduce((total, item) => total + Number(item.weight || 0) * Number(selected[item.id] || 0), 0);
  const valid = chosen.length > 0 && chosen.every(item => Number.isInteger(Number(selected[item.id])) &&
    Number(selected[item.id]) >= 1 && Number(selected[item.id]) <= item.available);
  const overCapacity = direction === 'deposit' && data && selectedWeight + data.storage_weight > data.capacity + 1e-7;
  const blockedReason = data?.[`${direction}_blocked_reason`] || data?.blocked_reason;
  const disabled = busy || loading || !!blockedReason;
  const toggle = item => setSelected(current => {
    const next = {...current};
    if (next[item.id] !== undefined) delete next[item.id];
    else next[item.id] = item.available;
    return next;
  });
  const transfer = async () => {
    if (pending.current || disabled || !valid || overCapacity) return;
    pending.current = true;
    setBusy(true);
    setConfirm(false);
    try {
      const response = await apiClient.post('/home-storage/transfer', {
        direction, revision: data.revision,
        items: chosen.map(item => ({item_id: item.id, quantity: Number(selected[item.id])}))
      });
      setData(response.data);
      if (response.data.can_deposit === false && response.data.can_withdraw) setDirection("withdraw");
      setSelected({});
      setNotice({variant: 'success', text: response.data.message});
      onInventoryChanged?.();
    } catch (error) {
      const text = errorText(error);
      await load();
      onInventoryChanged?.();
      setNotice({variant: 'danger', text});
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return <section className="home-storage fantasy-paper p-3" aria-label="Домашнее хранилище">
    <div className="home-storage-heading">
      <h2>Домашнее хранилище</h2>
      <Button variant="outline-secondary" onClick={() => {setNotice(null); load();}} disabled={busy || loading}>Обновить</Button>
    </div>
    {notice && <Alert ref={receipt} className="home-storage-receipt" variant={notice.variant} role="alert">{notice.text}</Alert>}
    {loading && <p role="status"><Spinner size="sm" animation="border" /> Загружаем хранилище…</p>}
    {data && <>
      <div className="home-storage-weights">
        <span>Сундук: <strong>{kg(data.storage_weight)} / {kg(data.capacity)} кг</strong></span>
        <span>Инвентарь: <strong>{kg(data.inventory_weight)} / {kg(data.max_weight)} кг</strong></span>
      </div>
      {blockedReason && <Alert variant="warning">{blockedReason}</Alert>}
      {data.has_home_courier ? <p>🏠 Домашний посланник: складывайте и забирайте вещи удалённо.</p> :
        <p><a href="/donation">Домашний посланник в магазине улучшений</a> за 500 далеонов навсегда позволит складывать и забирать вещи удалённо.</p>}
      <div className="home-storage-tabs" role="group" aria-label="Направление переноса">
        {[['deposit', 'Сложить из инвентаря'], ['withdraw', 'Забрать из сундука']].map(([value, label]) =>
          <Button key={value} variant={direction === value ? 'primary' : 'outline-primary'} aria-pressed={direction === value}
            disabled={busy || loading} onClick={() => {setDirection(value); setSelected({}); setCategory(''); setQuery(''); setNotice(null);}}>{label}</Button>)}
      </div>
      <div className="home-storage-filters">
        <Form.Group className="home-storage-search" controlId="home-storage-search">
          <Form.Label>Поиск в {direction === 'withdraw' ? 'домашнем хранилище' : 'инвентаре'}</Form.Label>
          <div className="home-storage-search-input">
            <Form.Control type="search" aria-label="Поиск предметов" placeholder="Название или тип предмета" value={query} disabled={busy || loading} onChange={event => setQuery(event.target.value)} />
            {query && <Button variant="outline-secondary" aria-label="Очистить поиск" disabled={busy || loading} onClick={() => setQuery('')}>Сбросить</Button>}
          </div>
          <Form.Text aria-live="polite">Найдено: {filtered.length} из {source.length}. Выбранные предметы сохраняются при поиске.</Form.Text>
        </Form.Group>
        <Form.Select aria-label="Тип предмета" value={category} disabled={busy || loading} onChange={event => setCategory(event.target.value)}>
          <option value="">Все типы</option>
          {categories.map(type => <option key={type} value={type}>{dict_translator[type] || type}</option>)}
        </Form.Select>
      </div>
      <div className="home-storage-selection">
        <Button size="sm" variant="outline-primary" disabled={disabled || !filtered.some(item => item.available > 0)}
          onClick={() => setSelected(current => ({...current, ...Object.fromEntries(filtered.filter(item => item.available > 0).map(item => [item.id, item.available]))}))}>Выбрать найденные</Button>
        <Button size="sm" variant="outline-secondary" disabled={disabled || !chosen.length} onClick={() => setSelected({})}>Снять выбор</Button>
      </div>
      {!filtered.length && <p className="my-4">{query || category ? 'Предметы не найдены.' : direction === 'deposit' ? 'Инвентарь пуст.' : 'Сундук пуст.'}</p>}
      <div className="home-storage-items">
        {filtered.map(item => <article key={item.id} className={'home-storage-item ' + (selected[item.id] !== undefined ? 'is-selected' : '')}>
          <label className="home-storage-item-name">
            <input type="checkbox" aria-label={item.name} disabled={disabled || item.available < 1} checked={selected[item.id] !== undefined} onChange={() => toggle(item)} />
            <span><strong>{item.name}</strong><small>Всего: {item.count} · Доступно: {item.available} · {kg(item.weight)} кг/шт.
              {item.equipped > 0 && (' · Надето: ' + item.equipped)}
              {item.type === 'corpse' && ' · Перенос недоступен'}</small></span>
          </label>
          {selected[item.id] !== undefined && <div className="home-storage-quantity">
            <Button variant="outline-secondary" aria-label={'Уменьшить: ' + item.name} disabled={disabled || Number(selected[item.id]) <= 1}
              onClick={() => setSelected(current => ({...current, [item.id]: Math.max(1, Number(current[item.id]) - 1)}))}>−</Button>
            <Form.Control type="number" inputMode="numeric" min="1" max={item.available} step="1"
              aria-label={'Количество: ' + item.name} value={selected[item.id]} disabled={disabled}
              onChange={event => setSelected(current => ({...current, [item.id]: event.target.value}))} />
            <Button variant="outline-secondary" aria-label={'Увеличить: ' + item.name} disabled={disabled || Number(selected[item.id]) >= item.available}
              onClick={() => setSelected(current => ({...current, [item.id]: Math.min(item.available, Number(current[item.id]) + 1)}))}>+</Button>
            <Button size="sm" variant="outline-secondary" disabled={disabled} onClick={() => setSelected(current => ({...current, [item.id]: item.available}))}>Все</Button>
          </div>}
        </article>)}
      </div>
      <div className="home-storage-footer">
        <div aria-live="polite">Выбрано: {chosen.length} · {kg(selectedWeight)} кг</div>
        {!valid && chosen.length > 0 && <span className="text-danger">Укажите целое количество в пределах доступного.</span>}
        {overCapacity && <span className="text-danger">Не хватает места в сундуке. Уменьшите количество.</span>}
        <Button disabled={disabled || !valid || overCapacity} onClick={() => setConfirm(true)}>
          {busy ? 'Переносим…' : direction === 'deposit' ? 'Сложить выбранное' : 'Забрать выбранное'}
        </Button>
      </div>
    </>}
    {!data && !loading && <Button onClick={load}>Повторить загрузку</Button>}
    <Modal show={confirm} onHide={() => setConfirm(false)} centered>
      <Modal.Header closeButton><Modal.Title>{direction === 'deposit' ? 'Сложить в сундук?' : 'Забрать в инвентарь?'}</Modal.Title></Modal.Header>
      <Modal.Body>
        <ul>{chosen.map(item => <li key={item.id}>{item.name} × {selected[item.id]}</li>)}</ul>
        <p>Общий вес: {kg(selectedWeight)} кг</p>
      </Modal.Body>
      <Modal.Footer><Button variant="secondary" onClick={() => setConfirm(false)}>Отмена</Button><Button onClick={transfer}>Подтвердить перенос</Button></Modal.Footer>
    </Modal>
  </section>;
}
