// src/components/InventoryItem.js
import { useState, useContext, useMemo } from "react";
import { Row, Col, Image, Dropdown, DropdownButton } from "react-bootstrap";
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
      
      // Определяем редкость ТОЛЬКО по наличию маркеров в названии
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
          // Если нет маркеров - обычная
          return {
              color: '#757575',
              name: 'обычная',
              badge: 'secondary'
          };
      }
  }, [device.name]); // Только зависимость от названия

  // Функция для получения списка ID надетых предметов из player_data
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

  const handleMouseEnter = () => {
    setShowMenu(true);
  };

  const handleMouseLeave = () => {
    setShowMenu(false);
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
    navigate(INVENTORY_ROUTE + "/" + devicekey);
  };

  // Упрощенный обработчик чекбокса
  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggleSelect) {
      onToggleSelect(itemId);
    }
  };

  // Обработчик клика по контейнеру
  const handleContainerClick = (e) => {
    // Пропускаем клики по чекбоксу
    if (e.target.type === 'checkbox' || 
        e.target.closest('.inventory-item-checkbox')) {
      return;
    }
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
    <Row xs={3} className="mb-2">
      <Col xs={3} md={2}>
        <div 
          className={`inventory-item-container ${isSelected ? 'selected' : ''}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleContainerClick}
          style={{ position: 'relative', padding: '2px' }}
        >
          {/* Чекбокс для выбора предмета */}
          {onToggleSelect && (
            <div 
              className="inventory-item-checkbox"
              style={{
                position: 'absolute',
                top: '5px',
                left: '5px',
                zIndex: 1000,
                backgroundColor: 'rgba(244, 228, 188, 0.9)',
                borderRadius: '4px',
                padding: '2px',
                border: '2px solid #8b7355',
                cursor: 'pointer'
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
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  margin: 0,
                  accentColor: '#28a745',
                  transform: 'scale(1.2)'
                }}
              />
            </div>
          )}
          
          <Image 
            src={imageSrc}
            className="list-images"
            fluid
            loading="lazy"
            onError={(e) => {
              e.target.src = exampleImage;
            }}
            style={{
              aspectRatio: '1/1',
              objectFit: 'cover',
              borderRadius: '6px'
            }}
          />
          {/* Отображение уровня предмета (если есть) */}
          {shouldShowLevel && (
          <div 
            className="item-level-badge"
            style={{
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              width: '24px',
              height: '24px',
              backgroundColor: getRarityColor.color,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '2px solid white',
              zIndex: 100
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
                top: '5px',
                right: '5px',
                width: '20px',
                height: '20px',
                backgroundColor: 'rgba(46, 204, 113, 0.9)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                zIndex: 100
              }}
            >
              ✓
            </div>
          )}
          
          {showMenu && (
            <div className="inventory-item-menu-wrapper">
              <DropdownButton
                show={showMenu}
                onClick={(e) => e.stopPropagation()}
                variant="dark"
                title=""
                id="inventory-item-fantasy-dropdown"
                className="inventory-item-dropdown-right"
              >
                <Dropdown.Item onClick={handleInspect}>
                  <i className="fas fa-search me-2"></i>
                  осмотреть
                </Dropdown.Item>
                {device.is_equippable && (
                  <Dropdown.Item onClick={handleWear}>
                    <i className="fas fa-tshirt me-2"></i>
                    надеть
                  </Dropdown.Item>
                )}
                <Dropdown.Item 
                  onClick={handleModalSell}
                  className={!canTransfer ? 'disabled' : ''}
                  style={!canTransfer ? { 
                    opacity: 0.5, 
                    cursor: 'not-allowed',
                    color: '#999'
                  } : {}}
                >
                  <i className="fas fa-coins me-2"></i>
                  продать
                </Dropdown.Item>
                <Dropdown.Item 
                  onClick={handleModalDrop}
                  className={!canTransfer ? 'disabled' : ''}
                  style={!canTransfer ? { 
                    opacity: 0.5, 
                    cursor: 'not-allowed',
                    color: '#999'
                  } : {}}
                >
                  <i className="fas fa-trash me-2"></i>
                  выкинуть
                </Dropdown.Item>
              </DropdownButton>
            </div>
          )}
        </div>
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

      </Col>
      <Col 
        xs={9} 
        lg={true} 
        style={{ fontSize: "0.9rem" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleContainerClick}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ 
              marginRight: '8px', 
              fontWeight: '600',
              color: isSelected ? '#28a745' : '#3e2723'
            }}>
              {formatItemName()}
            </span>
            {/* Бейдж редкости */}
            {device.rarity > 1 && (
              <span 
                className="badge"
                style={{ 
                  fontSize: '9px',
                  padding: '2px 6px',
                  marginRight: '4px',
                  backgroundColor: `${getRarityColor.color} !important`,
                  color: device.rarity >= 4 ? '#212529' : 'white',
                  border: `1px solid ${getRarityColor.color}`
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
                  fontSize: '9px',
                  padding: '2px 6px',
                  marginRight: '4px',
                  backgroundColor: '#28a745 !important',
                  border: '1px solid #1e7e34'
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
                  fontSize: '9px',
                  padding: '2px 6px',
                  backgroundColor: '#ffc107 !important',
                  color: '#212529 !important',
                  border: '1px solid #e0a800'
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
                  fontSize: '9px',
                  padding: '2px 6px',
                  backgroundColor: '#17a2b8 !important',
                  border: '1px solid #138496'
                }}
                title="Предмет выбран"
              >
                <i className="fas fa-check me-1"></i>
                выбран
              </span>
            )}
          </div>
          <div style={{ marginTop: "8px" }}>
            <span style={{ color: '#ffd700', fontWeight: '700', fontSize: '1rem' }}>
              <i className="fas fa-coins me-1"></i>
              {device.value} 🌕
            </span>
          </div>
          {device.description && (
            <div style={{ marginTop: "4px", fontSize: "0.8rem", color: '#666' }}>
              <small>{device.description.substring(0, 50)}...</small>
            </div>
          )}
        </div>
      </Col>
    </Row>
  );
};

export default InventoryItem;