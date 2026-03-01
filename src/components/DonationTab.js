import React, { useState, useContext, useEffect, useRef } from 'react';
import { observer } from "mobx-react-lite";
import { Row, Col, Card, Button, Badge, Alert, Modal, Spinner, Form } from "react-bootstrap";
import { Context } from "../index";
import GetDataById from "../http/GetData";
import { 
  premiumPurchase, 
  createPayment, 
  checkPaymentStatus 
} from "../http/premiumApi";

const DonationTab = observer(() => {
  const { user } = useContext(Context);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delay, setDelay] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Состояния для Robokassa
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(100);
  const [processingTopUp, setProcessingTopUp] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const paymentChecked = useRef(false); // Чтобы не проверять платеж повторно

  // Функция загрузки данных игрока (вынесена для повторного вызова)
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

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchPlayer();
  }, [user]);

  // Искусственная задержка для анимации
  useEffect(() => {
    if (playerData) {
      setTimeout(() => {
        setDelay(true);
      }, 1000);
    }
  }, [playerData]);

  // Проверка возврата с Robokassa (при наличии InvId в URL)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invId = urlParams.get('InvId');

    if (invId && !paymentChecked.current) {
      paymentChecked.current = true;
      setCheckingPayment(true);

      const verifyPayment = async () => {
        try {
          const data = await checkPaymentStatus(invId);

          if (data.status === 'success') {
            setSuccess(`Баланс пополнен на ${data.amount} 💎!`);
            // Обновляем данные игрока
            await fetchPlayer();
            if (user.updatePlayerData) user.updatePlayerData();
          } else if (data.status === 'failed') {
            setError('Платёж не прошёл. Попробуйте снова.');
          } else {
            // Статус pending – возможно, ещё обрабатывается
            // Можно подождать или показать информационное сообщение
          }
        } catch (err) {
          console.error('Ошибка проверки статуса платежа:', err);
          setError('Не удалось проверить статус платежа');
        } finally {
          setCheckingPayment(false);
          // Очищаем параметры из URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };

      verifyPayment();
    }
  }, []); // Пустой массив зависимостей – выполнится только один раз при монтировании

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
      description: "Магический камень, позволяющий сбросить характеристики предмета",
      price: 50,
      currency: "💎",
      features: ["Сброс всех характеристик предмета"],
      purchased: false,
      type: "consumable",
      maxQuantity: 100
    },
    {
      id: 6,
      name: "👁️ Глаз добытчика",
      description: "Автоматический сбор тайников и разделка",
      price: 300,
      currency: "💎",
      features: ["Автоматический сбор тайников и разделка"],
      purchased: false,
      type: "permanent"
    }
  ];

  const handlePurchaseClick = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setShowConfirmModal(true);
    setError("");
  };

  const handleConfirmPurchase = async () => {
    try {
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
        
        if (user.updatePlayerData) user.updatePlayerData();
        
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

  const calculateTotalPrice = () => {
    if (!selectedProduct) return 0;
    return selectedProduct.price * quantity;
  };

  const isPremiumActive = playerData?.premium_active || false;

  // Обработчик пополнения через Robokassa
  const handleTopUp = async () => {
    setProcessingTopUp(true);
    setError("");

    try {
      const data = await createPayment(topUpAmount, window.location.href);
      // Перенаправляем на страницу оплаты Robokassa
      window.location.href = data.payment_url;
    } catch (err) {
      console.error('Ошибка создания платежа:', err);
      setError(err.response?.data?.detail || 'Не удалось создать платёж');
    } finally {
      setProcessingTopUp(false);
      setShowTopUpModal(false);
    }
  };

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

  if (loading || checkingPayment) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="secondary" />
          <p className="mt-2 text-muted">
            {checkingPayment ? 'Проверка платежа...' : 'Загрузка...'}
          </p>
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
            <h5>🎉 {success}</h5>
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

      {/* Баланс далеонов и кнопка пополнения */}
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
          <Button
            variant="outline-warning"
            className="mt-3 fantasy-btn-gold"
            onClick={() => setShowTopUpModal(true)}
            disabled={processingTopUp}
          >
            {processingTopUp ? <Spinner size="sm" /> : '💰 Пополнить баланс'}
          </Button>
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

                  <ul className="fantasy-feature-list">
                    {product.features.map((feature, index) => (
                      <li key={index} className="fantasy-text-muted">
                        {feature}
                      </li>
                    ))}
                  </ul>

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

      {/* Модальное окно подтверждения покупки (товары) */}
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

      {/* Модальное окно пополнения баланса */}
      <Modal 
        show={showTopUpModal} 
        onHide={() => setShowTopUpModal(false)}
        centered
        className="fantasy-modal"
      >
        <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
          <Modal.Title className="fantasy-text-gold">Пополнение баланса</Modal.Title>
        </Modal.Header>
        <Modal.Body className="fantasy-modal-body">
          <Form.Group>
            <Form.Label className="fantasy-text-dark">Сумма пополнения (в далеонах)</Form.Label>
            <Form.Control
              type="number"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(parseInt(e.target.value) || 0)}
              min={10}
              step={10}
              className="text-center"
            />
            <Form.Text className="fantasy-text-muted">
              1 💎 = 1 рубль
            </Form.Text>
          </Form.Group>
          <Alert variant="info" className="mt-3 fantasy-alert">
            <small>
              Вы будете перенаправлены на страницу оплаты Robokassa. 
              После успешной оплаты баланс обновится автоматически.
            </small>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="fantasy-modal-footer">
          <Button 
            className="fantasy-btn fantasy-btn-secondary"
            onClick={() => setShowTopUpModal(false)}
            disabled={processingTopUp}
          >
            Отмена
          </Button>
          <Button 
            className="fantasy-btn fantasy-btn-gold"
            onClick={handleTopUp}
            disabled={processingTopUp || topUpAmount < 10}
          >
            {processingTopUp ? <Spinner size="sm" /> : 'Перейти к оплате'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

export default DonationTab;