import { useState, useEffect, useContext, useCallback } from "react";
import { Col, Container, Image, Row, Button, Modal, Badge } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { GetItemById } from "../http/GetData";
import { dict_translator, abilities_descriptions } from "../utils/Helpers";
import exampleImage from "../assets/Images/WIP.webp";
import { Spinner } from "react-bootstrap";
import { Context } from "../index";
import { WearDataById, ThrowItemById, SellItemById } from "../http/SupportFunctions";
import ModalAction from "../components/ModalAction";

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
  
  // Мемоизируем получение ID предмета
  const num = useCallback(() => {
    const url = location.pathname;
    const pathParts = url.split("/");
    const number = pathParts[pathParts.length - 1];
    return +number;
  }, [location.pathname])();

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await GetItemById(num);
        if (isMounted) {
          console.log(data.data);
          setItemData(data.data);
          setImageSrc(data.data.Image ? `/assets/Images/${data.data.Image.split("Images/")[1].replace(/\.(png|jpg|jpeg)$/, '.webp')}` : exampleImage);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [num]);
  
  // Мемоизируем обработчики модальных окон
  const handleModalSell = useCallback((event) => {
    event?.stopPropagation();
    if (!inventory_new[num]) {
      setModalMessage("Предмет не найден в инвентаре");
      setShowModal(true);
      return;
    }
    setShowModalSell(prev => !prev);
  }, [inventory_new, num]);

  const handleModalDrop = useCallback((event) => {
    event?.stopPropagation();
    if (!inventory_new[num]) {
      setModalMessage("Предмет не найден в инвентаре");
      setShowModal(true);
      return;
    }
    setShowModalDrop(prev => !prev);
  }, [inventory_new, num]);

  const toggleHandleRequest = useCallback(() => {
    setHandleRequest(prev => !prev);
  }, []);

  const handleModalClose = useCallback(() => setShowModal(false), []);
  const handleModalSellClose = useCallback(() => setShowModalSell(false), []);
  const handleModalDropClose = useCallback(() => setShowModalDrop(false), []);

  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        handleModalClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showModal, handleModalClose]);

  // Мемоизируем обработчики действий
  const handleSell = useCallback(async (value) => {
    toggleHandleRequest();
    try {
      const response = await SellItemById(num, value);
      const player_data = response.data;
      const message = response.message;
      user.setPlayerInventory(player_data.inventory_new);
      user.setPlayer(player_data);
      if (response.status) {
        setToNavigate(true);
      }
      setModalMessage(message);
      setShowModal(true);
    } catch (error) {
      setModalMessage("Ошибка при продаже предмета");
      setShowModal(true);
    } finally {
      toggleHandleRequest();
    }
  }, [num, toggleHandleRequest, user]);

  const handleThrowAway = useCallback(async (value) => {
    toggleHandleRequest();
    try {
      const response = await ThrowItemById(num, value);
      const player_data = response.data;
      const message = response.message;
      user.setPlayerInventory(player_data.inventory_new);
      user.setPlayer(player_data);
      if (response.status) { 
        setToNavigate(true); 
      }
      setModalMessage(message);
      setShowModal(true);
    } catch (error) {
      setModalMessage("Ошибка при выбрасывании предмета");
      setShowModal(true);
    } finally {
      toggleHandleRequest();
    }
  }, [num, toggleHandleRequest, user]);

  const handleWear = useCallback(async () => {
    try {
      const response = await WearDataById(num);
      const player_data = response.data;
      const message = response.message;
      user.setPlayerInventory(player_data.inventory_new);
      user.setPlayer(player_data);
      setModalMessage(message);
      setShowModal(true);
    } catch (error) {
      setModalMessage("Ошибка при надевании предмета");
      setShowModal(true);
    }
  }, [num, user]);

  useEffect(() => {
    if (toNavigate) {
      const timer = setTimeout(() => {
        navigate("/inventory", { replace: true }); // Используем replace для более быстрой навигации
      }, 500); // Уменьшаем время ожидания
      return () => clearTimeout(timer);
    }
  }, [toNavigate, navigate]);

  // Оптимизированная функция для навигации назад
  const handleBack = useCallback(() => {
    // Используем более быстрый метод навигации
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/inventory", { replace: true });
    }
  }, [navigate]);

  // Мемоизируем вычисление редкости предмета
  const getItemRarityClass = useCallback(() => {
    if (!itemData) return '';
    if (itemData.quality === 'legendary') return 'item-legendary';
    if (itemData.quality === 'epic') return 'item-epic';
    if (itemData.quality === 'rare') return 'item-rare';
    if (itemData.value > 1000) return 'item-valuable';
    return '';
  }, [itemData]);

  // Оптимизируем рендеринг характеристик
  const renderItemStats = useCallback(() => {
    if (!itemData) return null;

    return Object.entries(itemData).map(([key, value]) => {
      if (dict_translator[key] &&
          !["", 0, "No", {}, "{}", false, null, undefined].includes(value) &&
          !["Image", "gender", "number", "suffix", "name", "type", "value", "is_equipped", "is_equippable"].includes(key)) {
        
        if (key === "ability") {
          const keysArr = Object.keys(value);
          return keysArr.map(abilityKey => {
            if (abilities_descriptions[abilityKey]) {
              return (
                <div key={abilityKey} className="stat-item ability-item">
                  <span className="stat-label fantasy-text-primary">⚡ Способность:</span>
                  <span className="stat-value fantasy-text-dark">
                    {abilities_descriptions[abilityKey]}
                  </span>
                </div>
              );
            }
            return null;
          }).filter(Boolean);
        } else {
          const translatedKey = dict_translator[key] || key;
          const translatedValue = dict_translator[value] ? dict_translator[value] : value;
          return (
            <div key={key} className="stat-item">
              <span className="stat-label fantasy-text-primary">
              {translatedKey}: {' '} 
              </span>
              <span className="stat-value fantasy-text-dark fantasy-text-bold">
                {translatedValue}
              </span>
            </div>
          );
        }
      }
      return null;
    }).filter(Boolean);
  }, [itemData]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="fantasy-paper p-4 text-center">
          <Spinner animation="border" variant="primary" className="fantasy-spinner" />
          <div className="fantasy-text-primary mt-2">Загрузка предмета...</div>
        </div>
      </Container>
    );
  }

  if (error || !itemData) {
    return (
      <Container className="content-overlay text-center">
        <div className="fantasy-text-danger">
          <h4>⚠️ Ошибка загрузки</h4>
          <p>{error?.message || "Предмет не найден"}</p>
          <div className="d-flex justify-content-center gap-2">
            <Button className="fantasy-btn fantasy-btn-primary" onClick={() => window.location.reload()}>
              Попробовать снова
            </Button>
            <Button className="fantasy-btn fantasy-btn-secondary" onClick={handleBack}>
              Назад
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="item-detail-container">
      <div className={`fantasy-paper item-detail-card ${getItemRarityClass()}`}>
        <Row className="g-4">
          {/* Левая колонка - изображение и действия */}
          <Col md={6} lg={5}>
          
   <div className="item-visual-section ms-2">
         </div>   <div className="item-image-section text-center">
              {/* <div className="item-image-container mb-3"> */}
                <Image 
                  src={imageSrc} 
                  fluid 
                  className="item-detail-image fantasy-paper"
                  onError={(e) => {
                    e.target.src = exampleImage;
                  }}
                />
                {itemData.is_equipped && (
                  <Badge className="item-equipped-badge fantasy-btn-success">
                    ⚡ Надето
                  </Badge>
                )}
              </div>

              {/* Панель действий */}
              <div className="item-actions-panel fantasy-paper p-3">
                <h5 className="fantasy-text-dark fantasy-text-bold mb-3 text-center">Действия</h5>
                <div className="d-grid gap-2">
                  {itemData.is_equippable && (
                    <Button 
                      className="fantasy-btn fantasy-btn-primary fantasy-btn-lg"
                      onClick={handleWear}
                    >
                      Надеть предмет
                    </Button>
                  )}
                  <Button 
                    className="fantasy-btn fantasy-btn-success fantasy-btn-lg"
                    onClick={handleModalSell}
                    disabled={!inventory_new[num]}
                  >
                    Продать
                  </Button>
                  <Button 
                    className="fantasy-btn fantasy-btn-danger fantasy-btn-lg"
                    onClick={handleModalDrop}
                    disabled={!inventory_new[num]}
                  >
                    Выбросить
                  </Button>
                  <Button 
                    className="fantasy-btn fantasy-btn-secondary fantasy-btn-lg"
                    onClick={handleBack}
                  >
                    Назад
                  </Button>
                </div>
              </div>
          </Col>

{/* Правая колонка - характеристики */}
<Col md={6} lg={7}>
  <div className="item-stats-section ms-2"> {/* Добавлен отступ слева */}
    {/* Заголовок и основная информация */}
    <div className="item-header mb-3 text-left"> {/* Уменьшен mb-4 до mb-3 */}
      <h4 className="fantasy-text-dark fantasy-text-bold item-name text-left"> {/* h2 -> h4 */}
        {itemData.name || "Неизвестный предмет"}
      </h4>
      {itemData.type && (
        <div className="item-type-badge fantasy-text-muted small text-left"> {/* Добавлен small */}
          {dict_translator[itemData.type] || itemData.type}
        </div>
      )}
      {itemData.value && (
        <div className="item-value fantasy-text-dark fantasy-text-bold fs-5 text-left"> {/* fs-4 -> fs-5 */}
          🌕{itemData.value}
        </div>
      )}
    </div>

    {/* Основные характеристики */}
<div className="item-stats fantasy-paper p-2 p-md-3 mb-2 col-12 col-md-8 mx-left">
          <h6 className="fantasy-text-dark fantasy-text-bold mb-2">Характеристики</h6> {/* h5 -> h6 */}
      <div className="stats-grid small"> {/* Добавлен small */}
        {renderItemStats()}
      </div>
    </div>

    {/* Дополнительная информация */}
    {itemData.description && (
      <div className="item-description fantasy-paper p-2 small"> {/* Уменьшены отступы + small */}
        <h6 className="fantasy-text-dark fantasy-text-bold mb-1">Описание</h6> {/* h5 -> h6 */}
        <p className="fantasy-text-dark mb-0">{itemData.description}</p>
      </div>
    )}
  </div>
</Col>
</Row>
</div>

{/* Модальные окна */}
<Modal show={showModal} onHide={handleModalClose} backdrop="static" keyboard={false} centered>
  <Modal.Header closeButton className="fantasy-modal-header">
    <Modal.Title className="fantasy-text-gold">Оповещение</Modal.Title>
  </Modal.Header>
  <Modal.Body className="fantasy-text-dark fantasy-text-bold text-center" style={{ whiteSpace: 'pre-wrap', fontSize: '1em' }}> {/* Уменьшен шрифт */}
    {modalMessage}
  </Modal.Body>
  <Modal.Footer className="fantasy-modal-footer">
    <Button className="fantasy-btn fantasy-btn-primary btn-sm" onClick={handleModalClose}> {/* Добавлен btn-sm */}
      Понятно
    </Button>
  </Modal.Footer>
</Modal>

<ModalAction
  show={showModalSell && !!inventory_new[num]}
  onClose={handleModalSellClose} 
  device={inventory_new[num]}
  devicekey={num}
  action={handleSell}
  handleRequest={handleRequest}
  title="Продать предмет"
  actionButtonText="Продать"
  backdrop="static" 
  keyboard={false} 
  centered
/>

<ModalAction
  show={showModalDrop && !!inventory_new[num]}
  onClose={handleModalDropClose} 
  device={inventory_new[num]}
  devicekey={num}
  action={handleThrowAway}
  handleRequest={handleRequest}
  title="Выбросить предмет"
  actionButtonText="Выбросить"
  backdrop="static" 
  keyboard={false} 
  centered
/>
</Container>
  );
};

export default Item;