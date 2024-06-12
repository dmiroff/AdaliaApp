// src/components/InventoryItem.js
import React, { useState, useContext, useEffect} from "react";
import { Card, Col, Image, Dropdown, DropdownButton, Modal, Button } from "react-bootstrap";
import exampleImage from "../assets/Images/WIP.png";
import coinIcon from "../assets/Images/coin.jpeg";
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ROUTE } from "../utils/constants";
import { Form } from "react-bootstrap";
import { Context } from "../index";
import {WearDataById, ThrowItemById} from "../http/SupportFunctions";

const InventoryItem = ({ devicekey, device }) => {
  const { user } = useContext(Context);
  const imageSrc = device.image ? `/assets/Images/${device.image.split("Images/")[1]}` : exampleImage;
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toNavigate, setToNavigate] = useState(false);
  const [rangeValue, setRangeValue] = useState(1);

  const handleMouseEnter = () => {
    setShowDetails(true);
  };

  const handleMouseLeave = () => {
    setShowDetails(false);
  };

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleInspect = () => {
    navigate(INVENTORY_ROUTE + "/" + devicekey);
  };
  const handleSell = () => {
    console.log("sell");
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
    <Col xs={3} md={2} className="mb-3">
      <Card
        style={{ cursor: "pointer", position: "relative" }}
        border="dark"
        className="h-100"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{ position: "relative" }}>
          <Image src={imageSrc} fluid className="mb-2" onClick={handleMenuClick} />
          {showDetails && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "0.5rem",
                background: "rgba(0, 0, 0, 0.5)",
                color: "#fff",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ marginRight: "0.05rem" }}>{device.value}</div>
                <Image src={coinIcon} width={20} height={20} />
              </div>
            </div>
          )}
        </div>
        {showDetails && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              padding: "0.5rem",
              background: "rgba(0, 0, 0, 0.5)",
              color: "#fff",
            }}
          >
            {device.name}
          </div>
        )}
        {showMenu && (
          <DropdownButton
            show={showMenu}
            onClick={(e) => e.stopPropagation()}
            variant="dark"
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
            <Dropdown.Item onClick={handleSell}>продать</Dropdown.Item>
            <Dropdown.Item onClick={handleThrowAway}>выкинуть</Dropdown.Item>
          </DropdownButton>
        )}
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
      </Card>
      <Modal show={showModal} onHide={handleModalClose} backdrop="static" keyboard={false}>
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
    </Col>
  );
};

export default InventoryItem;