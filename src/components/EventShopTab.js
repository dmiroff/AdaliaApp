// EventShopTab.js - полная версия с защитными проверками
import React, { useState, useContext, useEffect } from 'react';
import { observer } from "mobx-react-lite";
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Badge, 
  Alert, 
  Modal, 
  Spinner, 
  Tabs, 
  Tab,
  Form
} from "react-bootstrap";
import { Context } from "../index";
import GetDataById from "../http/GetData";
import EventShopHistory from "../components/EventShopHistory";
import { eventShopPurchase } from "../http/eventShopApi";
import PlayerImages from "../components/PlayerImages";

const EventShopTab = observer(() => {
  const { user } = useContext(Context);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delay, setDelay] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeShop, setActiveShop] = useState("winter");
  const [selectedImage, setSelectedImage] = useState(null);

  // Загрузка данных игрока
  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const playerDataResponse = await GetDataById();
        if (playerDataResponse?.data) {
          setPlayerData(playerDataResponse.data);
          user.setPlayer(playerDataResponse.data);
        }
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

  // Функция для получения количества предмета в инвентаре
  const getItemCount = (itemId) => {
    if (!playerData?.inventory_new) return 0;
    
    const inventory = playerData.inventory_new;
    
    // Если инвентарь - объект с ключами как ID предметов
    if (typeof inventory === 'object' && !Array.isArray(inventory)) {
        const itemKey = String(itemId);
        const itemData = inventory[itemKey];
        
        if (!itemData) return 0;
        
        // Если это строка в формате "39765019 Снежок"
        if (typeof itemData === 'string') {
        // Пытаемся извлечь количество из строки
        const match = itemData.match(/^(\d+)/);
        if (match) {
            return parseInt(match[1], 10);
        }
        return 1; // Если не нашли число, считаем что 1 предмет
        }
        
        // Если это объект с полем count
        if (typeof itemData === 'object' && itemData.count !== undefined) {
        return parseInt(itemData.count, 10) || 0;
        }
    }
    
    // Если инвентарь - массив объектов
    if (Array.isArray(inventory)) {
        const item = inventory.find(item => 
        item && (item.item_id === itemId || item.id === itemId)
        );
        return item ? (parseInt(item.count, 10) || 0) : 0;
    }
    
    return 0;
    };

  // Количество снежков (ID 262)
  const snowballCount = getItemCount('262');

  // Зимний магазин (основной)
  const winterShopProducts = [
    {
      id: 1,
      name: "🎁 Мешок с подарками",
      description: "Тайный мешок, содержащий различные сюрпризы и награды",
      price: 200,
      currency: "❄️",
      currencyId: 262,
      features: [
        "Случайные предметы разного качества",
      ],
      type: "consumable",
      maxQuantity: 10,
      image: "🎁"
    },
    {
      id: 2,
      name: "🎭 Случайный образ",
      description: "Получите случайный уникальный образ для своего персонажа",
      price: 1000,
      currency: "❄️",
      currencyId: 262,
      features: [
        "Уникальный визуальный новогодний образ"
      ],
      type: "cosmetic",
      maxQuantity: 1,
      image: "🎭"
    },
    {
      id: 3,
      name: "✨ Заказ образа",
      description: "Выберите конкретный образ из доступной коллекции",
      price: 3000,
      currency: "❄️",
      currencyId: 262,
      features: [
        "Заказ конкретного образа"
      ],
      type: "cosmetic_selectable",
      maxQuantity: 1,
      image: "✨",
      requiresSelection: true
    },
    {
      id: 4,
      name: "⭐ Очко талантов",
      description: "Дополнительное очко для развития талантов персонажа",
      price: 5000,
      currency: "❄️",
      currencyId: 262,
      features: [
        "+1 очко талантов"
      ],
      type: "talent_point",
      maxQuantity: 5,
      image: "⭐"
    }
  ];

  // Список доступных образов для заказа
  const availableImages = [
    { id: 1, name: "Ледяной рыцарь", description: "Доспехи из вечного льда", rarity: "epic" },
    { id: 2, name: "Снежная фея", description: "Крылья из инея и снега", rarity: "legendary" },
    { id: 3, name: "Полярный волк", description: "Шкура арктического хищника", rarity: "rare" },
    { id: 4, name: "Новогодний маг", description: "Одеяния праздничного волшебства", rarity: "epic" },
    { id: 5, name: "Морозный лучник", description: "Лук из хрустального льда", rarity: "legendary" }
  ];

  const handlePurchaseClick = (product) => {
    if (!product || !product.id) {
      setError("Ошибка выбора товара");
      return;
    }
    
    setSelectedProduct(product);
    setQuantity(1);
    
    if (product.requiresSelection) {
      setSelectedImage(null);
    }
    
    setShowConfirmModal(true);
    setError("");
  };

  const canAfford = (product, qty = 1) => {
    // Защита от null/undefined
    if (!product || typeof product.price !== 'number') return false;
    return snowballCount >= (product.price * qty);
  };

  const calculateTotalPrice = () => {
    if (!selectedProduct || typeof selectedProduct.price !== 'number') return 0;
    return selectedProduct.price * quantity;
  };

  const handleConfirmPurchase = async () => {
    try {
      // Проверяем, что selectedProduct существует
      if (!selectedProduct || !selectedProduct.id) {
        setError("Ошибка: товар не выбран");
        return;
      }

      // Для заказа образа проверяем, выбран ли образ
      if (selectedProduct.requiresSelection && !selectedImage) {
        setError("Пожалуйста, выберите образ");
        return;
      }

      // Проверяем наличие средств
      if (!canAfford(selectedProduct, quantity)) {
        setError("Недостаточно снежков для покупки");
        return;
      }

      // Подготавливаем дополнительные данные для покупки
      const extraData = selectedProduct.requiresSelection 
        ? { selected_image_id: selectedImage.id }
        : {};

      const result = await eventShopPurchase(
        selectedProduct.id,
        selectedProduct.type,
        quantity,
        extraData
      );

      if (result.status === 200) {
        const message = selectedProduct.type === "consumable" 
          ? `Покупка "${selectedProduct.name}" x${quantity} успешна!`
          : `Покупка "${selectedProduct.name}" успешна!`;
        setSuccess(message);
        
        // Обновляем данные пользователя
        if (user.updatePlayerData) {
          user.updatePlayerData();
        }
        
        // Перезагружаем данные игрока
        const playerDataResponse = await GetDataById();
        setPlayerData(playerDataResponse.data);
        user.setPlayer(playerDataResponse.data);
        
        // Закрываем модалку
        setShowConfirmModal(false);
        setSelectedProduct(null);
        setSelectedImage(null);
      } else {
        setError(result.detail || "Ошибка при покупке");
      }
    } catch (err) {
      setError(err.message || "Ошибка при выполнении покупки");
    }

    setTimeout(() => {
      setSuccess("");
      setError("");
    }, 5000);
  };

  const handleQuantityChange = (value) => {
    const numValue = parseInt(value);
    if (!selectedProduct || typeof selectedProduct.maxQuantity !== 'number') return;
    
    if (numValue > 0 && numValue <= (selectedProduct.maxQuantity || 10)) {
      setQuantity(numValue);
    }
  };

  // Отображение загрузки
  if (!delay) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="info" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="fantasy-text-gold">Загрузка магазина события...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="info" />
          <p className="mt-2 text-muted">Загрузка магазина...</p>
        </div>
      </div>
    );
  }

  // Проверяем, что winterShopProducts существует и является массивом
  const safeWinterShopProducts = Array.isArray(winterShopProducts) ? winterShopProducts : [];

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
      <div className="text-center mb-4">
        <h2 className="fantasy-text-dark">🎄 Зимняя Лавка Чудес</h2>
        <p className="fantasy-text-muted">
          Особые товары доступные только во время зимнего события
        </p>
        <Badge bg="info" className="fs-6 py-2 px-3">
          ⏰ Событие активно до: 15 января
        </Badge>
      </div>

      {/* Текущие магазины в ротации */}
      <div className="mb-4">
        <Tabs
          activeKey={activeShop}
          onSelect={(k) => setActiveShop(k)}
          className="fantasy-tabs"
        >
          <Tab eventKey="winter" title="❄️ Зимний магазин">
            {/* Контент зимнего магазина */}
          </Tab>
          <Tab eventKey="history" title="📜 История покупок">
              <EventShopHistory />
          </Tab>
          <Tab eventKey="previous" title="📜 Архив" disabled>
            {/* Будут прошлые магазины */}
          </Tab>
        </Tabs>
      </div>

      {/* Баланс валюты события */}
      <Card className="fantasy-card mb-4 border-info">
        <Card.Body className="text-center">
          <h5 className="fantasy-text-info">Ваши снежки</h5>
          <div className="d-flex justify-content-center align-items-center">
            <div className="fantasy-text-dark fs-3 fw-bold me-2">
              {snowballCount.toLocaleString('ru-RU')}
            </div>
            <div className="fs-3">❄️</div>
          </div>
          <p className="fantasy-text-muted mt-2 mb-0">
            Снежки можно получить в зимних активностях и событиях
          </p>
        </Card.Body>
      </Card>

      {/* Список товаров */}
      <Row>
        {safeWinterShopProducts.map((product) => {
          // Проверяем, что товар существует
          if (!product || typeof product !== 'object') return null;
          
          const affordable = canAfford(product);
          const isDisabled = !affordable;
          
          return (
            <Col key={product.id} lg={6} className="mb-4">
              <Card className={`fantasy-card h-100 ${!affordable ? 'opacity-75' : ''}`}>
                <Card.Body className="d-flex flex-column">
                  <div className="text-center mb-3">
                    <div className="fs-1 mb-2">{product.image || "🎁"}</div>
                    <h4 className="fantasy-text-info">{product.name || "Товар"}</h4>
                    {product.type === "cosmetic" && (
                      <Badge bg="warning" className="mb-2">
                        🎭 Косметика
                      </Badge>
                    )}
                  </div>

                  <Card.Text className="fantasy-text-dark flex-grow-1">
                    {product.description || "Описание товара"}
                  </Card.Text>

                  {/* Список особенностей */}
                  <ul className="fantasy-feature-list">
                    {Array.isArray(product.features) 
                      ? product.features.map((feature, index) => (
                          <li key={index} className="fantasy-text-muted">
                            {feature}
                          </li>
                        ))
                      : <li className="fantasy-text-muted">Особенности не указаны</li>
                    }
                  </ul>

                  {/* Цена и кнопка */}
                  <div className="mt-auto">
                    <div className="text-center mb-3">
                      <span className="fantasy-text-dark fs-3 fw-bold">
                        {product.price ? product.price.toLocaleString('ru-RU') : "0"} {product.currency || "❄️"}
                      </span>
                      {product.type === "consumable" && (
                        <div className="mt-1">
                          <small className="fantasy-text-muted">
                            Можно купить до {product.maxQuantity || 10} шт
                          </small>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      className={`fantasy-btn w-100 ${
                        isDisabled 
                          ? 'fantasy-btn-secondary fantasy-btn-disabled' 
                          : 'fantasy-btn-info'
                      }`}
                      onClick={() => !isDisabled && handlePurchaseClick(product)}
                      disabled={isDisabled}
                    >
                      {!affordable 
                        ? 'Недостаточно снежков'
                        : product.type === "cosmetic_selectable"
                          ? 'Выбрать и купить'
                          : 'Купить'
                      }
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Информация о получении валюты */}
      <Card className="fantasy-card mt-4">
        <Card.Body>
          <h5 className="fantasy-text-info text-center">❄️ Как получить снежки?</h5>
          <Row className="text-center">
            <Col md={3} className="mb-3">
              <div className="fs-2">🎯</div>
              <h6>Ежедневные задания</h6>
              <small className="fantasy-text-muted">Выполняйте специальные зимние задания</small>
            </Col>
            <Col md={3} className="mb-3">
              <div className="fs-2">⚔️</div>
              <h6>Победы над боссами</h6>
              <small className="fantasy-text-muted">Побеждайте зимних боссов в подземельях</small>
            </Col>
            <Col md={3} className="mb-3">
              <div className="fs-2">🎁</div>
              <h6>Праздничные награды</h6>
              <small className="fantasy-text-muted">Получайте награды за активность в игре</small>
            </Col>
            <Col md={3} className="mb-3">
              <div className="fs-2">🏆</div>
              <h6>Событийные достижения</h6>
              <small className="fantasy-text-muted">Выполняйте достижения зимнего события</small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Модальное окно подтверждения покупки */}
      <Modal 
        show={showConfirmModal} 
        onHide={() => {
          setShowConfirmModal(false);
          setSelectedImage(null);
        }}
        centered
        className="fantasy-modal"
        size={selectedProduct?.requiresSelection ? "lg" : "md"}
      >
        <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-info">
          <Modal.Title className="fantasy-text-gold">
            {selectedProduct?.requiresSelection ? 'Выбор образа' : 'Подтверждение покупки'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="fantasy-modal-body">
          {selectedProduct ? (
            <div className="text-center">
              <div className="fs-1 mb-3">{selectedProduct.image || "🎁"}</div>
              <h4 className="fantasy-text-info mb-3">{selectedProduct.name || "Товар"}</h4>
              <p className="fantasy-text-dark">{selectedProduct.description || "Описание товара"}</p>
              
              {/* Выбор образа для "Заказ образа" */}
              {selectedProduct.requiresSelection && (
                <div className="my-4">
                  <h5 className="fantasy-text-dark mb-3">Выберите желаемый образ:</h5>
                  <Row className="g-3">
                    {availableImages.map((img) => (
                      <Col md={6} key={img.id}>
                        <Card 
                          className={`fantasy-card cursor-pointer ${
                            selectedImage?.id === img.id ? 'border-info border-2' : ''
                          }`}
                          onClick={() => setSelectedImage(img)}
                        >
                          <Card.Body>
                            <div className="fs-2 mb-2">
                              {img.rarity === 'legendary' ? '✨' : 
                               img.rarity === 'epic' ? '🌟' : '⭐'}
                            </div>
                            <h6 className="fantasy-text-dark">{img.name}</h6>
                            <small className="fantasy-text-muted">{img.description}</small>
                            <div className="mt-2">
                              <Badge bg={
                                img.rarity === 'legendary' ? 'warning' :
                                img.rarity === 'epic' ? 'purple' : 'info'
                              }>
                                {img.rarity === 'legendary' ? 'Легендарный' :
                                 img.rarity === 'epic' ? 'Эпический' : 'Редкий'}
                              </Badge>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  
                  {selectedImage && (
                    <Alert variant="info" className="mt-3">
                      Вы выбрали: <strong>{selectedImage.name}</strong>
                    </Alert>
                  )}
                </div>
              )}
              
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
                      max={selectedProduct.maxQuantity || 10}
                      className="mx-2 text-center"
                      style={{ width: '100px' }}
                    />
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => handleQuantityChange(Math.min(selectedProduct.maxQuantity || 10, quantity + 1))}
                      disabled={quantity >= (selectedProduct.maxQuantity || 10)}
                      className="fantasy-btn-outline"
                    >
                      +
                    </Button>
                  </div>
                  <div className="mt-2">
                    <small className="fantasy-text-muted">
                      Максимальное количество: {selectedProduct.maxQuantity || 10}
                    </small>
                  </div>
                </div>
              )}
              
              <div className="fantasy-price-display mb-3">
                <div className="d-flex justify-content-center align-items-center">
                  <span className="fantasy-text-info fs-2 fw-bold me-2">
                    {selectedProduct.type === "consumable" 
                      ? `${calculateTotalPrice().toLocaleString('ru-RU')}`
                      : (selectedProduct.price || 0).toLocaleString('ru-RU')
                    }
                  </span>
                  <span className="fs-2">{selectedProduct.currency || "❄️"}</span>
                </div>
                {selectedProduct.type === "consumable" && (
                  <div className="mt-1">
                    <small className="fantasy-text-muted">
                      {selectedProduct.price || 0} {selectedProduct.currency || "❄️"} за штуку • {quantity} шт.
                    </small>
                  </div>
                )}
              </div>
              
              <Alert variant="info" className="fantasy-alert">
                <div className="d-flex justify-content-between align-items-center">
                  <small>
                    У вас: {snowballCount.toLocaleString('ru-RU')} {selectedProduct.currency || "❄️"}
                  </small>
                  <small>
                    Будет списано: {selectedProduct.type === "consumable" 
                      ? calculateTotalPrice()
                      : selectedProduct.price || 0
                    } {selectedProduct.currency || "❄️"}
                  </small>
                </div>
                {selectedProduct.type === "consumable" && (
                  <div className="mt-2">
                    <small>
                      Останется: {Math.max(0, snowballCount - calculateTotalPrice())} {selectedProduct.currency || "❄️"}
                    </small>
                  </div>
                )}
              </Alert>
            </div>
          ) : (
            <div className="text-center">
              <p className="fantasy-text-dark">Товар не найден</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="fantasy-modal-footer">
          <Button 
            className="fantasy-btn fantasy-btn-secondary"
            onClick={() => {
              setShowConfirmModal(false);
              setSelectedImage(null);
            }}
          >
            Отмена
          </Button>
          <Button 
            className="fantasy-btn fantasy-btn-info"
            onClick={handleConfirmPurchase}
            disabled={
              !selectedProduct ||
              (selectedProduct?.requiresSelection ? !selectedImage :
              selectedProduct?.type === "consumable" ? !canAfford(selectedProduct, quantity) :
              !canAfford(selectedProduct))
            }
          >
            {selectedProduct?.type === "consumable" 
              ? `Купить ${quantity} шт.`
              : selectedProduct?.requiresSelection
                ? 'Подтвердить заказ'
                : 'Подтвердить покупку'
            }
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

export default EventShopTab;