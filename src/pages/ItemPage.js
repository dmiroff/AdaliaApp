import React, { useState, useEffect, useContext } from "react";
import { Col, Container, Image, Row, Button, Modal } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { GetItemById } from "../http/GetData";
import { dict_translator, abilities_descriptions } from "../utils/Helpers";
import exampleImage from "../assets/Images/WIP.png";
import { Spinner } from "react-bootstrap";
import { Context } from "../index";
import {WearDataById, ThrowItemById, SellItemById} from "../http/SupportFunctions";
import ModalAction from "../components/ModalAction"


const Item = () => {
  const { user } = useContext(Context);
  const inventory_new = user.inventory_new || {}; 
  const [itemData, setItemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showModalSell, setShowModalSell] = useState(false);
  const [showModalDrop, setShowModalDrop] = useState(false);
  const [handleRequest, setHandleRequest] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [toNavigate, setToNavigate] = useState(false);
  const navigate = useNavigate();

  const location = useLocation();
  const url = location.pathname;
  const pathParts = url.split("/");
  const number = pathParts[pathParts.length - 1];
  const num = +number;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await GetItemById(num);
        setItemData(data.data);
        setImageSrc(data.data.Image ? `/assets/Images/${data.data.Image.split("Images/")[1]}` : exampleImage);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [num]);
  
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


  const handleSell = async (value) => {
    toggleHandleRequest();
    const user_id = user.user.id;
    const response = await SellItemById(num, value);
    const player_data = response.data;
    const message = response.message;
    user.setPlayerInventory(player_data.inventory_new);
    user.setPlayer(player_data);
    if (response.status) {
      setToNavigate(true);
    }
    toggleHandleRequest();
    setModalMessage(message);
    setShowModal(true);
  };

  const handleThrowAway = async (value) => {
    toggleHandleRequest();
    const user_id = user.user.id;
    const response = await ThrowItemById(num, value);
    const player_data = response.data;
    const message = response.message;
    user.setPlayerInventory(player_data.inventory_new); // Update the state with fetched data
    user.setPlayer(player_data); // Set player data
    if (response.status){setToNavigate(true);};
    toggleHandleRequest();
    setModalMessage(message);
    setShowModal(true);
  };

  const handleWear = async () => {
    const user_id = user.user.id;
    const response = await WearDataById(num);
    const player_data = response.data;
    const message = response.message;
    user.setPlayerInventory(player_data.inventory_new); // Update the state with fetched data
    user.setPlayer(player_data); // Set player data

    setModalMessage(message);
    setShowModal(true);
  };

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

  useEffect(() => {
    if (toNavigate) {
      const timer = setTimeout(() => {
        navigate("/inventory");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [toNavigate]);


  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }
  
  console.log(imageSrc);

  return (
    <Container className="mt-4">
      <Row>
        <Col md={6}>
          <Image src={imageSrc} fluid />
        </Col>
        <Col md={6} className="d-flex flex-column justify-content-center">
          {itemData.is_equippable && (
            <Button variant="primary" className="mb-2" onClick={handleWear}>Надеть</Button>
          )}
          <Button variant="success" className="mb-2" onClick={handleModalSell}>Продать</Button>
          <Button variant="danger" onClick={handleModalDrop}>Выбросить</Button>
        </Col>
      </Row>
      <Row className="mt-4">
        <Col>
          {Object.entries(itemData).map(([key, value]) => {
            if (dict_translator[key] &&
                !["", 0, "No", {}, "{}", false, null].includes(value) &&
                !["Image", "gender", "number", "suffix"].includes(key)) {
              if (key === "ability") {
                const keysArr = Object.keys(value)
                for (key in keysArr) {
                  if (abilities_descriptions[keysArr[key]]) {
                    return (
                      <div key={key}>
                        {`${keysArr[key]}: ${abilities_descriptions[keysArr[key]]}`}
                      </div>
                    );}
                    else {
                      return null;
                    };
                }
              } else {
                const translatedValue = dict_translator[value] ? dict_translator[value] : value;
                return (
                  <div key={key}>
                    {`${dict_translator[key]}: ${translatedValue}`}
                  </div>
                );
              }
            } else {
              return null;
            }
          })}

        </Col>
      </Row>
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
            device={inventory_new[num]}
            devicekey={num}
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
            device={inventory_new[num]}
            devicekey={num}
            action={handleThrowAway}
            handleRequest={handleRequest}
            title="Выбросить предмет"
            actionButtonText="Выбросить"
            backdrop="static" 
            keyboard={false} centered
          />

    </Container>
  );
};

export default Item;
