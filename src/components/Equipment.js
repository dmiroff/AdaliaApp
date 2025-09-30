import { useState, useEffect, useContext } from "react";
import { Container, Dropdown, Row, Button, Card, Modal } from "react-bootstrap";
import GetDataById from "../http/GetData";
import { UnwearDataById } from "../http/SupportFunctions";
import { Spinner } from "react-bootstrap";
import { Context } from "../index";
import bodyImage from "../assets/Images/kukla.webp";
import "./Equipment.css";

const Equipment = () => {
  const { user } = useContext(Context);
  const [equippedItems, setEquippedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [toNavigate, setToNavigate] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState(null);

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
  }, [user.user.id, user.player_data]);

  const handleModalClose = () => setShowModal(false);

  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        handleModalClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  const handleUnwear = async () => {
    try {
      if (user.player_data[hoveredSlot]) {
        const response = await UnwearDataById(user.player_data[hoveredSlot].id);
        if (response.status) {
          setToNavigate(true);
          const message = response.message;
          const player_data = response.data;
          user.setPlayerInventory(player_data.inventory_new);
          user.setPlayer(player_data);
          setModalMessage(message);
        }
        setShowModal(true);
      } else {
        setModalMessage("Нельзя снять то, чего не надето");
        setShowModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center fantasy-paper p-4">
        <Spinner animation="border" role="status" className="fantasy-text-primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container className="mt-4">
      <Card className="fantasy-paper">
        <Card.Header className="fantasy-card-header fantasy-card-header-primary">
          <h3 className="fantasy-text-gold mb-0">Экипировка персонажа</h3>
        </Card.Header>
        <Card.Body>
          <Row className="character-body-container" style={{ position: 'relative' }}>
            <div className="inventory-container">
              <div className="character-silhouette">
                <img src={bodyImage} alt="Character" className="silhouette-img" />
                {equipmentSlots.map((slot) => (
                  <div
                    key={slot}
                    className={`equipment-slot ${slot}`}
                    style={{ position: 'absolute' }}
                    onMouseEnter={() => setHoveredSlot(slot)}
                    onMouseLeave={() => setHoveredSlot(null)}
                  >
                    {equippedItems[slot]?.id ? (
                      <>
                        {equippedItems[slot].Image ? (
                          <img
                            src={`/assets/Images/${equippedItems[slot].Image.split("Images/")[1]}`}
                            alt={equippedItems[slot].name}
                            className="equipment-item"
                            style={{ position: 'absolute', width: '10vw', height: '10vh' }}
                          />
                        ) : (
                          <div className="empty-slot" />
                        )}
                        {hoveredSlot === slot && (
                          <Dropdown>
                            <Dropdown.Toggle 
                              className="fantasy-btn fantasy-btn-danger fantasy-btn-sm"
                              style={{
                                position: "absolute",
                                zIndex: 1,
                                top: "0",
                                left: "0",
                                minWidth: "120px"
                              }}
                            >
                              Действия
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="fantasy-dropdown-menu">
                              <Dropdown.Item 
                                onClick={handleUnwear}
                                className="fantasy-text-dark"
                              >
                                Снять
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        )}
                      </>
                    ) : (
                      <div className="empty-slot fantasy-text-muted">
                        {hoveredSlot === slot && "Пусто"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Row>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleModalClose} backdrop="static" keyboard={false} className="fantasy-modal">
        <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
          <Modal.Title className="fantasy-text-gold">Оповещение</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ whiteSpace: 'pre-wrap' }} className="fantasy-text-dark">
          {modalMessage}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleModalClose}
            className="fantasy-btn fantasy-btn-secondary"
          >
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Equipment;