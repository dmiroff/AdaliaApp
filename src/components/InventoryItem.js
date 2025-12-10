// src/components/InventoryItem.js
import { useState, useContext, useEffect } from "react";
import { Row, Col, Image, Dropdown, DropdownButton, Badge } from "react-bootstrap";
import exampleImage from "../assets/Images/WIP.webp";
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ROUTE } from "../utils/constants";
import { Context } from "../index";
import { WearDataById, ThrowItemById, SellItemById, UnwearDataById } from "../http/SupportFunctions";
import ModalAction from "./ModalAction";
import "./InventoryItem.css";

const InventoryItem = ({ devicekey, device, onShowModal, onItemUpdate }) => {
  const { user } = useContext(Context);
  const imageSrc = device.image
    ? `../assets/Images/${device.image.replace(/^.*?Images\//i, '')}`
    : exampleImage;
  const [showMenu, setShowMenu] = useState(false);
  const [showModalSell, setShowModalSell] = useState(false);
  const [showModalDrop, setShowModalDrop] = useState(false);
  const [handleRequest, setHandleRequest] = useState(false);
  const [itemCount, setItemCount] = useState(device.count || 1);
  const [isEquipped, setIsEquipped] = useState(false);
  const navigate = useNavigate();

  // Следим за изменениями количества предмета
  useEffect(() => {
    setItemCount(device.count || 1);
  }, [device.count]);

  // Функция для проверки, надет ли предмет (сравниваем ID предмета с ID в слотах экипировки)
  const checkIfEquipped = () => {
    if (!user.player || !device.id) {
      setIsEquipped(false);
      return false;
    }
    
    const equipmentSlots = [
      "head", "right_hand", "left_hand", "breast_armor", "cloak", 
      "ring_1", "ring_2", "ring_3", "ring_4", "ring_5", 
      "gloves", "necklace", "leg_armor", "boots", "secondary_weapon", 
      "belt", "arm_armor"
    ];
    
    // Проверяем все слоты экипировки
    let equipped = false;
    equipmentSlots.forEach(slot => {
      const slotItem = user.player[slot];
      // Сравниваем ID предмета с ID в слоте (приводим к числам для безопасности)
      if (slotItem && parseInt(slotItem.id) === parseInt(device.id)) {
        equipped = true;
      }
    });
    
    setIsEquipped(equipped);
    return equipped;
  };

  // Проверяем статус экипировки при монтировании и при изменении player
  useEffect(() => {
    checkIfEquipped();
  }, [user.player, device.id]);

  const handleMouseEnter = () => {
    setShowMenu(true);
  };

  const handleMouseLeave = () => {
    setShowMenu(false);
  };

  const handleModalSell = (event) => {
    event.stopPropagation();
    setShowModalSell(!showModalSell);
  };

  const handleModalDrop = (event) => {
    event.stopPropagation();
    setShowModalDrop(!showModalDrop);
  };

  const handleInspect = () => {
    navigate(INVENTORY_ROUTE + "/" + devicekey);
  };
  
  const handleSell = async (value) => {
    setHandleRequest(true);
    const response = await SellItemById(devicekey, value);
    const player_data = response.data;
    user.setPlayerInventory(player_data.inventory_new);
    user.setPlayer(player_data);
    setShowModalSell(false);
    setHandleRequest(false);
    
    // Проверяем, остался ли предмет в инвентаре после продажи
    const itemStillExists = player_data.inventory_new && 
                           player_data.inventory_new[devicekey] && 
                           player_data.inventory_new[devicekey].count > 0;
    
    if (!itemStillExists && onItemUpdate) {
      onItemUpdate(devicekey, null);
    }
    
    onShowModal(response.message);
  };
  
  const handleThrowAway = async (value) => {
    setHandleRequest(true);
    const response = await ThrowItemById(devicekey, value);
    const player_data = response.data;
    user.setPlayerInventory(player_data.inventory_new);
    user.setPlayer(player_data);
    setShowModalDrop(false);
    setHandleRequest(false);
    
    // Проверяем, остался ли предмет в инвентаре после выбрасывания
    const itemStillExists = player_data.inventory_new && 
                           player_data.inventory_new[devicekey] && 
                           player_data.inventory_new[devicekey].count > 0;
    
    if (!itemStillExists && onItemUpdate) {
      onItemUpdate(devicekey, null);
    } else if (itemStillExists && onItemUpdate) {
      onItemUpdate(devicekey, player_data.inventory_new[devicekey]);
    }
    
    onShowModal(response.message);
  };

  const handleWear = async () => {
    const response = await WearDataById(devicekey);
    const player_data = response.data;
    user.setPlayerInventory(player_data.inventory_new);
    user.setPlayer(player_data);
    
    // Принудительно обновляем статус экипировки
    setTimeout(() => {
      checkIfEquipped();
    }, 100);
    
    onShowModal(response.message);
  };

  const handleUnwear = async () => {
    const response = await UnwearDataById(devicekey);
    const player_data = response.data;
    user.setPlayerInventory(player_data.inventory_new);
    user.setPlayer(player_data);
    
    // Принудительно обновляем статус экипировки
    setTimeout(() => {
      checkIfEquipped();
    }, 100);
    
    onShowModal(response.message);
  };

  const handleModalSellClose = () => setShowModalSell(false);
  const handleModalDropClose = () => setShowModalDrop(false);

  const formatItemName = () => {
    if (itemCount > 1) {
      return `${itemCount} ${device.name}`;
    }
    return device.name;
  };

  // Функция для рендеринга кнопки экипировки/снятия
  const renderEquipButton = () => {
    if (!device.is_equippable) return null;

    if (isEquipped) {
      return <Dropdown.Item onClick={handleUnwear}>снять</Dropdown.Item>;
    } else {
      return <Dropdown.Item onClick={handleWear}>надеть</Dropdown.Item>;
    }
  };

  // Если количество предмета равно 0, не отображаем его
  if (itemCount <= 0) {
    return null;
  }

  return (
    <Row xs={3} className="mb-2">
      <Col xs={3} md={2}>
        <div 
          className="inventory-item-container"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="position-relative">
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
            {/* Бейдж "Надето" */}
            {isEquipped && (
              <Badge 
                bg="success" 
                className="position-absolute top-0 start-0 m-1 equipped-badge"
              >
                Надето
              </Badge>
            )}
            {/* Бейдж количества, если больше 1 */}
            {itemCount > 1 && (
              <Badge 
                bg="primary" 
                className="position-absolute bottom-0 end-0 m-1 count-badge"
              >
                {itemCount}
              </Badge>
            )}
          </div>
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
                {renderEquipButton()}
                <Dropdown.Item onClick={handleModalSell}>продать</Dropdown.Item>
                <Dropdown.Item onClick={handleModalDrop}>выкинуть</Dropdown.Item>
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
          <div>
            <span>{formatItemName()}</span>
            {isEquipped && (
              <Badge bg="success" className="ms-2">Надето</Badge>
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