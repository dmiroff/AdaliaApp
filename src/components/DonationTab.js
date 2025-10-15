// src/components/DonationTab.js
import React, { useState, useContext, useEffect } from 'react';
import { observer } from "mobx-react-lite";
import { Row, Col, Card, Button, Badge, Alert, Modal, Spinner } from "react-bootstrap";
import { Context } from "../index";
import GetDataById from "../http/GetData";
import { premiumPurchase } from "../http/premiumApi"; // Импортируем новый API

const DonationTab = observer(() => {
  const { user } = useContext(Context);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delay, setDelay] = useState(false);

  // Загрузка данных игрока по аналогии с Character компонентом
  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const playerDataResponse = await GetDataById();
        setPlayerData(playerDataResponse.data);
        user.setPlayer(playerDataResponse.data);
        setLoading(false);
      } catch (err) {
        console.error("Ошибка загрузки данных игрока:", err);
        setError("Не удалось загрузить данные игрока");
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [user]);

  useEffect(() => {
    if (playerData) {
      setTimeout(() => {
        setDelay(true);
      }, 1000);
    }
  }, [playerData]);

  // Список донатных товаров
  const donationProducts = [
    {
      id: 1,
      name: "💰 Торговец",
      description: "Постоянный доступ к эксклюзивному торговцу с уникальными товарами",
      price: 200,
      currency: "💎",
      features: ["Торговля вне аукциона"],
      purchased: playerData?.upgrades?.includes("Торговец") || false,
      type: "permanent"
    },
    {
      id: 2,
      name: "⚡ Рысак",
      description: "Верный спутник для быстрого перемещения между локациями",
      price: 500,
      currency: "💎",
      features: ["Ускоренное перемещение"],
      purchased: playerData?.upgrades?.includes("Рысак") || false,
      type: "permanent"
    },
    {
      id: 3,
      name: "⭐ Премиум статус (Неделя)",
      description: "Особые привилегии и бонусы на 7 дней",
      price: 300,
      currency: "💎",
      features: ["+50% к опыту", "+50% к шансам выпадения предметов", "Отдых после боя"],
      purchased: false,
      type: "premium",
      duration_days: 7
    },
    {
      id: 4,
      name: "⭐ Премиум статус (Месяц)",
      description: "Особые привилегии и бонусы на 30 дней",
      price: 1000,
      currency: "💎",
      features: ["+50% к опыту", "+50% к шансам выпадения предметов", "Отдых после боя"],
      purchased: false,
      type: "premium", 
      duration_days: 30
    }
  ];

  const handlePurchaseClick = (product) => {
    setSelectedProduct(product);
    setShowConfirmModal(true);
    setError("");
  };

  const handleConfirmPurchase = async () => {
    try {
      // Используем новый API метод
      const result = await premiumPurchase(
        selectedProduct.id,
        selectedProduct.type,
        selectedProduct.duration_days
      );

      if (result.status === 200) {
        setSuccess(`Покупка "${selectedProduct.name}" успешно оформлена!`);
        
        // Обновляем данные пользователя через контекст
        if (user.updatePlayerData) {
          user.updatePlayerData();
        }
        
        // Перезагружаем данные игрока
        const playerDataResponse = await GetDataById();
        setPlayerData(playerDataResponse.data);
        user.setPlayer(playerDataResponse.data);
      } else {
        setError(result.detail || "Ошибка при покупке");
      }
    } catch (err) {
      setError(err.message || "Ошибка при выполнении покупки");
    }

    setShowConfirmModal(false);
    setSelectedProduct(null);
    
    setTimeout(() => {
      setSuccess("");
      setError("");
    }, 5000);
  };

  const formatPrice = (price, currency) => {
    return `${price.toLocaleString('ru-RU')} ${currency}`;
  };

  // Проверяем активен ли премиум статус
  const isPremiumActive = playerData?.premium_active || false;

  // Отображение загрузки по аналогии с Character
  if (!delay) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="secondary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="fantasy-text-gold">Загрузка данных персонажа...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="secondary" />
          <p className="mt-2 text-muted">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fantasy-paper content-overlay">
      {/* Уведомления */}
      {success && (
        <Alert variant="success" className="fantasy-alert">
          <div className="text-center">
            <h5>🎉 Покупка успешна!</h5>
            <p className="mb-0">{success}</p>
          </div>
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="fantasy-alert">
          <div className="text-center">
            <h5>❌ Ошибка</h5>
            <p className="mb-0">{error}</p>
          </div>
        </Alert>
      )}

      {/* Заголовок */}
      <div className="text-center mb-5">
        <h2 className="fantasy-text-dark">🌟 Премиум Магазин</h2>
        <p className="fantasy-text-muted">
          Улучшите свой игровой опыт с эксклюзивными возможностями
        </p>
      </div>

      {/* Баланс далеонов */}
      <Card className="fantasy-card mb-4">
        <Card.Body className="text-center">
          <h5 className="fantasy-text-primary">Ваш баланс</h5>
          <div className="fantasy-text-dark fs-3 fw-bold">
            {(playerData?.daleons || 0).toLocaleString('ru-RU')} 💎
          </div>
          {isPremiumActive && (
            <Badge bg="success" className="mt-2">
              ⭐ Премиум статус активен
            </Badge>
          )}
        </Card.Body>
      </Card>

      {/* Список товаров */}
      <Row>
        {donationProducts.map((product) => {
          const isPurchased = product.type === "permanent" ? product.purchased : false;
          const isDisabled = isPurchased || (playerData?.daleons || 0) < product.price;
          
          return (
            <Col key={product.id} lg={6} className="mb-4">
              <Card className={`fantasy-card h-100`}>
                
                <Card.Body className="d-flex flex-column">
                  <div className="text-center mb-3">
                    <h4 className="fantasy-text-primary">{product.name}</h4>
                    {product.type === "permanent" && product.purchased && (
                      <Badge bg="success" className="mb-2">
                        ✅ Приобретено
                      </Badge>
                    )}
                    {product.type === "premium" && isPremiumActive && (
                      <Badge bg="info" className="mb-2">
                        ⭐ Активен
                      </Badge>
                    )}
                  </div>

                  <Card.Text className="fantasy-text-dark flex-grow-1">
                    {product.description}
                  </Card.Text>

                  {/* Список особенностей */}
                  <ul className="fantasy-feature-list">
                    {product.features.map((feature, index) => (
                      <li key={index} className="fantasy-text-muted">
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Цена и кнопка */}
                  <div className="mt-auto">
                    <div className="text-center mb-3">
                      <span className="fantasy-text-dark fs-3 fw-bold">
                        {formatPrice(product.price, product.currency)}
                      </span>
                    </div>
                    
                    <Button
                      className={`fantasy-btn w-100 ${
                        isDisabled 
                          ? 'fantasy-btn-secondary fantasy-btn-disabled' 
                          : 'fantasy-btn-gold'
                      }`}
                      onClick={() => !isDisabled && handlePurchaseClick(product)}
                      disabled={isDisabled}
                    >
                      {product.type === "permanent" && product.purchased 
                        ? 'Приобретено' 
                        : (playerData?.daleons || 0) < product.price 
                          ? 'Недостаточно средств'
                          : 'Приобрести'
                      }
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Дополнительная информация */}
      <Card className="fantasy-card mt-4">
        <Card.Body>
          <h5 className="fantasy-text-primary text-center">💎 Почему стоит приобрести?</h5>
          <Row className="text-center">
            <Col md={3}>
              <div className="fs-1">⚡</div>
              <h6>Ускорение прогресса</h6>
              <small className="fantasy-text-muted">Достигайте целей быстрее</small>
            </Col>
            <Col md={3}>
              <div className="fs-1">🎁</div>
              <h6>Эксклюзивный контент</h6>
              <small className="fantasy-text-muted">Уникальные предметы и возможности</small>
            </Col>
            <Col md={3}>
              <div className="fs-1">💝</div>
              <h6>Поддержка проекта</h6>
              <small className="fantasy-text-muted">Помогайте развитию игры</small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Модальное окно подтверждения покупки */}
      <Modal 
        show={showConfirmModal} 
        onHide={() => setShowConfirmModal(false)}
        centered
        className="fantasy-modal"
      >
        <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
          <Modal.Title className="fantasy-text-gold">Подтверждение покупки</Modal.Title>
        </Modal.Header>
        <Modal.Body className="fantasy-modal-body">
          {selectedProduct && (
            <div className="text-center">
              <h4 className="fantasy-text-primary mb-3">{selectedProduct.name}</h4>
              <p className="fantasy-text-dark">{selectedProduct.description}</p>
              <div className="fantasy-price-display mb-3">
                <span className="fantasy-text-gold fs-2 fw-bold">
                  {formatPrice(selectedProduct.price, selectedProduct.currency)}
                </span>
              </div>
              <Alert variant="info" className="fantasy-alert">
                <small>
                  С вашего счета будет списано {selectedProduct.price} далеонов
                </small>
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="fantasy-modal-footer">
          <Button 
            className="fantasy-btn fantasy-btn-secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Отмена
          </Button>
          <Button 
            className="fantasy-btn fantasy-btn-gold"
            onClick={handleConfirmPurchase}
          >
            Подтвердить покупку
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

export default DonationTab;