import React, {useEffect, useState} from 'react';
import {Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner, Tab, Tabs} from 'react-bootstrap';
import {eventShopPurchase, getCurrentEventShop} from '../http/eventShopApi';
import EventShopHistory from './EventShopHistory';

const requestId = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function EventShopTab() {
  const [shop, setShop] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [contacts, setContacts] = useState('');
  const [busy, setBusy] = useState(false);
  const [receiptKey, setReceiptKey] = useState(0);
  const [id, setId] = useState('');

  useEffect(() => {
    let alive = true;
    getCurrentEventShop().then(data => {if (alive) setShop(data);})
      .catch(err => {if (alive) setError(err.response?.data?.detail || 'Не удалось загрузить магазин');});
    return () => {alive = false;};
  }, []);

  const choose = product => {
    setSelected(product); setQuantity(1); setDescription(''); setContacts('');
    setError(''); setId(requestId());
  };
  const custom = selected?.type === 'cosmetic_selectable';
  const total = (selected?.price || 0) * quantity;
  const validQuantity = Number.isInteger(quantity) && quantity >= 1 && quantity <= (selected?.max_quantity || 1);
  const confirm = async () => {
    if (busy || !selected || selected.purchased || !validQuantity || total > shop.balance || (custom && !description.trim())) return;
    setBusy(true); setError('');
    try {
      const result = await eventShopPurchase(selected.id, selected.type, quantity, {
        request_id: id, ...(custom ? {custom_image_request: description.trim(), player_contacts: contacts.trim()} : {})
      });
      setSuccess(result.message);
      setShop(previous => ({...previous, balance: result.data.remaining_currency,
        products: previous.products.map(product => product.id === selected.id && product.type === "permanent" ? {...product, purchased: true} : product)}));
      setSelected(null); setReceiptKey(key => key + 1);
    } catch (err) {setError(err.message || 'Не удалось завершить покупку');}
    finally {setBusy(false);}
  };

  return <div className="fantasy-paper content-overlay p-3">
    <h2 className="fantasy-text-dark">🍂 {shop?.event_name || 'Магазин осеннего ивента'}</h2>
    {error && <Alert variant="danger" role="alert">{error}</Alert>}
    {success && <Alert variant="success" role="status" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
    {!shop && !error && <Spinner animation="border" role="status"><span className="visually-hidden">Загрузка магазина</span></Spinner>}
    {shop && <>
      <Badge bg="secondary" className="my-3 p-2">💀 Осколки Некрополя: {shop.balance}</Badge>
      <Tabs defaultActiveKey="shop" mountOnEnter unmountOnExit>
        <Tab eventKey="shop" title="Товары">
          <Row className="g-3 mt-1">{shop.products.map(product => <Col xs={12} md={6} key={product.id}>
            <Card className="fantasy-card h-100"><Card.Body className="d-flex flex-column">
              <Card.Title>{product.image} {product.name}</Card.Title>
              <Card.Text>{product.description}</Card.Text>
              <p className="fantasy-text-dark">{product.price.toLocaleString('ru-RU')} осколков</p>
              <Button className="mt-auto" onClick={() => choose(product)} disabled={busy || product.purchased || shop.balance < product.price}>
                {product.purchased ? 'Приобретено' : shop.balance < product.price ? 'Не хватает осколков' : 'Купить'}
              </Button>
            </Card.Body></Card>
          </Col>)}</Row>
        </Tab>
        <Tab eventKey="history" title="История покупок"><div className="mt-3"><EventShopHistory key={receiptKey} /></div></Tab>
      </Tabs>
    </>}
    <Modal show={!!selected} onHide={() => !busy && setSelected(null)} centered backdrop={busy ? 'static' : true} keyboard={!busy}>
      <Modal.Header closeButton={!busy}><Modal.Title>{selected?.name}</Modal.Title></Modal.Header>
      <Modal.Body>
        <p>{selected?.description}</p>
        {selected?.max_quantity > 1 && <Form.Group className="mb-3" controlId="event-shop-quantity">
          <Form.Label>Количество</Form.Label><Form.Control type="number" min="1" max={selected.max_quantity}
            value={quantity} disabled={busy} onChange={event => setQuantity(Number(event.target.value))} />
        </Form.Group>}
        {custom && <>
          <Form.Group className="mb-3" controlId="event-shop-description"><Form.Label>Описание желаемого арта</Form.Label>
            <Form.Control as="textarea" rows={4} maxLength={4000} value={description} disabled={busy}
              onChange={event => setDescription(event.target.value)} required />
            <Form.Text>Обычное изображение без анимации. После покупки заказ передаётся администрации.</Form.Text>
          </Form.Group>
          <Form.Group controlId="event-shop-contacts"><Form.Label>Контакт для связи (необязательно)</Form.Label>
            <Form.Control maxLength={500} value={contacts} disabled={busy} onChange={event => setContacts(event.target.value)} />
          </Form.Group>
        </>}
        <p className="mt-3 mb-0">Итого: {total.toLocaleString('ru-RU')} осколков Некрополя</p>
        {error && <Alert variant="danger" className="mt-3 mb-0">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer><Button variant="secondary" disabled={busy} onClick={() => setSelected(null)}>Отмена</Button>
        <Button onClick={confirm} disabled={busy || !validQuantity || total > (shop?.balance || 0) || (custom && !description.trim())}>
          {busy ? 'Покупка…' : 'Подтвердить покупку'}
        </Button>
      </Modal.Footer>
    </Modal>
  </div>;
}
