// src/components/CreateAuctionModal.js
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert, Card } from "react-bootstrap";

const CreateAuctionModal = ({ show, onHide, onCreate, playerData, inventoryItems }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    start_price: "",
    price_step: "",
    buyout_price: "",
    duration_hours: 24
  });
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);

  // Используем переданные данные через пропсы
  const playerMoney = playerData?.money || 0;

  // Сбрасываем состояние при открытии
  useEffect(() => {
    if (show) {
      setSelectedItem(null);
      setFormData({
        start_price: "",
        price_step: "",
        buyout_price: "",
        duration_hours: 24
      });
      setError("");
      setSearchQuery("");
      setLoading(false);
      setFilteredItems(inventoryItems || []);
      console.log("CreateAuctionModal opened with inventory items:", inventoryItems);
    }
  }, [show, inventoryItems]);

  // Фильтрация по поиску
  useEffect(() => {
    if (searchQuery) {
      const filtered = inventoryItems.filter(item => 
        item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(inventoryItems || []);
    }
  }, [searchQuery, inventoryItems]);

  // Устанавливаем цены при выборе предмета
  useEffect(() => {
    if (selectedItem && selectedItem.value) {
      const itemValue = selectedItem.value;
      const basePrice = Math.round(itemValue / 2); // 50% от цены предмета
      const stepPrice = Math.round(itemValue * 0.1); // 10% от цены предмета
      
      setFormData(prev => ({
        ...prev,
        start_price: basePrice.toString(),
        price_step: stepPrice.toString(),
        buyout_price: itemValue.toString()
      }));
    }
  }, [selectedItem]);

  const handleCreate = async () => {
    if (!selectedItem) {
      setError("Выберите предмет для выставления");
      return;
    }

    // Преобразуем пустые строки в 0
    const startPrice = Number(formData.start_price) || 0;
    const priceStep = Number(formData.price_step) || 0;
    const buyoutPrice = Number(formData.buyout_price) || 0;

    if (startPrice <= 0 || priceStep <= 0) {
      setError("Цена и шаг ставки должны быть больше 0");
      return;
    }

    if (buyoutPrice > 0 && buyoutPrice <= startPrice) {
      setError("Цена выкупа должна быть больше стартовой цены");
      return;
    }

    const commission = Math.ceil(formData.duration_hours / 24) * 500;
    if (playerMoney < commission) {
      setError(`Недостаточно монет для оплаты комиссии: ${commission} 🌕`);
      return;
    }

    setLoading(true);
    try {
      const lotData = {
        item_id: selectedItem.id,
        name: selectedItem.name,
        start_price: startPrice,
        price_step: priceStep,
        buyout_price: buyoutPrice,
        duration_hours: formData.duration_hours
      };

      await onCreate(lotData);
    } catch (error) {
      console.error("Error in handleCreate:", error);
      setError("Ошибка при создании лота");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    // Разрешаем пустую строку или числовые значения
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const getItemType = (item) => {
    const typeMap = {
      'head': 'Шлем',
      'cloak': 'Плащ',
      'breast_armor': 'Доспех',
      'arm_armor': 'Наручи',
      'gloves': 'Перчатки',
      'belt': 'Пояс',
      'leg_armor': 'Поножи',
      'boots': 'Обувь',
      'necklace': 'Амулет',
      'ring': 'Кольцо',
      'right_hand': 'Оружие',
      'left_hand': 'Левая рука',
      'secondary_weapon': 'Запасное оружие',
      'supplies': 'Расходник',
      'food': 'Еда',
      'potions': 'Зелье',
      'scroll': 'Свиток',
      'reagent': 'Реагент',
      'goods': 'Товары',
    };
    return typeMap[item.type] || item.type || "Разное";
  };

  return (
    <Modal show={show} onHide={onHide} centered className="fantasy-modal" size="lg">
      <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
        <Modal.Title>📦 Выставить предмет на аукцион</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError("")} dismissible>
            {error}
          </Alert>
        )}

        <Row>
          <Col md={6}>
            <h6 className="fantasy-text-primary mb-3">Выберите предмет:</h6>
            
            {/* Поиск */}
            <Form.Control
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Поиск по названию..."
              className="mb-3"
            />

            {filteredItems.length === 0 ? (
              <div className="text-center fantasy-text-muted py-4">
                {(inventoryItems || []).length === 0 
                  ? "В вашем инвентаре нет предметов для выставления"
                  : "Предметы не найдены"
                }
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {filteredItems.map(item => (
                  <Card
                    key={item.id}
                    className={`mb-2 fantasy-card ${
                      selectedItem?.id === item.id 
                        ? 'border-primary bg-light' 
                        : ''
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedItem(item)}
                  >
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="fantasy-text-primary mb-1">
                            {item.name}
                          </h6>
                          <small className="fantasy-text-muted">
                            Тип: {getItemType(item)}<br/>
                            Ценность: {item.value || 0} 🌕<br/>
                            Количество: {item.count} шт.
                          </small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Col>
          
          <Col md={6}>
            <div className="fantasy-card p-3">
              <h6 className="fantasy-text-primary mb-3">Параметры лота:</h6>
              
              {selectedItem && (
                <div className="mb-3 p-2 fantasy-card bg-light">
                  <strong>Выбран:</strong> {selectedItem.name}<br/>
                  <small className="fantasy-text-muted">
                    Автоматически установлены: стартовая цена (50% от ценности) и шаг ставки (10% от ценности)
                  </small>
                </div>
              )}

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Стартовая цена (🌕)</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.start_price}
                    onChange={(e) => handleInputChange('start_price', e.target.value)}
                    placeholder="100"
                  />
                  <Form.Text className="text-muted">
                    Начальная цена лота (авто: 50% от ценности предмета)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Шаг ставки (🌕)</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.price_step}
                    onChange={(e) => handleInputChange('price_step', e.target.value)}
                    placeholder="10"
                  />
                  <Form.Text className="text-muted">
                    Минимальное увеличение ставки (авто: 10% от ценности предмета)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Цена выкупа (🌕)</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.buyout_price}
                    onChange={(e) => handleInputChange('buyout_price', e.target.value)}
                    placeholder={selectedItem?.value || "0"}
                  />
                  <Form.Text className="text-muted">
                    Цена мгновенного выкупа (авто: полная ценность предмета, 0 - отключить выкуп)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Время действия</Form.Label>
                  <Form.Select
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({
                      ...formData, 
                      duration_hours: Number(e.target.value)
                    })}
                  >
                    <option value={24}>24 часа</option>
                    <option value={48}>48 часов</option>
                    <option value={72}>72 часа</option>
                    <option value={168}>7 дней</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Комиссия: {Math.ceil(formData.duration_hours / 24) * 500} 🌕
                  </Form.Text>
                </Form.Group>

                <div className="fantasy-card p-2 bg-light">
                  <small className="fantasy-text-muted">
                    💰 Ваш баланс: <strong>{playerMoney} 🌕</strong><br/>
                    📦 Комиссия: <strong>{Math.ceil(formData.duration_hours / 24) * 500} 🌕</strong>
                  </small>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          className="fantasy-btn fantasy-btn-secondary" 
          onClick={onHide}
          disabled={loading}
        >
          Отмена
        </Button>
        <Button 
          className="fantasy-btn fantasy-btn-gold"
          onClick={handleCreate}
          disabled={!selectedItem || loading || !formData.start_price || !formData.price_step}
        >
          {loading ? "Создание..." : "🏷️ Выставить на аукцион"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateAuctionModal;