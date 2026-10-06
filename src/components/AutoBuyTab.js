import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, ListGroup, Modal } from 'react-bootstrap';
import apiClient from '../http/apiClient';

export default function AutoBuyTab() {
  const [data, setData] = useState({ rules: [], money: 0 });
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [removing, setRemoving] = useState(null);
  const failure = exc => setError(exc.response?.data?.detail || 'Не удалось выполнить действие');
  async function load() { const result = await apiClient.get('/api/autobuy'); setData(result.data); }
  useEffect(() => { load().catch(failure); }, []);
  async function search(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { const result = await apiClient.get('/api/autobuy/items', { params: { q: query } }); setItems(result.data); }
    catch (exc) { failure(exc); } finally { setBusy(false); }
  }
  async function save(rule, enabled = true) {
    setBusy(true); setError(''); setNotice('');
    try {
      await apiClient.put(`/api/autobuy/${rule.item_id}`, { price: rule.price, enabled });
      await load(); setNotice('Прайс-лист сохранён'); setSelected(null); setPrice('');
    } catch (exc) { failure(exc); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError('');
    try { await apiClient.delete(`/api/autobuy/${removing.item_id}`); await load(); setRemoving(null); }
    catch (exc) { failure(exc); } finally { setBusy(false); }
  }
  function select(item) { setSelected(item); setPrice(String(data.rules.find(r => r.item_id === item.id)?.price || '')); }
  return <div className="fantasy-paper p-3">
    <h3>Автопокупки — мой прайс-лист</h3>
    <p>При передаче вам предметов из списка вы автоматически платите отправителю указанную цену за штуку. Доступно: {data.money} 🌕.</p>
    <p>Если монет не хватает, покупается доступное количество. Остаток остаётся у отправителя. Предметы вне списка или с правилом на паузе передаются как обычный подарок. Действуют обычные ограничения передачи по локации, бою и весу.</p>
    {error && <Alert variant="danger">{typeof error === 'string' ? error : 'Проверьте цену и выбранный предмет'}</Alert>}
    {notice && <Alert variant="success">{notice}</Alert>}
    <Form onSubmit={search} className="mb-3"><Form.Label>Добавить предмет по названию или ID</Form.Label>
      <Form.Control value={query} onChange={event => setQuery(event.target.value)} placeholder="Эссенция смерти, книга сброса навыков…" />
      <Button type="submit" disabled={busy || !query.trim()} className="mt-2">Найти</Button>
    </Form>
    <ListGroup className="mb-3">{items.map(item => <ListGroup.Item key={item.id}>
      {item.name} · ID {item.id}{' '}<Button size="sm" disabled={busy} onClick={() => select(item)}>Выбрать</Button>
    </ListGroup.Item>)}</ListGroup>
    {selected && <Card className="mb-3"><Card.Body>
      <Card.Title>{selected.name} · ID {selected.id}</Card.Title>
      <Form onSubmit={event => { event.preventDefault(); save({ item_id: selected.id, price: Number(price) }); }}>
        <Form.Label>Монет за одну штуку</Form.Label>
        <Form.Control type="number" min="1" max="1000000000" step="1" required value={price} onChange={event => setPrice(event.target.value)} />
        <Button type="submit" disabled={busy} className="mt-2">Сохранить и включить</Button>{' '}
        <Button variant="secondary" disabled={busy} onClick={() => setSelected(null)}>Отмена</Button>
      </Form>
    </Card.Body></Card>}
    {data.rules.length === 0 && <p>Прайс-лист пуст. Добавьте первый предмет.</p>}
    {data.rules.map(rule => <Card key={rule.item_id} className="mb-2"><Card.Body>
      <strong>{rule.name}</strong> · ID {rule.item_id}<p>{rule.price} 🌕/шт. · {rule.enabled ? 'Автопокупка включена' : 'Пауза'}</p>
      <Button size="sm" disabled={busy} onClick={() => select({id: rule.item_id, name: rule.name})}>Цена</Button>{' '}
      <Button size="sm" variant="outline-secondary" disabled={busy} onClick={() => save(rule, !rule.enabled)}>{rule.enabled ? 'Пауза' : 'Включить'}</Button>{' '}
      <Button size="sm" variant="outline-danger" disabled={busy} onClick={() => setRemoving(rule)}>Удалить</Button>
    </Card.Body></Card>)}
    <Modal show={!!removing} onHide={() => !busy && setRemoving(null)} centered><Modal.Header closeButton={!busy}><Modal.Title>Удалить из прайс-листа?</Modal.Title></Modal.Header>
      <Modal.Body>{removing?.name}: после удаления передача этого предмета не будет оплачиваться автоматически.</Modal.Body>
      <Modal.Footer><Button variant="secondary" disabled={busy} onClick={() => setRemoving(null)}>Отмена</Button><Button variant="danger" disabled={busy} onClick={remove}>Удалить</Button></Modal.Footer>
    </Modal>
  </div>;
}
