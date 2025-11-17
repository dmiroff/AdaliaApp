// src/components/InventoryItem.js
import { useState, useContext} from "react";
import { Row, Col, Image, Dropdown, DropdownButton} from "react-bootstrap";
import exampleImage from "../assets/Images/WIP.webp";
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ROUTE } from "../utils/constants";
import { Context } from "../index";
import {WearDataById, ThrowItemById, SellItemById} from "../http/SupportFunctions";
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
    onShowModal(response.message);
  };

  const handleWear = async () => {
    const response = await WearDataById(devicekey);
    const player_data = response.data;
    user.setPlayerInventory(player_data.inventory_new);
    user.setPlayer(player_data);
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
            keyboard={false} centered
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
            keyboard={false} centered
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
            <div>
              <span>{formatItemName()}</span>
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