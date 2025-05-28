// src/components/InventoryItem.js
import React, { useState, useContext, useEffect} from "react";
import { Container, Row, Card, Col, Image, Dropdown, DropdownButton, Modal, Button } from "react-bootstrap";
import exampleImage from "../assets/Images/WIP.png";
import coinIcon from "../assets/Images/coin.jpeg";
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ROUTE } from "../utils/constants";
import { Form } from "react-bootstrap";
import { Context } from "../index";
import {WearDataById, ThrowItemById, SellItemById} from "../http/SupportFunctions";

const InventoryItem = ({ devicekey, device }) => {
  const { user } = useContext(Context);
  const imageSrc = device.image
  ? `../assets/Images/${device.image.replace(/^.*?Images\//i, '')}`
  : exampleImage;
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showModalSell, setShowModalSell] = useState(false);
  const [showModalDrop, setShowModalDrop] = useState(false);
  const [toNavigate, setToNavigate] = useState(false);
  const [rangeValue, setRangeValue] = useState(1);

  const handleMouseEnter = () => {
    setShowDetails(true);
    setShowMenu(!showMenu);
  };

  const handleMouseLeave = () => {
    setShowDetails(false);
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

  const handleInspect = () => {
    navigate(INVENTORY_ROUTE + "/" + devicekey);
  };

  const handleSell = async () => {
    const user_id = user.user.id;
    const response = await SellItemById(user_id, devicekey, rangeValue);
    const player_data = response.data;
    const message = response.message;
    user.setPlayerInventory(player_data.inventory_new); // Update the state with fetched data
    user.setPlayer(player_data); // Set player data
    if (response.status){setToNavigate(true);};

    setModalMessage(message);
    setShowModal(true);
  };
  
  const handleThrowAway = async () => {
    const user_id = user.user.id;
    const response = await ThrowItemById(user_id, devicekey, rangeValue);
    const player_data = response.data;
    const message = response.message;
    user.setPlayerInventory(player_data.inventory_new); // Update the state with fetched data
    user.setPlayer(player_data); // Set player data
    if (response.status){setToNavigate(true);};

    setModalMessage(message);
    setShowModal(true);
  };

  const handleWear = async () => {
    const user_id = user.user.id;
    const response = await WearDataById(user_id, devicekey);
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
      }, 1000);

      // Clear the timer if the component is unmounted
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  if (toNavigate) {
    const timer = setTimeout(() => {
      navigate("/prepare"); // Navigate to prepare to update item lists
  }, 1000);
  }

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
              {/* {showDetails && ( */}
              {/*   <div */}
              {/*     style={{ */}
              {/*       position: "absolute", */}
              {/*       bottom: 0, */}
              {/*       left: 0, */}
              {/*       right: 0, */}
              {/*       padding: "0.5rem", */}
              {/*       background: "rgba(0, 0, 0, 0.5)", */}
              {/*       color: "#fff", */}
              {/*       display: "flex", */}
              {/*       justifyContent: "flex-end", */}
              {/*       alignItems: "center", */}
              {/*     }} */}
              {/*   > */}
              {/*     <div style={{ display: "flex", alignItems: "center" }}> */}
              {/*       <div style={{ marginRight: "0.05rem" }}>{device.value}</div> */}
              {/*       <Image src={coinIcon} width={20} height={20} /> */}
              {/*     </div> */}
              {/*   </div> */}
              {/* )} */}
            </div>
            {/* {showDetails && ( */}
            {/*   <div */}
            {/*     style={{ */}
            {/*       position: "absolute", */}
            {/*       top: 0, */}
            {/*       left: 0, */}
            {/*       right: 0, */}
            {/*       padding: "0.5rem", */}
            {/*       background: "rgba(0, 0, 0, 0.5)", */}
            {/*       color: "#fff", */}
            {/*     }} */}
            {/*   > */}
            {/*     {device.name} */}
            {/*   </div> */}
            {/* )} */}
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
                <Dropdown.Item onClick={handleWear}>надеть</Dropdown.Item>
                <Dropdown.Item onClick={handleModalSell}>продать</Dropdown.Item>
                <Dropdown.Item onClick={handleModalDrop}>выкинуть</Dropdown.Item>
              </DropdownButton>
            )}
            {/* <Form.Range */}
            {/*   min={1} */}
            {/*   max={device.count} */}
            {/*   value={rangeValue} */}
            {/*   onChange={(e) => setRangeValue(e.target.value)} */}
            {/* /> */}
            {/* <label */}
            {/*   htmlFor="custom-range" */}
            {/*   className="form-label" */}
            {/*   style={{ */}
            {/*     position: "absolute", */}
            {/*     bottom: "0.75rem", */}
            {/*     left: "0.5rem", */}
            {/*     background: "#fff", */}
            {/*     padding: "0 0.25rem", */}
            {/*   }} */}
            {/* > */}
            {/*   {rangeValue} */}
            {/* </label> */}
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

         {/* ---------------------------- Modal sell start ------------------------------------------------ */}
          <Modal show={showModalSell} onHide={handleModalSellClose} backdrop="static" keyboard={false} centered>
            <Modal.Header closeButton>
              <Modal.Title>Продать предмет</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ whiteSpace: 'pre-wrap' }}>
              <Form.Range
                min={1}
                max={device.count}
                value={rangeValue}
                onChange={(e) => setRangeValue(e.target.value)}
              />
              <label
                htmlFor="custom-range"
                className="form-label"
                style={{
                  position: "absolute",
                  bottom: "0.75rem",
                  left: "0.5rem",
                  background: "#fff",
                  padding: "0 0.25rem",
                }}
              >
                {rangeValue}
              </label>

            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={handleSell}>
                Продать
              </Button>

              <Button variant="secondary" onClick={handleModalSellClose}>
                Закрыть
              </Button>
            </Modal.Footer>
          </Modal>
         {/* ---------------------------- Modal sell end ------------------------------------------------ */}

         {/* ---------------------------- Modal drop start ------------------------------------------------ */}
          <Modal show={showModalDrop} onHide={handleModalDropClose} backdrop="static" keyboard={false} centered>
            <Modal.Header closeButton>
              <Modal.Title>Выбросить предмет</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ whiteSpace: 'pre-wrap' }}>
              <Form.Range
                min={1}
                max={device.count}
                value={rangeValue}
                onChange={(e) => setRangeValue(e.target.value)}
              />
              <label
                htmlFor="custom-range"
                className="form-label"
                style={{
                  position: "absolute",
                  bottom: "0.75rem",
                  left: "0.5rem",
                  background: "#fff",
                  padding: "0 0.25rem",
                }}
              >
                {rangeValue}
              </label>

            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={handleThrowAway}>
                Выбросить
              </Button>

              <Button variant="secondary" onClick={handleModalDropClose}>
                Закрыть
              </Button>
            </Modal.Footer>
          </Modal>
         {/* ---------------------------- Modal drop end ------------------------------------------------ */}

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
