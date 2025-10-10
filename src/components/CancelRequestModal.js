import React from 'react';
import { Modal, Button, Alert } from "react-bootstrap";

const CancelRequestModal = ({ 
  show, 
  onHide, 
  selectedRequest, 
  onCancel, 
  loading 
}) => {
  if (!selectedRequest) return null;

  const totalCost = selectedRequest.buy_price * selectedRequest.buy_amount;
  const refundAmount = Math.floor(totalCost * 0.9);

  return (
    <Modal show={show} onHide={onHide} centered className="fantasy-modal">
      <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-danger">
        <Modal.Title>Отменить заявку на скупку</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Вы уверены, что хотите отменить заявку на скупку?</p>
        <div className="fantasy-card p-3 bg-light">
          <strong>Предмет:</strong> {selectedRequest.item_name}<br/>
          <strong>Цена за шт.:</strong> {selectedRequest.buy_price} 🌕<br/>
          <strong>Количество:</strong> {selectedRequest.buy_amount} шт.<br/>
          <strong>Общая стоимость:</strong> {totalCost} 🌕<br/>
          <strong>Возврат:</strong> {refundAmount} 🌕 (90%)
        </div>
        <Alert variant="warning" className="mt-3">
          <small>При отмене заявки вам будет возвращено 90% от зарезервированной суммы</small>
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          className="fantasy-btn fantasy-btn-secondary"
          onClick={onHide}
          disabled={loading}
        >
          Не отменять
        </Button>
        <Button 
          className="fantasy-btn fantasy-btn-danger"
          onClick={onCancel}
          disabled={loading}
        >
          {loading ? "Отмена..." : "Да, отменить заявку"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CancelRequestModal;