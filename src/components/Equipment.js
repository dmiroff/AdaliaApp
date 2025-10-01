import { useState, useEffect, useContext } from "react";
import { Container, Dropdown, DropdownButton, Row, Button, Modal } from "react-bootstrap";
import GetDataById from "../http/GetData";
import { UnwearDataById } from "../http/SupportFunctions";
import { Spinner } from "react-bootstrap";
import { Context } from "../index";
import bodyImage from "../assets/Images/kukla.webp";
import "./Equipment.css";

const Equipment = () => {
  const { user } = useContext(Context);
  const [equippedItems, setEquippedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState(null);

  const equipmentSlots = [
    "head", "right_hand", "left_hand", "breast_armor", "cloak", 
    "ring_1", "ring_2", "ring_3", "ring_4", "ring_5", 
    "gloves", "necklace", "leg_armor", "boots", "secondary_weapon", 
    "belt", "arm_armor"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await GetDataById(user.user.id);
        setEquippedItems(data.data || {});
      } catch (err) {
        console.error("Ошибка загрузки экипировки:", err);
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

  const handleUnwear = async (slot) => {
    try {
      if (user.player_data[slot]) {
        const response = await UnwearDataById(user.player_data[slot].id);
        if (response.status) {
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

  // Улучшенная функция для получения пути к изображению
  const getImagePath = (imagePath) => {
    if (!imagePath || imagePath === "" || imagePath === "null") {
      return null;
    }
    
    // Если путь содержит только имя файла
    if (imagePath.includes('.') && !imagePath.includes('/')) {
      const path = `/assets/Images/${imagePath}`;
      return path;
    }
    
    // Если путь содержит папку Images/
    if (imagePath.includes('Images/')) {
      const fileName = imagePath.split('Images/')[1];
      const path = `/assets/Images/${fileName}`.replace(/\.(png|jpg|jpeg)$/, '.webp');
      return path;
    }
    return null;
  };

  // Функция для проверки, есть ли изображение у предмета
  const hasValidImage = (item) => {
    if (!item || !item.Image) return false;
    return item.Image !== "" && item.Image !== "null";
  };

  // Улучшенная проверка на валидный предмет (включая id = 0)
  const isValidItem = (item) => {
    return item && item.id !== undefined && item.id !== null;
  };

  if (loading) {
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
      <Row className="character-body-container">
        <div className="inventory-container">
          <div className="character-silhouette">
            <img src={bodyImage} alt="Character" className="silhouette-img" />
            {equipmentSlots.map((slot) => {
              const item = equippedItems[slot];
              const itemIsValid = isValidItem(item);
              const hasImage = hasValidImage(item);
              const imagePath = hasImage ? getImagePath(item.Image) : null;

              return (
                <div
                  key={slot}
                  className={`equipment-slot ${slot}`}
                  onMouseEnter={() => setHoveredSlot(slot)}
                  onMouseLeave={() => setHoveredSlot(null)}
                >
                  {itemIsValid ? (
                    <>
                      {hasImage && imagePath ? (
                        <img
                          src={imagePath}
                          alt={item.name || 'Item'}
                          className="equipment-item"
                          onError={(e) => {
                            console.error(`Ошибка загрузки изображения: ${imagePath}`);
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div 
                          className="empty-slot-with-text" 
                          title={item.name || `Предмет #${item.id}`}
                        >
                          <span className="item-text">
                            {item.name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                      {hoveredSlot === slot && (
                        <DropdownButton
                          title="Действия"
                          show={true}
                          onClick={(e) => e.stopPropagation()}
                          variant="dark"
                          id="inventory-item-dropdown"
                          className="equipment-dropdown"
                        >
                          <Dropdown.Item 
                            variant="danger" 
                            onClick={() => handleUnwear(slot)}
                          >
                            Снять
                          </Dropdown.Item>
                        </DropdownButton>
                      )}
                    </>
                  ) : (
                    <div className="empty-slot" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
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