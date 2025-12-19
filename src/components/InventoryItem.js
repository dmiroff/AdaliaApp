// src/components/InventoryItem.js (ваш оригинальный код с минимальными изменениями)
import { useState, useContext, useMemo } from "react";
import { Row, Col, Image } from "react-bootstrap";
import exampleImage from "../assets/Images/WIP.webp";
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ROUTE } from "../utils/constants";
import { Context } from "../index";
import { WearDataById, ThrowItemById, SellItemById } from "../http/SupportFunctions";
import ModalAction from "./ModalAction";
import "./InventoryItem.css";

const InventoryItem = ({ 
  devicekey, 
  device, 
  onShowModal, 
  isSelected = false, 
  onToggleSelect = null 
}) => {
  const { user } = useContext(Context);
  const imageSrc = device.image
    ? `../assets/Images/${device.image.replace(/^.*?Images\//i, '')}`
    : exampleImage;
  const [showMenu, setShowMenu] = useState(false);
  const [showModalSell, setShowModalSell] = useState(false);
  const [showModalDrop, setShowModalDrop] = useState(false);
  const [handleRequest, setHandleRequest] = useState(false);
  const navigate = useNavigate();

  // Получаем ID предмета как число
  const itemId = devicekey;

  const shouldShowLevel = useMemo(() => {
    if (device.level === undefined || device.level === null) return false;
    const levelNum = Number(device.level);
    return !isNaN(levelNum) && levelNum > 0;
  }, [device.level]);

  // Функция для получения цвета редкости
  const getRarityColor = useMemo(() => {
    const name = device.name?.toLowerCase() || '';
    
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
  }, [device.name]);

  // Функция для получения списка ID надетых предметов
  const getEquippedItemIds = useMemo(() => {
    const equippedIds = new Set();
    
    if (user.player_data) {
      const equipmentSlots = [
        'head', 'right_hand', 'left_hand', 'breast_armor', 'cloak',
        'ring_1', 'ring_2', 'ring_3', 'ring_4', 'ring_5',
        'gloves', 'necklace', 'leg_armor', 'boots', 'secondary_weapon',
        'belt', 'arm_armor'
      ];
      
      for (const slot of equipmentSlots) {
        const slotItem = user.player_data[slot];
        
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
    }

    return equippedIds;
  }, [user.player_data]);

  // Проверяем, надет ли текущий предмет
  const isEquipped = useMemo(() => {
    return getEquippedItemIds.has(itemId);
  }, [getEquippedItemIds, itemId]);

  // Проверяем, можно ли продать/выбросить предмет
  const canTransfer = useMemo(() => {
    if (!isEquipped) return true;
    
    const inventoryCount = device.count || 0;
    if (inventoryCount <= 1) {
      return false;
    }
    
    return true;
  }, [isEquipped, device.count]);

  // Вычисляем максимальное количество для продажи/выбрасывания
  const maxTransferAmount = useMemo(() => {
    if (isEquipped) {
      return Math.max(0, (device.count || 0) - 1);
    }
    return device.count || 0;
  }, [isEquipped, device.count]);

  // Обработчик наведения на текстовую часть
  const handleTextMouseEnter = () => {
    setShowMenu(true);
  };

  const handleTextMouseLeave = () => {
    setShowMenu(false);
  };

  // Обработчик клика на текстовую часть (для мобильных устройств)
  const handleTextClick = (e) => {
    // На мобильных устройствах клик по тексту показывает/скрывает меню
    if (window.innerWidth <= 768) {
      setShowMenu(!showMenu);
    }
  };

  const handleModalSell = (event) => {
    event.stopPropagation();
    if (canTransfer) {
      setShowModalSell(true);
    }
  };

  const handleModalDrop = (event) => {
    event.stopPropagation();
    if (canTransfer) {
      setShowModalDrop(true);
    }
  };

  const handleInspect = (event) => {
    event.stopPropagation();
    setShowMenu(false);
    navigate(INVENTORY_ROUTE + "/" + devicekey);
  };

  const handleSell = async (value) => {
    setHandleRequest(true);
    const response = await SellItemById(devicekey, value);
    const player_data = response.data;
    user.setPlayerInventory(player_data.inventory_new);
    user.setPlayer_data(player_data);
    setShowModalSell(false);
    setHandleRequest(false);
    onShowModal(response.message);
  };
  
  const handleThrowAway = async (value) => {
    setHandleRequest(true);
    const response = await ThrowItemById(devicekey, value);
    const player_data = response.data;
    user.setPlayerInventory(player_data.inventory_new);
    user.setPlayer_data(player_data);
    setShowModalDrop(false);
    setHandleRequest(false);
    onShowModal(response.message);
  };

  const handleWear = async (event) => {
    event.stopPropagation();
    setShowMenu(false);
    try {
      const response = await WearDataById(devicekey);

      if (response.status === 200 && response.data) {
        const playerData = response.data;
        const message = response.message || 'Предмет надет';
        
        if (playerData.inventory_new !== undefined) {
          if (typeof user.setPlayerInventory === 'function') {
            user.setPlayerInventory(playerData.inventory_new);
          }
        }
        
        if (typeof user.setUser === 'function') {
          user.setUser(playerData);
        } else if (typeof user.updateUser === 'function') {
          user.updateUser(playerData);
        } else if (typeof user.setPlayerData === 'function') {
          user.setPlayerData(playerData);
        } else if (typeof user.setPlayer === 'function') {
          user.setPlayer(playerData);
        }
        
        onShowModal(message);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error in handleWear:', error);
      onShowModal('Ошибка при надевании предмета');
    }
  };

  const handleModalSellClose = () => setShowModalSell(false);
  const handleModalDropClose = () => setShowModalDrop(false);

  const formatItemName = () => {
    if (device.count > 1) {
      return `${device.count} ${device.name}`;
    }
    return device.name;
  };

  return (
    <Row className="mb-3 align-items-center">
      <Col xs={4} md={3} lg={2} className="ps-0 ps-md-2">
        <div 
          className={`inventory-item-image-container ${isSelected ? 'selected' : ''}`}
          onClick={(e) => {
            if (onToggleSelect) {
              e.stopPropagation();
              onToggleSelect(itemId);
            }
          }}
          style={{ 
            position: 'relative',
            backgroundColor: 'rgba(244, 228, 188, 0.8)',
            borderRadius: '10px',
            boxShadow: isSelected ? '0 0 0 3px rgba(40, 167, 69, 0.3)' : '0 2px 5px rgba(0, 0, 0, 0.1)',
            border: `2px solid ${isSelected ? '#28a745' : '#c19a6b'}`,
            cursor: onToggleSelect ? 'pointer' : 'default',
            overflow: 'hidden',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          {/* Чекбокс для выбора предмета */}
          {onToggleSelect && (
            <div 
              className="inventory-item-checkbox"
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                zIndex: 100,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '6px',
                padding: '3px',
                border: `2px solid ${isSelected ? '#28a745' : '#8b7355'}`,
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect(itemId);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  margin: 0,
                  accentColor: '#28a745'
                }}
              />
            </div>
          )}
          
          {/* Изображение предмета - ПРОСТОЕ РЕШЕНИЕ */}
          <Image 
            src={imageSrc}
            className="list-images item-image"
            fluid
            loading="lazy"
            onError={(e) => {
              e.target.src = exampleImage;
            }}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '100%',
              objectFit: 'contain',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '8px'
            }}
          />
          
          {/* Отображение уровня предмета */}
          {shouldShowLevel && (
            <div 
              className="item-level-badge"
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                width: '24px',
                height: '24px',
                backgroundColor: getRarityColor.color,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                border: '2px solid white',
                zIndex: 100,
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)'
              }}
              title={`Уровень ${device.level}`}
            >
              {device.level}
            </div>
          )}
          
          {/* Галочка для надетых предметов */}
          {isEquipped && (
            <div 
              className="equipped-badge"
              title="Предмет надет"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '20px',
                height: '20px',
                backgroundColor: 'rgba(46, 204, 113, 0.95)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 100,
                border: '2px solid white',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)'
              }}
            >
              ✓
            </div>
          )}
        </div>
      </Col>
      
      {/* Колонка с информацией */}
      <Col 
        xs={8} 
        md={9} 
        lg={true} 
        className="pe-0 pe-md-2 text-info-container"
        style={{ 
          fontSize: "0.9rem", 
          cursor: 'pointer',
          position: 'relative',
          paddingTop: '5px',
          paddingBottom: '5px'
        }}
        onMouseEnter={handleTextMouseEnter}
        onMouseLeave={handleTextMouseLeave}
        onClick={handleTextClick}
      >
        {/* Меню появляется в правом верхнем углу текстового блока */}
        {showMenu && (
          <div 
            className="inventory-item-menu-wrapper"
            onMouseEnter={() => setShowMenu(true)}
            onMouseLeave={() => setShowMenu(false)}
          >
            <div style={{ padding: '2px 0' }}>
              <button 
                className="dropdown-item-custom"
                onClick={handleInspect}
              >
                <i className="fas fa-search me-2"></i>
                осмотреть
              </button>
              
              {device.is_equippable && (
                <button 
                  className="dropdown-item-custom"
                  onClick={handleWear}
                >
                  <i className="fas fa-tshirt me-2"></i>
                  надеть
                </button>
              )}
              
              <button 
                className="dropdown-item-custom"
                onClick={handleModalSell}
                disabled={!canTransfer}
              >
                <i className="fas fa-coins me-2"></i>
                продать
              </button>
              
              <button 
                className="dropdown-item-custom"
                onClick={handleModalDrop}
                disabled={!canTransfer}
              >
                <i className="fas fa-trash me-2"></i>
                выкинуть
              </button>
            </div>
          </div>
        )}
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
            <span style={{ 
              marginRight: '8px', 
              fontWeight: '600',
              color: isSelected ? '#28a745' : '#3e2723',
              fontSize: '1rem',
              lineHeight: '1.2'
            }}>
              {formatItemName()}
            </span>
            {/* Бейдж редкости */}
            {device.rarity > 1 && (
              <span 
                className="badge"
                style={{ 
                  fontSize: '10px',
                  padding: '3px 8px',
                  marginRight: '4px',
                  backgroundColor: `${getRarityColor.color} !important`,
                  color: device.rarity >= 4 ? '#212529' : 'white',
                  border: `1px solid ${getRarityColor.color}`,
                  borderRadius: '12px'
                }}
                title={getRarityColor.name}
              >
                {getRarityColor.name}
              </span>
            )}
            {isEquipped && (
              <span 
                className="badge bg-success"
                style={{ 
                  fontSize: '10px',
                  padding: '3px 8px',
                  marginRight: '4px',
                  backgroundColor: '#28a745 !important',
                  border: '1px solid #1e7e34',
                  borderRadius: '12px'
                }}
                title="Предмет надет"
              >
                <i className="fas fa-check-circle me-1"></i>
                надет
              </span>
            )}
            {!canTransfer && isEquipped && (
              <span 
                className="badge bg-warning"
                style={{ 
                  fontSize: '10px',
                  padding: '3px 8px',
                  backgroundColor: '#ffc107 !important',
                  color: '#212529 !important',
                  border: '1px solid #e0a800',
                  borderRadius: '12px'
                }}
                title="Нельзя продать/выбросить единственный надетый экземпляр"
              >
                <i className="fas fa-lock me-1"></i>
                заблокирован
              </span>
            )}
            {isSelected && (
              <span 
                className="badge bg-info"
                style={{ 
                  fontSize: '10px',
                  padding: '3px 8px',
                  backgroundColor: '#17a2b8 !important',
                  border: '1px solid #138496',
                  borderRadius: '12px'
                }}
                title="Предмет выбран"
              >
                <i className="fas fa-check me-1"></i>
                выбран
              </span>
            )}
          </div>
          
          <div style={{ marginBottom: "8px" }}>
            <span style={{ color: '#ffd700', fontWeight: '700', fontSize: '1.1rem' }}>
              <i className="fas fa-coins me-1"></i>
              {device.value} 🌕
            </span>
          </div>
          
          {device.description && (
            <div style={{ 
              marginTop: "4px", 
              fontSize: "0.85rem", 
              color: '#666',
              lineHeight: '1.3',
              display: '-webkit-box',
              WebkitLineClamp: '2',
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {device.description}
            </div>
          )}
        </div>
      </Col>
      
      {/* Модальные окна */}
      <ModalAction
        show={showModalSell} 
        onClose={handleModalSellClose} 
        device={device}
        devicekey={devicekey}
        action={handleSell}
        handleRequest={handleRequest}
        title="Продать предмет"
        actionButtonText="Продать"
        maxAmount={maxTransferAmount}
        backdrop="static" 
        keyboard={false} 
        centered
      />

      <ModalAction
        show={showModalDrop} 
        onClose={handleModalDropClose} 
        device={device}
        devicekey={devicekey}
        action={handleThrowAway}
        handleRequest={handleRequest}
        title="Выбросить предмет"
        actionButtonText="Выбросить"
        maxAmount={maxTransferAmount}
        backdrop="static" 
        keyboard={false} 
        centered
      />
    </Row>
  );
};

export default InventoryItem;