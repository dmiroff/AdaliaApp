import { observer } from "mobx-react-lite";
import { useContext, useEffect, useState, useCallback, useMemo } from "react";
import InventoryItem from "./InventoryItem";
import { Row, Col, Form, Modal, Button, Badge } from "react-bootstrap";
import { Context } from "../index";
import GetDataById from "../http/GetData";
import { Spinner } from "react-bootstrap";
import Fuse from "fuse.js";
import { MassTransferModal, MassDropModal, MassSellModal } from "../components/MassTransferModal";
import "./InventoryList.css";

// Импортируем словарь переводов
import { dict_translator } from "../utils/Helpers";

const InventoryList = observer(() => {
  const { user } = useContext(Context);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [user_inventory, setUserInventory] = useState({});
  
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  
  // Состояния для массовых операций
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showMassTransferModal, setShowMassTransferModal] = useState(false);
  const [showMassSellModal, setShowMassSellModal] = useState(false);
  const [showMassDropModal, setShowMassDropModal] = useState(false);
  const [massOperationLoading, setMassOperationLoading] = useState(false);

  // Состояния для двух фильтров
  const [filters, setFilters] = useState([
    { field: "type", operator: "equals", value: "" },
    { field: "is_equippable", operator: "equals", value: "" }
  ]);

  // Функция для перевода значений с использованием словаря
  const translateValue = useCallback((value) => {
    if (value === null || value === undefined) return "";
    
    const strValue = String(value).toLowerCase();
    return dict_translator[strValue] || dict_translator[value] || value;
  }, []);

  // Функция для получения перевода типа предмета
  const getTranslatedType = useCallback((type) => {
    if (!type) return type;
    return translateValue(type);
  }, [translateValue]);

  // Доступные поля для фильтрации
  const filterFields = useMemo(() => [
    { 
      id: "type", 
      name: "Тип предмета", 
      type: "select",
      options: () => {
        const types = Array.from(
          new Set(Object.values(user_inventory).map(item => item.type).filter(Boolean))
        );
        return types.map(type => ({ 
          value: type, 
          label: getTranslatedType(type)
        })).sort((a, b) => a.label.localeCompare(b.label));
      }
    },
    { 
      id: "is_equippable", 
      name: "Можно надеть", 
      type: "boolean",
      options: [
        { value: "true", label: "Да" },
        { value: "false", label: "Нет" }
      ]
    },
    { 
      id: "value", 
      name: "Стоимость", 
      type: "number",
      operators: [
        { id: "greater", name: ">" },
        { id: "less", name: "<" },
        { id: "equals", name: "=" },
        { id: "greaterOrEquals", name: "≥" },
        { id: "lessOrEquals", name: "≤" }
      ]
    },
    { 
      id: "weight", 
      name: "Вес", 
      type: "number",
      operators: [
        { id: "greater", name: ">" },
        { id: "less", name: "<" },
        { id: "equals", name: "=" },
        { id: "greaterOrEquals", name: "≥" },
        { id: "lessOrEquals", name: "≤" }
      ]
    },
    { 
      id: "undefined", 
      name: "Распознан", 
      type: "boolean",
      options: [
        { value: "false", label: "Распознанный" },
        { value: "true", label: "Нераспознанный" }
      ]
    },
    { 
      id: "junk", 
      name: "Хлам", 
      type: "boolean",
      options: [
        { value: "true", label: "Да" },
        { value: "false", label: "Нет" }
      ]
    },
    { 
      id: "corrupted", 
      name: "Проклят", 
      type: "boolean",
      options: [
        { value: "true", label: "Да" },
        { value: "false", label: "Нет" }
      ]
    }
  ], [user_inventory, getTranslatedType]);

  // Функция для обновления данных игрока
  const fetchPlayerData = useCallback(async () => {
    try {
      const playerData = await GetDataById();
      
      if (playerData && playerData.data) {
        setPlayerData(playerData.data);
        const safeInventory = playerData.data.inventory_new || {};
        user.setPlayerInventory(safeInventory);
        setUserInventory(safeInventory);
        user.setPlayer(playerData.data);
      }
    } catch (error) {
      console.error("Error fetching player data:", error);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchPlayerData();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchPlayerData]);

  // Очистка выбора при изменении фильтров или поиска
  useEffect(() => {
    setSelectedItems(new Set());
  }, [filters, query]);

  const handleShowModal = (message) => {
    setModalMessage(message);
    setShowModal(true);
    setTimeout(() => {
      setShowModal(false);
    }, 3000);
  };

  const handleCloseModal = () => setShowModal(false);

  // Обработчики для массовых операций
  const toggleItemSelection = useCallback((itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const selectAllItems = useCallback(() => {
    const inventory = user_inventory || {};
    const filteredItems = filterInventoryItems(inventory);
    const allIds = filteredItems.map(([id]) => id);
    setSelectedItems(new Set(allIds));
  }, [user_inventory, filters, query]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Обработчики для фильтров
  const updateFilter = useCallback((index, field, value) => {
    setFilters(prev => {
      const newFilters = [...prev];
      if (field === "field") {
        // При изменении поля сбрасываем оператор и значение
        const fieldConfig = filterFields.find(f => f.id === value);
        newFilters[index] = { 
          field: value, 
          operator: fieldConfig?.type === "number" ? "greater" : "equals",
          value: "" 
        };
      } else {
        newFilters[index] = { ...newFilters[index], [field]: value };
      }
      return newFilters;
    });
  }, [filterFields]);

  const removeFilter = useCallback((index) => {
    setFilters(prev => {
      const newFilters = [...prev];
      newFilters[index] = { field: "", operator: "equals", value: "" };
      return newFilters;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters([
      { field: "", operator: "equals", value: "" },
      { field: "", operator: "equals", value: "" }
    ]);
  }, []);

  // Функция применения фильтров к предметам
  const applyFiltersToItems = useCallback((items) => {
    return items.filter(([id, item]) => {
      // Применяем оба фильтра
      return filters.every(filter => {
        if (!filter.field || filter.value === "") return true;
        
        const fieldConfig = filterFields.find(f => f.id === filter.field);
        if (!fieldConfig) return true;
        
        let itemValue = item[filter.field];
        
        // Для поля "corrupted" проверяем наличие свойства
        if (filter.field === "corrupted") {
          itemValue = item.corrupted || false;
        }
        
        // Обработка разных типов полей
        switch (fieldConfig.type) {
          case "boolean":
            // Для boolean сравниваем строковые значения
            return String(itemValue) === filter.value;
            
          case "number":
            const numValue = parseFloat(itemValue) || 0;
            const filterNumValue = parseFloat(filter.value) || 0;
            
            switch (filter.operator) {
              case "greater":
                return numValue > filterNumValue;
              case "less":
                return numValue < filterNumValue;
              case "equals":
                return numValue === filterNumValue;
              case "greaterOrEquals":
                return numValue >= filterNumValue;
              case "lessOrEquals":
                return numValue <= filterNumValue;
              default:
                return true;
            }
            
          case "select":
            // Для типа предмета
            return itemValue === filter.value;
            
          default:
            return true;
        }
      });
    });
  }, [filters, filterFields]);

  // Функция фильтрации предметов (фильтры + поиск)
  const filterInventoryItems = useCallback((inventory) => {
    let items = Object.entries(inventory).filter(([key, item]) => {
      return item && typeof item === 'object';
    });

    // Применяем кастомные фильтры
    items = applyFiltersToItems(items);

    // Применяем поиск
    if (query) {
      try {
        const itemObjects = items.map(([id, data]) => ({ 
          id, 
          ...(data || {})
        }));
        
        const fuse = new Fuse(itemObjects, {
          keys: ["name", "description"],
          includeScore: true,
          threshold: 0.4
        });
        
        const searchResults = fuse.search(query);
        items = searchResults.map(result => {
          const { id, ...data } = result.item;
          return [id, data];
        });
      } catch (error) {
        console.error("Fuse.js error:", error);
        items = items.filter(([key, item]) => 
          item.name && item.name.toLowerCase().includes(query.toLowerCase())
        );
      }
    }

    return items;
  }, [applyFiltersToItems, query]);

  // Обработчик успешного завершения массовой операции
  const handleOperationSuccess = useCallback(() => {
    fetchPlayerData();
    setSelectedItems(new Set());
  }, [fetchPlayerData]);

  // Подсчет статистики по активным фильтрам
  const activeFiltersCount = useMemo(() => {
    return filters.filter(f => f.field && f.value !== "").length;
  }, [filters]);

  // Условные возвраты должны быть ПОСЛЕ всех хуков
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center fantasy-paper p-4">
        <Spinner animation="border" role="status" className="fantasy-text-primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!playerData) {
    return (
      <div className="fantasy-paper p-4 text-center">
        <div className="fantasy-text-danger">Error: Player data not found</div>
      </div>
    );
  }

  const inventory = user_inventory || {};
  
  // Получаем отфильтрованные предметы
  const filteredItems = filterInventoryItems(inventory);
  
  const itemObjects = filteredItems.map(([id, data]) => ({ 
    id, 
    ...(data || {})
  }));

  let results = itemObjects;

  if (!Object.keys(inventory).length) {
    return (
      <div className="fantasy-paper p-4 text-center">
        <div className="fantasy-text-muted">Вот инвентарь пустой, он предмет простой</div>
      </div>
    );
  }

  // Подсчет общей стоимости и количества выбранных предметов
  let totalSelectedValue = 0;
  let totalSelectedCount = 0;
  
  selectedItems.forEach(itemId => {
    const item = user_inventory[itemId];
    if (item) {
      totalSelectedValue += (item.value || 0) * (item.count || 1);
      totalSelectedCount += item.count || 1;
    }
  });

  return (
    <div className="fantasy-paper content-overlay inventory-container p-3">
      {/* Панель массовых операций */}
      {selectedItems.size > 0 && (
        <div className="mass-operations-panel mb-3 p-3">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <span className="badge selected-count-badge">
              Выбрано: <strong>{selectedItems.size}</strong> предметов
              {totalSelectedCount > selectedItems.size && ` (${totalSelectedCount} шт)`}
            </span>
            <span className="badge value-badge">
              Общая стоимость: <strong>{totalSelectedValue}</strong> 🌕
            </span>
          </div>
          
          <div className="d-flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowMassTransferModal(true)}
              disabled={massOperationLoading}
              className="mass-action-btn"
            >
              <i className="fas fa-share me-1"></i>
              Передать
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={() => setShowMassSellModal(true)}
              disabled={massOperationLoading}
              className="mass-action-btn"
            >
              <i className="fas fa-coins me-1"></i>
              Продать
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowMassDropModal(true)}
              disabled={massOperationLoading}
              className="mass-action-btn"
            >
              <i className="fas fa-trash me-1"></i>
              Выбросить
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={clearSelection}
              disabled={massOperationLoading}
              className="mass-action-btn"
            >
              <i className="fas fa-times me-1"></i>
              Очистить
            </Button>
            <Button
              variant="outline-info"
              size="sm"
              onClick={selectAllItems}
              disabled={massOperationLoading || results.length === 0}
              className="mass-action-btn"
            >
              <i className="fas fa-check-square me-1"></i>
              Выбрать все ({results.length})
            </Button>
          </div>
        </div>
      )}

      {/* Два настраиваемых фильтра */}
      <div className="custom-filters-container mb-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fantasy-text-dark mb-0">Фильтры предметов</h6>
          <div className="d-flex gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={resetFilters}
              >
                <i className="fas fa-times-circle me-1"></i>
                Сбросить все фильтры
              </Button>
            )}
          </div>
        </div>
        
        <Row className="g-3">
          {filters.map((filter, index) => {
            const fieldConfig = filterFields.find(f => f.id === filter.field);
            
            return (
              <Col md={6} key={index}>
                <div className="filter-card p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">Фильтр {index + 1}</small>
                    {filter.field && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-0"
                        onClick={() => removeFilter(index)}
                        title="Удалить фильтр"
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    )}
                  </div>
                  
                  <div className="filter-controls">
                    {/* Выбор поля */}
                    <Form.Group className="mb-2">
                      <Form.Label size="sm">Поле</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filter.field}
                        onChange={(e) => updateFilter(index, "field", e.target.value)}
                      >
                        <option value="">Выберите поле...</option>
                        {filterFields.map(field => (
                          <option key={field.id} value={field.id}>
                            {field.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    
                    {/* Выбор оператора (для числовых полей) */}
                    {fieldConfig?.type === "number" && filter.field && (
                      <Form.Group className="mb-2">
                        <Form.Label size="sm">Условие</Form.Label>
                        <Form.Select
                          size="sm"
                          value={filter.operator}
                          onChange={(e) => updateFilter(index, "operator", e.target.value)}
                        >
                          {fieldConfig.operators.map(op => (
                            <option key={op.id} value={op.id}>
                              {op.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    )}
                    
                    {/* Поле ввода значения */}
                    {filter.field && (
                      <Form.Group className="mb-2">
                        <Form.Label size="sm">Значение</Form.Label>
                        
                        {fieldConfig?.type === "select" && (
                          <Form.Select
                            size="sm"
                            value={filter.value}
                            onChange={(e) => updateFilter(index, "value", e.target.value)}
                          >
                            <option value="">Любое...</option>
                            {fieldConfig.options().map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </Form.Select>
                        )}
                        
                        {fieldConfig?.type === "boolean" && (
                          <Form.Select
                            size="sm"
                            value={filter.value}
                            onChange={(e) => updateFilter(index, "value", e.target.value)}
                          >
                            <option value="">Любое...</option>
                            {fieldConfig.options.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </Form.Select>
                        )}
                        
                        {fieldConfig?.type === "number" && (
                          <Form.Control
                            type="number"
                            size="sm"
                            value={filter.value}
                            onChange={(e) => updateFilter(index, "value", e.target.value)}
                            placeholder="Введите число..."
                            min="0"
                            step="0.1"
                          />
                        )}
                      </Form.Group>
                    )}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
        
        {/* Отображение активных фильтров */}
        {activeFiltersCount > 0 && (
          <div className="active-filters-display mt-3 p-2">
            <small className="text-muted d-flex align-items-center flex-wrap gap-1">
              <i className="fas fa-filter"></i>
              <span>Активные фильтры:</span>
              {filters.map((filter, index) => {
                if (!filter.field || filter.value === "") return null;
                
                const fieldConfig = filterFields.find(f => f.id === filter.field);
                let displayValue = filter.value;
                
                // Форматирование значения для отображения
                if (fieldConfig?.type === "boolean") {
                  const option = fieldConfig.options.find(opt => opt.value === filter.value);
                  displayValue = option ? option.label : filter.value;
                } else if (fieldConfig?.type === "select") {
                  const options = fieldConfig.options();
                  const option = options.find(opt => opt.value === filter.value);
                  displayValue = option ? option.label : filter.value;
                } else if (fieldConfig?.type === "number") {
                  const operatorName = fieldConfig.operators?.find(op => op.id === filter.operator)?.name || filter.operator;
                  displayValue = `${operatorName} ${filter.value}`;
                }
                
                return (
                  <Badge 
                    key={index}
                    bg="info"
                    className="d-flex align-items-center gap-1 me-1 mb-1"
                    style={{ fontSize: '0.75rem' }}
                  >
                    {fieldConfig?.name}: {displayValue}
                    <Button
                      variant="link"
                      size="sm"
                      className="text-white p-0"
                      onClick={() => removeFilter(index)}
                      style={{ minWidth: '16px', height: '16px' }}
                    >
                      <i className="fas fa-times" style={{ fontSize: '0.6rem' }}></i>
                    </Button>
                  </Badge>
                );
              })}
            </small>
          </div>
        )}
      </div>

      {/* Поиск */}
      <div className="fantasy-paper content-overlay bulk-purchase-tab mb-3">
        <Form className="fantasy-form">
          <div className="search-input-wrapper">
            <i className="fas fa-search search-icon"></i>
            <Form.Control
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Название или описание предмета..."
              className="inventory-search-input bulk-purchase"
            />
            {query && (
              <Button
                variant="link"
                size="sm"
                className="clear-search-btn"
                onClick={() => setQuery('')}
                title="Очистить поиск"
              >
                <i className="fas fa-times"></i>
              </Button>
            )}
          </div>
          <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
            Найдено предметов: {results.length}
            {activeFiltersCount > 0 && (
              <span className="ms-2">
                <i className="fas fa-filter text-info me-1"></i>
                Активных фильтров: {activeFiltersCount}
              </span>
            )}
          </Form.Text>
        </Form>
      </div>

      {/* Список предметов */}
      <div className="inventory-items-container">
        {results.length > 0 ? (
          results.map((item) => (
            <InventoryItem 
              key={item.id} 
              devicekey={item.id} 
              device={item} 
              onShowModal={handleShowModal}
              isSelected={selectedItems.has(item.id)}
              onToggleSelect={toggleItemSelection}
              isUnidentified={item.undefined === true}
            />
          ))
        ) : (
          <div className="text-center p-4 fantasy-text-muted">
            <i className="fas fa-search fa-2x mb-3"></i>
            <p>Предметы не найдены</p>
            {query && <p>Попробуйте изменить поисковый запрос</p>}
            {activeFiltersCount > 0 && <p>Или измените фильтры</p>}
          </div>
        )}
      </div>
      
      {/* Модалки для массовых операций */}
      <MassTransferModal
        show={showMassTransferModal}
        onClose={() => setShowMassTransferModal(false)}
        selectedItems={selectedItems}
        inventory={user_inventory}
        onSuccess={handleOperationSuccess}
      />

      <MassSellModal
        show={showMassSellModal}
        onClose={() => setShowMassSellModal(false)}
        selectedItems={selectedItems}
        inventory={user_inventory}
        onSuccess={handleOperationSuccess}
      />

      <MassDropModal
        show={showMassDropModal}
        onClose={() => setShowMassDropModal(false)}
        selectedItems={selectedItems}
        inventory={user_inventory}
        onSuccess={handleOperationSuccess}
      />

      {/* Оповещение о результате операции */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static" keyboard={false} centered className="fantasy-modal">
        <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
          <Modal.Title className="fantasy-text-gold">Оповещение</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ whiteSpace: 'pre-wrap' }} className="fantasy-text-dark">
          {modalMessage}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            onClick={handleCloseModal}
            className="fantasy-btn fantasy-btn-secondary"
          >
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

export default InventoryList;