import React from 'react';
import { observer } from "mobx-react-lite";
import { useContext, useEffect, useState } from "react";
import { Row, Col, Form, Button, Card, Badge, Alert, Modal } from "react-bootstrap";
import { Context } from "../index";
import { Spinner } from "react-bootstrap";
import Fuse from "fuse.js";
import CreateBuyRequestModal from "./CreateBuyRequestModal";
import SellModal from "./SellModal";
import CancelRequestModal from "./CancelRequestModal";
import StorageCollectModal from "./StorageCollectModal";
import { fetchBuyRequests, createBuyRequest, sellToBuyRequest, collectPurchasedItems, cancelBuyRequest, getPlayerStorage } from "../http/bulkPurchase";
import GetDataById from "../http/GetData";

const BulkPurchaseTab = observer(() => {
  const { user } = useContext(Context);
  const [buyRequests, setBuyRequests] = useState([]);
  const [storageData, setStorageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedStorageItem, setSelectedStorageItem] = useState(null);
  
  // Модальные окна
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false); // Новое состояние для модального окна ошибок
  const [modalError, setModalError] = useState(""); // Текст ошибки для модалки
  
  const [sellAmount, setSellAmount] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentMode, setCurrentMode] = useState('requests'); // 'requests' или 'storage'

  const [playerData, setPlayerData] = useState(null);
  const [userInventory, setUserInventory] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);

  // Функция для показа ошибки в модальном окне
  const showErrorInModal = (errorMessage) => {
    setModalError(errorMessage);
    setShowErrorModal(true);
  };

  // Функция закрытия модального окна ошибок
  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setModalError("");
  };

  // Функция переключения режима
  const toggleMode = () => {
    setCurrentMode(currentMode === 'requests' ? 'storage' : 'requests');
    setQuery(""); // Сбрасываем поиск при переключении
  };

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true);
        const playerDataResponse = await GetDataById();
        
        if (playerDataResponse && playerDataResponse.data) {
          setPlayerData(playerDataResponse.data);
          const safeInventory = playerDataResponse.data.inventory_new || {};
          user.setPlayerInventory(safeInventory);
          setUserInventory(safeInventory);
          user.setPlayer(playerDataResponse.data);
          setDataLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching player data:", error);
        const errorMessage = error.response?.data?.detail || "Ошибка загрузки данных игрока";
        showErrorInModal(errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [user, refreshTrigger]);

  // Загрузка заявок
  useEffect(() => {
    const loadBuyRequests = async () => {
      if (!dataLoaded) return;
      
      try {
        console.log("Loading buy requests...");
        const requests = await fetchBuyRequests();
        console.log("Buy requests loaded:", requests);
        
        const safeRequests = Array.isArray(requests) ? requests : [];
        setBuyRequests(safeRequests);
      } catch (error) {
        console.error("Error fetching buy requests:", error);
        const errorMessage = error.response?.data?.detail || "Ошибка загрузки заявок на скупку";
        showErrorInModal(errorMessage);
        setError(errorMessage);
        setBuyRequests([]);
      }
    };

    if (currentMode === 'requests') {
      loadBuyRequests();
    }
  }, [dataLoaded, refreshTrigger, currentMode]);

  // Загрузка склада
  useEffect(() => {
    const loadStorage = async () => {
      if (!dataLoaded) return;
      
      try {
        console.log("Loading storage data...");
        const storage = await getPlayerStorage();
        console.log("Storage data loaded:", storage);
        
        const safeStorage = Array.isArray(storage?.data?.items) ? storage.data.items : [];
        setStorageData(safeStorage);
      } catch (error) {
        console.error("Error fetching storage:", error);
        const errorMessage = error.response?.data?.detail || "Ошибка загрузки данных склада";
        showErrorInModal(errorMessage);
        setError(errorMessage);
        setStorageData([]);
      }
    };

    if (currentMode === 'storage') {
      loadStorage();
    }
  }, [dataLoaded, refreshTrigger, currentMode]);

  const updateUserData = async () => {
    try {
      const playerDataResponse = await GetDataById();
      if (playerDataResponse && playerDataResponse.data) {
        setPlayerData(playerDataResponse.data);
        const safeInventory = playerDataResponse.data.inventory_new || {};
        user.setPlayerInventory(safeInventory);
        setUserInventory(safeInventory);
        user.setPlayer(playerDataResponse.data);
      }
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  const handleSell = async () => {
    try {
      setError("");
      const amount = Number(sellAmount);
      if (isNaN(amount) || amount <= 0) {
        const errorMessage = "Введите корректное количество";
        showErrorInModal(errorMessage);
        setError(errorMessage);
        return;
      }

      const response = await sellToBuyRequest(selectedRequest.id, { amount });
      
      if (response.status) {
        setSuccess(response.message);
        setShowSellModal(false);
        setSellAmount("");
        await updateUserData();
        setRefreshTrigger(prev => prev + 1);
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorMessage = response.message || "Ошибка при продаже";
        showErrorInModal(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error selling items:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Ошибка при продаже предметов";
      showErrorInModal(errorMessage);
      setError(errorMessage);
    }
  };

  const handleCollect = async (itemId, amount = 1) => {
    try {
      setError("");
      const response = await collectPurchasedItems(itemId, amount);
      
      if (response.status) {
        setSuccess(response.message);
        setShowCollectModal(false);
        await updateUserData();
        setRefreshTrigger(prev => prev + 1);
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorMessage = response.message || "Ошибка при получении предметов";
        showErrorInModal(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error collecting items:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Ошибка при получении предметов";
      showErrorInModal(errorMessage);
      setError(errorMessage);
    }
  };

  const handleCancelRequest = async () => {
    try {
      setError("");
      const response = await cancelBuyRequest(selectedRequest.id);
      
      if (response.status) {
        setSuccess(response.message);
        setShowCancelModal(false);
        await updateUserData();
        setRefreshTrigger(prev => prev + 1);
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorMessage = response.message || "Ошибка при отмене заявки";
        showErrorInModal(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error cancelling buy request:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Ошибка при отмене заявки";
      showErrorInModal(errorMessage);
      setError(errorMessage);
    }
  };

  const handleCreateRequest = async (buyRequestData) => {
    try {
      setError("");
      const response = await createBuyRequest(buyRequestData);
      
      if (response.status) {
        setSuccess(response.message);
        setShowCreateModal(false);
        await updateUserData();
        setRefreshTrigger(prev => prev + 1);
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorMessage = response.message || "Ошибка при создании заявки";
        showErrorInModal(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error creating buy request:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Ошибка при создании заявки";
      showErrorInModal(errorMessage);
      setError(errorMessage);
    }
  };

  const inventoryArray = React.useMemo(() => {
    if (!userInventory || Object.keys(userInventory).length === 0) {
        return [];
    }

    const filteredItemsWithKeys = Object.entries(userInventory).filter(
        ([key, item]) => item && typeof item === 'object'
    );

    const itemObjects = filteredItemsWithKeys.map(([id, data]) => ({ 
        id: parseInt(id), 
        ...(data || {})
    }));

    return itemObjects;
  }, [userInventory]);

  // Безопасная фильтрация заявок
  let filteredRequests = Array.isArray(buyRequests) ? buyRequests : [];
  
  if (query && filteredRequests.length > 0 && currentMode === 'requests') {
    try {
      const fuse = new Fuse(filteredRequests, {
        keys: ["item_name"],
        threshold: 0.3
      });
      const searchResults = fuse.search(query);
      filteredRequests = searchResults.map(result => result.item);
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  // Безопасная фильтрация склада
  let filteredStorage = Array.isArray(storageData) ? storageData : [];
  
  if (query && filteredStorage.length > 0 && currentMode === 'storage') {
    try {
      const fuse = new Fuse(filteredStorage, {
        keys: ["name"],
        threshold: 0.3
      });
      const searchResults = fuse.search(query);
      filteredStorage = searchResults.map(result => result.item);
    } catch (error) {
      console.error("Search error:", error);
    }
  }

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

  return (
    <div className="fantasy-paper content-overlay">
      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess("")} dismissible>
          {success}
        </Alert>
      )}

      {/* Модальное окно для ошибок */}
      <Modal 
        show={showErrorModal} 
        onHide={handleCloseErrorModal}
        centered
        className="fantasy-modal"
      >
        <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-danger">
          <Modal.Title className="fantasy-text-gold">❌ Ошибка операции</Modal.Title>
        </Modal.Header>
        <Modal.Body className="fantasy-modal-body">
          <div className="text-center">
            <div className="fs-1 mb-3">⚠️</div>
            <h5 className="fantasy-text-dark mb-3">Не удалось выполнить операцию</h5>
            <p className="fantasy-text-muted">{modalError}</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="fantasy-modal-footer">
          <Button 
            className="fantasy-btn fantasy-btn-primary"
            onClick={handleCloseErrorModal}
          >
            Понятно
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Упрощенная панель управления с одной кнопкой-переключателем */}
      <Row className="mb-4">
        <Col md={8}>
          <Form.Control
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`🔍 Поиск по ${currentMode === 'requests' ? 'заявкам' : 'складу'}...`}
            className="inventory-search-input"
          />
        </Col>
        <Col md={4}>
          <div className="d-flex gap-2">
            {/* Кнопка-переключатель режимов */}
            <Button 
              className="fantasy-btn fantasy-btn-primary flex-grow-1"
              onClick={toggleMode}
            >
              {currentMode === 'requests' ? '📦 Перейти к складу' : '📋 Перейти к заявкам'}
            </Button>
            
            {/* Кнопка создания заявки - только в режиме заявок */}
            {currentMode === 'requests' && (
              <Button 
                className="fantasy-btn fantasy-btn-success"
                onClick={() => setShowCreateModal(true)}
              >
                💰 Выставить заявку
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {/* Заголовок текущего режима */}
      <div className="mb-3">
        <h4 className="fantasy-text-primary">
          {currentMode === 'requests' ? '📋 Заявки на скупку' : '📦 Мой склад'}
        </h4>
        <div className="fantasy-text-muted small">
          {currentMode === 'requests' 
            ? 'Продавайте предметы по заявкам других игроков или создавайте свои' 
            : 'Забирайте предметы, купленные по вашим заявкам'
          }
        </div>
      </div>

      {/* Режим заявок */}
      {currentMode === 'requests' && (
        <>
          <Row>
            {filteredRequests.map((request) => (
              <Col key={request.id} md={6} lg={4} className="mb-3">
                <BuyRequestCard 
                  request={request} 
                  onSellClick={() => {
                    setSelectedRequest(request);
                    setSellAmount("1");
                    setShowSellModal(true);
                  }}
                  onCancelClick={() => {
                    setSelectedRequest(request);
                    setShowCancelModal(true);
                  }}
                  currentUserId={playerData?.id}
                  userInventory={userInventory}
                />
              </Col>
            ))}
          </Row>

          {filteredRequests.length === 0 && !loading && (
            <div className="text-center fantasy-text-muted py-4">
              {query ? "Заявки по вашему запросу не найдены" : "Заявок на скупку нет"}
            </div>
          )}
        </>
      )}

      {/* Режим склада */}
      {currentMode === 'storage' && (
        <>
          <Row>
            {filteredStorage.map((storageItem) => (
              <Col key={`${storageItem.item_id}-${storageItem.name}`} md={6} lg={4} className="mb-3">
                <StorageItemCard 
                  item={storageItem}
                  onCollectClick={() => {
                    setSelectedStorageItem(storageItem);
                    setShowCollectModal(true);
                  }}
                />
              </Col>
            ))}
          </Row>

          {filteredStorage.length === 0 && !loading && (
            <div className="text-center fantasy-text-muted py-4">
              {query ? "Предметы по вашему запросу не найдены" : "Ваш склад пуст"}
            </div>
          )}
        </>
      )}

      {/* Модальные окна */}
      <SellModal
        show={showSellModal}
        onHide={() => setShowSellModal(false)}
        selectedRequest={selectedRequest}
        sellAmount={sellAmount}
        setSellAmount={setSellAmount}
        userInventory={userInventory}
        onSell={handleSell}
        loading={loading}
      />

      <CancelRequestModal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        selectedRequest={selectedRequest}
        onCancel={handleCancelRequest}
        loading={loading}
      />

      <StorageCollectModal
        show={showCollectModal}
        onHide={() => setShowCollectModal(false)}
        selectedItem={selectedStorageItem}
        onCollect={handleCollect}
        loading={loading}
      />

      <CreateBuyRequestModal 
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onCreate={handleCreateRequest}
        playerData={playerData}
        inventoryItems={inventoryArray}
      />
    </div>
  );
});

// Компонент карточки заявки (без изменений)
const BuyRequestCard = ({ request, onSellClick, onCancelClick, currentUserId, userInventory }) => {
  const isMyRequest = request.user_id === currentUserId;
  const itemIdStr = request.item_id.toString();
  const canSell = userInventory[itemIdStr] && userInventory[itemIdStr].count > 0;

  return (
    <Card className={`fantasy-card h-100 ${isMyRequest ? 'border-warning' : ''}`}>
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="fantasy-text-primary">{request.item_name}</Card.Title>
          <div className="d-flex flex-column align-items-end">
            <Badge bg={request.buy_amount > 10 ? "success" : request.buy_amount > 5 ? "warning" : "danger"}>
              {request.buy_amount} шт.
            </Badge>
            {isMyRequest && (
              <Badge bg="warning" className="mt-1">
                Моя заявка
              </Badge>
            )}
          </div>
        </div>
        
        <Card.Text className="flex-grow-1">
          <small className="fantasy-text-muted">
            Цена за шт.: <strong>{request.buy_price} 🌕</strong><br/>
            Общая сумма: <strong>{request.buy_price * request.buy_amount} 🌕</strong><br/>
          </small>
        </Card.Text>

        <div className="mt-auto">
          <Row className="g-2">
            {!isMyRequest ? (
              <Col>
                <Button 
                  size="sm" 
                  className={`fantasy-btn fantasy-btn-gold w-100 ${!canSell ? 'fantasy-btn-disabled' : ''}`}
                  onClick={onSellClick}
                  disabled={!canSell}
                >
                  <span className="fantasy-btn-text">
                    {canSell ? `Продать (${userInventory[itemIdStr].count} в инв.)` : "Нет в инвентаре"}
                  </span>
                </Button>
              </Col>
            ) : (
              <Col>
                <Button 
                  size="sm" 
                  className="fantasy-btn fantasy-btn-danger w-100"
                  onClick={onCancelClick}
                >
                  <span className="fantasy-btn-text">Отменить заявку</span>
                </Button>
              </Col>
            )}
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
};

// Компонент карточки предмета на складе (упрощенный)
const StorageItemCard = ({ item, onCollectClick }) => {
  return (
    <Card className="fantasy-card h-100">
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="fantasy-text-primary">{item.name}</Card.Title>
          <Badge bg="info">
            {item.count} шт.
          </Badge>
        </div>
        
        <Card.Text className="flex-grow-1">
          <small className="fantasy-text-muted">
            Вес за шт.: <strong>{item.weight} ⚖️</strong><br/>
            Ценность: <strong>{item.value} 🌕</strong><br/>
            ID: {item.item_id}
          </small>
        </Card.Text>

        <div className="mt-auto">
          <Button 
            size="sm" 
            className="fantasy-btn fantasy-btn-success w-100"
            onClick={onCollectClick}
          >
            Забрать со склада
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default BulkPurchaseTab;