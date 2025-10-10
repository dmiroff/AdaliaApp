import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert, Card } from "react-bootstrap";

const CreateBuyRequestModal = ({ show, onHide, onCreate, playerData, inventoryItems }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    buy_price: "",
    buy_amount: ""
  });
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);

  const playerMoney = playerData?.money || 0;

  useEffect(() => {
    if (show) {
      setSelectedItem(null);
      setFormData({
        buy_price: "",
        buy_amount: ""
      });
      setError("");
      setSearchQuery("");
      setLoading(false);
      setFilteredItems(inventoryItems || []);
    }
  }, [show, inventoryItems]);

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

  useEffect(() => {
    if (selectedItem && selectedItem.value) {
      const itemValue = selectedItem.value;
      const suggestedPrice = Math.round(itemValue * 0.7); // 70% от ценности для скупки
      
      setFormData(prev => ({
        ...prev,
        buy_price: suggestedPrice.toString(),
        buy_amount: "1"
      }));
    }
  }, [selectedItem]);

  const handleCreate = async () => {
    if (!selectedItem) {
        setError("Выберите предмет для скупки");
        return;
    }

    const buyPrice = Number(formData.buy_price) || 0;
    const buyAmount = Number(formData.buy_amount) || 0;

    if (buyPrice <= 0 || buyAmount <= 0) {
        setError("Цена и количество должны быть больше 0");
        return;
    }

    const totalCost = buyPrice * buyAmount;
    if (playerMoney < totalCost) {
        setError(`Недостаточно монет для заявки: ${totalCost} 🌕`);
        return;
    }

    setLoading(true);
    try {
        const buyRequestData = {
        item_id: selectedItem.id, // Это число
        item_name: selectedItem.name,
        buy_price: buyPrice,
        buy_amount: buyAmount
        };

        await onCreate(buyRequestData);
    } catch (error) {
        console.error("Error in handleCreate:", error);
        setError("Ошибка при создании заявки на скупку");
    } finally {
        setLoading(false);
    }
    };

  const handleInputChange = (field, value) => {
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
        <Modal.Title>💰 Создать заявку на скупку</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError("")} dismissible>
            {error}
          </Alert>
        )}

        <Row>
          <Col md={6}>
            <h6 className="fantasy-text-primary mb-3">Выберите предмет для скупки:</h6>
            
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
                  ? "В вашем инвентаре нет предметов для создания заявки"
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
                          <h8 className="fantasy-text-primary mb-1">
                            {item.name}
                          </h8>
                          <small className="fantasy-text-muted">
                            Тип: {getItemType(item)}<br/>
                            Ценность: {item.value || 0} 🌕<br/>
                            В инвентаре: {item.count} шт.
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
              <h6 className="fantasy-text-primary mb-3">Параметры заявки:</h6>
              
              {selectedItem && (
                <div className="mb-3 p-2 fantasy-card bg-light">
                  <strong>Выбран:</strong> {selectedItem.name}<br/>
                  <small className="fantasy-text-muted">
                    Автоматически установлена цена скупки (70% от ценности)
                  </small>
                </div>
              )}

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Цена скупки за шт. (🌕)</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.buy_price}
                    onChange={(e) => handleInputChange('buy_price', e.target.value)}
                    placeholder="70"
                  />
                  <Form.Text className="text-muted">
                    Цена за единицу предмета (авто: 70% от ценности)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Количество для скупки</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.buy_amount}
                    onChange={(e) => handleInputChange('buy_amount', e.target.value)}
                    placeholder="1"
                  />
                  <Form.Text className="text-muted">
                    Сколько предметов хотите скупить
                  </Form.Text>
                </Form.Group>

                <div className="fantasy-card p-2 bg-light">
                  <small className="fantasy-text-muted">
                    💰 Ваш баланс: <strong>{playerMoney} 🌕</strong><br/>
                    💸 Общая стоимость: <strong>
                      {formData.buy_price && formData.buy_amount 
                        ? (Number(formData.buy_price) * Number(formData.buy_amount)) 
                        : 0} 🌕
                    </strong>
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
          className="fantasy-btn fantasy-btn-success"
          onClick={handleCreate}
          disabled={!selectedItem || loading || !formData.buy_price || !formData.buy_amount}
        >
          {loading ? "Создание..." : "💰 Создать заявку на скупку"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateBuyRequestModal;