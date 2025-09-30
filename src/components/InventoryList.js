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
  const { selected_type } = user;
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [user_inventory, setUserInventory] = useState(user.inventory_new);
  
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
    return (
      <div className="fantasy-paper p-4 text-center">
        <div className="fantasy-text-muted">Вот инвентарь пустой, он предмет простой</div>
      </div>
    );
  }

  return (
    <div className="fantasy-paper content-overlay">
      <Row className="d-flex">
        <Row md="auto" xs={2} lg="auto" className="p-2">
          <Col>
            <TypeBar />
          </Col>
          <Col>
            <Form className="fantasy-form">
              <Form.Control
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Название предмета..."
                className="w-100"
              />
            </Form>
          </Col>
        </Row>
        {results.map((item, index) => (
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