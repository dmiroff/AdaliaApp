import React, { useState, useContext, useEffect } from 'react';
import { observer } from "mobx-react-lite";
import { Row, Col, Card, Button, Badge, Alert, Modal, Spinner, Form } from "react-bootstrap";
import { Context } from "../index";
import GetDataById from "../http/GetData";
import { premiumPurchase } from "../http/premiumApi";

const DonationTab = observer(() => {
  const { user } = useContext(Context);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delay, setDelay] = useState(false);
  const [quantity, setQuantity] = useState(1); // Добавляем состояние для количества

  // Загрузка данных игрока
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
      description: "Постоянный доступ к аукциону, бирже и скупке",
      price: 200,
      currency: "💎",
      features: ["Доступ к торговле вне аукциона"],
      purchased: playerData?.upgrades?.includes("Торговец") || false,
      type: "permanent"
    },
    {
      id: 2,
      name: "🐎 Рысак",
      description: "Верный спутник для ускоренного перемещения между локациями",
      price: 500,
      currency: "💎",
      features: ["Быстрые перемещения"],
      purchased: playerData?.upgrades?.includes("Рысак") || false,
      type: "permanent"
    },
    {
      id: 3,
      name: "🌾 Пожинатель на 7 дней",
      description: "Получите игровой опыт нового уровня",
      price: 300,
      currency: "💎",
      features: ["+50% к опыту", "+50% к шансам выпадения предметов", "Отдых после боя"],
      purchased: false,
      type: "premium",
      duration_days: 7
    },
    {
      id: 4,
      name: "🌾 Пожинатель на 30 дней",
      description: "Исследуйте просторы Адалии с легкостью",
      price: 1000,
      currency: "💎",
      features: ["+50% к опыту", "+50% к шансам выпадения предметов", "Отдых после боя"],
      purchased: false,
      type: "premium", 
      duration_days: 30
    },
    {
      id: 5,
      name: "🌀 Камень забвения",
      description: "Магический камень, позволяющий сбросить характеристики и перераспределить очки",
      price: 50,
      currency: "💎",
      features: ["Сброс всех характеристик персонажа", "Возврат всех очков характеристик", "Возможность нового распределения"],
      purchased: false,
      type: "consumable",
      maxQuantity: 100 // Максимальное количество для покупки
    }
  ];

  const handlePurchaseClick = (product) => {
    setSelectedProduct(product);
    setQuantity(1); // Сбрасываем количество при выборе нового товара
    setShowConfirmModal(true);
    setError("");
  };

  const handleConfirmPurchase = async () => {
    try {
      // Для consumable товаров передаем количество, для остальных - только ID и duration
      const result = await premiumPurchase(
        selectedProduct.id,
        selectedProduct.type === "premium" ? selectedProduct.duration_days : null,
        selectedProduct.type === "consumable" ? quantity : undefined
      );

      if (result.status === 200) {
        const message = selectedProduct.type === "consumable" 
          ? `Покупка "${selectedProduct.name}" x${quantity} успешна!`
          : `Покупка "${selectedProduct.name}" успешна!`;
        setSuccess(message);
        
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

  const handleQuantityChange = (value) => {
    const numValue = parseInt(value);
    if (numValue > 0 && numValue <= (selectedProduct?.maxQuantity || 100)) {
      setQuantity(numValue);
    }
  };

  // Рассчитываем общую стоимость с учетом количества
  const calculateTotalPrice = () => {
    if (!selectedProduct) return 0;
    return selectedProduct.price * quantity;
  };

  // Проверяем активен ли премиум статус
  const isPremiumActive = playerData?.premium_active || false;

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
          Улучшите игровой опыт используя дополнительные функции
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
              ⭐ Пожинатель активен
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
                      {product.type === "consumable" && (
                        <div className="mt-1">
                          <small className="fantasy-text-muted">
                            Можно купить оптом (до {product.maxQuantity || 100} шт)
                          </small>
                        </div>
                      )}
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
                          : product.type === "consumable"
                            ? 'Купить'
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
              
              {/* Поле выбора количества для consumable товаров */}
              {selectedProduct.type === "consumable" && (
                <div className="my-4">
                  <Form.Label className="fantasy-text-dark">Количество:</Form.Label>
                  <div className="d-flex align-items-center justify-content-center">
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="fantasy-btn-outline"
                    >
                      -
                    </Button>
                    <Form.Control
                      type="number"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      min="1"
                      max={selectedProduct.maxQuantity || 100}
                      className="mx-2 text-center"
                      style={{ width: '100px' }}
                    />
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => handleQuantityChange(Math.min(selectedProduct.maxQuantity || 100, quantity + 1))}
                      disabled={quantity >= (selectedProduct.maxQuantity || 100)}
                      className="fantasy-btn-outline"
                    >
                      +
                    </Button>
                  </div>
                  <div className="mt-2">
                    <small className="fantasy-text-muted">
                      Максимальное количество: {selectedProduct.maxQuantity || 100}
                    </small>
                  </div>
                </div>
              )}
              
              <div className="fantasy-price-display mb-3">
                <span className="fantasy-text-gold fs-2 fw-bold">
                  {selectedProduct.type === "consumable" 
                    ? `${formatPrice(calculateTotalPrice(), selectedProduct.currency)} (${quantity} шт.)`
                    : formatPrice(selectedProduct.price, selectedProduct.currency)
                  }
                </span>
                {selectedProduct.type === "consumable" && (
                  <div className="mt-1">
                    <small className="fantasy-text-muted">
                      {selectedProduct.price} 💎 за штуку
                    </small>
                  </div>
                )}
              </div>
              
              <Alert variant="info" className="fantasy-alert">
                <small>
                  С вашего счета будет списано {selectedProduct.type === "consumable" 
                    ? calculateTotalPrice() 
                    : selectedProduct.price} далеонов
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
            disabled={selectedProduct?.type === "consumable" && (playerData?.daleons || 0) < calculateTotalPrice()}
          >
            {selectedProduct?.type === "consumable" 
              ? `Купить ${quantity} шт.`
              : 'Подтвердить покупку'
            }
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

export default DonationTab;