import { observer } from "mobx-react-lite";
import { useContext, useEffect, useState } from "react";
import InventoryItem from "./InventoryItem";
import {Row, Col, Form, Modal, Button} from "react-bootstrap";
import TypeBar from "../components/TypeBar";
import { Context } from "../index";
import GetDataById from "../http/GetData";
import { Spinner } from "react-bootstrap";
import Fuse from "fuse.js"

const InventoryList = observer(() => {
  const { user } = useContext(Context);
  const { selected_type } = user;
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delay, setDelay] = useState(false);
  const [query, setQuery] = useState("");
  const [user_inventory, setUserInventory] = useState(user.inventory_new);
  
  // Добавляем состояния для модального окна
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const fetchPlayer = async () => {
      const playerData = await GetDataById();
      setPlayerData(playerData.data);
      user.setPlayerInventory(playerData.data.inventory_new);
      setUserInventory(playerData.data.inventory_new);
      user.setPlayer(playerData.data);
      setLoading(false);
    };

    fetchPlayer();
  }, [user]);
 
  useEffect(() => {
    if (playerData) {
      setTimeout(() => {
        setDelay(true);
      }, 1000); // Delay time of 2 seconds
    }
  }, [playerData]);

  // Функция для показа модального окна
  const handleShowModal = (message) => {
    setModalMessage(message);
    setShowModal(true);
    
    // Автоматическое закрытие через 3 секунды
    setTimeout(() => {
      setShowModal(false);
    }, 3000);
  };

  // Функция для закрытия модального окна
  const handleCloseModal = () => setShowModal(false);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!playerData) {
    return <div>Error: Player data not found</div>;
  }

  const filteredItemsWithKeys = Object.entries(user.inventory_new).filter(
    ([key, item]) => item.type === selected_type
  );

  const itemObjects = filteredItemsWithKeys.map(([id, data]) => ({ id, ...data }));

  const fuse = new Fuse(itemObjects, {
    keys: ["name"],
    includeScore: true,
    threshold: 0.3 
  });
  
  const results = query ? fuse.search(query).map(result => result.item) : itemObjects;

  if (!Object.keys(user.inventory_new).length) {
    return <div>Вот инвентарь пустой, он предмет простой</div>;
  }

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
    <>
      <Row className="d-flex">
        <Row md="auto" xs={2} lg="auto" className="p-2">
          <Col>
            <TypeBar></TypeBar>
          </Col>
          <Col>
            <Form.Control
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Название предмета..."
              className="w-full p-2 border rounded-lg mb-4"
            />
          </Col>
        </Row>
        {results.map((item, index) => (
          <InventoryItem 
            key={item.id} 
            devicekey={item.id} 
            device={item} 
            onShowModal={handleShowModal} // Передаем функцию для показа модалки
          />
        ))}
      </Row>
      
      {/* Модальное окно в родительском компоненте */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static" keyboard={false} centered>
        <Modal.Header closeButton>
          <Modal.Title>Оповещение</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ whiteSpace: 'pre-wrap' }}>{modalMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
});

export default InventoryList;
