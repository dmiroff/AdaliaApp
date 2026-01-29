import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { 
  Card, 
  Table, 
  ProgressBar, 
  Badge, 
  Button, 
  Modal, 
  Form, 
  Alert, 
  Spinner, 
  Row, 
  Col,
  InputGroup,
  Container
} from 'react-bootstrap';
import { observer } from "mobx-react-lite";
import { Context } from "../../index";
import { toJS } from 'mobx';
import { settlementService } from '../../services/SettlementService';
import GetDataById from "../../http/GetData";

// Полный список реагентов
const RESOURCES_DATA = {
  48: "Коготь страшной крысы",
  66: "Крысиный хвост",
  67: "Крысиная шкура",
  68: "Кровь крысы",
  69: "Длинный крысиный хвост",
  70: "Огромная крысиная кожа",
  74: "Кровь страшной крысы",
  75: "Резцы крысы",
  76: "Алмаз",
  77: "Рубин",
  78: "Изумруд",
  79: "Сапфир",
  80: "Янтарь",
  81: "Аметист",
  82: "Нитка",
  83: "Ржавый гвоздь",
  102: "Мешок зерна",
  103: "Зерно",
  104: "Голова короля крыс",
  105: "Пружина",
  107: "Заячья шкурка",
  108: "Заячья лапка",
  124: "Камень забвения",
  262: "Снежок",
  400: "Клык змеи",
  401: "Простой яд",
  402: "Кожа змеи",
  403: "Кожа громовой лягушки",
  404: "Железы громовой лягушки",
  406: "Лягушачьи лапки",
  407: "Шкура волка",
  408: "Эктоплазма муравья",
  409: "Кристалловидные антенны",
  410: "Муравьиный феромон",
  411: "Кремниевая пыль",
  412: "Воплощение камня",
  415: "Голова медузы-горгоны",
  416: "Эссенция призрака",
  417: "Шкура тролля",
  418: "Жвалы Червя",
  419: "Шкура пантеры",
  420: "Яд лесного паука",
  421: "Шкура виверны",
  422: "Перья гарпии",
  423: "Электрические железы",
  426: "Эктоплазма",
  428: "Пыльца феи",
  429: "Шкура барса",
  433: "Голова сирены",
  442: "Шкура оленя",
  443: "Рога оленя",
  469: "Перо ветра",
  470: "Рога короля чащи",
  471: "Семя отравы",
  472: "Сердце льда",
  87: "Ракушка",
  88: "Жемчужина",
  89: "Чёрная жемчужина",
  1100: "Пещерный папоротник",
  1101: "Трубочный гриб",
  1102: "Хвощ",
  1103: "Бледнолистая лилия",
  1104: "Шипокуст",
  1105: "Паутинка",
  1106: "Канализационный огурец",
  1107: "Сталеплодник",
  1108: "Трещиноцвет",
  1109: "Светогриб",
  1110: "Слизневик",
  1111: "Крапива обыкновенная",
  1112: "Зверобой",
  1113: "Горец птичий",
  1114: "Полынь горькая",
  1115: "Пастушья сумка",
  1116: "Шалфей",
  1117: "Трава-мурава",
  1118: "Подорожник",
  1119: "Клевер луговой",
  1120: "Конский щавель",
  1121: "Лох узколистный",
  1122: "Дикий мак",
  1123: "Лопух",
  1124: "Хмель обыкновенный",
  1125: "Щавель дикий",
  1126: "Одуванчик",
  1127: "Пырей",
  1128: "Цикорий",
  1129: "Чистотел",
  1130: "Тысячелистник",
  1131: "Орочник колючий",
  1132: "Душица",
  1133: "Ромашка",
  1134: "Пижма обыкновенная",
  1135: "Тимьян ползучий",
  1136: "Пион уклоняющегося",
  1137: "Комдальский чай",
  1138: "Золотая розга",
  1139: "Бадан толстолистный",
  1140: "Шлемник обыкновенный",
  1141: "Лишайник бородатый",
  1142: "Солодка голая",
  1143: "Камнеломка",
  1144: "Горечавка",
  1145: "Эльфский эдельвейс",
  1146: "Родиола Розовая",
  1147: "Кровохлёбка лекарственная",
  1148: "Пустырник",
  1149: "Валериана горная",
  1150: "Рогоз узколистный",
  1151: "Морской лотос",
  1152: "Стрелолист",
  1153: "Морские водоросли",
  1154: "Копеечник забытый",
  1155: "Мох прибрежный",
  1156: "Мята перечная",
  1157: "Боярышник",
  1158: "Девясил высокий",
  1159: "Калина красная",
  1160: "Белена чёрная",
  1161: "Дурман синий",
  1162: "Зайцегуб опьяняющий",
  1163: "Вяз",
  1164: "Ольха",
  1165: "Липа",
  1166: "Череда",
  1167: "Акация",
  1168: "Горная гвоздика",
  1169: "Лечебная хоста",
  1170: "Соболятник",
  1171: "Пион древовидный",
  1172: "Самшит колхидский",
  1173: "Тис ягодный",
  1174: "Магнолия",
  1175: "Горная герань",
  1176: "Морская звезда",
  1177: "Чёрный осьминог",
  1178: "Рыба-игла",
  1179: "Ледяная треска",
  1180: "Огненный окунь",
  1181: "Воздушный скат",
  1182: "Электрический угорь",
  1183: "Скалистый треск",
  1184: "Императорская гарнира",
  1185: "Призрачный угорь",
  1186: "Искрящийся гуппи",
  1187: "Золотая рыбка",
  1188: "Панцирь краба",
  1189: "Воплощение огня",
  1190: "Жало скорпиона",
  1191: "Хитин скорпиона",
  1192: "Воплощение жизни",
  1193: "Воплощение ветра",
  1194: "Воплощение молнии",
  1195: "Воплощение льда",
  1196: "Воплощение света",
  1197: "Воплощение звука",
  1198: "Воплощение власти",
  1199: "Воплощение тьмы",
  1200: "Воплощение смерти",
};

const CONSTRUCTION_RESOURCES = {
  112: "Железная руда",
  114: "Бревно",
  115: "Мешок угля",
  116: "Песчаник",
  117: "Мешок песка",
  118: "Стекло",
  119: "Доска", 
  120: "Сталь",
  121: "Каменный блок",
  413: "Глиняная пластина",
  414: "Каменная пластина"
};

const LEATHER_TIER_RESOURCES = {
  'leather_t1': "Кожа T1",
  'leather_t2': "Кожа T2", 
  'leather_t3': "Кожа T3"
};

// Добавляем числовые ID для кожи T1-T3 для обратной совместимости
const LEATHER_NUMERIC_IDS = {
  10001: "Кожа T1",
  10002: "Кожа T2",
  10003: "Кожа T3"
};

// Маппинг строковых ID кожи в числовые для API
const LEATHER_ID_MAPPING = {
  'leather_t1': 10001,
  'leather_t2': 10002,
  'leather_t3': 10003
};

const ALL_RESOURCES = { ...RESOURCES_DATA, ...CONSTRUCTION_RESOURCES, ...LEATHER_TIER_RESOURCES, ...LEATHER_NUMERIC_IDS };

// Коды строительных материалов для расчета использования склада
const CONSTRUCTION_CODES = ["112", "114", "115", "116", "117", "118", "119", "120", "121", "413", "414"];

// Функция для проверки, является ли ресурс кожей
const isLeatherResource = (resourceId) => {
  const idStr = String(resourceId);
  return ['leather_t1', 'leather_t2', 'leather_t3', '10001', '10002', '10003'].includes(idStr);
};

// Функция для проверки, является ли ресурс строительным материалом
const isConstructionResource = (resourceId) => {
  const idStr = String(resourceId);
  return CONSTRUCTION_CODES.includes(idStr);
};

const getResourceName = (key) => {
  const idStr = String(key);
  
  if (ALL_RESOURCES[idStr] !== undefined) {
    return ALL_RESOURCES[idStr];
  }
  
  const id = parseInt(key);
  if (!isNaN(id) && ALL_RESOURCES[id] !== undefined) {
    return ALL_RESOURCES[id];
  }
  
  return `Ресурс ${key}`;
};

const getResourceTypeDisplay = (resourceId) => {
  const strId = String(resourceId);
  
  if (CONSTRUCTION_RESOURCES[strId] !== undefined) {
    return 'Стройматериал';
  }
  
  const id = parseInt(resourceId);
  if (!isNaN(id) && CONSTRUCTION_RESOURCES[id] !== undefined) {
    return 'Стройматериал';
  }
  
  if (isLeatherResource(resourceId)) {
    return 'Кожа';
  }
  
  const hideIds = [67, 70, 402, 403, 407, 417, 419, 421, 429, 442];
  if (hideIds.includes(id)) {
    return 'Шкура';
  }
  
  return 'Реагент';
};

const getResourceBadgeColor = (resourceId) => {
  const strId = String(resourceId);
  
  if (CONSTRUCTION_RESOURCES[strId] !== undefined) {
    return 'info';
  }
  
  const id = parseInt(resourceId);
  if (!isNaN(id) && CONSTRUCTION_RESOURCES[id] !== undefined) {
    return 'info';
  }
  
  if (isLeatherResource(resourceId)) {
    if (resourceId === 'leather_t1' || resourceId === 10001) return 'warning';
    if (resourceId === 'leather_t2' || resourceId === 10002) return 'primary';
    if (resourceId === 'leather_t3' || resourceId === 10003) return 'danger';
  }
  
  const hideIds = [67, 70, 402, 403, 407, 417, 419, 421, 429, 442];
  if (hideIds.includes(id)) {
    if ([403, 1197, 417, 421].includes(id)) return 'danger';
    if ([70, 407, 419, 429, 442].includes(id)) return 'primary';
    return 'warning';
  }
  
  return 'secondary';
};

// Функция для преобразования ID ресурса для API
const getResourceIdForApi = (resourceId) => {
  // Если это строка кожи, преобразуем в числовой ID
  if (LEATHER_ID_MAPPING[resourceId]) {
    return LEATHER_ID_MAPPING[resourceId];
  }
  // Если это уже числовой ID кожи
  if (isLeatherResource(resourceId)) {
    return parseInt(resourceId) || resourceId;
  }
  // Для других ресурсов пробуем преобразовать в число
  const numId = parseInt(resourceId);
  return isNaN(numId) ? resourceId : numId;
};

// Функция для безопасного преобразования данных в строку
const safeToString = (value) => {
  if (value == null) return '';
  
  if (typeof value === 'object') {
    // Если это объект ошибки Pydantic с полем msg
    if (value.msg) {
      return value.msg;
    }
    // Если это объект с полем message
    else if (value.message) {
      return value.message;
    }
    // Если это массив
    else if (Array.isArray(value)) {
      return value.map(item => safeToString(item)).join(', ');
    }
    // В противном случае преобразуем в JSON строку
    else {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
  }
  
  return String(value);
};

const TakeResourceModal = ({ 
  show, 
  onClose, 
  resource, 
  onTake,
  loading = false,
  canTake = true
}) => {
  const [quantity, setQuantity] = useState(1);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (resource) {
      setQuantity(1);
      setAlert(null);
    }
  }, [resource]);

  const handleQuantityChange = (value) => {
    const newValue = parseInt(value) || 1;
    const max = resource?.amount || 1;
    setQuantity(Math.min(Math.max(1, newValue), max));
  };

  const handleInputChange = (value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
      return;
    }
    handleQuantityChange(numValue);
  };

  const handleSetMax = () => {
    if (resource) {
      setQuantity(resource.amount);
    }
  };

  const handleSetMin = () => {
    setQuantity(1);
  };

  const handleSubmit = async () => {
    if (!resource || !canTake) return;
    
    // Дополнительная проверка для кожи
    if (isLeatherResource(resource.id)) {
      setAlert({
        type: 'danger',
        message: 'Ресурсы кожи не могут быть забраны со склада'
      });
      return;
    }
    
    try {
      // Преобразуем ID ресурса для API
      const resourceIdForApi = getResourceIdForApi(resource.id);
      await onTake(resourceIdForApi, quantity);
    } catch (error) {
      setAlert({
        type: 'danger',
        message: safeToString(error.message || error || 'Ошибка при заборе ресурса')
      });
    }
  };

  if (!resource) return null;

  const canTakeSelectedAmount = quantity <= resource.amount && quantity > 0;
  const isLeather = isLeatherResource(resource.id);

  return (
    <Modal 
      show={show} 
      onHide={onClose}
      backdrop="static"
      centered
      className="fantasy-modal"
    >
      <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
        <Modal.Title className="fantasy-text-gold">
          <i className="fas fa-download me-2"></i>
          Забрать ресурс со склада
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="fantasy-card">
        {alert && (
          <Alert variant={alert.type} className="mb-3">
            <i className={`fas fa-${alert.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
            {safeToString(alert.message)}
          </Alert>
        )}

        <div className="mb-4">
          <h6 className="fantasy-text-gold">
            <i className="fas fa-cube me-2"></i>
            {safeToString(resource.name)}
            {isLeather && (
              <Badge bg="danger" className="ms-2">
                <i className="fas fa-exclamation-triangle me-1"></i>
                Недоступно для забора
              </Badge>
            )}
          </h6>
          <div className="alert alert-info fantasy-alert">
            <i className="fas fa-info-circle me-2"></i>
            Ресурс будет перемещен в ваш инвентарь.
            <br />
            <small>
              ID ресурса: <Badge bg="info">{safeToString(resource.id)}</Badge>
              <br />
              Тип: <Badge bg={getResourceBadgeColor(resource.id)}>
                {safeToString(getResourceTypeDisplay(resource.id))}
              </Badge>
              {isLeather && (
                <>
                  <br />
                  <small className="text-danger">
                    <i className="fas fa-ban me-1"></i>
                    Этот тип ресурса не может быть забран со склада
                  </small>
                </>
              )}
            </small>
          </div>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fantasy-text-dark">Количество для забора</span>
            <span className="fantasy-text-muted">
              доступно: {safeToString(resource.amount)} шт
            </span>
          </div>

          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-center gap-3">
              <span className="fantasy-text-dark">Прямой ввод:</span>
              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleSetMin}
                  disabled={quantity <= 1 || loading || !canTake || isLeather}
                  className="fantasy-btn"
                  title="Установить минимум"
                >
                  Мин
                </Button>

                <InputGroup size="sm" style={{ width: '120px' }}>
                  <Button
                    variant="outline-secondary"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1 || loading || !canTake || isLeather}
                    className="fantasy-btn"
                  >
                    -
                  </Button>
                  <Form.Control
                    type="number"
                    min="1"
                    max={resource.amount}
                    value={quantity}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="text-center fantasy-input"
                    disabled={loading || !canTake || isLeather}
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= resource.amount || loading || !canTake || isLeather}
                    className="fantasy-btn"
                  >
                    +
                  </Button>
                </InputGroup>

                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleSetMax}
                  disabled={quantity >= resource.amount || loading || !canTake || isLeather}
                  className="fantasy-btn"
                  title="Установить максимум"
                >
                  Макс
                </Button>
              </div>
            </div>

            <div className="d-flex align-items-center gap-3">
              <span className="fantasy-text-dark">Ползунок:</span>
              <Form.Range
                min="1"
                max={resource.amount}
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                className="flex-grow-1"
                disabled={loading || !canTake || isLeather}
              />
            </div>

            <div className="d-flex align-items-center gap-3">
              <span className="fantasy-text-dark">Быстрый выбор:</span>
              <div className="d-flex gap-1">
                {[1, 5, 10, 25, 50, 100].map(num => (
                  <Button
                    key={num}
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleQuantityChange(Math.min(num, resource.amount))}
                    disabled={loading || !canTake || isLeather || num > resource.amount}
                    className="fantasy-btn"
                    active={quantity === Math.min(num, resource.amount)}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="d-flex justify-content-between small fantasy-text-muted">
              <span>0</span>
              <span>Забирается: {quantity} из {safeToString(resource.amount)}</span>
              <span>{safeToString(resource.amount)}</span>
            </div>
            <div className="progress" style={{ height: '6px' }}>
              <div 
                className="progress-bar bg-primary" 
                role="progressbar" 
                style={{ width: `${(quantity / resource.amount) * 100}%` }}
                aria-valuenow={quantity}
                aria-valuemin="0"
                aria-valuemax={resource.amount}
              />
            </div>
          </div>
        </div>

        <div className="fantasy-card mb-3">
          <div className="row text-center">
            <div className="col-6">
              <div className="mb-2">
                <div className="fantasy-text-muted">Будет занято в инвентаре:</div>
                <div className="fantasy-text-dark fs-5">
                  {quantity} слот(ов)
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="mb-2">
                <div className="fantasy-text-muted">Будет забрано:</div>
                <div className="fantasy-text-dark fs-5">
                  {quantity} шт
                </div>
              </div>
            </div>
          </div>
        </div>

        {!canTake && (
          <Alert variant="warning" className="fantasy-alert mt-3">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Только офицеры и лидер гильдии могут забирать ресурсы со склада
          </Alert>
        )}

        {isLeather && (
          <Alert variant="danger" className="fantasy-alert mt-3">
            <i className="fas fa-ban me-2"></i>
            Ресурсы кожи (T1-T3) не могут быть забраны со склада
          </Alert>
        )}

        {!canTakeSelectedAmount && canTake && !isLeather && (
          <Alert variant="danger" className="fantasy-alert mt-3">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Невозможно забрать указанное количество!
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between border-top border-secondary">
        <Button 
          variant="secondary" 
          onClick={onClose}
          disabled={loading}
          className="fantasy-btn"
        >
          <i className="fas fa-times me-2"></i>
          Отмена
        </Button>
        <Button 
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || !canTake || !canTakeSelectedAmount || isLeather}
          className="fantasy-btn fantasy-btn-primary"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Забор...
            </>
          ) : (
            <>
              <i className="fas fa-download me-2"></i>
              Забрать {quantity} ресурс(ов)
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const SettlementStorage = observer(() => {
  const { settlement, user, guild } = useContext(Context);
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  const [selectedResource, setSelectedResource] = useState(null);
  const [showTakeModal, setShowTakeModal] = useState(false);
  const [takeLoading, setTakeLoading] = useState(false);
  
  const [storeAllLoading, setStoreAllLoading] = useState(false);
  const [storeHidesLoading, setStoreHidesLoading] = useState(false);
  
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  const [playerInventory, setPlayerInventory] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  
  const showNotification = (type, message) => {
    setNotification({ 
      show: true, 
      type, 
      message: safeToString(message) 
    });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
  };
  
  const fetchInventoryData = async () => {
    setInventoryLoading(true);
    try {
      const response = await GetDataById();
      if (response && response.data) {
        setPlayerData(response.data);
        const inventory = response.data.inventory_new || {};
        setPlayerInventory(inventory);
        console.log('Инвентарь загружен:', inventory);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showNotification('error', 'Ошибка загрузки инвентаря');
    } finally {
      setInventoryLoading(false);
    }
  };
  
  const storageData = useMemo(() => {
    if (!settlement.settlementData) return {};
    
    const data = settlement.settlementData;
    return data.resources || data.storage || {};
  }, [settlement.settlementData]);
  
  const guildId = useMemo(() => {
    return guild.guildData?.id;
  }, [guild.guildData]);
  
  const playerId = useMemo(() => {
    return user.user?.id;
  }, [user.user]);
  
  const playerRole = useMemo(() => {
    if (guild.guildData && guild.guildData.player_role) {
      return guild.guildData.player_role;
    }
    return 'member';
  }, [guild.guildData]);
  
  const canTakeResources = useMemo(() => {
    return playerRole === 'leader' || playerRole === 'officer';
  }, [playerRole]);
  
  const isLeader = useMemo(() => {
    return playerRole === 'leader';
  }, [playerRole]);
  
  const isOfficerOrLeader = useMemo(() => {
    return playerRole === 'officer' || playerRole === 'leader';
  }, [playerRole]);
  
  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      if (settlement.fetchSettlementData && guildId) {
        await settlement.fetchSettlementData(guildId);
      }
      
      await fetchInventoryData();
      
      showNotification('success', 'Данные обновлены');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showNotification('error', 'Ошибка при обновлении данных');
    } finally {
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchInventoryData();
  }, []);
  
  const getPlayerResourcesByType = useMemo(() => {
    console.log('Начинаем обработку инвентаря:', playerInventory);
    
    if (!playerInventory || typeof playerInventory !== 'object' || Object.keys(playerInventory).length === 0) {
      console.log('Инвентарь пуст или не является объектом');
      return { construction: [], hides: [], leatherTier: [], other: [], all: [] };
    }
    
    const resources = [];
    
    Object.entries(playerInventory).forEach(([key, value]) => {
      try {
        if (!value) return;
        
        let resourceId, amount;
        
        if (typeof value === 'object' && value !== null) {
          if ('count' in value) {
            amount = value.count;
            resourceId = key;
          } else if ('amount' in value) {
            amount = value.amount;
            resourceId = key;
          } else if ('quantity' in value) {
            amount = value.quantity;
            resourceId = key;
          } else {
            console.log('Объект без поля количества:', key, value);
            return;
          }
        }
        else if (typeof value === 'number') {
          resourceId = key;
          amount = value;
        }
        else if (typeof value === 'string') {
          resourceId = key;
          amount = parseInt(value);
          if (isNaN(amount)) {
            console.log('Невозможно преобразовать строку в число:', key, value);
            return;
          }
        }
        else {
          console.log('Неподдерживаемый тип данных для ресурса:', key, typeof value, value);
          return;
        }
        
        const numAmount = Number(amount);
        if (!isNaN(numAmount) && numAmount > 0) {
          const id = String(resourceId);
          
          resources.push({
            id: id,
            name: getResourceName(id),
            amount: numAmount,
            type: getResourceTypeDisplay(id),
            inventoryId: key,
            rawData: value
          });
          
          console.log('Добавлен ресурс:', id, getResourceName(id), numAmount, getResourceTypeDisplay(id));
        }
      } catch (error) {
        console.error('Ошибка обработки ресурса:', key, value, error);
      }
    });
    
    console.log('Все обработанные ресурсы:', resources);
    
    const construction = resources.filter(r => r.type === 'Стройматериал');
    const hides = resources.filter(r => r.type === 'Шкура');
    const leatherTier = resources.filter(r => r.type === 'Кожа');
    const other = resources.filter(r => !['Стройматериал', 'Шкура', 'Кожа'].includes(r.type));
    
    console.log('Категоризированные ресурсы:', {
      construction: construction.length,
      hides: hides.length,
      leatherTier: leatherTier.length,
      other: other.length
    });
    
    return { construction, hides, leatherTier, other, all: resources };
  }, [playerInventory]);
  
  const getStorageResourcesByType = useMemo(() => {
    if (!storageData || typeof storageData !== 'object') {
      return { construction: [], hides: [], leatherTier: [], other: [], all: [] };
    }
    
    const resources = Object.entries(storageData)
      .filter(([key, value]) => {
        const amount = Number(value);
        return !isNaN(amount) && amount > 0;
      })
      .map(([key, value]) => {
        const amount = Number(value);
        
        return {
          id: key,
          name: getResourceName(key),
          amount: amount,
          type: getResourceTypeDisplay(key)
        };
      });
    
    const construction = resources.filter(r => r.type === 'Стройматериал');
    const hides = resources.filter(r => r.type === 'Шкура');
    const leatherTier = resources.filter(r => r.type === 'Кожа');
    const other = resources.filter(r => !['Стройматериал', 'Шкура', 'Кожа'].includes(r.type));
    
    return { construction, hides, leatherTier, other, all: resources };
  }, [storageData]);
  
  const storageUsage = useMemo(() => {
    if (!storageData || typeof storageData !== 'object') {
      return { used: 0, capacity: 10000, percentage: 0 };
    }
    
    // Используем только строительные материалы для расчета использования склада
    let used = 0;
    
    Object.entries(storageData).forEach(([key, value]) => {
      if (CONSTRUCTION_CODES.includes(key)) {
        const numVal = Number(value);
        if (!isNaN(numVal)) {
          used += numVal;
        }
      }
    });
    
    const capacity = 10000;
    const percentage = capacity > 0 ? (used / capacity) * 100 : 0;
    
    return { used, capacity, percentage };
  }, [storageData]);
  
  const handleOpenTakeModal = (resource) => {
    if (!canTakeResources) {
      showNotification('warning', 'Только офицеры и лидер гильдии могут забирать ресурсы со склада');
      return;
    }
    
    // Проверяем, является ли ресурс кожей
    if (isLeatherResource(resource.id)) {
      showNotification('warning', 'Ресурсы кожи не могут быть забраны со склада');
      return;
    }
    
    setSelectedResource(resource);
    setShowTakeModal(true);
  };
  
  const handleTakeResource = async (resourceId, quantity) => {
    if (!guildId || !playerId) {
      showNotification('error', 'Не удалось определить ID гильдии или игрока');
      return;
    }
    
    setTakeLoading(true);
    try {
      // Проверяем, является ли resourceId уже преобразованным для API
      const finalResourceId = resourceId;
      
      console.log('Забор ресурса:', {
        guildId,
        playerId,
        resourceId: finalResourceId,
        quantity
      });
      
      const result = await settlementService.takeResource(guildId, playerId, finalResourceId, quantity);
      
      if (result.status === 200) {
        showNotification('success', result.message || 'Ресурс успешно забран');
        
        await refreshAllData();
        
        setShowTakeModal(false);
        setSelectedResource(null);
      } else {
        showNotification('error', result.message || 'Произошла ошибка при взятии ресурса');
      }
    } catch (error) {
      console.error('Error taking resource:', error);
      showNotification('error', error.message || 'Произошла ошибка при взятии ресурса');
    } finally {
      setTakeLoading(false);
    }
  };
  
  const handleStoreAllConstruction = async () => {
    if (!guildId || !playerId) {
      showNotification('error', 'Не удалось определить ID гильдии или игрока');
      return;
    }
    
    const constructionResources = getPlayerResourcesByType.construction;
    if (constructionResources.length === 0) {
      showNotification('info', 'У вас нет строительных материалов для складывания');
      return;
    }
    
    setStoreAllLoading(true);
    try {
      const result = await settlementService.storeAllResources(guildId, playerId, 'construction');
      
      if (result.status === 200) {
        showNotification('success', result.message || 'Строительные материалы успешно сложены на склад');
        
        await refreshAllData();
      } else {
        showNotification('error', result.message || 'Произошла ошибка при складывании материалов');
      }
    } catch (error) {
      console.error('Error storing construction resources:', error);
      showNotification('error', 'Произошла ошибка при складывании материалов');
    } finally {
      setStoreAllLoading(false);
    }
  };
  
  const handleStoreAllHides = async () => {
    if (!guildId || !playerId) {
      showNotification('error', 'Не удалось определить ID гильдии или игрока');
      return;
    }
    
    const hideResources = getPlayerResourcesByType.hides;
    const leatherTierResources = getPlayerResourcesByType.leatherTier;
    const allHideResources = [...hideResources, ...leatherTierResources];
    
    if (allHideResources.length === 0) {
      showNotification('info', 'У вас нет шкур для складывания');
      return;
    }
    
    setStoreHidesLoading(true);
    try {
      const result = await settlementService.storeAllResources(guildId, playerId, 'hides');
      
      if (result.status === 200) {
        showNotification('success', result.message || 'Шкуры успешно сложены на склад');
        
        await refreshAllData();
      } else {
        showNotification('error', result.message || 'Произошла ошибка при складывании шкур');
      }
    } catch (error) {
      console.error('Error storing hides:', error);
      showNotification('error', 'Произошла ошибка при складывании шкур');
    } finally {
      setStoreHidesLoading(false);
    }
  };
  
  const getPlayerHidesCountByTier = (tier) => {
    const allHides = [...getPlayerResourcesByType.hides, ...getPlayerResourcesByType.leatherTier];
    return allHides.reduce((sum, hide) => sum + hide.amount, 0);
  };
  
  const getPlayerConstructionCount = () => {
    return getPlayerResourcesByType.construction.reduce((sum, resource) => sum + resource.amount, 0);
  };
  
  const hasGuildData = useMemo(() => {
    return guild.guildData && guild.guildData.has_guild;
  }, [guild.guildData]);
  
  const hasSettlementData = useMemo(() => {
    return settlement.settlementData;
  }, [settlement.settlementData]);
  
  if (!hasGuildData) {
    return (
      <Container>
        <Card className="fantasy-card">
          <Card.Body className="text-center py-5">
            <i className="fas fa-users fa-3x text-muted mb-3"></i>
            <h5 className="fantasy-text-muted mb-3">Вы не состоите в гильдии</h5>
            <p className="fantasy-text-muted mb-4">
              Для доступа к складу поселения необходимо быть членом гильдии
            </p>
          </Card.Body>
        </Card>
      </Container>
    );
  }
  
  if (!hasSettlementData) {
    return (
      <Container>
        <Card className="fantasy-card">
          <Card.Body className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 fantasy-text-muted">Загрузка данных поселения...</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }
  
  if (inventoryLoading) {
    return (
      <Container>
        <Card className="fantasy-card">
          <Card.Body className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 fantasy-text-muted">Загрузка инвентаря...</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }
  
  return (
    <Container fluid className="castle-storage-container">
      {notification.show && (
        <Alert 
          variant={notification.type === 'success' ? 'success' : 'danger'} 
          className="position-fixed top-0 end-0 m-3" 
          style={{ zIndex: 9999 }}
          dismissible
          onClose={() => setNotification({ show: false, type: '', message: '' })}
        >
          {safeToString(notification.message)}
        </Alert>
      )}
      
      <Card className="fantasy-card mb-4">
        <Card.Header className="fantasy-card-header fantasy-card-header-success">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fantasy-text-gold mb-0">
                <i className="fas fa-warehouse me-2"></i>
                Склад поселения
              </h5>
              <div className="fantasy-text-muted mt-1">
                Использование склада (только стройматериалы): <Badge bg={storageUsage.percentage > 80 ? "danger" : storageUsage.percentage > 60 ? "warning" : "success"}>
                  {storageUsage.used.toLocaleString()} / {storageUsage.capacity.toLocaleString()}
                </Badge>
                {!canTakeResources && (
                  <span className="ms-2 text-warning">
                    <small>(Только чтение)</small>
                  </span>
                )}
                {isOfficerOrLeader && (
                  <Badge bg={isLeader ? "danger" : "warning"} className="ms-2">
                    {safeToString(isLeader ? "Лидер гильдии" : "Офицер гильдии")}
                  </Badge>
                )}
              </div>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-warning" 
                size="sm"
                onClick={() => setDebugMode(!debugMode)}
                className="fantasy-btn"
              >
                <i className="fas fa-bug me-1"></i>
                {debugMode ? 'Скрыть детали' : 'Показать детали'}
              </Button>
              <Button 
                variant="outline-info" 
                size="sm"
                onClick={refreshAllData}
                disabled={refreshing || inventoryLoading}
                className="fantasy-btn"
              >
                {(refreshing || inventoryLoading) ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <i className="fas fa-sync me-1"></i>
                    Обновить
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card.Header>
        
        <Card.Body className="fantasy-card">
          <div className="storage-summary mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Badge bg="info" className="p-2 fantasy-badge">
                {storageUsage.used.toLocaleString()} / {storageUsage.capacity.toLocaleString()}
              </Badge>
            </div>
            <ProgressBar 
              now={storageUsage.percentage} 
              variant={storageUsage.percentage > 80 ? "danger" : storageUsage.percentage > 60 ? "warning" : "success"}
              style={{ height: "10px", borderRadius: "5px" }}
              className="mb-2"
            />
            <div className="d-flex justify-content-between">
              <small className="fantasy-text-muted">
                Использовано: {storageUsage.percentage.toFixed(1)}%
              </small>
              <small className="fantasy-text-muted">
                Свободно: {(storageUsage.capacity - storageUsage.used).toLocaleString()}
              </small>
            </div>
          </div>
          
          <Row className="mb-4">
            <Col md={6} className="mb-3 mb-md-0">
              <Card className="fantasy-card h-100">
                <Card.Body className="text-center">
                  <h6 className="fantasy-text-dark mb-3">
                    <i className="fas fa-boxes me-2"></i>
                    Строительные материалы
                  </h6>
                  <div className="mb-3">
                    <Badge bg="info" className="fantasy-badge p-2 mb-2 d-block">
                      У вас: {getPlayerResourcesByType.construction.length} видов
                    </Badge>
                    <Badge bg="success" className="fantasy-badge p-2 d-block">
                      Всего: {getPlayerConstructionCount()} шт
                    </Badge>
                  </div>
                  <Button 
                    variant="outline-success" 
                    onClick={handleStoreAllConstruction}
                    disabled={storeAllLoading || getPlayerResourcesByType.construction.length === 0 || inventoryLoading}
                    className="fantasy-btn w-100"
                  >
                    {storeAllLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <>
                        <i className="fas fa-upload me-2"></i>
                        Сложить все ресурсы
                      </>
                    )}
                  </Button>
                  {debugMode && (
                    <div className="mt-2">
                      <small className="text-muted d-block">
                        Ресурсы: {getPlayerResourcesByType.construction.map(r => `${safeToString(r.name)}(${r.amount})`).join(', ') || 'нет'}
                      </small>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="fantasy-card h-100">
                <Card.Body className="text-center">
                  <h6 className="fantasy-text-dark mb-3">
                    <i className="fas fa-skin me-2"></i>
                    Шкуры и кожа
                  </h6>
                  <div className="mb-3">
                    <Badge bg="info" className="fantasy-badge p-2 mb-2 d-block">
                      Всего видов: {getPlayerResourcesByType.hides.length + getPlayerResourcesByType.leatherTier.length}
                    </Badge>
                    <Badge bg="success" className="fantasy-badge p-2 d-block">
                      Всего: {getPlayerHidesCountByTier('all') + getPlayerResourcesByType.leatherTier.reduce((sum, r) => sum + r.amount, 0)}
                    </Badge>
                  </div>
                  <Button 
                    variant="outline-warning" 
                    onClick={handleStoreAllHides}
                    disabled={storeHidesLoading || (getPlayerResourcesByType.hides.length === 0 && getPlayerResourcesByType.leatherTier.length === 0) || inventoryLoading}
                    className="fantasy-btn w-100"
                  >
                    {storeHidesLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <>
                        <i className="fas fa-upload me-2"></i>
                        Сложить все шкуры
                      </>
                    )}
                  </Button>
                  {debugMode && (
                    <div className="mt-2">
                      <small className="text-muted d-block">
                        Ресурсы: {[...getPlayerResourcesByType.hides, ...getPlayerResourcesByType.leatherTier].map(r => `${safeToString(r.name)}(${r.amount})`).join(', ') || 'нет'}
                      </small>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="mb-4">
            <Col md={3}>
              <Card className="fantasy-card h-100">
                <Card.Body className="text-center">
                  <div className="fantasy-text-dark fs-4 fw-bold">
                    {getStorageResourcesByType.all.length}
                  </div>
                  <div className="fantasy-text-muted">Всего ресурсов</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="fantasy-card h-100">
                <Card.Body className="text-center">
                  <div className="fantasy-text-dark fs-4 fw-bold">
                    {getStorageResourcesByType.construction.length}
                  </div>
                  <div className="fantasy-text-muted">Стройматериалы</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="fantasy-card h-100">
                <Card.Body className="text-center">
                  <div className="fantasy-text-dark fs-4 fw-bold">
                    {getStorageResourcesByType.hides.length}
                  </div>
                  <div className="fantasy-text-muted">Шкуры</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="fantasy-card h-100">
                <Card.Body className="text-center">
                  <div className="fantasy-text-dark fs-4 fw-bold">
                    {getStorageResourcesByType.leatherTier.length + getStorageResourcesByType.other.length}
                  </div>
                  <div className="fantasy-text-muted">Прочие ресурсы</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {!canTakeResources && (
            <Alert variant="warning" className="fantasy-alert mb-3">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Ваша роль: <Badge bg="secondary">{safeToString(playerRole || 'участник')}</Badge>. 
              Только офицеры и лидер гильдии могут забирать ресурсы со склада.
            </Alert>
          )}
          
          {isOfficerOrLeader && (
            <Alert variant="info" className="fantasy-alert mb-3">
              <i className="fas fa-info-circle me-2"></i>
              Ваша роль: <Badge bg={isLeader ? "danger" : "warning"}>{safeToString(isLeader ? "Лидер гильдии" : "Офицер гильдии")}</Badge>. 
              Вы можете забирать ресурсы со склада.
            </Alert>
          )}
          
          {getStorageResourcesByType.all.length > 0 ? (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fantasy-text-dark mb-0">
                  <i className="fas fa-cubes me-2"></i>
                  Ресурсы на складе ({getStorageResourcesByType.all.length})
                  <small className="ms-2 text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Ресурсы кожи (T1-T3) не могут быть забраны
                  </small>
                </h6>
                <div>
                  <small className="fantasy-text-muted">
                    Сортировка по количеству
                  </small>
                </div>
              </div>
              <div className="table-responsive">
                <Table hover className="fantasy-table">
                  <thead>
                    <tr>
                      <th>Ресурс</th>
                      <th>Тип</th>
                      <th>Количество</th>
                      <th className="text-center">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getStorageResourcesByType.all
                      .sort((a, b) => b.amount - a.amount)
                      .map((resource) => {
                        const resourcePercentage = (resource.amount / storageUsage.used) * 100;
                        const badgeColor = getResourceBadgeColor(resource.id);
                        const isLeather = isLeatherResource(resource.id);
                        const isConstruction = isConstructionResource(resource.id);
                        
                        return (
                          <tr key={resource.id} className="align-middle">
                            <td className="fantasy-text-dark">
                              <div>
                                {safeToString(resource.name)}
                                {isLeather && (
                                  <Badge bg="danger" className="ms-2" size="sm" title="Недоступно для забора">
                                    <i className="fas fa-ban me-1"></i>
                                    Не забирается
                                  </Badge>
                                )}
                                {isConstruction && (
                                  <Badge bg="info" className="ms-2" size="sm" title="Учитывается в использовании склада">
                                    <i className="fas fa-ruler-combined me-1"></i>
                                    Учитывается
                                  </Badge>
                                )}
                              </div>
                              <small className="fantasy-text-muted">ID: {safeToString(resource.id)}</small>
                            </td>
                            <td>
                              <Badge 
                                bg={badgeColor}
                                className="fantasy-badge p-2"
                              >
                                {safeToString(resource.type)}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <Badge bg="secondary" className="fantasy-badge p-2 me-2">
                                  {safeToString(resource.amount.toLocaleString())}
                                </Badge>
                                <div className="flex-grow-1">
                                  {isConstruction ? (
                                    <>
                                      <ProgressBar 
                                        now={resourcePercentage} 
                                        variant="info"
                                        style={{ height: "6px", borderRadius: "3px" }}
                                      />
                                      <small className="fantasy-text-muted d-block mt-1">
                                        {resourcePercentage.toFixed(1)}% от строительных материалов
                                      </small>
                                    </>
                                  ) : (
                                    <small className="fantasy-text-muted d-block mt-1">
                                      <i className="fas fa-info-circle me-1"></i>
                                      Не учитывается в использовании склада
                                    </small>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="text-center">
                              {/* Показываем кнопку только если ресурс НЕ является кожей */}
                              {!isLeather && (
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => handleOpenTakeModal(resource)}
                                  disabled={!canTakeResources}
                                  title={canTakeResources ? "Забрать ресурс" : "Только для офицеров и лидера гильдии"}
                                  className="fantasy-btn"
                                  style={{ minWidth: "100px" }}
                                >
                                  <i className="fas fa-download me-1"></i>
                                  Забрать
                                </Button>
                              )}
                              {/* Для кожи показываем сообщение или оставляем пустым */}
                              {isLeather && (
                                <span className="text-muted" title="Ресурсы кожи не могут быть забраны">
                                  <i className="fas fa-ban me-1"></i>
                                  Недоступно
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
              <p className="fantasy-text-muted">Склад пуст</p>
              {!refreshing && (
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={refreshAllData}
                  className="fantasy-btn mt-2"
                >
                  <i className="fas fa-sync me-1"></i>
                  Обновить
                </Button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
      
      <TakeResourceModal
        show={showTakeModal}
        onClose={() => {
          setShowTakeModal(false);
          setSelectedResource(null);
        }}
        resource={selectedResource}
        onTake={handleTakeResource}
        loading={takeLoading}
        canTake={canTakeResources}
      />
    </Container>
  );
});

export default SettlementStorage;