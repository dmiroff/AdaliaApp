import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert, Card, Tabs, Tab, Spinner } from "react-bootstrap";
import { searchItemByName } from "../http/bulkPurchase"; // Импортируем функцию поиска

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
  const [manualItemName, setManualItemName] = useState("");
  const [activeTab, setActiveTab] = useState("inventory"); // "inventory" или "manual"
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedManualItem, setSelectedManualItem] = useState(null);
  const [searchError, setSearchError] = useState("");

  const playerMoney = playerData?.money || 0;

  useEffect(() => {
    if (show) {
      setSelectedItem(null);
      setSelectedManualItem(null);
      setFormData({
        buy_price: "",
        buy_amount: ""
      });
      setError("");
      setSearchError("");
      setSearchQuery("");
      setManualItemName("");
      setLoading(false);
      setFilteredItems(inventoryItems || []);
      setSearchResults([]);
      setActiveTab("inventory");
      setIsSearching(false);
    }
  }, [show, inventoryItems]);

  // Фильтрация предметов из инвентаря
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

  // Обработчик изменения цены/количества для автоматической подстановки
  useEffect(() => {
    if ((selectedItem && selectedItem.value) || selectedManualItem) {
      const item = selectedItem || selectedManualItem;
      const itemValue = item.value || 0;
      const suggestedPrice = Math.round(itemValue * 0.7); // 70% от ценности для скупки
      
      setFormData(prev => ({
        ...prev,
        buy_price: suggestedPrice.toString(),
        buy_amount: "1"
      }));
    }
  }, [selectedItem, selectedManualItem]);

  // Функция поиска предмета по названию на бэкенде
  const searchItemByNameHandler = async () => {
    if (!manualItemName.trim()) {
      setSearchError("Введите название предмета для поиска");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      // Используем реальный API запрос
      const response = await searchItemByName(manualItemName);
      
      if (response.status === 200 && response.data && response.data.length > 0) {
        setSearchResults(response.data);
      } else {
        setSearchError(response.message || "Предметы не найдены");
      }
    } catch (error) {
      console.error("Error searching item:", error);
      setSearchError(error.message || "Ошибка при поиске предмета");
    } finally {
      setIsSearching(false);
    }
  };

  // Обработчик выбора предмета из результатов поиска
  const handleSelectManualItem = (item) => {
    setSelectedManualItem(item);
    setManualItemName(item.name); // Обновляем поле ввода названием выбранного предмета
  };

  const handleCreate = async () => {
    // Очищаем ошибки поиска
    setSearchError("");

    if (activeTab === "inventory" && !selectedItem) {
      setError("Выберите предмет для скупки");
      return;
    }

    if (activeTab === "manual" && !manualItemName.trim()) {
      setError("Введите название предмета для скупки");
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
      let buyRequestData;

      if (activeTab === "inventory") {
        // Для предметов из инвентаря
        buyRequestData = {
          item_id: selectedItem.id, // Это число
          item_name: selectedItem.name,
          buy_price: buyPrice,
          buy_amount: buyAmount
        };
      } else {
        // Для ручного ввода по названию
        buyRequestData = {
          item_name: manualItemName.trim(),
          buy_price: buyPrice,
          buy_amount: buyAmount
        };
      }

      const result = await onCreate(buyRequestData);
      
      // Проверяем результат создания заявки
      if (result && result.status === false) {
        setError(result.message || "Ошибка при создании заявки");
      } else {
        onHide(); // Закрываем модалку после успешного создания
      }
    } catch (error) {
      console.error("Error in handleCreate:", error);
      setError(error.message || "Ошибка при создании заявки на скупку");
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
    if (item.type === "manual") {
      return "Ручной ввод";
    }
    
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

  // Автоматический поиск при изменении названия (с дебаунсом)
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (manualItemName.trim() && activeTab === "manual") {
        searchItemByNameHandler();
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [manualItemName, activeTab]);

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

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-4"
          fill
        >
          <Tab eventKey="inventory" title="📦 Из инвентаря">
            <Row>
              <Col md={6}>
                <h6 className="fantasy-text-primary mb-3">Выберите предмет для скупки:</h6>
                
                <Form.Control
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Поиск по названию в инвентаре..."
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
                              <div className="fantasy-text-primary mb-1">
                                {item.name}
                              </div>
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
          </Tab>

          <Tab eventKey="manual" title="✍️ По названию">
            <Row>
              <Col md={6}>
                <h6 className="fantasy-text-primary mb-3">Найдите предмет по названию:</h6>
                
                <div className="d-flex mb-3">
                  <Form.Control
                    type="text"
                    value={manualItemName}
                    onChange={(e) => setManualItemName(e.target.value)}
                    placeholder="Введите название предмета..."
                    className="me-2"
                    onKeyPress={(e) => e.key === 'Enter' && searchItemByNameHandler()}
                  />
                  <Button 
                    className="fantasy-btn fantasy-btn-primary"
                    onClick={searchItemByNameHandler}
                    disabled={isSearching || !manualItemName.trim()}
                  >
                    {isSearching ? (
                      <Spinner animation="border" size="sm" />
                    ) : "🔍"}
                  </Button>
                </div>

                {searchError && (
                  <Alert variant="warning" className="mb-3">
                    {searchError}
                  </Alert>
                )}

                {isSearching ? (
                  <div className="text-center fantasy-text-muted py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Поиск...</span>
                    </Spinner>
                    <p className="mt-2">Ищем предмет в базе данных...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center fantasy-text-muted py-4">
                    <p>Введите название предмета для поиска</p>
                    <small>Например: "Кинжал ассасина", "Лечебное зелье"</small>
                  </div>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <p className="fantasy-text-muted small mb-2">
                      Найдено {searchResults.length} предметов:
                    </p>
                    {searchResults.map((item, index) => (
                      <Card
                        key={item.id || index}
                        className={`mb-2 fantasy-card ${
                          selectedManualItem?.id === item.id 
                            ? 'border-primary bg-light' 
                            : ''
                        }`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSelectManualItem(item)}
                      >
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="fantasy-text-primary mb-1">
                                {item.name}
                              </div>
                              <small className="fantasy-text-muted">
                                Тип: {getItemType(item)}<br/>
                                {item.value ? `Ценность: ${item.value} 🌕` : "Ценность не указана"}<br/>
                                {item.description && <>{item.description}<br/></>}
                                ID: {item.id}
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
                  
                  {manualItemName && (
                    <div className="mb-3 p-2 fantasy-card bg-light">
                      <strong>Предмет:</strong> {manualItemName}<br/>
                      <small className="fantasy-text-muted">
                        {selectedManualItem?.value 
                          ? `Автоматически установлена цена скупки (70% от ценности)`
                          : `Установите цену вручную.`
                        }
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
                        placeholder={
                          selectedManualItem?.value 
                            ? Math.round(selectedManualItem.value * 0.7).toString()
                            : "100"
                        }
                      />
                      <Form.Text className="text-muted">
                        {selectedManualItem?.value 
                          ? `Цена за единицу предмета (70% от ${selectedManualItem.value}🌕)`
                          : "Установите цену за единицу предмета"
                        }
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
                        </strong><br/>
                        📦 Требуется резервация: <strong>
                          {formData.buy_price && formData.buy_amount 
                            ? Math.round(Number(formData.buy_price) * Number(formData.buy_amount) * 1.1) 
                            : 0} 🌕 (110%)
                        </strong>
                      </small>
                    </div>
                  </Form>
                </div>
              </Col>
            </Row>
          </Tab>
        </Tabs>
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
          disabled={
            loading || 
            !formData.buy_price || 
            !formData.buy_amount ||
            Number(formData.buy_price) <= 0 ||
            Number(formData.buy_amount) <= 0 ||
            (activeTab === "inventory" && !selectedItem) ||
            (activeTab === "manual" && !manualItemName.trim())
          }
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Создание...
            </>
          ) : "💰 Создать заявку на скупку"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateBuyRequestModal;