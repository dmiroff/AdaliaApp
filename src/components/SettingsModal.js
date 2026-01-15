// src/components/SettingsModal.js
import React, { useState, useEffect, useContext } from 'react';
import { Modal, Tab, Tabs, Spinner, Alert } from "react-bootstrap";
import PlayerSettings from './PlayerSettings';
import PlayerImages from './PlayerImages';
import { Context } from "../index";

const SettingsModal = ({ show, onHide }) => {
  const { user } = useContext(Context);
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagesReady, setImagesReady] = useState(false);

  const handleTabSelect = (key) => {
    setActiveTab(key);
    // При переключении на вкладку с образами, проверяем загрузку
    if (key === "images" && !imagesReady) {
      setLoading(true);
      // Даем время на рендеринг компонента
      setTimeout(() => {
        setLoading(false);
        setImagesReady(true);
      }, 300);
    }
  };

  useEffect(() => {
    if (!show) {
      setActiveTab("general");
      setError("");
      setImagesReady(false);
    } else {
      // При открытии модального окна проверяем, загружены ли образы
      if (activeTab === "images") {
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    }
  }, [show, activeTab]);

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
              {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                  <div className="text-center">
                    <Spinner animation="border" variant="info" />
                    <p className="mt-2 fantasy-text-muted">Загрузка коллекции образов...</p>
                  </div>
                </div>
              ) : (
                <PlayerImages />
              )}
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
};

export default SettingsModal;