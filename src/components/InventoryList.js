import { favoriteInventory as withFavorites } from '../utils/favorites';
import { observer } from "mobx-react-lite";
import { useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import InventoryItem from "./InventoryItem";
import ActionNotice from "./ActionNotice";
import { Modal, Button } from "react-bootstrap";
import { Context } from "../index";
import GetDataById from "../http/GetData";
import apiClient from "../http/apiClient";
import { Spinner } from "react-bootstrap";
import ItemFilters from './ItemFilters';
import {browseConditions, emptyBrowse, itemFieldNames} from '../utils/itemBrowseFields';
import {browseLocalItems, itemFilterOptions} from '../utils/localItemBrowse';
import { MassTransferModal, MassDropModal, MassSellModal } from "../components/MassTransferModal";
import "./InventoryList.css";

const inventoryFields = [...Object.keys(itemFieldNames), 'favorite'];
const inventorySearch = {threshold:0.4};

const InventoryList = observer(() => {
  const { user } = useContext(Context);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [browse, setBrowse] = useState(emptyBrowse);
  const [loadError, setLoadError] = useState(false);
  const [user_inventory, setUserInventory] = useState({});
  const items = useMemo(() => Object.entries(withFavorites(user_inventory, playerData))
    .filter(([, item]) => item && typeof item === 'object')
    .map(([id, item]) => ({...item, id})), [user_inventory, playerData]);
  const filterOptions = useMemo(() => itemFilterOptions(items), [items]);
  const results = useMemo(() => browseLocalItems(items, browse, inventorySearch), [items, browse]);
  
  const [notice, setNotice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  
  const identifyPending = useRef(false);
  const [identifying, setIdentifying] = useState(false);
  const [identifiedCount, setIdentifiedCount] = useState(0);
  const unidentifiedCount = Object.values(user_inventory).reduce((sum, item) =>
    sum + (item.undefined && item.is_equippable ? Math.max(0, Number(item.count ?? 1)) : 0), 0);

  const identifyAll = async () => {
    if (identifyPending.current) return;
    identifyPending.current = true;
    setIdentifying(true);
    setIdentifiedCount(0);
    let total = 0;
    try {
      let remaining;
      do {
        const {data} = await apiClient.post('/inventory/identify-all', {}, {timeout: 60000});
        total += data.identified_count;
        remaining = data.remaining_count;
        setIdentifiedCount(total);
        setSelectedItems(new Set());
        if (data.data) {
          user.setPlayer(data.data);
          user.setPlayerInventory(data.data.inventory_new || {});
          setPlayerData(data.data);
          setUserInventory(data.data.inventory_new || {});
        }
        if (!data.identified_count && remaining) throw new Error('Часть предметов не удалось распознать.');
      } while (remaining > 0);
      setNotice({variant: 'success', message: `Распознано предметов: ${total}.`});
    } catch (error) {
      setNotice({variant: 'error', message: `Распознано: ${total}. ${error.response?.data?.detail || error.message || 'Не удалось завершить распознавание.'}`});
      await fetchPlayerData();
    } finally {
      identifyPending.current = false;
      setIdentifying(false);
    }
  };

  // Состояния для массовых операций
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showMassTransferModal, setShowMassTransferModal] = useState(false);
  const [showMassSellModal, setShowMassSellModal] = useState(false);
  const [showMassDropModal, setShowMassDropModal] = useState(false);
  const [massOperationLoading, setMassOperationLoading] = useState(false);

  // Функция для обновления данных игрока
  const fetchPlayerData = useCallback(async () => {
    setLoadError(false);
    try {
      const playerData = await GetDataById();
      if (!playerData?.data) throw new Error('Player data unavailable');
      
      if (playerData && playerData.data) {
        setPlayerData(playerData.data);
        const safeInventory = playerData.data.inventory_new || {};
        user.setPlayerInventory(safeInventory);
        setUserInventory(safeInventory);
        user.setPlayer(playerData.data);
      }
    } catch (error) {
      setLoadError(true);
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

  useEffect(() => {
    if (user.player_data?.inventory_new) {
      setPlayerData(user.player_data);
      setUserInventory(user.inventory_new);
    }
  }, [user.player_data, user.inventory_new]);

  const applyBrowse = value => {
    if (value.q !== browse.q || value.category !== browse.category ||
        JSON.stringify(browseConditions(value)) !== JSON.stringify(browseConditions(browse))) {
      setSelectedItems(new Set());
    }
    setBrowse(value);
  };

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

  const selectAllItems = () => setSelectedItems(new Set(results.map(item => item.id)));

  const clearSelection = () => setSelectedItems(new Set());

  // Обработчик успешного завершения массовой операции
  const handleOperationSuccess = useCallback((message) => {
    if (typeof message === "string") setNotice({message,variant:"success"});
    fetchPlayerData();
    setSelectedItems(new Set());
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

  if (loadError) {
    return <div className="fantasy-paper p-4 text-center" role="alert">
      <h4>Не удалось загрузить инвентарь</h4>
      <p>Проверьте связь. Ваши предметы не пропали.</p>
      <Button className="fantasy-btn fantasy-btn-lg" onClick={fetchPlayerData}>Повторить</Button>
    </div>;
  }

  if (!playerData) {
    return (
      <div className="fantasy-paper p-4 text-center">
        <div className="fantasy-text-danger">Error: Player data not found</div>
      </div>
    );
  }

  if (!items.length) {
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
      {(unidentifiedCount > 0 || identifying) && <button
        className="fantasy-btn inventory-identify" disabled={identifying || massOperationLoading || playerData?.in_fight}
        onClick={identifyAll}>
        {identifying ? `Распознаём… ${identifiedCount}` : `Распознать всё (${unidentifiedCount})`}
      </button>}
      <ItemFilters categoryShortcuts initialValue={browse} label="Фильтры инвентаря" options={filterOptions} fields={inventoryFields}
        onApply={applyBrowse} result={`Найдено: ${results.length} из ${items.length}`} />
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

      {/* Список предметов */}
      <div className="inventory-items-container">
        {results.length > 0 ? (
          results.map((item) => (
            <InventoryItem 
              key={item.id} 
              devicekey={item.id} 
              device={item} 
              onShowModal={handleShowModal}
              onNotify={setNotice}
              isSelected={selectedItems.has(item.id)}
              onToggleSelect={toggleItemSelection}
              isUnidentified={item.undefined === true}
            />
          ))
        ) : (
          <div className="text-center p-4 fantasy-text-muted">
            <i className="fas fa-search fa-2x mb-3"></i>
            <p>Предметы не найдены</p>
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

      <ActionNotice notice={notice} onDismiss={() => setNotice(null)} />
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
