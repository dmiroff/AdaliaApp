// EventShopTab.js - Огненная версия (трофеи пепла -> награда пепла)
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

const EventShopTab = observer(() => {
  const { user } = useContext(Context);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delay, setDelay] = useState(false);
  const [activeShop, setActiveShop] = useState("fire"); // "fire" - основной магазин

  // ID предмета валюты (трофеи пепла)
  const CURRENCY_ITEM_ID = '265'; // замените на реальный ID трофеев пепла
  // ID выдаваемой награды (награда пепла)
  const REWARD_ITEM_ID = '266';  // замените на реальный ID награды пепла

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

  // Функция получения количества валюты (трофеев пепла)
  const getItemCount = (itemId) => {
    if (!playerData?.inventory_new) return 0;
    
    const inventory = playerData.inventory_new;
    
    if (typeof inventory === 'object' && !Array.isArray(inventory)) {
      const itemKey = String(itemId);
      const itemData = inventory[itemKey];
      
      if (!itemData) return 0;
      
      if (typeof itemData === 'string') {
        const match = itemData.match(/^(\d+)/);
        if (match) return parseInt(match[1], 10);
        return 1;
      }
      
      if (typeof itemData === 'object' && itemData.count !== undefined) {
        return parseInt(itemData.count, 10) || 0;
      }
    }
    
    if (Array.isArray(inventory)) {
      const item = inventory.find(item => 
        item && (item.item_id === itemId || item.id === itemId)
      );
      return item ? (parseInt(item.count, 10) || 0) : 0;
    }
    
    return 0;
  };

  const trophyCount = getItemCount(CURRENCY_ITEM_ID);

  // Единственный продукт: награда пепла за 300 трофеев
  const fireShopProducts = [
    {
      id: 101,
      name: "🔥 Награда пепла",
      description: "Заберите свою награду в обмен на трофеи пепла. Пепел можно использовать для усилений и особых крафтов.",
      price: 300,
      currency: "🏆",
      currencyId: CURRENCY_ITEM_ID,
      features: [
        "Вы получите 1 награду пепла",
        "Требуется 300 трофеев пепла"
      ],
      type: "consumable",          // расходник, можно несколько раз
      maxQuantity: 100,             // максимум за раз, можно поменять
      image: "🔥"
    }
  ];

  const handlePurchaseClick = (product) => {
    if (!product || !product.id) {
      setError("Ошибка выбора товара");
      return;
    }
    setSelectedProduct(product);
    setShowConfirmModal(true);
    setError("");
  };

  const canAfford = (product, qty = 1) => {
    if (!product || typeof product.price !== 'number') return false;
    return trophyCount >= (product.price * qty);
  };

  const calculateTotalPrice = () => {
    if (!selectedProduct || typeof selectedProduct.price !== 'number') return 0;
    return selectedProduct.price * (selectedProduct.type === "consumable" ? quantity : 1);
  };

  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (value) => {
    const numValue = parseInt(value);
    if (!selectedProduct || typeof selectedProduct.maxQuantity !== 'number') return;
    if (numValue > 0 && numValue <= (selectedProduct.maxQuantity || 100)) {
      setQuantity(numValue);
    }
  };

  const handleConfirmPurchase = async () => {
    try {
      if (!selectedProduct || !selectedProduct.id) {
        setError("Ошибка: товар не выбран");
        return;
      }

      const finalQuantity = (selectedProduct.type === "consumable") ? quantity : 1;

      if (!canAfford(selectedProduct, finalQuantity)) {
        setError(`Недостаточно трофеев пепла. Нужно: ${selectedProduct.price * finalQuantity}, у вас: ${trophyCount}`);
        return;
      }

      // Отправка запроса на сервер
      const result = await eventShopPurchase(
        selectedProduct.id,
        selectedProduct.type,
        finalQuantity,
        {} // дополнительные данные не требуются
      );

      if (result.status === 200) {
        setSuccess(`Покупка "${selectedProduct.name}" x${finalQuantity} успешна! Вы получили награду пепла.`);
        
        // Обновляем данные игрока
        if (user.updatePlayerData) user.updatePlayerData();
        const playerDataResponse = await GetDataById();
        setPlayerData(playerDataResponse.data);
        user.setPlayer(playerDataResponse.data);
        
        setShowConfirmModal(false);
        setSelectedProduct(null);
        setQuantity(1);
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

  // Отображение загрузки
  if (!delay || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="danger" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="fantasy-text-gold mt-2">Загрузка магазина Пепла...</p>
        </div>
      </div>
    );
  }

  const safeProducts = Array.isArray(fireShopProducts) ? fireShopProducts : [];

  return (
    <div className="fantasy-paper content-overlay" style={{ background: 'rgba(20, 10, 5, 0.95)' }}>
      {/* Уведомления */}
      {success && (
        <Alert variant="success" className="fantasy-alert">
          <div className="text-center">
            <h5>✅ Обмен успешен!</h5>
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
        <h2 className="fantasy-text-gold">🔥 Алтарь Пепла</h2>
        <p className="fantasy-text-muted">
          Обменяйте трофеи пепла на могущественную награду пепла
        </p>
        <Badge bg="danger" className="fs-6 py-2 px-3">
          🔥 Событие активно до: 21 мая
        </Badge>
      </div>

      {/* Вкладки */}
      <div className="mb-4">
        <Tabs
          activeKey={activeShop}
          onSelect={(k) => setActiveShop(k)}
          className="fantasy-tabs fire-tabs"
        >
          <Tab eventKey="fire" title="🔥 Алтарь обмена" />
          <Tab eventKey="history" title="📜 История">
            <EventShopHistory />
          </Tab>
        </Tabs>
      </div>

      {/* Баланс валюты */}
      <Card className="fantasy-card mb-4 border-danger">
        <Card.Body className="text-center">
          <h5 className="fantasy-text-fire">Ваши трофеи пепла</h5>
          <div className="d-flex justify-content-center align-items-center">
            <div className="fantasy-text-dark fs-3 fw-bold me-2">
              {trophyCount.toLocaleString('ru-RU')}
            </div>
            <div className="fs-3">🏆🔥</div>
          </div>
          <p className="fantasy-text-muted mt-2 mb-0">
            Трофеи пепла добываются в огненных подземельях и за победу над Легионом
          </p>
        </Card.Body>
      </Card>

      {/* Список товаров */}
      <Row>
        {safeProducts.map((product) => {
          if (!product) return null;
          const affordable = canAfford(product);
          return (
            <Col key={product.id} md={6} lg={5} className="mx-auto mb-4">
              <Card className={`fantasy-card h-100 text-center ${!affordable ? 'opacity-75' : 'glow-fire'}`}>
                <Card.Body className="d-flex flex-column">
                  <div className="text-center mb-3">
                    <div className="fs-1 mb-2">{product.image || "🔥"}</div>
                    <h4 className="fantasy-text-fire">{product.name}</h4>
                    <Badge bg="warning" className="mb-2">Огненная награда</Badge>
                  </div>

                  <Card.Text className="fantasy-text-dark flex-grow-1">
                    {product.description}
                  </Card.Text>

                  <ul className="fantasy-feature-list text-start">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="fantasy-text-muted">{feature}</li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <div className="text-center mb-3">
                      <span className="fantasy-text-fire fs-3 fw-bold">
                        {product.price} {product.currency}
                      </span>
                      <div className="mt-1">
                        <small className="fantasy-text-muted">
                          Можно купить до {product.maxQuantity} раз
                        </small>
                      </div>
                    </div>

                    <Button
                      className={`fantasy-btn w-100 ${!affordable ? 'fantasy-btn-secondary' : 'fantasy-btn-danger'}`}
                      onClick={() => affordable && handlePurchaseClick(product)}
                      disabled={!affordable}
                    >
                      {!affordable ? 'Недостаточно трофеев пепла' : 'Обменять'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Как получить валюту */}
      <Card className="fantasy-card mt-4">
        <Card.Body>
          <h5 className="fantasy-text-fire text-center">🏆 Как получить трофеи пепла?</h5>
          <Row className="text-center">
            <Col md={3} className="mb-3">
              <div className="fs-2">🔥</div>
              <h6>Огненные данжи</h6>
              <small className="fantasy-text-muted">Проходите подземелья стихии огня</small>
            </Col>
            <Col md={3} className="mb-3">
              <div className="fs-2">👹</div>
              <h6>Войска легиона</h6>
              <small className="fantasy-text-muted">Уничтожайте отряды пепла</small>
            </Col>
            <Col md={3} className="mb-3">
              <div className="fs-2">⚔️</div>
              <h6>Ежедневные задания</h6>
              <small className="fantasy-text-muted">Выполняйте задания ремесленников</small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Модальное окно подтверждения */}
      <Modal 
        show={showConfirmModal} 
        onHide={() => {
          setShowConfirmModal(false);
          setQuantity(1);
        }}
        centered
        className="fantasy-modal fire-modal"
      >
        <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-danger">
          <Modal.Title className="fantasy-text-gold">Обмен трофеев на награду пепла</Modal.Title>
        </Modal.Header>
        <Modal.Body className="fantasy-modal-body">
          {selectedProduct && (
            <div className="text-center">
              <div className="fs-1 mb-3">{selectedProduct.image || "🔥"}</div>
              <h4 className="fantasy-text-fire">{selectedProduct.name}</h4>
              <p>{selectedProduct.description}</p>

              {selectedProduct.type === "consumable" && (
                <div className="my-4">
                  <Form.Label className="fantasy-text-dark">Количество обменов:</Form.Label>
                  <div className="d-flex align-items-center justify-content-center">
                    <Button variant="outline-secondary" onClick={() => handleQuantityChange(Math.max(1, quantity - 1))} disabled={quantity <= 1}>-</Button>
                    <Form.Control type="number" value={quantity} onChange={(e) => handleQuantityChange(e.target.value)} min="1" max={selectedProduct.maxQuantity || 100} className="mx-2 text-center" style={{ width: '100px' }} />
                    <Button variant="outline-secondary" onClick={() => handleQuantityChange(Math.min(selectedProduct.maxQuantity || 100, quantity + 1))} disabled={quantity >= (selectedProduct.maxQuantity || 100)}>+</Button>
                  </div>
                </div>
              )}

              <div className="fantasy-price-display mb-3">
                <div className="d-flex justify-content-center align-items-center">
                  <span className="fantasy-text-fire fs-2 fw-bold me-2">
                    {calculateTotalPrice().toLocaleString('ru-RU')}
                  </span>
                  <span className="fs-2">🏆</span>
                </div>
                <small className="fantasy-text-muted">
                  {selectedProduct.price} трофеев за 1 награду × {quantity} = {calculateTotalPrice()}
                </small>
              </div>

              <Alert variant="dark" className="fantasy-alert bg-dark text-warning">
                <div className="d-flex justify-content-between">
                  <span>Ваши трофеи:</span>
                  <span>{trophyCount} 🏆</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Будет списано:</span>
                  <span>{calculateTotalPrice()} 🏆</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Останется:</span>
                  <span>{Math.max(0, trophyCount - calculateTotalPrice())} 🏆</span>
                </div>
                <div className="mt-2 text-success">
                  Вы получите: {quantity} x 🔥 награда пепла
                </div>
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Отмена</Button>
          <Button variant="danger" onClick={handleConfirmPurchase} disabled={!selectedProduct || !canAfford(selectedProduct, selectedProduct.type === "consumable" ? quantity : 1)}>
            Подтвердить обмен
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

export default EventShopTab;