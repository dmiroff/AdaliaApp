// src/components/InventoryItem.js
import { useState, useContext} from "react";
import { Row, Col, Image, Dropdown, DropdownButton} from "react-bootstrap";
import exampleImage from "../assets/Images/WIP.webp";
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ROUTE } from "../utils/constants";
import { Context } from "../index";
import {WearDataById, ThrowItemById, SellItemById} from "../http/SupportFunctions";
import ModalAction from "./ModalAction"

const InventoryItem = ({ devicekey, device, onShowModal }) => {
  const { user } = useContext(Context);
  const imageSrc = device.image
    ? `../assets/Images/${device.image.replace(/^.*?Images\//i, '')}`
    : exampleImage;
  const [showMenu, setShowMenu] = useState(false);
  const [showModalSell, setShowModalSell] = useState(false);
  const [showModalDrop, setShowModalDrop] = useState(false);
  const [toNavigate, setToNavigate] = useState(false);
  const [handleRequest, setHandleRequest] = useState(false);
  const [rangeValue, setRangeValue] = useState(1);
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    setShowMenu(!showMenu);
  };

  const handleMouseLeave = () => {
    setShowMenu(!showMenu);
  };

  const handleModalSell = (event) => {
    event.stopPropagation();
    setShowModalSell(!showModalSell);
  };

  const handleModalDrop = (event) => {
    event.stopPropagation();
    setShowModalDrop(!showModalDrop);
  };

  const toggleHandleRequest = () => {
    setHandleRequest(!handleRequest);
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
    if (response.status) { setToNavigate(true); }
    setShowModalSell(false);
    setHandleRequest(false);

    // Используем переданную функцию вместо локального состояния
    onShowModal(response.message);
  };
  
  const handleThrowAway = async (value) => {
    setHandleRequest(true);
    setRangeValue(value);
    const response = await ThrowItemById(devicekey, value);
    const player_data = response.data;
    user.setPlayerInventory(player_data.inventory_new);
    user.setPlayer(player_data);
    if (response.status) { setToNavigate(true); }
    setShowModalDrop(false);
    setHandleRequest(false);

    // Используем переданную функцию вместо локального состояния
    onShowModal(response.message);
  };

  const handleWear = async () => {
    const response = await WearDataById(devicekey);
    const player_data = response.data;
    user.setPlayerInventory(player_data.inventory_new);
    user.setPlayer(player_data);

    // Используем переданную функцию вместо локального состояния
    onShowModal(response.message);
  };

  // Function to close the modal
  const handleModalSellClose = () => setShowModalSell(false);
  const handleModalDropClose = () => setShowModalDrop(false);

  return (
      <Row xs={3} className="mb-2">
        <Col 
          xs={3} 
          md={2}
        >
        <div 
          style={{ cursor: "pointer", position: "relative", justifyContent: 'center', alignItems: 'center' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
              <Image src={imageSrc}
                className="list-images"
                fluid
                loading="lazy"
                onError={(e) => {
                  e.target.src = exampleImage; // Fallback
                  console.error('Image load failed:', imageSrc); // Debugging
                }}
                style={{
                  aspectRatio: '1/1',
                  objectFit: 'cover'
                }}
              />
            {showMenu && (
              <DropdownButton
                show={showMenu}
                onClick={(e) => e.stopPropagation()}
                variant="dark"
                title=""
                id="inventory-item-dropdown"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "100%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 1,
                }}
              >
                <Dropdown.Item onClick={handleInspect}>осмотреть</Dropdown.Item>
                {device.is_equippable && (<Dropdown.Item onClick={handleWear}>надеть</Dropdown.Item>)}
                <Dropdown.Item onClick={handleModalSell}>продать</Dropdown.Item>
                <Dropdown.Item onClick={handleModalDrop}>выкинуть</Dropdown.Item>
              </DropdownButton>
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
        <Col xs={9} lg={true} style={{ fontSize: "0.9rem"}}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {device.name}
            <br />
            Кол-во: {device.count}
            <br />
            Цена: {device.value}
          </div>
        </Col>
      </Row>
  );
};

export default InventoryItem;
