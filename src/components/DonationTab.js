import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { observer } from "mobx-react-lite";
import { Row, Col, Card, Button, Badge, Alert, Modal, Spinner, Form } from "react-bootstrap";
import { Context } from "../index";
import GetDataById from "../http/GetData";
import { 
  premiumPurchase, 
  createPaymentOrder,
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
  // NEW: состояние для текста заказа (арт / анимированный образ)
  const [customRequest, setCustomRequest] = useState("");

  // Состояния для пополнения
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(100);
  const [processingTopUp, setProcessingTopUp] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState(null);
  const paymentChecked = useRef(false);

  // Загрузка данных игрока
  const fetchPlayer = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    fetchPlayer();
  }, [fetchPlayer]);

  useEffect(() => {
    if (playerData) {
      setTimeout(() => {
        setDelay(true);
      }, 1000);
    }
  }, [playerData]);

  // Подгружаем скрипт виджета Т-Банка (если нужен)
  useEffect(() => {
    if (!document.querySelector('script[src*="tinkoff_v2.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://securepay.tinkoff.ru/html/payForm/js/tinkoff_v2.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Проверка статуса платежа после возврата с оплаты
  useEffect(() => {
    const storedPaymentId = sessionStorage.getItem('pendingPaymentId');
    if (storedPaymentId && !paymentChecked.current) {
      paymentChecked.current = true;
      setPendingPaymentId(storedPaymentId);
      sessionStorage.removeItem('pendingPaymentId');
    }
  }, []);

  useEffect(() => {
    if (pendingPaymentId) {
      const verifyPayment = async () => {
        setCheckingPayment(true);
        try {
          const data = await checkPaymentStatus(pendingPaymentId);
          if (data.status === 'success') {
            setSuccess(`Баланс пополнен на ${data.amount} 💎!`);
            await fetchPlayer();
            if (user.updatePlayerData) user.updatePlayerData();
          } else if (data.status === 'failed' || data.status === 'cancelled') {
            setError('Платёж не прошёл. Попробуйте снова.');
          }
          // Для статуса 'pending' ничего не показываем, ждём webhook
        } catch (err) {
          console.error('Ошибка проверки статуса платежа:', err);
          setError('Не удалось проверить статус платежа');
        } finally {
          setCheckingPayment(false);
          setPendingPaymentId(null);
        }
      };
      verifyPayment();
    }
  }, [pendingPaymentId, fetchPlayer, user]);

  // NEW: Обновлённый список товаров с двумя новыми позициями (арт на заказ и анимированный образ)
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
      purchased: playerData?.upgrades?.includes("Глаз добытчика") || false,
      type: "permanent"
    },
    {
      id: 7,
      name: "🏰 Гильдейский посланник",
      description: "Взаимодействие с замком/поселением из любой локации",
      price: 2000,
      currency: "💎",
      features: ["Взаимодействие с замком/поселением из любой локации"],
      purchased: playerData?.upgrades?.includes("Гильдейский посланник") || false,
      type: "permanent"
    },
    // NEW: Арт персонажа на заказ (требует описания)
    {
      id: 8,
      name: "🎨 Арт персонажа на заказ",
      description: "Уникальный арт вашего персонажа",
      price: 1500,
      currency: "💎",
      features: ["Индивидуальный арт персонажа"],
      purchased: false,
      type: "custom",
      requiresSelection: true,
      selectionPlaceholder: "Опишите вашего персонажа: расу, пол, класс, одежду, позу, фон, детали...",
      selectionMinLength: 20
    },
    // NEW: Анимированный образ персонажа
    {
      id: 9,
      name: "✨ Анимированный образ персонажа",
      description: "Живой анимированный портрет вашего персонажа с эффектами",
      price: 3000,
      currency: "💎",
      features: ["Анимированный образ", "Уникальные эффекты"],
      purchased: false,
      type: "custom",
      requiresSelection: true,
      selectionPlaceholder: "Опишите желаемый образ для анимации: внешность, одежда, анимации, эффекты...",
      selectionMinLength: 20
    }
  ];

  const handlePurchaseClick = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCustomRequest(""); // NEW: сбрасываем предыдущий запрос
    setShowConfirmModal(true);
    setError("");
  };

  // NEW: Обновлённая функция подтверждения покупки с поддержкой extra данных
  const handleConfirmPurchase = async () => {
    try {
      // Валидация для товаров с описанием
      if (selectedProduct.requiresSelection) {
        const minLength = selectedProduct.selectionMinLength || 10;
        if (!customRequest || customRequest.trim().length < minLength) {
          setError(`Пожалуйста, введите описание (минимум ${minLength} символов)`);
          return;
        }
      }

      // Формируем дополнительные данные, если нужно
      const extraData = selectedProduct.requiresSelection 
        ? { custom_request: customRequest.trim() } 
        : {};

      // Вызов API (предполагается, что premiumPurchase теперь поддерживает четвёртый параметр extraData)
      const result = await premiumPurchase(
        selectedProduct.id,
        selectedProduct.type === "premium" ? selectedProduct.duration_days : null,
        selectedProduct.type === "consumable" ? quantity : undefined,
        extraData   // NEW: передаём описание для кастомных заказов
      );

      if (result.status === 200) {
        let message = "";
        if (selectedProduct.type === "consumable") {
          message = `Покупка "${selectedProduct.name}" x${quantity} успешна!`;
        } else if (selectedProduct.requiresSelection) {
          message = `Заказ "${selectedProduct.name}" отправлен! Администратор свяжется с вами.`;
        } else {
          message = `Покупка "${selectedProduct.name}" успешна!`;
        }
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
    setCustomRequest(""); // NEW: очищаем
    
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

  const handleTopUp = async () => {
    setProcessingTopUp(true);
    setError("");
  
    try {
      const returnUrl = window.location.origin + window.location.pathname;
      const email = user.email || '';
      const phone = user.phone || '';
  
      const orderData = await createPaymentOrder(topUpAmount, returnUrl, email, phone);
  
      sessionStorage.setItem('pendingPaymentId', orderData.order_id);
  
      window.location.href = orderData.payment_url;
    } catch (err) {
      console.error('Ошибка создания платежа:', err);
      setError(err.response?.data?.detail || 'Не удалось создать платёж');
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
          <div className="d-flex flex-column align-items-center mt-3">
            {isPremiumActive && (
              <Badge bg="success" className="mb-2">
                ⭐ Пожинатель активен
              </Badge>
            )}
            <Button
              className="fantasy-btn fantasy-btn-gold"
              onClick={() => setShowTopUpModal(true)}
              disabled={processingTopUp}
            >
              {processingTopUp ? <Spinner size="sm" /> : '💰 Пополнить баланс'}
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Список товаров */}
      <Row>
        {donationProducts.map((product) => {
          // Для постоянных улучшений проверяем, куплено ли
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
                    {/* NEW: для кастомных товаров можно добавить значок */}
                    {product.requiresSelection && (
                      <Badge bg="warning" className="mb-2">
                        ✨ На заказ
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
                          : product.requiresSelection
                            ? 'Оформить заказ'
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
        onHide={() => {
          setShowConfirmModal(false);
          setSelectedProduct(null);
          setCustomRequest("");
        }}
        centered
        className="fantasy-modal"
        size={selectedProduct?.requiresSelection ? "lg" : "md"} // NEW: для заказов окно побольше
      >
        <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
          <Modal.Title className="fantasy-text-gold">
            {selectedProduct?.requiresSelection ? 'Оформление заказа' : 'Подтверждение покупки'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="fantasy-modal-body">
          {selectedProduct && (
            <div className="text-center">
              <h4 className="fantasy-text-primary mb-3">{selectedProduct.name}</h4>
              <p className="fantasy-text-dark">{selectedProduct.description}</p>
              
              {/* NEW: Поле ввода описания для кастомных товаров */}
              {selectedProduct.requiresSelection && (
                <div className="my-4">
                  <Form.Group>
                    <Form.Label className="fantasy-text-dark">
                      <strong>Опишите ваш заказ:</strong>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      value={customRequest}
                      onChange={(e) => setCustomRequest(e.target.value)}
                      placeholder={selectedProduct.selectionPlaceholder || "Введите описание..."}
                      className="fantasy-textarea"
                    />
                    <Form.Text className="fantasy-text-muted">
                      Минимум {selectedProduct.selectionMinLength || 10} символов. 
                      Чем подробнее описание, тем лучше художник поймёт вашу идею.
                    </Form.Text>
                  </Form.Group>
                  {customRequest && customRequest.length < (selectedProduct.selectionMinLength || 10) && (
                    <Alert variant="warning" className="mt-2 fantasy-alert">
                      <small>
                        Осталось { (selectedProduct.selectionMinLength || 10) - customRequest.length } символов
                      </small>
                    </Alert>
                  )}
                </div>
              )}
              
              {/* Выбор количества для consumable (не для кастомных) */}
              {selectedProduct.type === "consumable" && !selectedProduct.requiresSelection && (
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
                  {selectedProduct.type === "consumable" && !selectedProduct.requiresSelection
                    ? `${formatPrice(calculateTotalPrice(), selectedProduct.currency)} (${quantity} шт.)`
                    : formatPrice(selectedProduct.price, selectedProduct.currency)
                  }
                </span>
                {selectedProduct.type === "consumable" && !selectedProduct.requiresSelection && (
                  <div className="mt-1">
                    <small className="fantasy-text-muted">
                      {selectedProduct.price} 💎 за штуку
                    </small>
                  </div>
                )}
              </div>
              
              <Alert variant="info" className="fantasy-alert">
                <small>
                  {selectedProduct.requiresSelection
                    ? 'После подтверждения заявка будет отправлена администратору. С вашего счета будет списана указанная сумма.'
                    : `С вашего счета будет списано ${
                        selectedProduct.type === "consumable" && !selectedProduct.requiresSelection
                          ? calculateTotalPrice()
                          : selectedProduct.price
                      } далеонов`
                  }
                </small>
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="fantasy-modal-footer">
          <Button 
            className="fantasy-btn fantasy-btn-secondary"
            onClick={() => {
              setShowConfirmModal(false);
              setSelectedProduct(null);
              setCustomRequest("");
            }}
          >
            Отмена
          </Button>
          <Button 
            className="fantasy-btn fantasy-btn-gold"
            onClick={handleConfirmPurchase}
            disabled={
              selectedProduct?.type === "consumable" && !selectedProduct.requiresSelection
                ? (playerData?.daleons || 0) < calculateTotalPrice()
                : selectedProduct?.requiresSelection
                ? !customRequest || customRequest.length < (selectedProduct.selectionMinLength || 10)
                : (playerData?.daleons || 0) < (selectedProduct?.price || 0)
            }
          >
            {selectedProduct?.requiresSelection
              ? 'Отправить заявку'
              : selectedProduct?.type === "consumable"
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
              Вы будете перенаправлены на защищённую страницу оплаты банковской картой.
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