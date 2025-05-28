// src/components/ModalThrowAway.js
import React, { useState, useContext, useEffect} from "react";
import { Modal, Form, Button } from "react-bootstrap";

const ModalAction = ({show, onClose, device, devicekey, action, title, actionButtonText, handleRequest}) => {
  const [rangeValue, setRangeValue] = useState(1);

  if (!show) {
   return null;
  }

  return (
    <Modal show={show} onHide={onClose} backdrop="static" keyboard={false} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ whiteSpace: 'pre-wrap' }}>
        <Form.Range
          min={1}
          max={device.count}
          value={rangeValue}
          onChange={(e) => setRangeValue(e.target.value)}
        />
        <label
          htmlFor="custom-range"
          className="form-label"
          style={{
            position: "absolute",
            bottom: "0.75rem",
            left: "0.5rem",
            background: "#fff",
            padding: "0 0.25rem",
          }}
        >
          {rangeValue}
        </label>
      </Modal.Body>
      <Modal.Footer>
        <Button disabled={handleRequest} variant="primary" onClick={action}>
          {actionButtonText} 
        </Button>

        <Button variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
      </Modal.Footer>
    </Modal>
  );
};



export default ModalAction
