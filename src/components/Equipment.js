import { useState, useEffect, useContext } from "react";
import { Alert, Container, Row, Button, Modal, Offcanvas } from "react-bootstrap";
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
  const [selectedSlot, setSelectedSlot] = useState(null);

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
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  const handleUnwear = async (slot) => {
    try {
      const equippedItem = equippedItems[slot];
      if (isValidItem(equippedItem)) {
        const response = await UnwearDataById(equippedItem.id);
        if (response.status) {
          const message = response.message;
          const player_data = response.data;
          user.setPlayerInventory(player_data.inventory_new);
          user.setPlayer(player_data);
          setEquippedItems(player_data);
          setModalMessage(message);
        }
        setSelectedSlot(null);
        setShowModal(true);
      } else {
        setModalMessage("Нельзя снять то, чего не надето");
        setShowModal(true);
      }
    } catch (err) {
      console.error(err);
      setSelectedSlot(null);
      setModalMessage("Не удалось снять предмет. Обновите данные и попробуйте ещё раз.");
      setShowModal(true);
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

  const selectedItem = selectedSlot ? equippedItems[selectedSlot] : null;

  if (loading) {
    return (
      <div className="equipment-layout__loading" role="status">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка снаряжения...</span>
        </Spinner>
        <span>Загружаем снаряжение…</span>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">Не удалось загрузить снаряжение. Обновите страницу.</Alert>;
  }
  
  return (
    <Container className="equipment-layout mt-3">
      <Row className="equipment-layout__row">
        <div className="equipment-layout__frame">
          <div className="equipment-layout__canvas">
            <img src={bodyImage} alt="Силуэт персонажа" className="equipment-layout__image" />
            {equipmentSlots.map((slot) => {
              const item = equippedItems[slot];
              const itemIsValid = isValidItem(item);
              const hasImage = hasValidImage(item);
              const imagePath = hasImage ? getImagePath(item.Image) : null;

              return (
                <button
                  key={slot}
                  type="button"
                  className={`equipment-layout__slot equipment-slot ${slot}`}
                  onClick={() => itemIsValid && setSelectedSlot(slot)}
                  disabled={!itemIsValid}
                  aria-label={itemIsValid ? `${item.name || 'Предмет'} — открыть действия` : undefined}
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
                    </>
                  ) : (
                    <div className="empty-slot" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Row>
      <Offcanvas
        show={Boolean(selectedSlot && isValidItem(selectedItem))}
        onHide={() => setSelectedSlot(null)}
        placement="bottom"
        className="equipment-action-sheet"
        aria-labelledby="equipment-action-title"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title id="equipment-action-title">
            {selectedItem?.name || "Предмет снаряжения"}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <p className="equipment-action-sheet__hint">Предмет останется в инвентаре персонажа.</p>
          <Button
            variant="danger"
            className="equipment-action-sheet__button"
            onClick={() => handleUnwear(selectedSlot)}
          >
            Снять предмет
          </Button>
        </Offcanvas.Body>
      </Offcanvas>
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
