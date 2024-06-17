import React, { useState, useEffect, useContext } from "react";
import { Col, Container, Dropdown, DropdownButton, Row, Button, Card, CardDeck, Modal } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import GetDataById from "../http/GetData";
import {UnwearDataById} from "../http/SupportFunctions"; // Import UnwearDataById function
import exampleImage from "../assets/Images/empty_slot.jpeg";
import { Spinner } from "react-bootstrap";
import { Context } from "../index";
import bodyImage from "../assets/Images/CharacterBody.jpg"; // Import your character body image
import "./Equipment.css";

const Equipment = () => {
  const { user } = useContext(Context);
  const [equippedItems, setEquippedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [toNavigate, setToNavigate] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [delay, setDelay] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null); // State to store the selected slot

  const equipmentSlots = [
    "head",
    "right_hand",
    "left_hand",
    "breast_armor",
    "cloak",
    "ring_1",
    "ring_2",
    "ring_3",
    "ring_4",
    "ring_5",
    "gloves",
    "necklace",
    "leg_armor",
    "boots",
    "secondary_weapon",
    "belt",
    "arm_armor",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await GetDataById(user.user.id);
        setEquippedItems(data.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.user.id]);

  // Function to close the modal
  const handleModalClose = () => setShowModal(false);

  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        handleModalClose();
      }, 1000);

      // Clear the timer if the component is unmounted
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  useEffect(() => {
    if (equippedItems) {
      setTimeout(() => {
        setDelay(true);
      }, 1000); // Delay time of 2 seconds
    }
  }, [equippedItems]);

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
  };

  const handleUnwear = async () => {
    try {
      if (user.player_data[selectedSlot]){
        const response = await UnwearDataById(user.user.id, user.player_data[selectedSlot].id);
        if (response.status){
          setToNavigate(true);
          const message = response.message;
          const player_data = response.data;
          user.setPlayerInventory(player_data.inventory_new); // Update the state with fetched data
          user.setPlayer(player_data); // Set player data
         setModalMessage(message);
        };
        setShowModal(true);
        setSelectedSlot(null);
    }
    {
      const message = "Нельзя снять то, чего не надето";
      setSelectedSlot(null);
      setModalMessage(message);
      setShowModal(true);
    }
    } catch (err) {
      console.error(err);
    }
  };

  if (!delay) {
    return (
      <div className="d-flex justify-content-center align-items-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="character-body-container" style={{ position: 'relative' }}>
        <img src={bodyImage} alt="Character Body" className="character-body" />
        {equipmentSlots.map((slot) => {
          return (
            <div key={slot} className={`equipment-slot ${slot}`} style={{ position: 'absolute' }} onClick={() => handleSlotClick(slot)}>
              {equippedItems[slot] ? (
                <>
                  <img src={equippedItems[slot].Image ? `/assets/Images/${equippedItems[slot].Image.split("Images/")[1]}` : exampleImage} alt={equippedItems[slot].name} className="equipment-item" style={{ position: 'absolute', width: '10vw', height: '10vh' }} />
                  {selectedSlot && (
                    <DropdownButton
                      title="Действия"
                      show={selectedSlot}
                      onClick={(e) => e.stopPropagation()}
                      variant="dark"
                      id="inventory-item-dropdown"
                      style={{
                        position: "absolute",
                        zIndex: 1,
                      }}
                    >
                      <Dropdown.Item variant="danger" onClick={handleUnwear}>Снять</Dropdown.Item>
                    </DropdownButton>
                  )}
                </>
              ) : (
                <img src={exampleImage} alt="Empty slot" className="equipment-item" style={{ position: 'absolute', width: '1vw', height: '1vh' }} />
              )}
            </div>
          );
        })}
      </Row>
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
    </Container>
  );
};

export default Equipment;
