// src/components/PlayerImages.js
import React, { useState, useEffect, useContext } from 'react';
import { Card, Row, Col, Button, Alert, Spinner, Badge, Accordion } from "react-bootstrap";
import { Context } from "../index";
import GetDataById from "../http/GetData";
import { getPlayerSettings, setCurrentImage } from "../http/playerSettingsApi";

const PlayerImages = () => {
  const { user } = useContext(Context);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [playerData, setPlayerData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const playerDataResponse = await GetDataById();
        setPlayerData(playerDataResponse.data);
        
        const settingsResponse = await getPlayerSettings();
        setSettings(settingsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setError("Не удалось загрузить коллекцию образов");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSetCurrentImage = async (imageName) => {
    try {
      setError("");
      const response = await setCurrentImage(imageName);
      if (response.status === 200) {
        setSuccess(`Образ "${imageName}" установлен как текущий!`);
        
        // Обновляем данные
        const playerDataResponse = await GetDataById();
        setPlayerData(playerDataResponse.data);
        
        const settingsResponse = await getPlayerSettings();
        setSettings(settingsResponse.data);
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.detail || "Ошибка при смене образа");
      }
    } catch (err) {
      setError(err.message || "Ошибка при смене образа");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="info" />
        <p className="mt-2">Загрузка коллекции образов...</p>
      </div>
    );
  }

  const availableImages = settings?.available_images || [];
  const currentImage = settings?.current_image || playerData?.character_art;

  return (
    <div className="images-container">
      {success && <Alert variant="success" className="mb-3">{success}</Alert>}
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

      <Accordion defaultActiveKey="0" className="mb-4">
        {/* Текущий активный образ */}
        <Accordion.Item eventKey="0" className="fantasy-card border-success">
          <Accordion.Header className="fantasy-card-header-success">
            <div className="d-flex align-items-center">
              <div className="me-2">👤</div>
              <h5 className="mb-0">Активный образ</h5>
              {currentImage && (
                <Badge bg="success" className="ms-2">Активен</Badge>
              )}
            </div>
          </Accordion.Header>
          <Accordion.Body className="text-center">
            <div className="fs-1 mb-3">
              {currentImage?.includes("рыцарь") ? "⚔️" :
               currentImage?.includes("фея") ? "🧚" :
               currentImage?.includes("волк") ? "🐺" :
               currentImage?.includes("маг") ? "🧙" :
               currentImage?.includes("лучник") ? "🏹" : "👤"}
            </div>
            <h4 className="fantasy-text-success mb-3">
              {currentImage || "Стандартный образ"}
            </h4>
            {!currentImage && (
              <p className="fantasy-text-muted">
                Вы ещё не выбрали образ. Приобретите образ в событийном магазине!
              </p>
            )}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      {/* Доступные образы */}
      <div className="mb-4">
        <h5 className="fantasy-text-dark mb-3">
          📚 Доступные образы ({availableImages.length})
        </h5>
        
        {availableImages.length > 0 ? (
          <Row className="g-3">
            {availableImages.map((image, index) => (
              <Col key={index} md={6} lg={4}>
                <Card className={`fantasy-card h-100 ${currentImage === image ? 'border-info border-2' : ''}`}>
                  <Card.Body className="text-center d-flex flex-column">
                    <div className="fs-2 mb-2">
                      {image.includes("рыцарь") ? "⚔️" :
                       image.includes("фея") ? "🧚" :
                       image.includes("волк") ? "🐺" :
                       image.includes("маг") ? "🧙" :
                       image.includes("лучник") ? "🏹" : "👤"}
                    </div>
                    <h6 className="fantasy-text-dark flex-grow-1 mb-3">{image}</h6>
                    <div className="mt-auto">
                      {currentImage === image ? (
                        <Button variant="success" disabled className="w-100">
                          ✅ Активен
                        </Button>
                      ) : (
                        <Button 
                          variant="outline-info" 
                          onClick={() => handleSetCurrentImage(image)}
                          className="w-100 fantasy-btn fantasy-btn-outline"
                        >
                          Выбрать этот образ
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center py-4">
            <div className="fs-1 mb-3">📭</div>
            <h5 className="fantasy-text-muted">Коллекция образов пуста</h5>
            <p className="fantasy-text-muted">
              Приобретайте образы в событийном магазине, чтобы пополнить коллекцию!
            </p>
          </div>
        )}
      </div>

      {/* Информация */}
      <Card className="fantasy-card">
        <Card.Header className="fantasy-card-header-info">
          <h5 className="mb-0">ℹ️ Информация об образах</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3">
              <div className="text-center">
                <div className="fs-2 mb-2">🎲</div>
                <h6>Случайный образ</h6>
                <small className="fantasy-text-muted">
                  Покупается за 1000 снежков. Вы получаете случайный образ из доступной коллекции.
                </small>
              </div>
            </Col>
            <Col md={4} className="mb-3">
              <div className="text-center">
                <div className="fs-2 mb-2">🎨</div>
                <h6>Заказ образа</h6>
                <small className="fantasy-text-muted">
                  Покупается за 3000 снежков. Вы заказываете индивидуальный образ у администрации игры.
                </small>
              </div>
            </Col>
            <Col md={4} className="mb-3">
              <div className="text-center">
                <div className="fs-2 mb-2">🔄</div>
                <h6>Смена образа</h6>
                <small className="fantasy-text-muted">
                  Меняйте активный образ в любое время бесплатно. Все купленные образы остаются в коллекции.
                </small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PlayerImages;