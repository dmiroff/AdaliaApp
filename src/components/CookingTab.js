import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Modal, Spinner } from 'react-bootstrap';
import apiClient from '../http/apiClient';

const art = require.context('../assets/Images', true, /\.(webp|png|jpe?g)$/);
function picture(path) {
  const relative = (path || '').split('Images/')[1];
  if (!relative) return null;
  for (const key of [`./${relative.replace(/\.[^.]+$/, '.webp')}`, `./${relative}`]) {
    if (art.keys().includes(key)) return art(key);
  }
  return null;
}
export default function CookingTab({ initialDishId = null, dishesOnly = false }) {
  const [data, setData] = useState(null), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [batches, setBatches] = useState(1), [busy, setBusy] = useState(false), [pending, setPending] = useState(null);
  const [now, setNow] = useState(Date.now());
  const reload = async () => { const result = await apiClient.get('/crafting/cooking'); setData(result.data); };
  useEffect(() => {
    reload().catch(() => setError('Не удалось загрузить кухню'));
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(() => reload().catch(() => {}), 10000);
    return () => { clearInterval(timer); clearInterval(poll); };
  }, []);
  const preview = (action, payload, title, details) => {
    setPending({ action, payload: { ...payload, request_id: crypto.randomUUID() }, title, details });
  };
  const submit = async () => {
    if (!pending || busy) return;
    setBusy(true); setError('');
    try {
      const result = await apiClient.post(`/crafting/cooking/${pending.action}`, pending.payload);
      setMessage(result.data.message); setPending(null); await reload();
    } catch (e) { setError(e.response?.data?.detail || 'Ответ не получен. Можно повторить подтверждение.'); }
    finally { setBusy(false); }
  };
  const quoteText = q => q ? `${q.effect}\nДополнительная обычная еда: ${Object.entries(q.food).map(([id, n]) => `${data?.food_names?.[id] || id} ×${n}`).join(', ') || 'не требуется'}. Лечение: ${q.healed}. ${q.partial ? 'Еды не хватает: отдых частичный. ' : ''}${q.replaces ? 'Предыдущий пищевой эффект будет заменён.' : ''}` : 'Ваша раса не может использовать обычную еду.';
  if (!data) return error ? <Alert variant="danger">{error}</Alert> : <Spinner animation="border" />;
  return <div className="fantasy-paper p-3">
    <h3>🍲 Кухня · Повар {data.skill ?? 'не открыт'}</h3>
    <p>Выберите готовое блюдо и нажмите «Использовать на отдыхе». Результат придёт в игру через 30 секунд.</p>
    <p>Сила зависит от навыка автора при приготовлении и сохраняется при передаче. Рост продолжается после 100.</p>
    <p>🔥 «Посиделки у костра»: поешьте в одной локации лагеря за 5 минут компанией из 5, 10 или 100 человек. Каждый завершает полный отдых со своим блюдом. Награды к навыку повара: +1, +2 и +3 — по одному разу за уровень.</p>
    {!data.allowed && <Alert variant="info">{['В поселении нужна построенная кухня', 'Разбейте лагерь или войдите в кухню своего поселения'].includes(data.reason) ? 'Для готовки и отдыха с блюдом разбейте лагерь.' : data.reason}</Alert>}
    {data.last_result && !data.job && <Alert variant="success" role="status">{data.last_result.message}</Alert>}
    {message && !(data.last_result && !data.job && message.includes('начат')) && <Alert variant="success">{message}</Alert>}
    {error && <Alert variant="danger">{error}</Alert>}
    {data.job && <Alert variant="info">До завершения: {Math.max(0, Math.ceil(data.job.ready_at - now / 1000))} сек. <Button size="sm" onClick={() => reload().catch(() => setError('Не удалось обновить'))}>Обновить</Button></Alert>}
    {data.meal && <p>Следующий бой: {data.meal.name}. Осталось {Math.max(0, Math.ceil((data.meal.expires_at - now / 1000) / 60))} мин.</p>}
    <h4>Готовые блюда</h4>
    {!data.dishes.length && <p>В инвентаре пока нет готовых блюд.</p>}
    {data.dishes.filter(d => !initialDishId || d.id === Number(initialDishId)).map(d => <Card key={d.id} className="my-2"><Card.Body>
      <Card.Title>{d.name} ×{d.count}</Card.Title><p>{d.effect}</p>
      <Button disabled={busy || !data.allowed || !d.quote} onClick={() => preview('rest', { item_id: d.id, replace: !!d.quote.replaces, partial: d.quote.partial }, 'Отдых с блюдом — 30 секунд', `Расход: 1 порция.\n${quoteText(d.quote)}`)}>Использовать на отдыхе</Button>

    </Card.Body></Card>)}
    {!dishesOnly && <details className="mt-3"><summary>Приготовить блюдо / изучить рецепт</summary>
    <h4>Приготовление</h4>
    <Form.Label>Партий (готовятся последовательно)</Form.Label>
    <Form.Control type="number" min={1} max={100} value={batches} onChange={e => setBatches(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} />
    {data.recipes.map(r => <Card key={r.id} className="my-2"><Card.Body>
      {picture(r.image) && <img src={picture(r.image)} width="64" height="64" alt="" className="float-end rounded" />}
      <Card.Title>{r.name}</Card.Title><p>Повар {r.level} · {r.known ? 'Изучен' : 'Нужна запись рецепта'}</p>
      <p>{r.effect}</p><p>{r.portions * batches} порц. · {r.seconds * batches} сек.</p>
      <ul>{r.materials.map(m => <li key={m.id}>{m.name}: {m.count * batches} / есть {m.available}</li>)}</ul>
      {r.known ? <Button disabled={busy || !data.allowed || data.skill < r.level || r.max_batches < batches} onClick={() => preview('cook', { recipe_id: r.id, batches }, r.name, `Будет потрачено: ${r.materials.map(m => `${m.name} ×${m.count * batches}`).join(', ')}.\n${r.portions * batches} порц., ${r.seconds * batches} сек.\n${r.effect}`)}>Приготовить</Button>
        : <Button disabled={busy || !data.allowed || !r.note_count || data.skill === null} onClick={() => preview('learn', { note_id: r.note_id }, 'Изучить рецепт', `Расход: 1 запись «${r.name}». Готовка доступна с навыка ${r.level}.`)}>Изучить (есть {r.note_count})</Button>}
    </Card.Body></Card>)}
    </details>}
    <Modal show={!!pending} onHide={() => !busy && setPending(null)}><Modal.Header closeButton={!busy}><Modal.Title>{pending?.title}</Modal.Title></Modal.Header>
      <Modal.Body style={{ whiteSpace: 'pre-line' }}>{pending?.details}{error && <Alert variant="danger">{error}</Alert>}</Modal.Body>
      <Modal.Footer><Button variant="secondary" disabled={busy} onClick={() => setPending(null)}>Отмена</Button><Button disabled={busy} onClick={submit}>Подтвердить</Button></Modal.Footer>
    </Modal>
  </div>;
}
