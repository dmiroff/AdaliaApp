import { observer } from "mobx-react-lite";
import { useContext, useEffect, useState, useCallback } from "react";
import InventoryItem from "./InventoryItem";
import { Row, Col, Form, Modal, Button, Badge, ListGroup } from "react-bootstrap";
import TypeBar from "../components/TypeBar";
import { Context } from "../index";
import GetDataById from "../http/GetData";
import { Spinner } from "react-bootstrap";
import Fuse from "fuse.js";
import { MassTransferModal, MassDropModal, MassSellModal } from "../components/MassTransferModal";
import "./InventoryList.css";

const InventoryList = observer(() => {
  const { user } = useContext(Context);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [user_inventory, setUserInventory] = useState({});
  
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  
  // Новые состояния для массовых операций
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showMassTransferModal, setShowMassTransferModal] = useState(false);
  const [showMassSellModal, setShowMassSellModal] = useState(false);
  const [showMassDropModal, setShowMassDropModal] = useState(false);
  const [massOperationLoading, setMassOperationLoading] = useState(false);

  const selected_type = user.selected_type !== undefined ? user.selected_type : null;

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

  // Очистка выбора при изменении типа предметов
  useEffect(() => {
    setSelectedItems(new Set());
  }, [selected_type, query]);

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
    
    // Сначала фильтруем по типу
    let filteredItems = Object.entries(inventory).filter(([key, item]) => {
      if (!item || typeof item !== 'object') return false;
      if (selected_type === null || selected_type === undefined) return true;
      return item.type === selected_type;
    });

    // Затем фильтруем по поисковому запросу, если он есть
    if (query) {
      try {
        const fuse = new Fuse(filteredItems.map(([id, data]) => ({ 
          id, 
          ...(data || {})
        })), {
          keys: ["name"],
          includeScore: true,
          threshold: 0.3
        });
        
        filteredItems = fuse.search(query).map(result => {
          const { id, ...data } = result.item;
          return [id, data];
        });
      } catch (error) {
        console.error("Fuse.js error in selectAllItems:", error);
        filteredItems = filteredItems.filter(([key, item]) => 
          item.name && item.name.toLowerCase().includes(query.toLowerCase())
        );
      }
    }
    
    const allIds = filteredItems.map(([id]) => id);
    setSelectedItems(new Set(allIds));
  }, [user_inventory, selected_type, query]); // Добавили query в зависимости

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Обработчик успешного завершения массовой операции
  const handleOperationSuccess = useCallback(() => {
    fetchPlayerData(); // Обновляем данные игрока
    setSelectedItems(new Set()); // Очищаем выбранные предметы
  }, [fetchPlayerData]);

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
  
  const filteredItemsWithKeys = Object.entries(inventory).filter(
    ([key, item]) => {
      if (!item || typeof item !== 'object') return false;
      if (selected_type === null || selected_type === undefined) {
        return true;
      }
      return item.type === selected_type;
    }
  );

  const itemObjects = filteredItemsWithKeys.map(([id, data]) => ({ 
    id, 
    ...(data || {})
  }));

  let results = itemObjects;
  try {
    const fuse = new Fuse(itemObjects, {
      keys: ["name"],
      includeScore: true,
      threshold: 0.3 
    });
    
    results = query ? fuse.search(query).map(result => result.item) : itemObjects;
  } catch (error) {
    console.error("Fuse.js error:", error);
    if (query) {
      results = itemObjects.filter(item => 
        item.name && item.name.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

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
    <div className="fantasy-paper content-overlay inventory-container p-3"> {/* Уменьшили padding */}
      {/* Поменяли порядок: 1. Панель массовых операций (если есть) */}
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
              Продать ({totalSelectedValue} 🌕)
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
              disabled={massOperationLoading}
              className="mass-action-btn"
            >
              <i className="fas fa-check-square me-1"></i>
              Выбрать все ({results.length})
            </Button>
          </div>
        </div>
      )}

      {/* 2. Фильтр по типам - теперь САМЫЙ ВЕРХНИЙ элемент */}
      <div className="inventory-filter-container mb-3">
        <Row className="align-items-center">
          <Col xs="auto">
            <TypeBar />
          </Col>
          <Col className="text-end">
            <Button
              variant="outline-info"
              size="sm"
              onClick={selectAllItems}
              disabled={selectedItems.size === results.length}
              className="select-all-btn"
            >
              <i className="fas fa-check-circle me-1"></i>
              Выбрать все ({results.length})
            </Button>
          </Col>
        </Row>
      </div>

      {/* 3. Поиск */}
      <div className="fantasy-paper content-overlay bulk-purchase-tab mb-3">
        <Form className="fantasy-form">
          <div className="search-input-wrapper">
            <i className="fas fa-search search-icon"></i>
            <Form.Control
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Название предмета..."
              className="inventory-search-input bulk-purchase"
            />
          </div>
        </Form>
      </div>

      {/* 4. Список предметов */}
      <div className="inventory-items-container">
        {results.map((item) => (
          <InventoryItem 
            key={item.id} 
            devicekey={item.id} 
            device={item} 
            onShowModal={handleShowModal}
            isSelected={selectedItems.has(item.id)}
            onToggleSelect={toggleItemSelection}
          />
        ))}
      </div>
      
      {/* Модалка для массовой передачи */}
      <MassTransferModal
        show={showMassTransferModal}
        onClose={() => setShowMassTransferModal(false)}
        selectedItems={selectedItems}
        inventory={user_inventory}
        onSuccess={handleOperationSuccess}
      />

      {/* Модалка для массовой продажи */}
      <MassSellModal
        show={showMassSellModal}
        onClose={() => setShowMassSellModal(false)}
        selectedItems={selectedItems}
        inventory={user_inventory}
        onSuccess={handleOperationSuccess}
      />

      {/* Модалка для массового выбрасывания */}
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