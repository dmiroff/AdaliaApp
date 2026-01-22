import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Modal, Button, Form, Spinner, InputGroup, Alert } from "react-bootstrap";
import { TransferToCastleStorage, TransferFromCastleStorage } from "../http/guildService";

// Модальное окно для переноса предметов в замок
export const MassTransferToCastleModal = ({ 
  show, 
  onClose, 
  selectedItems, 
  inventory, 
  castleId, 
  onSuccess 
}) => {
  const [itemsWithQuantity, setItemsWithQuantity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const initialItems = Array.from(selectedItems).map(itemId => {
      const item = inventory[itemId];
      return {
        itemId,
        name: item?.name || '',
        maxQuantity: item?.count || 1,
        quantity: item?.count || 1,
        value: item?.value || 0
      };
    });
    setItemsWithQuantity(initialItems);
  }, [selectedItems, inventory]);

  const handleQuantityChange = useCallback((itemId, quantity) => {
    setItemsWithQuantity(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, quantity: Math.min(Math.max(1, quantity), item.maxQuantity) }
        : item
    ));
  }, []);

  const handleInputChange = useCallback((itemId, value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
      return;
    }
    setItemsWithQuantity(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, quantity: Math.min(numValue, item.maxQuantity) }
        : item
    ));
  }, []);

  const handleSetMax = useCallback((itemId) => {
    const item = itemsWithQuantity.find(item => item.itemId === itemId);
    if (item) {
      handleQuantityChange(itemId, item.maxQuantity);
    }
  }, [itemsWithQuantity, handleQuantityChange]);

  const handleSetMin = useCallback((itemId) => {
    handleQuantityChange(itemId, 1);
  }, [handleQuantityChange]);

  const handleSubmit = async () => {
    const itemsToSubmit = itemsWithQuantity.map(item => ({
      item_id: item.itemId,
      quantity: item.quantity
    }));
    
    setLoading(true);
    setAlert(null);
    
    try {
      const result = await TransferToCastleStorage(castleId, itemsToSubmit);
      if (result && result.status === 200) {
        setAlert({
          type: 'success',
          message: result.message || 'Предметы успешно перенесены в замок!'
        });
        
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
          setAlert(null);
        }, 1500);
      } else {
        throw new Error(result?.message || 'Ошибка при переносе предметов');
      }
    } catch (error) {
      console.error('Ошибка массового переноса в замок:', error);
      setAlert({
        type: 'danger',
        message: error.message || 'Ошибка при переносе предметов'
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCount = useMemo(() => {
    return itemsWithQuantity.reduce((sum, item) => sum + item.quantity, 0);
  }, [itemsWithQuantity]);

  return (
    <Modal 
      show={show} 
      onHide={onClose}
      backdrop="static"
      centered
      className="fantasy-modal mass-operation-modal"
    >
      <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
        <Modal.Title className="d-flex align-items-center fantasy-text-gold">
          <i className="fas fa-upload me-2"></i>
          Перенос предметов в замок
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {alert && (
          <Alert variant={alert.type} className="mb-3">
            <i className={`fas fa-${alert.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
            {alert.message}
            {alert.type === 'success' && (
              <div className="mt-2">
                <Spinner animation="border" size="sm" className="me-2" />
                Закрытие через 1 секунду...
              </div>
            )}
          </Alert>
        )}

        <div className="alert alert-info mb-4 mass-modal-alert">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Внимание:</strong> Вы переносите предметы в общее хранилище замка.
          Любой участник гильдии может взять эти предметы обратно.
        </div>
        
        <div className="mb-3">
          <h6 className="mass-modal-title fantasy-text-gold">
            <i className="fas fa-edit me-2"></i>
            Укажите количество для каждого предмета:
          </h6>
        </div>
        
        <div className="selected-items-list">
          {itemsWithQuantity.map(item => (
            <div key={item.itemId} className="item-quantity-row mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="item-name-mass fantasy-text-dark">{item.name}</span>
                <span className="item-available fantasy-text-dark">
                  доступно: {item.maxQuantity} шт
                </span>
              </div>
              
              <div className="d-flex flex-column gap-3">
                {/* Ползунок */}
                <div className="d-flex align-items-center gap-3">
                  <span className="mass-quantity-label fantasy-text-dark">Ползунок:</span>
                  <Form.Range
                    min="1"
                    max={item.maxQuantity}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value))}
                    className="mass-quantity-slider flex-grow-1"
                    disabled={loading || alert?.type === 'success'}
                  />
                </div>
                
                {/* Прямой ввод числа */}
                <div className="d-flex align-items-center gap-3">
                  <span className="mass-quantity-label fantasy-text-dark">Прямой ввод:</span>
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleSetMin(item.itemId)}
                      disabled={item.quantity <= 1 || loading || alert?.type === 'success'}
                      className="mass-quantity-btn"
                      title="Установить минимум"
                    >
                      Мин
                    </Button>
                    
                    <InputGroup size="sm" style={{ width: '120px' }}>
                      <Button
                        variant="outline-secondary"
                        onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                        disabled={item.quantity <= 1 || loading || alert?.type === 'success'}
                      >
                        -
                      </Button>
                      <Form.Control
                        type="number"
                        min="1"
                        max={item.maxQuantity}
                        value={item.quantity}
                        onChange={(e) => handleInputChange(item.itemId, e.target.value)}
                        className="text-center"
                        disabled={loading || alert?.type === 'success'}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxQuantity || loading || alert?.type === 'success'}
                      >
                        +
                      </Button>
                    </InputGroup>
                    
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleSetMax(item.itemId)}
                      disabled={item.quantity >= item.maxQuantity || loading || alert?.type === 'success'}
                      className="mass-quantity-btn"
                      title="Установить максимум"
                    >
                      Макс
                    </Button>
                  </div>
                </div>
                
                {/* Быстрые кнопки */}
                <div className="d-flex align-items-center gap-3">
                  <span className="mass-quantity-label fantasy-text-dark">Быстрый выбор:</span>
                  <div className="d-flex gap-1">
                    {[1, 5, 10, 25, 50].map(num => (
                      <Button
                        key={num}
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleQuantityChange(item.itemId, Math.min(num, item.maxQuantity))}
                        disabled={loading || num > item.maxQuantity || alert?.type === 'success'}
                        className="mass-quick-btn"
                        active={item.quantity === Math.min(num, item.maxQuantity)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Прогресс бар */}
              <div className="mt-2">
                <div className="d-flex justify-content-between small fantasy-text-muted">
                  <span>0</span>
                  <span>Берется: {item.quantity} из {item.maxQuantity}</span>
                  <span>{item.maxQuantity}</span>
                </div>
                <div className="progress" style={{ height: '5px' }}>
                  <div 
                    className="progress-bar bg-primary" 
                    role="progressbar" 
                    style={{ width: `${(item.quantity / item.maxQuantity) * 100}%` }}
                    aria-valuenow={item.quantity}
                    aria-valuemin="0"
                    aria-valuemax={item.maxQuantity}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mass-total-info p-3">
          <div className="row text-center">
            <div className="col-12">
              <div className="mb-2">
                <div className="mass-total-label fantasy-text-dark">Всего предметов к переносу:</div>
                <div className="mass-total-value fantasy-text-gold">
                  {totalCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button 
          variant="secondary" 
          onClick={onClose}
          disabled={loading || alert?.type === 'success'}
          className="mass-cancel-btn"
        >
          <i className="fas fa-times me-2"></i>
          Отмена
        </Button>
        <Button 
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || totalCount === 0 || alert?.type === 'success'}
          className="mass-submit-btn mass-submit-gold"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Перенос...
            </>
          ) : alert?.type === 'success' ? (
            <>
              <i className="fas fa-check me-2"></i>
              Успешно!
            </>
          ) : (
            <>
              <i className="fas fa-upload me-2"></i>
              Перенести {totalCount} предметов
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Модальное окно для изъятия предметов из замка
export const MassTransferFromCastleModal = ({ 
  show, 
  onClose, 
  selectedItems, 
  storageItems, 
  castleId, 
  onSuccess,
  canTakeItems
}) => {
  const [itemsWithQuantity, setItemsWithQuantity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const initialItems = Array.from(selectedItems).map(itemId => {
      const item = storageItems.find(i => i.id === itemId);
      return {
        itemId,
        name: item?.name || '',
        maxQuantity: item?.count || 1,
        quantity: item?.count || 1,
        value: item?.value || 0
      };
    });
    setItemsWithQuantity(initialItems);
  }, [selectedItems, storageItems]);

  const handleQuantityChange = useCallback((itemId, quantity) => {
    setItemsWithQuantity(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, quantity: Math.min(Math.max(1, quantity), item.maxQuantity) }
        : item
    ));
  }, []);

  const handleInputChange = useCallback((itemId, value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
      return;
    }
    setItemsWithQuantity(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, quantity: Math.min(numValue, item.maxQuantity) }
        : item
    ));
  }, []);

  const handleSetMax = useCallback((itemId) => {
    const item = itemsWithQuantity.find(item => item.itemId === itemId);
    if (item) {
      handleQuantityChange(itemId, item.maxQuantity);
    }
  }, [itemsWithQuantity, handleQuantityChange]);

  const handleSetMin = useCallback((itemId) => {
    handleQuantityChange(itemId, 1);
  }, [handleQuantityChange]);

  const handleSubmit = async () => {
    if (!canTakeItems) {
      setAlert({
        type: 'warning',
        message: "Только офицеры и лидер гильдии могут забирать предметы из замка!"
      });
      return;
    }

    const itemsToSubmit = itemsWithQuantity.map(item => ({
      item_id: item.itemId,
      quantity: item.quantity
    }));
    
    setLoading(true);
    setAlert(null);
    
    try {
      const result = await TransferFromCastleStorage(castleId, itemsToSubmit);
      if (result && result.status === 200) {
        setAlert({
          type: 'success',
          message: result.message || 'Предметы успешно перенесены в инвентарь!'
        });
        
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
          setAlert(null);
        }, 1500);
      } else {
        throw new Error(result?.message || 'Ошибка при изъятии предметов');
      }
    } catch (error) {
      console.error('Ошибка массового изъятия из замка:', error);
      setAlert({
        type: 'danger',
        message: error.message || 'Ошибка при изъятии предметов'
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCount = useMemo(() => {
    return itemsWithQuantity.reduce((sum, item) => sum + item.quantity, 0);
  }, [itemsWithQuantity]);

  return (
    <Modal 
      show={show} 
      onHide={onClose}
      backdrop="static"
      centered
      className="fantasy-modal mass-operation-modal"
    >
      <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-warning">
        <Modal.Title className="d-flex align-items-center fantasy-text-gold">
          <i className="fas fa-download me-2"></i>
          Изъятие предметов из замка
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {alert && (
          <Alert variant={alert.type} className="mb-3">
            <i className={`fas fa-${alert.type === 'success' ? 'check-circle' : alert.type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle'} me-2`}></i>
            {alert.message}
            {alert.type === 'success' && (
              <div className="mt-2">
                <Spinner animation="border" size="sm" className="me-2" />
                Закрытие через 1 секунду...
              </div>
            )}
          </Alert>
        )}

        <div className="alert alert-warning mb-4 mass-modal-alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>Внимание:</strong> Только офицеры и лидер гильдии могут забирать предметы из хранилища замка.
        </div>
        
        <div className="selected-items-list">
          {itemsWithQuantity.map(item => (
            <div key={item.itemId} className="item-quantity-row mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="item-name-mass fantasy-text-dark">{item.name}</span>
                <span className="item-available fantasy-text-dark">
                  доступно: {item.maxQuantity} шт
                </span>
              </div>
              
              <div className="d-flex flex-column gap-3">
                {/* Ползунок */}
                <div className="d-flex align-items-center gap-3">
                  <span className="mass-quantity-label fantasy-text-dark">Ползунок:</span>
                  <Form.Range
                    min="1"
                    max={item.maxQuantity}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value))}
                    className="mass-quantity-slider flex-grow-1"
                    disabled={loading || !canTakeItems || alert?.type === 'success'}
                  />
                </div>
                
                {/* Прямой ввод числа */}
                <div className="d-flex align-items-center gap-3">
                  <span className="mass-quantity-label fantasy-text-dark">Прямой ввод:</span>
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleSetMin(item.itemId)}
                      disabled={item.quantity <= 1 || loading || !canTakeItems || alert?.type === 'success'}
                      className="mass-quantity-btn"
                      title="Установить минимум"
                    >
                      Мин
                    </Button>
                    
                    <InputGroup size="sm" style={{ width: '120px' }}>
                      <Button
                        variant="outline-secondary"
                        onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                        disabled={item.quantity <= 1 || loading || !canTakeItems || alert?.type === 'success'}
                      >
                        -
                      </Button>
                      <Form.Control
                        type="number"
                        min="1"
                        max={item.maxQuantity}
                        value={item.quantity}
                        onChange={(e) => handleInputChange(item.itemId, e.target.value)}
                        className="text-center"
                        disabled={loading || !canTakeItems || alert?.type === 'success'}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxQuantity || loading || !canTakeItems || alert?.type === 'success'}
                      >
                        +
                      </Button>
                    </InputGroup>
                    
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleSetMax(item.itemId)}
                      disabled={item.quantity >= item.maxQuantity || loading || !canTakeItems || alert?.type === 'success'}
                      className="mass-quantity-btn"
                      title="Установить максимум"
                    >
                      Макс
                    </Button>
                  </div>
                </div>
                
                {/* Быстрые кнопки */}
                <div className="d-flex align-items-center gap-3">
                  <span className="mass-quantity-label fantasy-text-dark">Быстрый выбор:</span>
                  <div className="d-flex gap-1">
                    {[1, 5, 10, 25, 50].map(num => (
                      <Button
                        key={num}
                        variant="outline-warning"
                        size="sm"
                        onClick={() => handleQuantityChange(item.itemId, Math.min(num, item.maxQuantity))}
                        disabled={loading || !canTakeItems || num > item.maxQuantity || alert?.type === 'success'}
                        className="mass-quick-btn"
                        active={item.quantity === Math.min(num, item.maxQuantity)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Прогресс бар */}
              <div className="mt-2">
                <div className="d-flex justify-content-between small fantasy-text-muted">
                  <span>0</span>
                  <span>Берется: {item.quantity} из {item.maxQuantity}</span>
                  <span>{item.maxQuantity}</span>
                </div>
                <div className="progress" style={{ height: '5px' }}>
                  <div 
                    className="progress-bar bg-warning" 
                    role="progressbar" 
                    style={{ width: `${(item.quantity / item.maxQuantity) * 100}%` }}
                    aria-valuenow={item.quantity}
                    aria-valuemin="0"
                    aria-valuemax={item.maxQuantity}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mass-total-info p-3">
          <div className="row text-center">
            <div className="col-12">
              <div className="mb-2">
                <div className="mass-total-label fantasy-text-dark">Всего предметов к изъятию:</div>
                <div className="mass-total-value fantasy-text-gold">
                  {totalCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button 
          variant="secondary" 
          onClick={onClose}
          disabled={loading || alert?.type === 'success'}
          className="mass-cancel-btn"
        >
          <i className="fas fa-times me-2"></i>
          Отмена
        </Button>
        <Button 
          variant="warning"
          onClick={handleSubmit}
          disabled={loading || !canTakeItems || totalCount === 0 || alert?.type === 'success'}
          className="mass-submit-btn mass-submit-gold"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Изъятие...
            </>
          ) : alert?.type === 'success' ? (
            <>
              <i className="fas fa-check me-2"></i>
              Успешно!
            </>
          ) : (
            <>
              <i className="fas fa-download me-2"></i>
              Изъять {totalCount} предметов
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};