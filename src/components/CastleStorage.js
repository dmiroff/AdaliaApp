import React, { useState, useContext, useEffect, useCallback, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Spinner,
  ListGroup,
  Badge,
  Tabs,
  Tab,
  ProgressBar
} from "react-bootstrap";
import { Context } from "../index";
import { observer } from "mobx-react-lite";
import {
  GetCastleStorage
} from "../http/guildService";
import GetDataById from "../http/GetData";
import ItemFilters from './ItemFilters';
import {emptyBrowse, itemFieldNames, itemSorts} from '../utils/itemBrowseFields';
import {browseLocalItems, itemFilterOptions} from '../utils/localItemBrowse';
import { dict_translator } from "../utils/Helpers";
import "./CastleStorage.css";
import { 
  MassTransferToCastleModal, 
  MassTransferFromCastleModal 
} from './CastleStorageModal';

const inventoryFields = [...Object.keys(itemFieldNames), 'equipped'];
const storageFields = [...Object.keys(itemFieldNames), 'added_by'];
const legacyStorageFields = storageFields.filter(field => !['level', 'rarity', 'prefix', 'suffix'].includes(field));
const legacyStorageSorts = itemSorts.filter(([field]) => field !== 'level' && field !== 'level_asc');
const castleSearch = {keys:['name', 'description', 'nameAndDescription'], threshold:0.4,
  minMatchCharLength:2, ignoreLocation:true};

// Вспомогательная функция для нормализации ID
const normalizeId = (id) => {
  if (id === undefined || id === null || id === "undefined") return "undefined";
  return String(id);
};

// Улучшенный компонент карточки предмета с иконкой и индикатором экипировки
const CastleStorageItem = ({ 
  item, 
  isSelected = false, 
  onToggleSelect = null,
  source = "inventory"
}) => {
  const [itemId, setItemId] = useState("");

  useEffect(() => {
    const id = item.id || item.itemId || item.key;
    setItemId(normalizeId(id));
  }, [item]);

  // Определение редкости
  const getRarityColor = () => {
    const name = item.name?.toLowerCase() || '';
    
    if (name.includes('(л)')) {
      return {
        color: '#ff6f00',
        name: 'легендарная',
        badge: 'warning'
      };
    } else if (name.includes('(ор)')) {
      return {
        color: '#8e24aa',
        name: 'очень редкая',
        badge: 'purple'
      };
    } else if (name.includes('(р)')) {
      return {
        color: '#1e88e5',
        name: 'редкая',
        badge: 'primary'
      };
    } else {
      return {
        color: '#757575',
        name: 'обычная',
        badge: 'secondary'
      };
    }
  };

  // Иконка в зависимости от типа предмета
  const getItemIcon = () => {
    const type = item.type?.toLowerCase() || '';
    
    if (type.includes('weapon') || type === 'оружие') return 'fas fa-sword';
    if (type.includes('armor') || type === 'броня') return 'fas fa-shield-alt';
    if (type.includes('helmet') || type === 'шлем') return 'fas fa-helmet-battle';
    if (type.includes('accessory') || type === 'аксессуар') return 'fas fa-gem';
    if (type.includes('potion') || type === 'зелье') return 'fas fa-flask';
    if (type.includes('food') || type === 'еда') return 'fas fa-apple-alt';
    if (type.includes('material') || type === 'материал') return 'fas fa-cubes';
    if (type.includes('scroll') || type === 'свиток') return 'fas fa-scroll';
    if (type.includes('book') || type === 'книга') return 'fas fa-book';
    if (type.includes('ring') || type === 'кольцо') return 'fas fa-ring';
    if (type.includes('amulet') || type === 'амулет') return 'fas fa-medal';
    
    return 'fas fa-box';
  };

  const formatItemName = () => {
    if (item.count > 1) {
      return `${item.count} ${item.name}`;
    }
    return item.name;
  };

  const handleClick = (e) => {
    if (onToggleSelect && itemId) {
      e.stopPropagation();
      onToggleSelect(itemId);
    }
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (onToggleSelect && itemId) {
      onToggleSelect(itemId);
    }
  };

  const getItemType = () => {
    if (item.type) {
      return dict_translator[item.type] || item.type;
    }
    return "Предмет";
  };

  const rarityColor = getRarityColor();
  const isEquipped = item.equipped === true;

  return (
    <div 
      className={`castle-storage-item-card ${isSelected ? 'selected' : ''} ${source} ${isEquipped ? 'equipped' : ''}`}
      onClick={handleClick}
      title={`ID: ${itemId}`}
    >
      <div className="item-checkbox" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="item-icon">
        <i className={getItemIcon()}></i>
        {item.type && (
          <span className="item-type-badge">
            {getItemType()}
          </span>
        )}
      </div>

      <div className="item-info">
        <div className="item-header">
          <div className="item-name text-dark">
            {formatItemName()}
            <small className="text-muted ms-2">ID: {itemId}</small>
          </div>
          <div className="item-value text-dark">
            {item.value ? `${item.value} 🌕` : ''}
          </div>
        </div>

        <div className="item-details text-dark">
          {item.weight !== undefined && (
            <span className="item-detail">
              <i className="fas fa-weight me-1"></i>
              {item.weight} кг
            </span>
          )}
          
          {source === "storage" && item.added_by && (
            <span className="item-detail">
              <i className="fas fa-user me-1"></i>
              {item.added_by}
            </span>
          )}
        </div>

        {item.description && (
          <div className="item-description text-dark">
            {item.description}
          </div>
        )}

        <div className="item-badges">
          {rarityColor.name !== "обычная" && (
            <Badge 
              bg={rarityColor.badge}
              className="rarity-badge"
            >
              {rarityColor.name}
            </Badge>
          )}
          
          {isEquipped && (
            <Badge bg="success" className="equipped-badge">
              <i className="fas fa-check-circle me-1"></i>
              Экипировано
            </Badge>
          )}
          
          {source === "storage" && item.added_at && (
            <Badge bg="info" className="date-badge">
              {new Date(item.added_at).toLocaleDateString()}
            </Badge>
          )}
          
          {item.undefined === true && (
            <Badge bg="danger" className="identified-badge">
              Неопознанный
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

const CastleStorage = observer(() => {
  const { guild } = useContext(Context);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCastle, setActiveCastle] = useState(null);
  const [storageItems, setStorageItems] = useState([]);
  const [playerInventory, setPlayerInventory] = useState({});
  const [playerData, setPlayerData] = useState(null);
  
  const [selectedInventoryItems, setSelectedInventoryItems] = useState(new Set());
  const [selectedStorageItems, setSelectedStorageItems] = useState(new Set());
  const [showTransferToCastle, setShowTransferToCastle] = useState(false);
  const [showTransferFromCastle, setShowTransferFromCastle] = useState(false);
  
  const [hasAccess, setHasAccess] = useState(false);
  const [accessReason, setAccessReason] = useState("");
  const [storageCapacity, setStorageCapacity] = useState({ current: 0, max: 1000 });
  
  const [isCastleEventActive, setIsCastleEventActive] = useState(false);

  const [inventoryBrowse, setInventoryBrowse] = useState(emptyBrowse);
  const [storageBrowse, setStorageBrowse] = useState(emptyBrowse);

  // Проверка наличия улучшения "Гильдейский посланник"
  const hasMessenger = useMemo(() => {
    return playerData?.upgrades?.includes("Гильдейский посланник") || false;
  }, [playerData]);

  // Получение набора экипированных предметов (аналог InventoryItem)
  const equippedItemsSet = useMemo(() => {
    if (!playerData) return new Set();
    const equippedIds = new Set();
    
    // Список слотов, которые могут содержать предметы
    const equipmentSlots = [
      'head', 'right_hand', 'left_hand', 'breast_armor', 'cloak',
      'ring_1', 'ring_2', 'ring_3', 'ring_4', 'ring_5',
      'gloves', 'necklace', 'leg_armor', 'boots', 'secondary_weapon',
      'belt', 'arm_armor'
    ];
    
    for (const slot of equipmentSlots) {
      const slotItem = playerData[slot];
      if (slotItem && slotItem.id !== undefined && slotItem.id !== null) {
        let id;
        if (typeof slotItem.id === 'string') {
          id = slotItem.id;
        } else if (typeof slotItem.id === 'number') {
          id = slotItem.id.toString();
        } else {
          continue;
        }
        equippedIds.add(id);
      }
    }
    
    return equippedIds;
  }, [playerData]);

  // Загрузка данных
  useEffect(() => {
    if (guild.selectedCastle) {
      setActiveCastle(guild.selectedCastle);
      guild.setSelectedCastle(null);
    } else if (guild.guildData?.castles && guild.guildData.castles.length > 0) {
      setActiveCastle(guild.guildData.castles[0]);
    }
  }, [guild.selectedCastle, guild.guildData]);

  const fetchPlayerData = useCallback(async () => {
    try {
      const result = await GetDataById();
      if (result && result.data) {
        setPlayerData(result.data);
        setPlayerInventory(result.data.inventory_new || {});
        
        const isEventActive = result.data.active_event === "Castle";
        setIsCastleEventActive(isEventActive);
        
        if (activeCastle) {
          checkAccess(result.data);
        }
      }
    } catch (error) {
      console.error("Error fetching player data:", error);
      setError("Не удалось загрузить данные игрока");
    }
  }, [activeCastle]);

  const checkAccess = useCallback((playerData) => {
    if (!activeCastle) return;
    
    if (playerData?.upgrades?.includes("Гильдейский посланник")) {
      setHasAccess(true);
      setAccessReason("Доступ разрешен благодаря Гильдейскому посланнику");
      return;
    }
    
    const isEventActive = playerData?.active_event === "Castle";
    
    if (isEventActive) {
      setHasAccess(true);
      setAccessReason("Доступ разрешен - вы находитесь в событии 'Замок'");
    } else {
      setHasAccess(false);
      setAccessReason(`Доступ запрещён - вы не находитесь в событии 'Замок'. Текущее событие: ${playerData?.active_event || "не определено"}`);
    }
  }, [activeCastle]);

  const fetchCastleStorage = useCallback(async (castleId) => {
    if (castleId === undefined || castleId === null) return;
    
    setLoading(true);
    setError("");
    try {
      const result = await GetCastleStorage(castleId);
      
      if (result && result.status === 200) {
        const storageData = result.data;
        
        let itemsArray = [];
        if (storageData?.items) {
          if (typeof storageData.items === 'object' && !Array.isArray(storageData.items)) {
            itemsArray = Object.entries(storageData.items).map(([key, value]) => {
              const itemId = normalizeId(value.id || key);
              return {
                id: itemId,
                ...value,
                undefined: value.undefined === true || value.undefined === "true" ? true : false
              };
            });
          } else if (Array.isArray(storageData.items)) {
            itemsArray = storageData.items.map(item => ({
              ...item,
              id: normalizeId(item.id || item.key || item.itemId),
              undefined: item.undefined === true || item.undefined === "true" ? true : false
            }));
          }
        }
        
        setStorageItems(itemsArray);
        setStorageCapacity({
          current: storageData.current_weight || 0,
          max: storageData.storage_capacity || 1000
        });
        
        if (hasMessenger) {
          setHasAccess(true);
          setAccessReason("Доступ разрешен благодаря Гильдейскому посланнику");
        } else if (storageData.has_access !== undefined) {
          setHasAccess(storageData.has_access);
        } else {
          const isEventActive = playerData?.active_event === "Castle";
          setHasAccess(isEventActive);
        }
        
        if (storageData.message && !storageData.has_access && !hasMessenger) {
          setAccessReason(storageData.message);
        } else if (!hasAccess && !hasMessenger && playerData) {
          const isEventActive = playerData.active_event === "Castle";
          if (!isEventActive) {
            setAccessReason(`Доступ запрещён - вы не находитесь в событии 'Замок'. Текущее событие: ${playerData.active_event || "не определено"}`);
          }
        }
      } else {
        setError(result?.message || "Не удалось загрузить хранилище замка");
      }
    } catch (error) {
      console.error("Error fetching castle storage:", error);
      setError("Ошибка при загрузке хранилища замка");
    } finally {
      setLoading(false);
    }
  }, [playerData, hasMessenger, hasAccess]);

  useEffect(() => {
    if (activeCastle) {
      fetchCastleStorage(activeCastle.id);
    }
  }, [activeCastle, fetchCastleStorage]);

  useEffect(() => {
    fetchPlayerData();
  }, [fetchPlayerData]);

  const inventoryItems = useMemo(() => Object.entries(playerInventory)
    .filter(([, item]) => item && typeof item === 'object')
    .map(([id, item]) => ({...item, id, equipped:equippedItemsSet.has(id)})),
    [playerInventory, equippedItemsSet]);
  const inventoryOptions = useMemo(() => itemFilterOptions(inventoryItems), [inventoryItems]);
  const storageOptions = useMemo(() => itemFilterOptions(storageItems), [storageItems]);
  const storageHasDetails = !storageItems.length || storageItems.some(item => 'level' in item);
  const filteredInventory = useMemo(() => browseLocalItems(inventoryItems, inventoryBrowse, castleSearch), [inventoryItems, inventoryBrowse]);
  const filteredStorage = useMemo(() => browseLocalItems(storageItems, storageBrowse, castleSearch), [storageItems, storageBrowse]);

  // Вспомогательные функции
  const handleCastleSelect = (castle) => {
    setActiveCastle(castle);
    setSelectedInventoryItems(new Set());
    setSelectedStorageItems(new Set());
    fetchCastleStorage(castle.id);
    if (playerData) {
      checkAccess(playerData);
    }
  };

  const toggleInventoryItem = (itemId) => {
    if (!itemId) return;
    setSelectedInventoryItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const toggleStorageItem = (itemId) => {
    if (!itemId) return;
    setSelectedStorageItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const selectAllFilteredInventory = () => {
    const allIds = filteredInventory.map(item => item.id);
    setSelectedInventoryItems(new Set(allIds));
  };

  const selectAllFilteredStorage = () => {
    const allIds = filteredStorage.map(item => normalizeId(item.id));
    setSelectedStorageItems(new Set(allIds));
  };

  const clearAllSelections = () => {
    setSelectedInventoryItems(new Set());
    setSelectedStorageItems(new Set());
  };

  const handleTransferToCastle = () => {
    if (selectedInventoryItems.size === 0) {
      alert("Выберите предметы для переноса в замок");
      return;
    }
    setShowTransferToCastle(true);
  };

  const handleTransferFromCastle = () => {
    if (selectedStorageItems.size === 0) {
      alert("Выберите предметы для изъятия из замка");
      return;
    }
    const playerRole = guild.guildData?.player_role;
    const canTakeItems = playerRole === 'leader' || playerRole === 'officer';
    if (!canTakeItems) {
      alert("Только офицеры и лидер гильдии могут забирать предметы из хранилища замка!");
      return;
    }
    setShowTransferFromCastle(true);
  };

  const handleOperationSuccess = () => {
    fetchCastleStorage(activeCastle?.id);
    fetchPlayerData();
    clearAllSelections();
  };

  const canTakeItemsFromStorage = guild.guildData?.player_role === 'leader' || 
                                  guild.guildData?.player_role === 'officer';

  const capacityPercentage = (storageCapacity.current / storageCapacity.max) * 100;

  const handleRefresh = () => {
    if (activeCastle?.id) {
      fetchCastleStorage(activeCastle.id);
    }
    fetchPlayerData();
  };

  const renderEventWarning = () => {
    if (!isCastleEventActive && !hasMessenger && playerData) {
      return (
        <Alert variant="danger" className="mb-3">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>Доступ к хранилищу замка ограничен!</strong>
          <div className="mt-1">
            Для использования хранилища замка вы должны находиться в событии "Замок" или иметь улучшение "Гильдейский посланник".
            Текущее событие: <strong>{playerData.active_event || "не определено"}</strong>
          </div>
        </Alert>
      );
    }
    return null;
  };

  if (!guild.hasGuild || !guild.guildData?.castles || guild.guildData.castles.length === 0) {
    return (
      <Container className="castle-storage-container">
        <Card className="fantasy-card">
          <Card.Header className="fantasy-card-header fantasy-card-header-danger">
            <h4 className="fantasy-text-gold">🏰 Хранилище замка</h4>
          </Card.Header>
          <Card.Body className="text-center">
            <div className="py-5">
              <i className="fas fa-castle fa-4x text-muted mb-4"></i>
              <h5 className="text-dark">У вашей гильдии нет замков</h5>
              <p className="text-dark">Захватите замок, чтобы получить доступ к общему хранилищу</p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="castle-storage-container">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")} className="mt-3">
          ⚠️ {error}
        </Alert>
      )}
      
      {renderEventWarning()}

      <Row className="g-3">
        <Col lg={3}>
          <Card className="fantasy-card h-100">
            <Card.Header className="fantasy-card-header fantasy-card-header-primary">
              <h5 className="fantasy-text-gold">🏯 Выбор замка</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {guild.guildData.castles.map(castle => (
                  <ListGroup.Item
                    key={castle.id}
                    className={`castle-select-item ${activeCastle?.id === castle.id ? 'active' : ''}`}
                    onClick={() => handleCastleSelect(castle)}
                  >
                    <div className="d-flex align-items-center">
                      <div className="castle-icon me-3">
                        <i className="fas fa-castle"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="castle-name text-dark">{castle.name || "Без названия"}</div>
                      </div>
                      {activeCastle?.id === castle.id && (
                        <i className="fas fa-check text-success"></i>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              
              {activeCastle && (
                <div className="mt-4">
                  <div className="castle-stats p-3">
                    <h6 className="text-dark mb-3">📊 Статистика замка</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-dark">Уровень хранилища:</span>
                      <Badge bg="info">{activeCastle.storage_lvl || 1}</Badge>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-dark">Вес хранилища:</span>
                      <span className="text-dark">{storageCapacity.current.toFixed(1)} / {storageCapacity.max} кг</span>
                    </div>
                    <div className="mb-3">
                      <ProgressBar 
                        now={capacityPercentage} 
                        variant={capacityPercentage > 90 ? "danger" : capacityPercentage > 70 ? "warning" : "success"}
                        className="mb-1"
                      />
                      <small className="text-dark">{capacityPercentage.toFixed(1)}% заполнено</small>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-dark">Предметов в хранилище:</span>
                      <Badge bg="secondary">{storageItems.length}</Badge>
                    </div>
                  </div>
                  
                  <div className={`access-info mt-3 p-3 ${hasAccess ? 'access-granted' : 'access-denied'}`}>
                    <h6 className="text-dark mb-2">
                      <i className={`fas fa-${hasAccess ? 'check-circle text-success' : 'times-circle text-danger'} me-2`}></i>
                      Доступ к хранилищу
                    </h6>
                    <p className="small mb-0 text-dark">{accessReason}</p>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={9}>
          <Card className="fantasy-card h-100">
            <Card.Header className="fantasy-card-header fantasy-card-header-warning">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="fantasy-text-gold mb-0">
                  📦 Хранилище замка: {activeCastle?.name || "Не выбран"}
                  <small className="ms-2 fantasy-text-gold">
                    ({storageCapacity.current.toFixed(1)} / {storageCapacity.max} кг)
                  </small>
                </h5>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-info"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="fantasy-btn"
                    type="button"
                  >
                    <i className="fas fa-sync"></i>
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="secondary" />
                  <p className="text-dark mt-3">Загрузка хранилища...</p>
                </div>
              ) : !hasAccess ? (
                <div className="text-center py-5">
                  <i className="fas fa-lock fa-4x text-danger mb-4"></i>
                  <h5 className="text-dark mb-3">Доступ запрещен</h5>
                  <p className="text-dark">{accessReason}</p>
                </div>
              ) : (
                <Tabs defaultActiveKey="toCastle" className="mb-3 fantasy-tabs">
                  <Tab eventKey="toCastle" title="📤 В замок">
                    <div>
                      <div className="mb-4">
                        {selectedInventoryItems.size > 0 && (
                          <div className="mass-operations-panel mb-3 p-3">
                            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                              <span className="badge selected-count-badge">
                                Выбрано: <strong>{selectedInventoryItems.size}</strong> предметов
                              </span>
                            </div>
                            
                            <div className="d-flex flex-wrap gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={handleTransferToCastle}
                                className="mass-action-btn"
                                type="button"
                              >
                                <i className="fas fa-upload me-1"></i>
                                Перенести в замок ({selectedInventoryItems.size})
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={clearAllSelections}
                                className="mass-action-btn"
                                type="button"
                              >
                                <i className="fas fa-times me-1"></i>
                                Очистить
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={selectAllFilteredInventory}
                                className="mass-action-btn"
                                disabled={filteredInventory.length === 0}
                                type="button"
                              >
                                <i className="fas fa-check-double me-1"></i>
                                Выбрать всё ({filteredInventory.length})
                              </Button>
                            </div>
                          </div>
                        )}

                        <ItemFilters initialValue={inventoryBrowse} label="Фильтры инвентаря для переноса в замок" fields={inventoryFields} options={inventoryOptions}
                          onApply={setInventoryBrowse} result={`Найдено: ${filteredInventory.length} из ${inventoryItems.length}`} />
                        {selectedInventoryItems.size === 0 &&
                          <Button className="mb-3" variant="outline-primary" type="button"
                            onClick={selectAllFilteredInventory} disabled={!filteredInventory.length}>
                            Выбрать всё ({filteredInventory.length})
                          </Button>}
                        <div className="inventory-items-grid">
                          {filteredInventory.length > 0 ? (
                            filteredInventory.map(item => (
                              <CastleStorageItem
                                key={item.id}
                                item={item}
                                isSelected={selectedInventoryItems.has(item.id)}
                                onToggleSelect={toggleInventoryItem}
                                source="inventory"
                              />
                            ))
                          ) : (
                            <div className="text-center py-5">
                              <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                              <p className="text-dark">
                                {Object.keys(playerInventory).length > 0 
                                  ? "Предметы не найдены по вашему запросу" 
                                  : "Ваш инвентарь пуст"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Tab>

                  <Tab eventKey="fromCastle" title="📥 Из замка">
                    <div>
                      <div className="mb-4">
                        {!canTakeItemsFromStorage && (
                          <Alert variant="warning" className="mb-3">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            Только офицеры и лидер гильдии могут забирать предметы из хранилища замка
                          </Alert>
                        )}
                        
                        {selectedStorageItems.size > 0 && (
                          <div className="mass-operations-panel mb-3 p-3">
                            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                              <span className="badge selected-count-badge">
                                Выбрано: <strong>{selectedStorageItems.size}</strong> предметов
                              </span>
                            </div>
                            
                            <div className="d-flex flex-wrap gap-2">
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={handleTransferFromCastle}
                                disabled={!canTakeItemsFromStorage}
                                className="mass-action-btn"
                                type="button"
                              >
                                <i className="fas fa-download me-1"></i>
                                Изъять в инвентарь ({selectedStorageItems.size})
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={clearAllSelections}
                                className="mass-action-btn"
                                type="button"
                              >
                                <i className="fas fa-times me-1"></i>
                                Очистить
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={selectAllFilteredStorage}
                                className="mass-action-btn"
                                disabled={filteredStorage.length === 0 || !canTakeItemsFromStorage}
                                type="button"
                              >
                                <i className="fas fa-check-double me-1"></i>
                                Выбрать всё ({filteredStorage.length})
                              </Button>
                            </div>
                          </div>
                        )}

                        <ItemFilters initialValue={storageBrowse} label="Фильтры склада замка" options={storageOptions}
                          fields={storageHasDetails ? storageFields : legacyStorageFields}
                          sorts={storageHasDetails ? itemSorts : legacyStorageSorts}
                          onApply={setStorageBrowse} result={`Найдено: ${filteredStorage.length} из ${storageItems.length}`} />
                        {selectedStorageItems.size === 0 &&
                          <Button className="mb-3" variant="outline-primary" type="button"
                            onClick={selectAllFilteredStorage} disabled={!filteredStorage.length || !canTakeItemsFromStorage}>
                            Выбрать всё ({filteredStorage.length})
                          </Button>}
                        <div className="storage-items-grid">
                          {filteredStorage.length > 0 ? (
                            filteredStorage.map(item => (
                              <CastleStorageItem 
                                key={`storage-${item.id}`}
                                item={item}
                                isSelected={selectedStorageItems.has(item.id)}
                                onToggleSelect={toggleStorageItem}
                                source="storage"
                              />
                            ))
                          ) : (
                            <div className="text-center py-5">
                              <i className="fas fa-warehouse fa-3x text-muted mb-3"></i>
                              <p className="text-dark">
                                {storageItems.length > 0 
                                  ? "Предметы не найдены по вашему запросу" 
                                  : "Хранилище замка пусто"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Tab>
                </Tabs>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <MassTransferToCastleModal
        show={showTransferToCastle}
        onClose={() => setShowTransferToCastle(false)}
        selectedItems={selectedInventoryItems}
        inventory={playerInventory}
        castleId={activeCastle?.id}
        onSuccess={handleOperationSuccess}
      />

      <MassTransferFromCastleModal
        show={showTransferFromCastle}
        onClose={() => setShowTransferFromCastle(false)}
        selectedItems={selectedStorageItems}
        storageItems={storageItems}
        castleId={activeCastle?.id}
        onSuccess={handleOperationSuccess}
        canTakeItems={canTakeItemsFromStorage}
      />
    </Container>
  );
});

export default CastleStorage;
