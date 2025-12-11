// src/components/InventoryItem.js
import { useState, useContext, useMemo, useEffect } from "react";
import { Row, Col, Image, Dropdown, DropdownButton } from "react-bootstrap";
import exampleImage from "../assets/Images/WIP.webp";
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ROUTE } from "../utils/constants";
import { Context } from "../index";
import { WearDataById, ThrowItemById, SellItemById } from "../http/SupportFunctions";
import ModalAction from "./ModalAction";
import "./InventoryItem.css";

const InventoryItem = ({ devicekey, device, onShowModal }) => {
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
  const itemId = parseInt(devicekey);

  // Отладочная информация для понимания структуры данных
  useEffect(() => {
    
    // Проверяем все слоты экипировки в player_data
    const equipmentSlots = [
      'head', 'right_hand', 'left_hand', 'breast_armor', 'cloak',
      'ring_1', 'ring_2', 'ring_3', 'ring_4', 'ring_5',
      'gloves', 'necklace', 'leg_armor', 'boots', 'secondary_weapon',
      'belt', 'arm_armor'
    ];
    
    equipmentSlots.forEach(slot => {
      const slotData = user.player_data?.[slot];
      if (slotData && slotData.id) {
      }
    });
  }, [itemId, device, user.player_data]);

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
          // Преобразуем id в число для сравнения
          let id;
          if (typeof slotItem.id === 'string') {
            id = parseInt(slotItem.id);
          } else if (typeof slotItem.id === 'number') {
            id = slotItem.id;
          } else {
            continue; // Пропускаем невалидный id
          }
          
          if (!isNaN(id)) {
            equippedIds.add(id);
          }
        }
      }
    }

    return equippedIds;
  }, [user.player_data]);

  // Проверяем, надет ли текущий предмет
  const isEquipped = useMemo(() => {
    const equipped = getEquippedItemIds.has(itemId);
    return equipped;
  }, [getEquippedItemIds, itemId, device.name]);

  // Проверяем, можно ли продать/выбросить предмет
  const canTransfer = useMemo(() => {
    // Если предмет не надет, можно продать/выбросить любое количество
    if (!isEquipped) return true;
    
    // Если предмет надет, проверяем количество
    const inventoryCount = device.count || 0;
    
    // Если у нас есть только один экземпляр и он надет - нельзя продать
    if (inventoryCount <= 1) {
      return false;
    }
    
    // Если есть несколько экземпляров, можно продать те, что не надеты
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

  const handleInspect = () => {
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

  const handleWear = async () => {
    const response = await WearDataById(devicekey);
    const player_data = response.data;
    user.setPlayerInventory(player_data.inventory_new);
    user.setPlayer_data(player_data);
    onShowModal(response.message);
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
          className="inventory-item-container"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ position: 'relative' }}
        >
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
              objectFit: 'cover'
            }}
          />
          
          {/* Галочка для надетых предметов */}
          {isEquipped && (
            <div 
              className="equipped-badge"
              title="Предмет надет"
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
                <Dropdown.Item onClick={handleInspect}>осмотреть</Dropdown.Item>
                {device.is_equippable && (<Dropdown.Item onClick={handleWear}>надеть</Dropdown.Item>)}
                <Dropdown.Item 
                  onClick={handleModalSell}
                  className={!canTransfer ? 'disabled' : ''}
                  style={!canTransfer ? { 
                    opacity: 0.5, 
                    cursor: 'not-allowed',
                    color: '#999'
                  } : {}}
                >
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
      >
        <div>
          {/* Применяем форматирование названия и количества */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ marginRight: '8px' }}>{formatItemName()}</span>
            {isEquipped && (
              <span 
                className="badge bg-success"
                style={{ 
                  fontSize: '10px',
                  padding: '2px 6px',
                  marginRight: '4px',
                  backgroundColor: '#28a745 !important'
                }}
                title="Предмет надет"
              >
                надет
              </span>
            )}
            {!canTransfer && isEquipped && (
              <span 
                className="badge bg-warning"
                style={{ 
                  fontSize: '10px',
                  padding: '2px 6px',
                  backgroundColor: '#ffc107 !important',
                  color: '#212529 !important'
                }}
                title="Нельзя продать/выбросить единственный надетый экземпляр"
              >
                заблокирован
              </span>
            )}
          </div>
          <div style={{ marginTop: "4px" }}>
            <span>{device.value} 🌕</span>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default InventoryItem;