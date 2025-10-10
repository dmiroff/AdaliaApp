import React from 'react';
import { Modal, Button, Form, Alert } from "react-bootstrap";

const SellModal = ({ 
  show, 
  onHide, 
  selectedRequest, 
  sellAmount, 
  setSellAmount, 
  userInventory, 
  onSell, 
  loading 
}) => {
  if (!selectedRequest) return null;

  const itemIdStr = selectedRequest.item_id.toString();
  const inventoryCount = userInventory[itemIdStr]?.count || 0;
  const maxAmount = Math.min(inventoryCount, selectedRequest.buy_amount);
  const totalPayment = selectedRequest.buy_price * (Number(sellAmount) || 0);

  return (
    <Modal show={show} onHide={onHide} centered className="fantasy-modal">
      <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
        <Modal.Title>Продать предметы</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Предмет: <strong>{selectedRequest.item_name}</strong></p>
        <p>Цена за шт.: <strong>{selectedRequest.buy_price} 🌕</strong></p>
        <p>Осталось скупить: <strong>{selectedRequest.buy_amount} шт.</strong></p>
        
        <Form.Group>
          <Form.Label>Количество для продажи:</Form.Label>
          <Form.Control
            type="number"
            value={sellAmount}
            onChange={(e) => setSellAmount(e.target.value)}
            min={1}
            max={maxAmount}
            placeholder="Введите количество"
          />
          <Form.Text className="text-muted">
            В вашем инвентаре: {inventoryCount} шт.<br/>
            Общая выплата: {totalPayment} 🌕
          </Form.Text>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          className="fantasy-btn fantasy-btn-secondary"
          onClick={onHide}
          disabled={loading}
        >
          Отмена
        </Button>
        <Button 
          className="fantasy-btn fantasy-btn-gold"
          onClick={onSell}
          disabled={
            !sellAmount || 
            Number(sellAmount) <= 0 || 
            Number(sellAmount) > inventoryCount ||
            loading
          }
        >
          {loading ? "Продажа..." : "Продать"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SellModal;