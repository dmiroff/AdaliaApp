// src/components/InventoryItem.js
import React, { useState, useContext, useEffect} from "react";
import { Row, Card, Col, Image, Dropdown, DropdownButton, Modal, Button } from "react-bootstrap";
import exampleImage from "../assets/Images/WIP.png";
import coinIcon from "../assets/Images/coin.jpeg";
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ROUTE } from "../utils/constants";
import { Form } from "react-bootstrap";
import { Context } from "../index";
import {WearDataById, ThrowItemById, SellItemById} from "../http/SupportFunctions";
import ModalAction from "./ModalAction"

const InventoryItem = ({ devicekey, device }) => {
  const { user } = useContext(Context);
  const imageSrc = device.image
  ? `../assets/Images/${device.image.replace(/^.*?Images\//i, '')}`
  : exampleImage;
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showModalSell, setShowModalSell] = useState(false);
  const [showModalDrop, setShowModalDrop] = useState(false);
  const [toNavigate, setToNavigate] = useState(false);
  const [handleRequest, setHandleRequest] = useState(false);
  const [rangeValue, setRangeValue] = useState(1);

  const handleMouseEnter = () => {
    setShowMenu(!showMenu);
  };

  const handleMouseLeave = () => {
    setShowMenu(!showMenu);
  };

  const handleMenuClick = (event) => {
    event.stopPropagation();
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
    const user_id = user.user.id;
    const response = await SellItemById(devicekey, value);
    const player_data = response.data;
    const message = response.message;
    user.setPlayerInventory(player_data.inventory_new); // Update the state with fetched data
    user.setPlayer(player_data); // Set player data
    if (response.status){setToNavigate(true);};
    setShowModalSell(!showModalSell);
    setHandleRequest(false);

    setModalMessage(message);
    setShowModal(true);
  };
  
  const handleThrowAway = async (value) => {
    setHandleRequest(true);
    setRangeValue(value)
    const user_id = user.user.id;
    const response = await ThrowItemById(devicekey, value);
    const player_data = response.data;
    const message = response.message;
    user.setPlayerInventory(player_data.inventory_new); // Update the state with fetched data
    user.setPlayer(player_data); // Set player data
    if (response.status){setToNavigate(true);};
    setShowModalDrop(!showModalDrop);
    setHandleRequest(false);

    setModalMessage(message);
    setShowModal(true);
  };

  const handleWear = async () => {
    const user_id = user.user.id;
    const response = await WearDataById(devicekey);
    const player_data = response.data;
    const message = response.message;
    user.setPlayerInventory(player_data.inventory_new); // Update the state with fetched data
    user.setPlayer(player_data); // Set player data

    setModalMessage(message);
    setShowModal(true);
  };

  // Function to close the modal
  const handleModalClose = () => setShowModal(false);
  const handleModalSellClose = () => setShowModalSell(false);
  const handleModalDropClose = () => setShowModalDrop(false);

  // Automatically close the modal after 3 seconds
  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        handleModalClose();
      }, 3000);

      // Clear the timer if the component is unmounted
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  return (
      <Row xs={3} className="mb-2">
        <Col 
          xs={3} 
          md={1} 
          // className="mb-4" 
          className="h-100"

        >
          <Card 
            style={{ cursor: "pointer", position: "relative", justifyContent: 'center', alignItems: 'center' }}
            border="white"
            align="center"
            className="h-100"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div style={{ position: "relative" }}>
              <Image src={imageSrc}
                fluid
                className="mb-1"
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
            </div>
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
                  left: "50%",
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
          </Card>
          <Modal show={showModal} onHide={handleModalClose} backdrop="static" keyboard={false} centered>
            <Modal.Header closeButton>
              <Modal.Title>Оповещение</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ whiteSpace: 'pre-wrap' }}>{modalMessage}</Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleModalClose}>
                Закрыть
              </Button>
            </Modal.Footer>
          </Modal>

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
