import { observer } from "mobx-react-lite";
import { useContext, useEffect, useState } from "react";
import InventoryItem from "./InventoryItem";
import { Row, Col, Form, Modal, Button } from "react-bootstrap";
import TypeBar from "../components/TypeBar";
import { Context } from "../index";
import GetDataById from "../http/GetData";
import { Spinner } from "react-bootstrap";
import '../App.css';
import Fuse from "fuse.js"

const InventoryList = observer(() => {
  const { user } = useContext(Context);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [user_inventory, setUserInventory] = useState({});
  
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Безопасное получение selected_type
  const selected_type = user.selected_type !== undefined ? user.selected_type : null;

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true);
        const playerData = await GetDataById();
        
        if (playerData && playerData.data) {
          setPlayerData(playerData.data);
          
          // Защищенная установка инвентаря
          const safeInventory = playerData.data.inventory_new || {};
          user.setPlayerInventory(safeInventory);
          setUserInventory(safeInventory);
          user.setPlayer(playerData.data);
        }
      } catch (error) {
        console.error("Error fetching player data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [user]);
 
  const handleShowModal = (message) => {
    setModalMessage(message);
    setShowModal(true);
    setTimeout(() => {
      setShowModal(false);
    }, 3000);
  };

  const handleCloseModal = () => setShowModal(false);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center fantasy-paper p-4">
        <Spinner animation="border" role="status" className="fantasy-text-primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!playerData) {
    return (
      <div className="fantasy-paper p-4 text-center">
        <div className="fantasy-text-danger">Error: Player data not found</div>
      </div>
    );
  }

  // ЗАЩИЩЕННАЯ ФИЛЬТРАЦИЯ
  const inventory = user_inventory || {};
  
  const filteredItemsWithKeys = Object.entries(inventory).filter(
    ([key, item]) => {
      // Проверяем что item существует и имеет тип
      if (!item || typeof item !== 'object') return false;
      
      // Если тип не выбран, показываем все предметы
      if (selected_type === null || selected_type === undefined) {
        return true;
      }
      // Иначе фильтруем по выбранному типу
      return item.type === selected_type;
    }
  );

  const itemObjects = filteredItemsWithKeys.map(([id, data]) => ({ 
    id, 
    ...(data || {}) // Защита от undefined data
  }));

  // Защищенный Fuse.js
  let results = itemObjects;
  try {
    const fuse = new Fuse(itemObjects, {
      keys: ["name"],
      includeScore: true,
      threshold: 0.3 
    });
    
    results = query ? fuse.search(query).map(result => result.item) : itemObjects;
  } catch (error) {
    console.error("Fuse.js error:", error);
    // В случае ошибки Fuse.js используем простую фильтрацию
    if (query) {
      results = itemObjects.filter(item => 
        item.name && item.name.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  if (!Object.keys(inventory).length) {
    return (
      <div className="fantasy-paper p-4 text-center">
        <div className="fantasy-text-muted">Вот инвентарь пустой, он предмет простой</div>
      </div>
    );
  }

  return (
    <div className="fantasy-paper content-overlay">
      {/* Поиск сверху */}
      <Row className="inventory-search-row mb-3">
        <Col>
          <Form className="fantasy-form">
            <Form.Control
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Название предмета..."
              className="inventory-search-input"
            />
          </Form>
        </Col>
      </Row>

      {/* Фильтр по типам */}
      <Row className="inventory-filter-row mb-3">
        <Col xs="auto">
          <TypeBar />
        </Col>
      </Row>

      {/* Список предметов */}
      <Row className="inventory-items-container">
        {results.map((item) => (
          <InventoryItem 
            key={item.id} 
            devicekey={item.id} 
            device={item} 
            onShowModal={handleShowModal}
          />
        ))}
      </Row>
      
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static" keyboard={false} centered className="fantasy-modal">
        <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
          <Modal.Title className="fantasy-text-gold">Оповещение</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ whiteSpace: 'pre-wrap' }} className="fantasy-text-dark">
          {modalMessage}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            onClick={handleCloseModal}
            className="fantasy-btn fantasy-btn-secondary"
          >
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

export default InventoryList;