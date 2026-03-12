// src/components/BulkPurchaseTab.js
import React from 'react';
import { observer } from "mobx-react-lite";
import { useContext, useEffect, useState, useCallback, useMemo } from "react";
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

  // Инициализация из контекста
  const [playerData, setPlayerData] = useState(user.player || null);
  const [userInventory, setUserInventory] = useState(user.playerInventory || {});
  const [dataLoaded, setDataLoaded] = useState(!!user.player);

  const [buyRequests, setBuyRequests] = useState([]);
  const [storageData, setStorageData] = useState([]);
  const [loading, setLoading] = useState(!dataLoaded);
  const [query, setQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedStorageItem, setSelectedStorageItem] = useState(null);
  
  // Модальные окна
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalError, setModalError] = useState("");
  
  const [sellAmount, setSellAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentMode, setCurrentMode] = useState('requests');
  
  // Фильтры
  const [showOnlyMyRequests, setShowOnlyMyRequests] = useState(false);
  const [showOnlySellable, setShowOnlySellable] = useState(false);
  
  // Триггер для принудительного обновления данных игрока
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Функция для показа ошибки в модальном окне
  const showErrorInModal = useCallback((errorMessage) => {
    setModalError(errorMessage);
    setShowErrorModal(true);
  }, []);

  const handleCloseErrorModal = useCallback(() => {
    setShowErrorModal(false);
    setModalError("");
  }, []);

  // Переключение режимов
  const toggleMode = useCallback(() => {
    setCurrentMode(prev => {
      const newMode = prev === 'requests' ? 'storage' : 'requests';
      // При переключении сбрасываем поиск
      setQuery("");
      return newMode;
    });
    setShowOnlyMyRequests(false);
    setShowOnlySellable(false);
  }, []);

  // Загрузка данных игрока (обновляет контекст и состояния)
  useEffect(() => {
    const loadPlayerData = async () => {
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
        } else {
          showErrorInModal("Не удалось загрузить данные игрока: пустой ответ");
        }
      } catch (error) {
        console.error("Error fetching player data:", error);
        const errorMessage = error.response?.data?.detail || "Ошибка загрузки данных игрока";
        showErrorInModal(errorMessage);
        setError(errorMessage);
        // dataLoaded остаётся false, playerData не сбрасывается (остаётся из контекста или null)
      } finally {
        setLoading(false);
      }
    };

    loadPlayerData();
  }, [user, refreshTrigger, showErrorInModal]);

  // Загрузка заявок
  const loadBuyRequests = useCallback(async (forceRefresh = false) => {
    if (!dataLoaded) return;

    try {
      const requests = await fetchBuyRequests();
      setBuyRequests(Array.isArray(requests) ? requests : []);
    } catch (error) {
      console.error("Error fetching buy requests:", error);
      const errorMessage = error.response?.data?.detail || "Ошибка загрузки заявок на скупку";
      showErrorInModal(errorMessage);
      setError(errorMessage);
      setBuyRequests([]);
    }
  }, [dataLoaded, showErrorInModal]);

  // Загрузка склада
  const loadStorage = useCallback(async (forceRefresh = false) => {
    if (!dataLoaded) return;

    try {
      const storage = await getPlayerStorage();
      setStorageData(Array.isArray(storage?.data?.items) ? storage.data.items : []);
    } catch (error) {
      console.error("Error fetching storage:", error);
      const errorMessage = error.response?.data?.detail || "Ошибка загрузки данных склада";
      showErrorInModal(errorMessage);
      setError(errorMessage);
      setStorageData([]);
    }
  }, [dataLoaded, showErrorInModal]);

  // Загрузка заявок при переключении в режим requests
  useEffect(() => {
    if (currentMode === 'requests' && dataLoaded) {
      loadBuyRequests();
    }
  }, [currentMode, dataLoaded, loadBuyRequests]);

  // Загрузка склада при переключении в режим storage
  useEffect(() => {
    if (currentMode === 'storage' && dataLoaded) {
      loadStorage();
    }
  }, [currentMode, dataLoaded, loadStorage]);

  // Обновление данных после действий
  const updateUserData = useCallback(async () => {
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
  }, [user]);

  // Обработчик продажи
  const handleSell = useCallback(async () => {
    try {
      setError("");
      const amount = Number(sellAmount);
      if (isNaN(amount) || amount <= 0) {
        showErrorInModal("Введите корректное количество");
        return;
      }

      const response = await sellToBuyRequest(selectedRequest.id, { amount });

      if (response.status) {
        setSuccess(response.message);
        setShowSellModal(false);
        setSellAmount("");

        await updateUserData();
        if (currentMode === 'requests') {
          await loadBuyRequests(true);
        }

        setTimeout(() => setSuccess(""), 3000);
      } else {
        showErrorInModal(response.message || "Ошибка при продаже");
      }
    } catch (error) {
      console.error("Error selling items:", error);
      showErrorInModal(error.response?.data?.detail || error.message || "Ошибка при продаже");
    }
  }, [selectedRequest, sellAmount, currentMode, showErrorInModal, updateUserData, loadBuyRequests]);

  // Обработчик получения со склада
  const handleCollect = useCallback(async (itemId, amount = 1) => {
    try {
      setError("");
      const response = await collectPurchasedItems(itemId, amount);

      if (response.status) {
        setSuccess(response.message);
        setShowCollectModal(false);

        await updateUserData();
        if (currentMode === 'storage') {
          await loadStorage(true);
        }

        setTimeout(() => setSuccess(""), 3000);
      } else {
        showErrorInModal(response.message || "Ошибка при получении");
      }
    } catch (error) {
      console.error("Error collecting items:", error);
      showErrorInModal(error.response?.data?.detail || error.message || "Ошибка при получении");
    }
  }, [currentMode, showErrorInModal, updateUserData, loadStorage]);

  // Обработчик отмены заявки
  const handleCancelRequest = useCallback(async () => {
    try {
      setError("");
      const response = await cancelBuyRequest(selectedRequest.id);

      if (response.status) {
        setSuccess(response.message);
        setShowCancelModal(false);

        await updateUserData();
        if (currentMode === 'requests') {
          await loadBuyRequests(true);
        }

        setTimeout(() => setSuccess(""), 3000);
      } else {
        showErrorInModal(response.message || "Ошибка при отмене");
      }
    } catch (error) {
      console.error("Error cancelling buy request:", error);
      showErrorInModal(error.response?.data?.detail || error.message || "Ошибка при отмене");
    }
  }, [selectedRequest, currentMode, showErrorInModal, updateUserData, loadBuyRequests]);

  // Обработчик создания заявки
  const handleCreateRequest = useCallback(async (buyRequestData) => {
    try {
      setError("");
      const response = await createBuyRequest(buyRequestData);

      if (response.status) {
        setSuccess(response.message);
        setShowCreateModal(false);

        await updateUserData();
        if (currentMode === 'requests') {
          await loadBuyRequests(true);
        }

        setTimeout(() => setSuccess(""), 3000);
      } else {
        showErrorInModal(response.message || "Ошибка при создании");
      }
    } catch (error) {
      console.error("Error creating buy request:", error);
      showErrorInModal(error.response?.data?.detail || error.message || "Ошибка при создании");
    }
  }, [currentMode, showErrorInModal, updateUserData, loadBuyRequests]);

  // Преобразование инвентаря в массив для модалки создания
  const inventoryArray = useMemo(() => {
    if (!userInventory || Object.keys(userInventory).length === 0) return [];
    return Object.entries(userInventory)
      .filter(([_, item]) => item && typeof item === 'object')
      .map(([id, data]) => ({ id: parseInt(id), ...data }));
  }, [userInventory]);

  // Фильтрация заявок
  const filteredRequests = useMemo(() => {
    let requests = buyRequests;
    if (!Array.isArray(requests)) return [];

    if (showOnlyMyRequests && playerData?.id) {
      requests = requests.filter(req => req.user_id === playerData.id);
    }

    if (showOnlySellable && playerData?.id && Object.keys(userInventory).length > 0) {
      requests = requests.filter(req => 
        req.user_id !== playerData.id && userInventory[req.item_id.toString()]?.count > 0
      );
    }

    if (query && requests.length > 0) {
      try {
        const fuse = new Fuse(requests, {
          keys: ["item_name"],
          threshold: 0.3
        });
        return fuse.search(query).map(result => result.item);
      } catch (error) {
        console.error("Search error:", error);
      }
    }
    return requests;
  }, [buyRequests, query, showOnlyMyRequests, showOnlySellable, playerData, userInventory]);

  // Фильтрация склада
  const filteredStorage = useMemo(() => {
    if (!Array.isArray(storageData)) return [];
    if (query && storageData.length > 0 && currentMode === 'storage') {
      try {
        const fuse = new Fuse(storageData, {
          keys: ["name"],
          threshold: 0.3
        });
        return fuse.search(query).map(result => result.item);
      } catch (error) {
        console.error("Search error:", error);
      }
    }
    return storageData;
  }, [storageData, query, currentMode]);

  // Состояния загрузки
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center fantasy-paper p-4">
        <Spinner animation="border" role="status" className="fantasy-text-primary">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
      </div>
    );
  }

  // Если данных нет совсем — предлагаем повторить
  if (!playerData) {
    return (
      <div className="fantasy-paper p-4 text-center">
        <div className="fantasy-text-danger mb-3">
          Не удалось загрузить данные игрока.
        </div>
        <Button
          className="fantasy-btn fantasy-btn-primary"
          onClick={() => setRefreshTrigger(prev => prev + 1)}
        >
          Повторить попытку
        </Button>
      </div>
    );
  }

  return (
    <div className="fantasy-paper content-overlay bulk-purchase-tab">
      {/* Уведомления */}
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
            <p className="fantasy-text-dark">{modalError}</p>
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

      {/* Панель управления */}
      <Row className="mb-3">
        <Col md={7}>
          <Form.Control
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`🔍 Поиск по ${currentMode === 'requests' ? 'заявкам' : 'складу'}...`}
            className="inventory-search-input"
          />
        </Col>
        <Col md={5}>
          <div className="d-flex gap-2">
            {/* Кнопка "Мои заявки" */}
            {currentMode === 'requests' && (
              <Button
                className="fantasy-btn"
                variant={showOnlyMyRequests ? "warning" : "outline-warning"}
                onClick={() => setShowOnlyMyRequests(prev => !prev)}
                title={showOnlyMyRequests ? "Показать все заявки" : "Показать только мои заявки"}
              >
                {showOnlyMyRequests ? "👥 Все" : "👤 Мои"}
              </Button>
            )}

            {/* Кнопка "Можно продать" */}
            {currentMode === 'requests' && (
              <Button
                className="fantasy-btn"
                variant={showOnlySellable ? "success" : "outline-success"}
                onClick={() => setShowOnlySellable(prev => !prev)}
                title={showOnlySellable ? "Показать все заявки" : "Показать только продаваемые (есть в инвентаре)"}
              >
                {showOnlySellable ? "📦 Все" : "💰 Продать"}
              </Button>
            )}

            {/* Кнопка переключения режимов */}
            <Button 
              className="fantasy-btn"
              onClick={toggleMode}
            >
              {currentMode === 'requests' ? '📦 Склад' : '📋 Заявки'}
            </Button>

            {/* Кнопка создания заявки */}
            {currentMode === 'requests' && (
              <Button 
                className="fantasy-btn"
                onClick={() => setShowCreateModal(true)}
              >
                💰 Создать
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {/* Заголовок текущего режима */}
      <div className="mb-3">
        <h4 className="fantasy-text-primary">
          {currentMode === 'requests' ? '📋 Заявки на скупку' : '📦 Мой склад'}
          {currentMode === 'requests' && showOnlyMyRequests && (
            <Badge bg="warning" className="ms-2">Мои заявки</Badge>
          )}
          {currentMode === 'requests' && showOnlySellable && (
            <Badge bg="success" className="ms-2">Можно продать</Badge>
          )}
        </h4>
        <div className="fantasy-text-dark small">
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

          {filteredRequests.length === 0 && (
            <div className="text-center fantasy-text-dark py-4">
              {query 
                ? "Заявки по вашему запросу не найдены" 
                : showOnlyMyRequests 
                  ? "У вас нет активных заявок" 
                  : showOnlySellable
                    ? "Нет заявок, которые можно продать (предметы отсутствуют в инвентаре)"
                    : "Заявок на скупку нет"
              }
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

          {filteredStorage.length === 0 && (
            <div className="text-center fantasy-text-dark py-4">
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
        loading={false}
      />

      <CancelRequestModal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        selectedRequest={selectedRequest}
        onCancel={handleCancelRequest}
        loading={false}
      />

      <StorageCollectModal
        show={showCollectModal}
        onHide={() => setShowCollectModal(false)}
        selectedItem={selectedStorageItem}
        onCollect={handleCollect}
        loading={false}
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
          <small className="fantasy-text-dark">
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
                  className={`fantasy-btn fantasy-btn-success w-100 ${!canSell ? 'fantasy-btn-disabled' : ''}`}
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

// Компонент карточки предмета на складе (без изменений)
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
          <small className="fantasy-text-dark">
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