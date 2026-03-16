import React, { useState, useContext, useEffect, useCallback, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
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
import Fuse from "fuse.js";
import { dict_translator } from "../utils/Helpers";
import "./CastleStorage.css";
import { 
  MassTransferToCastleModal, 
  MassTransferFromCastleModal 
} from './CastleStorageModal';

// Хук для дебаунса
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Вспомогательная функция для нормализации ID
const normalizeId = (id) => {
  if (id === undefined || id === null || id === "undefined") return "undefined";
  return String(id);
};

// Компонент карточки предмета
const CastleStorageItem = ({ 
  item, 
  isSelected = false, 
  onToggleSelect = null,
  source = "inventory"
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [itemId, setItemId] = useState("");

  useEffect(() => {
    const id = item.id || item.itemId || item.key;
    setItemId(normalizeId(id));
  }, [item]);

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

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(prev => !prev);
  };

  const getItemType = () => {
    if (item.type) {
      return dict_translator[item.type] || item.type;
    }
    return "Предмет";
  };

  const rarityColor = getRarityColor();

  return (
    <div 
      className={`castle-storage-item-card ${isSelected ? 'selected' : ''} ${source}`}
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
        <i className="fas fa-box"></i>
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

      {showMenu && (
        <div className="item-menu">
          <div className="menu-content">
            <button className="menu-item">
              <i className="fas fa-info-circle"></i>
              Подробнее
            </button>
            <button className="menu-item">
              <i className="fas fa-search"></i>
              Осмотреть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Кастомный компонент Select
const CustomSelect = ({ 
  size = "sm", 
  value, 
  onChange, 
  children, 
  className = "",
  disabled = false,
  ...props 
}) => {
  const handleChange = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange(e);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className={`custom-select-wrapper ${className}`}>
      <select 
        className={`form-select form-select-${size} mobile-friendly-select`}
        value={value}
        onChange={handleChange}
        onClick={handleClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </select>
      <div className="select-arrow">
        <i className="fas fa-chevron-down"></i>
      </div>
    </div>
  );
};

// Компонент FilterCard для отображения одного фильтра
const FilterCard = ({ 
  filter, 
  index, 
  filterFields, 
  onUpdateFilter, 
  onRemoveFilter,
  source 
}) => {
  const fieldConfig = filterFields.find(f => f.id === filter.field);
  
  const handleFieldChange = (e) => {
    e.stopPropagation();
    onUpdateFilter(index, "field", e.target.value);
  };

  const handleOperatorChange = (e) => {
    e.stopPropagation();
    onUpdateFilter(index, "operator", e.target.value);
  };

  const handleValueChange = (e) => {
    e.stopPropagation();
    onUpdateFilter(index, "value", e.target.value);
  };

  const handleValueInputChange = (e) => {
    e.stopPropagation();
    onUpdateFilter(index, "value", e.target.value);
  };

  const handleRemoveFilter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRemoveFilter(index);
  };

  const handleFormClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="filter-card p-3 mb-3" onClick={handleFormClick}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <small className="text-dark">
          {source === "inventory" ? "Фильтр инвентаря" : "Фильтр хранилища"} {index + 1}
        </small>
        {filter.field && (
          <Button
            variant="link"
            size="sm"
            className="text-danger p-0"
            onClick={handleRemoveFilter}
            title="Удалить фильтр"
            type="button"
          >
            <i className="fas fa-times"></i>
          </Button>
        )}
      </div>
      
      <div className="filter-controls" onClick={handleFormClick}>
        <Form.Group className="mb-2">
          <Form.Label size="sm" className="text-dark">Поле</Form.Label>
          <CustomSelect
            size="sm"
            value={filter.field}
            onChange={handleFieldChange}
            className="w-100"
          >
            <option value="">Выберите поле...</option>
            {filterFields.map(field => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </CustomSelect>
        </Form.Group>
        
        {fieldConfig?.type === "number" && filter.field && (
          <Form.Group className="mb-2">
            <Form.Label size="sm" className="text-dark">Условие</Form.Label>
            <CustomSelect
              size="sm"
              value={filter.operator}
              onChange={handleOperatorChange}
              className="w-100"
            >
              {fieldConfig.operators.map(op => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </CustomSelect>
          </Form.Group>
        )}
        
        {filter.field && (
          <Form.Group className="mb-2">
            <Form.Label size="sm" className="text-dark">Значение</Form.Label>
            
            {fieldConfig?.type === "select" && (
              <CustomSelect
                size="sm"
                value={filter.value}
                onChange={handleValueChange}
                className="w-100"
              >
                <option value="">Любое...</option>
                {fieldConfig.options().map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </CustomSelect>
            )}
            
            {fieldConfig?.type === "boolean" && (
              <CustomSelect
                size="sm"
                value={filter.value}
                onChange={handleValueChange}
                className="w-100"
              >
                <option value="">Любое...</option>
                {fieldConfig.options.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </CustomSelect>
            )}
            
            {fieldConfig?.type === "number" && (
              <Form.Control
                type="number"
                size="sm"
                value={filter.value}
                onChange={handleValueInputChange}
                onClick={handleFormClick}
                placeholder="Введите число..."
                min="0"
                step="0.1"
                className="w-100"
              />
            )}
          </Form.Group>
        )}
      </div>
    </div>
  );
};

// Основной компонент хранилища замка
const CastleStorage = observer(() => {
  const { user, guild } = useContext(Context);
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

  // Состояния для фильтрации и поиска
  const [searchQueryInventory, setSearchQueryInventory] = useState("");
  const [searchQueryStorage, setSearchQueryStorage] = useState("");
  const debouncedInventorySearch = useDebounce(searchQueryInventory, 300);
  const debouncedStorageSearch = useDebounce(searchQueryStorage, 300);
  
  const [inventoryFilters, setInventoryFilters] = useState([
    { field: "", operator: "equals", value: "" },
    { field: "", operator: "equals", value: "" }
  ]);
  
  const [storageFilters, setStorageFilters] = useState([
    { field: "", operator: "equals", value: "" },
    { field: "", operator: "equals", value: "" }
  ]);

  // UPDATED: Проверка наличия улучшения "Гильдейский посланник"
  const hasMessenger = useMemo(() => {
    return playerData?.upgrades?.includes("Гильдейский посланник") || false;
  }, [playerData]);

  const translateValue = useCallback((value) => {
    if (value === null || value === undefined) return "";
    const strValue = String(value).toLowerCase();
    return dict_translator[strValue] || dict_translator[value] || value;
  }, []);

  const getTranslatedType = useCallback((type) => {
    if (!type) return type;
    return translateValue(type);
  }, [translateValue]);

  const uniqueTypes = useMemo(() => {
    const allItems = [];
    if (playerInventory) {
      Object.values(playerInventory).forEach(item => {
        if (item) allItems.push(item);
      });
    }
    if (storageItems) {
      storageItems.forEach(item => {
        if (item) allItems.push(item);
      });
    }
    return Array.from(new Set(allItems.map(item => item.type).filter(Boolean)));
  }, [playerInventory, storageItems]);

  const uniqueAddedBy = useMemo(() => {
    const addedBySet = new Set();
    storageItems.forEach(item => {
      if (item.added_by) addedBySet.add(item.added_by);
    });
    return Array.from(addedBySet);
  }, [storageItems]);

  const filterFields = useMemo(() => {
    return [
      { 
        id: "type", 
        name: "Тип предмета", 
        type: "select",
        options: () => uniqueTypes.map(type => ({ 
          value: type, 
          label: getTranslatedType(type)
        })).sort((a, b) => a.label.localeCompare(b.label))
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
          { value: "true", label: "Нераспознанный" },
          { value: "false", label: "Распознанный" }
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
      },
      { 
        id: "added_by", 
        name: "Добавлено игроком", 
        type: "select",
        options: () => uniqueAddedBy.map(name => ({ 
          value: name, 
          label: name 
        })).sort((a, b) => a.label.localeCompare(b.label))
      }
    ];
  }, [uniqueTypes, uniqueAddedBy, getTranslatedType]);

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

  // UPDATED: Функция проверки доступа теперь учитывает Гильдейского посланника
  const checkAccess = useCallback((playerData) => {
    if (!activeCastle) return;
    
    // Если есть апгрейд, доступ всегда есть
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

  // UPDATED: При загрузке данных хранилища также учитываем апгрейд
  const fetchCastleStorage = useCallback(async (castleId) => {
    if (!castleId) return;
    
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
        
        // Проверяем апгрейд (данные playerData могут быть ещё не загружены, но у нас есть hasMessenger из useMemo)
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
  }, [playerData, hasMessenger]);

  useEffect(() => {
    if (activeCastle) {
      fetchCastleStorage(activeCastle.id);
    }
  }, [activeCastle, fetchCastleStorage]);

  useEffect(() => {
    fetchPlayerData();
  }, [fetchPlayerData]);

  const applyFiltersToItems = useCallback((items, filters, isArray = false) => {
    return items.filter(itemData => {
      if (!isArray) {
        const [key, item] = itemData;
        return filters.every(filter => {
          if (!filter.field || filter.value === "") return true;
          
          const fieldConfig = filterFields.find(f => f.id === filter.field);
          if (!fieldConfig) return true;
          
          let itemValue = item[filter.field];
          
          if (filter.field === "undefined") {
            itemValue = item.undefined === true ? true : false;
            itemValue = String(itemValue);
          } else if (filter.field === "corrupted") {
            itemValue = item.corrupted || false;
          } else if (filter.field === "junk") {
            itemValue = item.junk || false;
          } else if (filter.field === "is_equippable") {
            itemValue = item.is_equippable || false;
          } else if (filter.field === "added_by") {
            itemValue = item.added_by || "";
          }
          
          switch (fieldConfig.type) {
            case "boolean":
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
              return itemValue === filter.value;
              
            default:
              return true;
          }
        });
      } else {
        const item = itemData;
        return filters.every(filter => {
          if (!filter.field || filter.value === "") return true;
          
          const fieldConfig = filterFields.find(f => f.id === filter.field);
          if (!fieldConfig) return true;
          
          let itemValue = item[filter.field];
          
          if (filter.field === "undefined") {
            itemValue = item.undefined === true ? true : false;
            itemValue = String(itemValue);
          } else if (filter.field === "corrupted") {
            itemValue = item.corrupted || false;
          } else if (filter.field === "junk") {
            itemValue = item.junk || false;
          } else if (filter.field === "is_equippable") {
            itemValue = item.is_equippable || false;
          } else if (filter.field === "added_by") {
            itemValue = item.added_by || "";
          }
          
          switch (fieldConfig.type) {
            case "boolean":
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
              return itemValue === filter.value;
              
            default:
              return true;
          }
        });
      }
    });
  }, [filterFields]);

  const filterItems = useCallback((items, query, filters, isArray = false) => {
    const hasActiveFilters = filters.some(f => f.field && f.value !== "");
    
    if (!hasActiveFilters && !query) {
      return isArray ? items : Object.entries(items).filter(([key, item]) => 
        item && typeof item === 'object' && key !== null && key !== undefined
      );
    }

    let filteredItems = isArray ? items : Object.entries(items).filter(([key, item]) => 
      item && typeof item === 'object' && key !== null && key !== undefined
    );

    if (hasActiveFilters) {
      filteredItems = applyFiltersToItems(filteredItems, filters, isArray);
    }

    if (query && filteredItems.length > 0) {
      try {
        const itemObjects = isArray 
          ? filteredItems.map(item => ({ 
              ...item, 
              id: normalizeId(item.id),
              searchKey: `${item.name || ''} ${item.description || ''}`
            }))
          : filteredItems.map(([id, data]) => ({ 
              id: normalizeId(id),
              ...(data || {}),
              searchKey: `${data?.name || ''} ${data?.description || ''}`
            }));
        
        const fuse = new Fuse(itemObjects, {
          keys: ["name", "description", "searchKey"],
          includeScore: true,
          threshold: 0.4,
          shouldSort: true,
          minMatchCharLength: 2,
          ignoreLocation: true,
        });
        
        const searchResults = fuse.search(query);
        
        if (isArray) {
          filteredItems = searchResults.map(result => result.item);
        } else {
          filteredItems = searchResults.map(result => {
            const { id, ...data } = result.item;
            return [id, data];
          });
        }
      } catch (error) {
        console.error("Fuse.js error:", error);
        const lowerQuery = query.toLowerCase();
        if (isArray) {
          filteredItems = filteredItems.filter(item => 
            (item.name && item.name.toLowerCase().includes(lowerQuery)) ||
            (item.description && item.description.toLowerCase().includes(lowerQuery))
          );
        } else {
          filteredItems = filteredItems.filter(([key, item]) => 
            (item.name && item.name.toLowerCase().includes(lowerQuery)) ||
            (item.description && item.description.toLowerCase().includes(lowerQuery))
          );
        }
      }
    }
    
    return filteredItems;
  }, [applyFiltersToItems]);

  const filteredInventory = useMemo(() => {
    return filterItems(playerInventory, debouncedInventorySearch, inventoryFilters, false);
  }, [playerInventory, debouncedInventorySearch, inventoryFilters, filterItems]);

  const filteredStorage = useMemo(() => {
    return filterItems(storageItems, debouncedStorageSearch, storageFilters, true);
  }, [storageItems, debouncedStorageSearch, storageFilters, filterItems]);

  const updateInventoryFilter = (index, field, value) => {
    setInventoryFilters(prev => {
      const newFilters = [...prev];
      if (field === "field") {
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
  };

  const removeInventoryFilter = (index) => {
    setInventoryFilters(prev => {
      const newFilters = [...prev];
      newFilters[index] = { field: "", operator: "equals", value: "" };
      return newFilters;
    });
  };

  const resetInventoryFilters = () => {
    setInventoryFilters([
      { field: "", operator: "equals", value: "" },
      { field: "", operator: "equals", value: "" }
    ]);
    setSearchQueryInventory("");
  };

  const updateStorageFilter = (index, field, value) => {
    setStorageFilters(prev => {
      const newFilters = [...prev];
      if (field === "field") {
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
  };

  const removeStorageFilter = (index) => {
    setStorageFilters(prev => {
      const newFilters = [...prev];
      newFilters[index] = { field: "", operator: "equals", value: "" };
      return newFilters;
    });
  };

  const resetStorageFilters = () => {
    setStorageFilters([
      { field: "", operator: "equals", value: "" },
      { field: "", operator: "equals", value: "" }
    ]);
    setSearchQueryStorage("");
  };

  const activeInventoryFiltersCount = useMemo(() => {
    return inventoryFilters.filter(f => f.field && f.value !== "").length;
  }, [inventoryFilters]);

  const activeStorageFiltersCount = useMemo(() => {
    return storageFilters.filter(f => f.field && f.value !== "").length;
  }, [storageFilters]);

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
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleStorageItem = (itemId) => {
    if (!itemId) return;
    
    setSelectedStorageItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAllFilteredInventory = () => {
    const allIds = filteredInventory.map(([key]) => normalizeId(key));
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

  // UPDATED: Предупреждение показываем только если нет апгрейда и нет события
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

                        <div className="mb-3">
                          <div className="fantasy-paper content-overlay bulk-purchase-tab">
                            <Form>
                              <div className="search-input-wrapper">
                                <i className="fas fa-search search-icon"></i>
                                <Form.Control
                                  type="text"
                                  value={searchQueryInventory}
                                  onChange={(e) => setSearchQueryInventory(e.target.value)}
                                  placeholder="Название или описание предмета..."
                                  className="inventory-search-input bulk-purchase"
                                />
                                {searchQueryInventory && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="clear-search-btn"
                                    onClick={() => setSearchQueryInventory('')}
                                    title="Очистить поиск"
                                    type="button"
                                  >
                                    <i className="fas fa-times"></i>
                                  </Button>
                                )}
                              </div>
                              <Form.Text className="text-dark">
                                Найдено: {filteredInventory.length} предметов
                                {activeInventoryFiltersCount > 0 && (
                                  <span className="ms-2">
                                    <i className="fas fa-filter text-info me-1"></i>
                                    Активных фильтров: {activeInventoryFiltersCount}
                                  </span>
                                )}
                              </Form.Text>
                            </Form>
                          </div>
                        </div>

                        <div className="custom-filters-container mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="text-dark mb-0">Фильтры предметов</h6>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={selectAllFilteredInventory}
                                className="fantasy-btn"
                                disabled={filteredInventory.length === 0}
                                type="button"
                              >
                                <i className="fas fa-check-double me-1"></i>
                                Выбрать всё
                              </Button>
                              {activeInventoryFiltersCount > 0 && (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={resetInventoryFilters}
                                  className="fantasy-btn"
                                  type="button"
                                >
                                  <i className="fas fa-times-circle me-1"></i>
                                  Сбросить все фильтры
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <Row className="g-3">
                            {inventoryFilters.map((filter, index) => (
                              <Col xs={12} key={index}>
                                <FilterCard
                                  filter={filter}
                                  index={index}
                                  filterFields={filterFields}
                                  onUpdateFilter={updateInventoryFilter}
                                  onRemoveFilter={removeInventoryFilter}
                                  source="inventory"
                                />
                              </Col>
                            ))}
                          </Row>
                          
                          {activeInventoryFiltersCount > 0 && (
                            <div className="active-filters-display mt-3 p-2">
                              <small className="text-dark d-flex align-items-center flex-wrap gap-1">
                                <i className="fas fa-filter"></i>
                                <span>Активные фильтры:</span>
                                {inventoryFilters.map((filter, index) => {
                                  if (!filter.field || filter.value === "") return null;
                                  
                                  const fieldConfig = filterFields.find(f => f.id === filter.field);
                                  let displayValue = filter.value;
                                  
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
                                        onClick={() => removeInventoryFilter(index)}
                                        style={{ minWidth: '16px', height: '16px' }}
                                        type="button"
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
                        
                        <div className="inventory-items-grid">
                          {filteredInventory.length > 0 ? (
                            filteredInventory.map(([key, item]) => {
                              const normalizedId = normalizeId(key);
                              return (
                                <CastleStorageItem 
                                  key={`inventory-${key}`}
                                  item={{ id: normalizedId, key: key, ...item }}
                                  isSelected={selectedInventoryItems.has(normalizedId)}
                                  onToggleSelect={toggleInventoryItem}
                                  source="inventory"
                                />
                              );
                            })
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

                        <div className="mb-3">
                          <div className="fantasy-paper content-overlay bulk-purchase-tab">
                            <Form>
                              <div className="search-input-wrapper">
                                <i className="fas fa-search search-icon"></i>
                                <Form.Control
                                  type="text"
                                  value={searchQueryStorage}
                                  onChange={(e) => setSearchQueryStorage(e.target.value)}
                                  placeholder="Название или описание предмета..."
                                  className="inventory-search-input bulk-purchase"
                                />
                                {searchQueryStorage && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="clear-search-btn"
                                    onClick={() => setSearchQueryStorage('')}
                                    title="Очистить поиск"
                                    type="button"
                                  >
                                    <i className="fas fa-times"></i>
                                  </Button>
                                )}
                              </div>
                              <Form.Text className="text-dark">
                                Найдено: {filteredStorage.length} предметов
                                {activeStorageFiltersCount > 0 && (
                                  <span className="ms-2">
                                    <i className="fas fa-filter text-info me-1"></i>
                                    Активных фильтров: {activeStorageFiltersCount}
                                  </span>
                                )}
                              </Form.Text>
                            </Form>
                          </div>
                        </div>

                        <div className="custom-filters-container mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="text-dark mb-0">Фильтры хранилища</h6>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={selectAllFilteredStorage}
                                className="fantasy-btn"
                                disabled={filteredStorage.length === 0 || !canTakeItemsFromStorage}
                                type="button"
                              >
                                <i className="fas fa-check-double me-1"></i>
                                Выбрать всё
                              </Button>
                              {activeStorageFiltersCount > 0 && (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={resetStorageFilters}
                                  className="fantasy-btn"
                                  type="button"
                                >
                                  <i className="fas fa-times-circle me-1"></i>
                                  Сбросить все фильтры
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <Row className="g-3">
                            {storageFilters.map((filter, index) => (
                              <Col xs={12} key={index}>
                                <FilterCard
                                  filter={filter}
                                  index={index}
                                  filterFields={filterFields}
                                  onUpdateFilter={updateStorageFilter}
                                  onRemoveFilter={removeStorageFilter}
                                  source="storage"
                                />
                              </Col>
                            ))}
                          </Row>
                          
                          {activeStorageFiltersCount > 0 && (
                            <div className="active-filters-display mt-3 p-2">
                              <small className="text-dark d-flex align-items-center flex-wrap gap-1">
                                <i className="fas fa-filter"></i>
                                <span>Активные фильтры:</span>
                                {storageFilters.map((filter, index) => {
                                  if (!filter.field || filter.value === "") return null;
                                  
                                  const fieldConfig = filterFields.find(f => f.id === filter.field);
                                  let displayValue = filter.value;
                                  
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
                                        onClick={() => removeStorageFilter(index)}
                                        style={{ minWidth: '16px', height: '16px' }}
                                        type="button"
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