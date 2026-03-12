// src/components/AuctionTab.js
import React from 'react';
import { observer } from "mobx-react-lite";
import { useContext, useEffect, useState, useMemo } from "react";
import { Row, Col, Form, Modal, Button, Card, Badge, Alert } from "react-bootstrap";
import { Context } from "../index";
import { Spinner } from "react-bootstrap";
import Fuse from "fuse.js";
import CreateAuctionModal from "./CreateAuctionModal";
import { fetchAuctionLots, createAuctionLot, placeBid, buyoutLot } from "../http/auction";
import GetDataById from "../http/GetData";

const AuctionTab = observer(() => {
  const { user } = useContext(Context);

  // Инициализируем состояния данными из контекста, если они уже есть
  const [playerData, setPlayerData] = useState(user.player || null);
  const [userInventory, setUserInventory] = useState(user.playerInventory || {});
  const [dataLoaded, setDataLoaded] = useState(!!user.player); // true, если данные уже были

  const [auctionLots, setAuctionLots] = useState([]);
  const [loading, setLoading] = useState(!dataLoaded); // если данных нет, начинаем с загрузки
  const [query, setQuery] = useState("");
  const [selectedLot, setSelectedLot] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const showErrorInModal = (errorMessage) => {
    setModalError(errorMessage);
    setShowErrorModal(true);
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setModalError("");
  };

  // Загрузка данных игрока (обновляет контекст и состояния)
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
        } else {
          showErrorInModal("Не удалось загрузить данные игрока: пустой ответ");
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
  }, [user, refreshTrigger, showErrorInModal]);

  // Загружаем лоты аукциона только когда есть данные игрока
  useEffect(() => {
    const loadAuctionLots = async () => {
      if (!dataLoaded) return;

      try {
        const lots = await fetchAuctionLots();
        setAuctionLots(lots);
      } catch (error) {
        console.error("Error fetching auction lots:", error);
        const errorMessage = error.response?.data?.detail || "Ошибка загрузки лотов аукциона";
        showErrorInModal(errorMessage);
        setError(errorMessage);
      }
    };

    loadAuctionLots();
  }, [dataLoaded, refreshTrigger, showErrorInModal]);

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

  const handlePlaceBid = async () => {
    try {
      setError("");
      const bidValue = Number(bidAmount);
      if (isNaN(bidValue) || bidValue <= 0) {
        const errorMessage = "Введите корректную сумму ставки";
        showErrorInModal(errorMessage);
        setError(errorMessage);
        return;
      }

      const response = await placeBid(selectedLot.id, { amount: bidValue });

      if (response.status) {
        setSuccess(response.message);
        setShowBidModal(false);
        setBidAmount("");
        await updateUserData();
        setRefreshTrigger(prev => prev + 1);

        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      console.error("Error placing bid:", error);
      const errorMessage = error.response?.data?.detail || "Ошибка при размещении ставки";
      showErrorInModal(errorMessage);
      setError(errorMessage);
    }
  };

  const handleBuyout = async (lotId) => {
    try {
      setError("");
      const response = await buyoutLot(lotId);

      if (response.status) {
        setSuccess(response.message);
        await updateUserData();
        setRefreshTrigger(prev => prev + 1);

        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      console.error("Error buying out:", error);
      const errorMessage = error.response?.data?.detail || "Ошибка при выкупе лота";
      showErrorInModal(errorMessage);
      setError(errorMessage);
    }
  };

  const handleCreateLot = async (lotData) => {
    try {
      setError("");
      const response = await createAuctionLot(lotData);

      if (response.status) {
        setSuccess(response.message);
        setShowCreateModal(false);
        await updateUserData();
        setRefreshTrigger(prev => prev + 1);

        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      console.error("Error creating lot:", error);
      const errorMessage = error.response?.data?.detail || "Ошибка при создании лота";
      showErrorInModal(errorMessage);
      setError(errorMessage);
    }
  };

  const handleCreateButtonClick = () => {
    if (inventoryArray.length === 0) {
      const errorMessage = "У вас нет предметов для выставления на аукцион";
      showErrorInModal(errorMessage);
      return;
    }
    setShowCreateModal(true);
  };

  // Поиск по лотам
  let filteredLots = auctionLots;
  if (query && auctionLots.length > 0) {
    try {
      const fuse = new Fuse(auctionLots, {
        keys: ["name"],
        threshold: 0.3
      });
      const searchResults = fuse.search(query);
      filteredLots = searchResults.map(result => result.item);
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  // Преобразование инвентаря в массив
  const inventoryArray = useMemo(() => {
    if (!userInventory || Object.keys(userInventory).length === 0) {
      return [];
    }
    const filteredItemsWithKeys = Object.entries(userInventory).filter(
      ([key, item]) => item && typeof item === 'object'
    );
    return filteredItemsWithKeys.map(([id, data]) => ({
      id: parseInt(id),
      ...(data || {})
    }));
  }, [userInventory]);

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

      {/* Панель управления */}
      <Row className="mb-4">
        <Col md={8}>
          <Form.Control
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Поиск по названию лота..."
            className="inventory-search-input bulk-purchase"
          />
        </Col>
        <Col md={4}>
          <Button
            className="fantasy-btn w-100"
            onClick={handleCreateButtonClick}
            disabled={inventoryArray.length === 0}
          >
            {inventoryArray.length === 0 ? "📦 Нет предметов" : "📦 Выставить предмет"}
          </Button>
        </Col>
      </Row>

      {/* Список лотов */}
      <Row>
        {filteredLots.map((lot) => (
          <Col key={lot.id} md={6} lg={4} className="mb-3">
            <AuctionLotCard
              lot={lot}
              onBidClick={() => {
                setSelectedLot(lot);
                setBidAmount((lot.start_price + lot.price_step).toString());
                setShowBidModal(true);
              }}
              onBuyoutClick={() => handleBuyout(lot.id)}
              onViewHistory={() => setSelectedLot(lot)}
              currentUserId={playerData?.id}
            />
          </Col>
        ))}
      </Row>

      {filteredLots.length === 0 && !loading && (
        <div className="text-center fantasy-text-muted py-4">
          {query ? "Лоты по вашему запросу не найдены" : "Лотов на аукционе нет"}
        </div>
      )}

      {/* Модальное окно ставки */}
      <Modal show={showBidModal} onHide={() => setShowBidModal(false)} centered className="fantasy-modal">
        <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
          <Modal.Title>Сделать ставку</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLot && (
            <>
              <p>Лот: <strong>{selectedLot.name}</strong></p>
              <p>Текущая цена: <strong>{selectedLot.start_price} 🌕</strong></p>
              <p>Минимальная ставка: <strong>{selectedLot.start_price + selectedLot.price_step} 🌕</strong></p>
              <Form.Group>
                <Form.Label>Ваша ставка:</Form.Label>
                <Form.Control
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  min={selectedLot.start_price + selectedLot.price_step}
                  placeholder="Введите сумму ставки"
                />
                <Form.Text className="text-muted">
                  Ваши монеты: {playerData?.money || 0} 🌕
                </Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="fantasy-btn fantasy-btn-secondary"
            onClick={() => setShowBidModal(false)}
          >
            Отмена
          </Button>
          <Button
            className="fantasy-btn fantasy-btn-gold"
            onClick={handlePlaceBid}
            disabled={!bidAmount || Number(bidAmount) < (selectedLot?.start_price + selectedLot?.price_step) || Number(bidAmount) > (playerData?.money || 0)}
          >
            Подтвердить ставку
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно создания лота */}
      <CreateAuctionModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onCreate={handleCreateLot}
        playerData={playerData}
        inventoryItems={inventoryArray}
      />
    </div>
  );
});

// Компонент карточки лота (с бейджем "Мой лот")
const AuctionLotCard = ({ lot, onBidClick, onBuyoutClick, onViewHistory, currentUserId }) => {
  const timeLeft = new Date(lot.end_time) - new Date();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const isMyLot = lot.user_id === currentUserId;

  return (
    <Card className={`fantasy-card h-100 ${isMyLot ? 'border-warning' : ''}`}>
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="fantasy-text-primary">{lot.name}</Card.Title>
          <div className="d-flex flex-column align-items-end">
            <Badge bg={hoursLeft < 1 ? "danger" : hoursLeft < 24 ? "warning" : "success"}>
              {hoursLeft}ч
            </Badge>
            {/* Бейдж "Мой лот" – как в скупке */}
            {isMyLot && (
              <Badge bg="warning" className="mt-1">
                Мой лот
              </Badge>
            )}
          </div>
        </div>

        <Card.Text className="flex-grow-1">
          <small className="fantasy-text-muted">
            Текущая цена: <strong>{lot.start_price} 🌕</strong><br/>
            {lot.buyout_price > 0 && `Выкуп: ${lot.buyout_price} 🌕`}
            {lot.buyout_price === 0 && `Выкуп: недоступен`}
            <br/>Шаг ставки: {lot.price_step} 🌕
          </small>
        </Card.Text>

        <div className="mt-auto">
          <Row className="g-2">
            <Col>
              <Button
                size="sm"
                className={`fantasy-btn fantasy-btn-gold w-100 ${isMyLot ? 'fantasy-btn-disabled' : ''}`}
                onClick={onBidClick}
                disabled={isMyLot}
              >
                <span className="fantasy-btn-text">Ставка</span>
              </Button>
            </Col>
            {lot.buyout_price > 0 && (
              <Col>
                <Button
                  size="sm"
                  className="fantasy-btn fantasy-btn-gold w-100"
                  onClick={onBuyoutClick}
                >
                  <span className="fantasy-btn-text">Выкупить</span>
                </Button>
              </Col>
            )}
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AuctionTab;