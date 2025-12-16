// src/components/SettingsModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Tab, Tabs, Spinner, Alert } from "react-bootstrap";
import PlayerSettings from './PlayerSettings';
import PlayerImages from './PlayerImages';

const SettingsModal = ({ show, onHide }) => {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTabSelect = (key) => {
    setActiveTab(key);
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      centered
      className="fantasy-modal"
      backdrop="static"
    >
      <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
        <Modal.Title className="fantasy-text-gold">
          ⚙️ Настройки игрока
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="fantasy-modal-body p-0">
        {error && (
          <Alert variant="danger" className="m-3">
            {error}
          </Alert>
        )}

        <Tabs
          activeKey={activeTab}
          onSelect={handleTabSelect}
          className="fantasy-tabs px-3 pt-3"
          fill
        >
          <Tab eventKey="general" title="📊 Основные настройки">
            <div className="p-3">
              <PlayerSettings />
            </div>
          </Tab>
          <Tab eventKey="images" title="🎭 Мои образы">
            <div className="p-3">
              <PlayerImages />
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
};

export default SettingsModal;