import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

const StorageCollectModal = ({ 
  show, 
  onHide, 
  selectedItem, 
  onCollect, 
  loading 
}) => {
  const [collectAmount, setCollectAmount] = useState(1);

  if (!selectedItem) return null;

  const handleCollect = () => {
    onCollect(selectedItem.item_id, collectAmount);
    setCollectAmount(1);
  };

  const handleClose = () => {
    setCollectAmount(1);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered className="fantasy-modal">
      <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-success">
        <Modal.Title>Забрать предметы со склада</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Предмет: <strong>{selectedItem.name}</strong></p>
        <p>Доступно на складе: <strong>{selectedItem.count} шт.</strong></p>
        
        <Row className="g-2 align-items-end">
          <Col>
            <Form.Group>
              <Form.Label>Количество для забора:</Form.Label>
              <Form.Control
                type="number"
                value={collectAmount}
                onChange={(e) => setCollectAmount(Number(e.target.value))}
                min={1}
                max={selectedItem.count}
              />
            </Form.Group>
          </Col>
          <Col>
            <div className="fantasy-card p-2 bg-light">
              <small className="fantasy-text-muted">
                Вес: {selectedItem.weight * collectAmount} ⚖️<br/>
                Будет перенесено в инвентарь
              </small>
            </div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          className="fantasy-btn fantasy-btn-secondary"
          onClick={handleClose}
          disabled={loading}
        >
          Отмена
        </Button>
        <Button 
          className="fantasy-btn fantasy-btn-success"
          onClick={handleCollect}
          disabled={collectAmount < 1 || collectAmount > selectedItem.count || loading}
        >
          {loading ? "Перенос..." : "Забрать"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StorageCollectModal;