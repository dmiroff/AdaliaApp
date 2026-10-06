import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Modal } from 'react-bootstrap';
import apiClient from '../http/apiClient';

export default function HeadContractPanel() {
  const [contract, setContract] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState(false);
  async function load() {
    try { const { data } = await apiClient.get('/api/head-contract'); setContract(data); setError(''); }
    catch (exc) { setError(exc.response?.data?.detail || 'Не удалось проверить контракт'); }
  }
  useEffect(() => { load(); }, []);
  async function buyout() {
    setBusy(true); setError('');
    try {
      const { data } = await apiClient.post('/api/head-contract/buyout', { price: contract.price });
      setMessage(`${data.message}. Потрачено: ${data.price} 🌕`);
      setConfirm(false); await load();
    } catch (exc) { setError(exc.response?.data?.detail || 'Не удалось откупиться'); }
    finally { setBusy(false); }
  }
  return <Card className="mb-3"><Card.Body>
    <Card.Title>🕵️ Тайный осведомитель</Card.Title>
    {error && <Alert variant="danger">{error}</Alert>}
    {message && <Alert variant="success">{message}</Alert>}
    {contract && <p>{contract.active ? `На вашу голову назначен контракт. Откуп: ${contract.price} 🌕` : 'На вашу голову нет активного контракта.'}</p>}
    {contract?.active && <Button disabled={busy} onClick={() => setConfirm(true)}>Откупиться</Button>}{' '}
    <Button variant="outline-secondary" disabled={busy} onClick={load}>Проверить контракт</Button>
    <Modal show={confirm} onHide={() => !busy && setConfirm(false)} centered>
      <Modal.Header closeButton={!busy}><Modal.Title>Откупиться от контракта?</Modal.Title></Modal.Header>
      <Modal.Body>С инвентаря будет списана оставшаяся награда: {contract?.price} 🌕. Контракт будет снят. Если награда изменится, потребуется подтвердить новую стоимость.</Modal.Body>
      <Modal.Footer><Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>Отмена</Button>
        <Button disabled={busy} onClick={buyout}>{busy ? 'Откуп…' : 'Подтвердить откуп'}</Button></Modal.Footer>
    </Modal>
  </Card.Body></Card>;
}
