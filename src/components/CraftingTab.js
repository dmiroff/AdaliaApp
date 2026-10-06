import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap';
import apiClient from '../http/apiClient';

export default function CraftingTab() {
  const [catalog, setCatalog] = useState(null);
  const [search, setSearch] = useState('');
  const [batches, setBatches] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(null);
  const reload = async () => {
    const { data } = await apiClient.get('/crafting');
    setCatalog(data);
  };
  useEffect(() => { reload().catch(e => setError(e.response?.data?.detail || 'Не удалось загрузить рецепты')); }, []);
  const craft = async (recipe) => {
    setBusy(true); setError(''); setMessage('');
    const request = pending?.recipe === recipe && pending?.batches === batches
      ? pending : { recipe, batches, request_id: crypto.randomUUID() };
    setPending(request);
    try {
      const { data } = await apiClient.post('/crafting', request);
      setMessage(`Создано: ${data.name} × ${data.quantity}. Потрачено золота: ${data.money_spent}.`);
      setPending(null);
      await reload();
    } catch (e) {
      setError(e.response?.data?.detail || 'Ответ не получен. Повтори тот же крафт — материалы не спишутся дважды.');
      if (e.response && e.response.status < 500) setPending(null);
    } finally { setBusy(false); }
  };
  if (!catalog) return error ? <Alert variant="danger">{error}</Alert> : <Spinner animation="border" />;
  return <div className="fantasy-paper p-3">
    <h3>⚒️ Кузня</h3>
    <p>Рецепты используют материалы из инвентаря. Навык Кузнеца увеличивает выход расходников.</p>
    {!catalog.allowed && <Alert variant="info">{catalog.reason}. Постоянная переносная кузня доступна в премиум-магазине за 500 далёнов.</Alert>}
    {catalog.portable && <Alert variant="success">Переносная кузня доступна: можно создавать предметы вне боя в любой локации.</Alert>}
    {error && <Alert variant="danger">{error}</Alert>}
    {message && <Alert variant="success">{message}</Alert>}
    <Form.Control aria-label="Поиск рецепта" placeholder="Стрелы, болты, свитки…" value={search} onChange={e => setSearch(e.target.value)} className="mb-2" />
    <Form.Label>Количество партий</Form.Label>
    <Form.Control type="number" min={1} max={100} value={batches} disabled={busy}
      onChange={e => setBatches(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} className="mb-3" />
    {catalog.recipes.filter(r => r.key.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(r => <Card className="mb-2" key={r.key}>
      <Card.Body><Card.Title>{r.key}</Card.Title>
        <p>{r.description}</p>
        <div>Выход: {r.quantity * batches} шт. · Золото: {r.money * batches}</div>
        <ul>{r.materials.map(m => <li key={m.id}>{m.name}: {m.required * batches} / есть {m.available}</li>)}</ul>
        <Button disabled={busy || !catalog.allowed || batches > r.max_batches} onClick={() => craft(r.key)}>
          {busy ? 'Крафт…' : 'Создать'}
        </Button>
      </Card.Body>
    </Card>)}
  </div>;
}
