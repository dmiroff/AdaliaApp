// src/components/MassOperationModals.js
import { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import {MassDropItems, MassSellItems, MassTransferItems} from "../http/SupportFunctions";

// Массовая продажа
export const MassSellModal = ({ show, onClose, selectedItems, inventory, onSuccess }) => {
  const [itemsWithQuantity, setItemsWithQuantity] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleQuantityChange = (itemId, quantity) => {
    setItemsWithQuantity(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, quantity: Math.min(Math.max(1, quantity), item.maxQuantity) }
        : item
    ));
  };

  const handleInputChange = (itemId, value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
      return;
    }
    setItemsWithQuantity(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, quantity: Math.min(numValue, item.maxQuantity) }
        : item
    ));
  };

  const handleSetMax = (itemId) => {
    const item = itemsWithQuantity.find(item => item.itemId === itemId);
    if (item) {
      handleQuantityChange(itemId, item.maxQuantity);
    }
  };

  const handleSetMin = (itemId) => {
    handleQuantityChange(itemId, 1);
  };

  const handleSubmit = async () => {
    const itemsToSubmit = itemsWithQuantity.map(item => ({
      itemId: item.itemId,
      quantity: item.quantity
    }));
    
    setLoading(true);
    try {
      const result = await MassSellItems(itemsToSubmit);
      
      alert(result.message || 'Предметы успешно проданы!');
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Ошибка массовой продажи:', error);
      alert(error.response?.data?.detail || error.message || 'Ошибка при продаже предметов');
    } finally {
      setLoading(false);
    }
  };

  const totalCount = itemsWithQuantity.reduce((sum, item) => sum + item.quantity, 0);

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
          <i className="fas fa-coins me-2"></i>
          Массовая продажа
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="alert alert-warning mb-4 mass-modal-alert">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Окончательная стоимость продажи определяется с учётом:</strong>
          <ul className="mb-0 mt-2">
            <li>Вашего навыка торговли</li>
            <li>Уровня харизмы</li>
          </ul>
        </div>
        
        <div className="mb-3">
          <h6 className="mass-modal-title">
            <i className="fas fa-edit me-2"></i>
            Укажите количество для каждого предмета:
          </h6>
        </div>
        
        <div className="selected-items-list">
          {itemsWithQuantity.map(item => (
            <div key={item.itemId} className="item-quantity-row mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="item-name-mass">{item.name}</span>
                <span className="item-available">
                  доступно: {item.maxQuantity} шт
                </span>
              </div>
              
              <div className="d-flex flex-column gap-3">
                {/* Ползунок */}
                <div className="d-flex align-items-center gap-3">
                  <span className="mass-quantity-label">Ползунок:</span>
                  <Form.Range
                    min="1"
                    max={item.maxQuantity}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value))}
                    className="mass-quantity-slider flex-grow-1"
                    disabled={loading}
                  />
                </div>
                
                {/* Прямой ввод числа */}
                <div className="d-flex align-items-center gap-3">
                  <span className="mass-quantity-label">Прямой ввод:</span>
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleSetMin(item.itemId)}
                      disabled={item.quantity <= 1 || loading}
                      className="mass-quantity-btn"
                      title="Установить минимум"
                    >
                      Мин
                    </Button>
                    
                    <InputGroup size="sm" style={{ width: '120px' }}>
                      <Button
                        variant="outline-secondary"
                        onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                        disabled={item.quantity <= 1 || loading}
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
                        disabled={loading}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxQuantity || loading}
                      >
                        +
                      </Button>
                    </InputGroup>
                    
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleSetMax(item.itemId)}
                      disabled={item.quantity >= item.maxQuantity || loading}
                      className="mass-quantity-btn"
                      title="Установить максимум"
                    >
                      Макс
                    </Button>
                  </div>
                </div>
                
                {/* Быстрые кнопки */}
                <div className="d-flex align-items-center gap-3">
                  <span className="mass-quantity-label">Быстрый выбор:</span>
                  <div className="d-flex gap-1">
                    {[1, 5, 10, 25, 50].map(num => (
                      <Button
                        key={num}
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleQuantityChange(item.itemId, Math.min(num, item.maxQuantity))}
                        disabled={loading || num > item.maxQuantity}
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
                <div className="d-flex justify-content-between small text-muted">
                  <span>0</span>
                  <span>Использовано: {item.quantity} из {item.maxQuantity}</span>
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
                <div className="mass-total-label">Всего предметов к продаже:</div>
                <div className="mass-total-value">
                  {totalCount}
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-2">
            <small className="mass-total-note">
              <i className="fas fa-exclamation-circle me-1"></i>
              Итоговая стоимость будет рассчитана при продаже
            </small>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button 
          variant="secondary" 
          onClick={onClose}
          disabled={loading}
          className="mass-cancel-btn"
        >
          <i className="fas fa-times me-2"></i>
          Отмена
        </Button>
        
        <Button 
          variant="success"
          onClick={handleSubmit}
          disabled={loading}
          className="mass-submit-btn mass-submit-gold"
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Продажа...
            </>
          ) : (
            <>
              <i className="fas fa-coins me-2"></i>
              Продать {totalCount} предметов
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Массовая передача
export const MassTransferModal = ({ show, onClose, selectedItems, inventory, onSuccess }) => {
  const [recipientName, setRecipientName] = useState("");
  const [itemsWithQuantity, setItemsWithQuantity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationError, setOperationError] = useState('');
  const transferPending = useRef(false);
  useEffect(() => {if(show){setRecipientName('');setOperationError('');}}, [show]);

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

  const handleRecipientChange = (e) => {
    setRecipientName(e.target.value);
  };

  const handleQuantityChange = (itemId, quantity) => {
    setItemsWithQuantity(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, quantity: Math.min(Math.max(1, quantity), item.maxQuantity) }
        : item
    ));
  };

  const handleInputChange = (itemId, value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
      return;
    }
    setItemsWithQuantity(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, quantity: Math.min(numValue, item.maxQuantity) }
        : item
    ));
  };

  const handleSetMax = (itemId) => {
    const item = itemsWithQuantity.find(item => item.itemId === itemId);
    if (item) {
      handleQuantityChange(itemId, item.maxQuantity);
    }
  };

  const handleSubmit = async () => {
    if (transferPending.current) return;
    setOperationError('');
    if (!recipientName.trim()) {
      setOperationError("Введите точное имя персонажа получателя");
      return;
    }

    const itemsToSubmit = itemsWithQuantity.map(item => ({
      itemId: item.itemId,
      quantity: item.quantity
    }));
    
    transferPending.current = true;
    setLoading(true);
    try {
      const result = await MassTransferItems(recipientName.trim(), itemsToSubmit);
      

      
      if (onSuccess) {
        onSuccess(result.message || 'Предметы успешно переданы!');
      }
      
      onClose();
    } catch (error) {
      console.error('Ошибка массовой передачи:', error);
      setOperationError(typeof error.response?.data?.detail === 'string' ? error.response.data.detail : 'Передача не выполнена. Проверьте получателя и попробуйте снова.');
    } finally {
      transferPending.current = false;
      setLoading(false);
    }
  };

  const totalCount = itemsWithQuantity.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Modal 
      show={show} 
      onHide={() => {if (!transferPending.current) onClose();}}
      backdrop="static"
      centered
      className="fantasy-modal mass-operation-modal"
    >
      <Modal.Header closeButton={!loading} className="fantasy-card-header fantasy-card-header-primary">
        <Modal.Title className="d-flex align-items-center fantasy-text-gold">
          <i className="fas fa-share-alt me-2"></i>
          Передача предметов
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {operationError && <p role="alert" className="text-danger">{operationError}</p>}
        <div className="mb-4">
          <div className="mass-recipient-label">
            <i className="fas fa-user-circle me-2"></i>
            Имя персонажа получателя:
          </div>
          <p className="small">Укажите точное игровое имя. Перед передачей проверьте получателя и количество.</p>
          <div className="recipient-search">
            <i className="fas fa-search search-icon"></i>
            <Form.Control
              type="text"
              value={recipientName}
              onChange={handleRecipientChange}
              placeholder="Точное имя персонажа"
              aria-label="Имя персонажа получателя"
              className="mass-input"
              disabled={loading}
            />
          </div>
          
        </div>

        <div className="mb-4">
          <div className="mass-modal-title mb-3">
            <i className="fas fa-boxes me-2"></i>
            Выбранные предметы:
          </div>
          
          <div className="selected-items-list">
            {itemsWithQuantity.map(item => (
              <div key={item.itemId} className="item-quantity-row mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="item-name-mass">{item.name}</span>
                  <span className="item-available">
                    доступно: {item.maxQuantity} шт
                  </span>
                </div>
                
                <label className="transfer-quantity-label" htmlFor={`transfer-quantity-${item.itemId}`}>Количество</label>
                <div className="transfer-quantity-control">
                  <Button className="fantasy-btn" aria-label={`Уменьшить количество: ${item.name}`} onClick={() => handleQuantityChange(item.itemId,item.quantity-1)} disabled={loading || item.quantity<=1}>−</Button>
                  <Form.Control id={`transfer-quantity-${item.itemId}`} type="number" inputMode="numeric" min="1" max={item.maxQuantity} step="1"
                    value={item.quantity} onChange={event => handleInputChange(item.itemId,event.target.value)} disabled={loading}/>
                  <Button className="fantasy-btn" aria-label={`Увеличить количество: ${item.name}`} onClick={() => handleQuantityChange(item.itemId,item.quantity+1)} disabled={loading || item.quantity>=item.maxQuantity}>+</Button>
                  <Button className="fantasy-btn transfer-quantity-max" onClick={() => handleSetMax(item.itemId)} disabled={loading || item.quantity>=item.maxQuantity}>Все ({item.maxQuantity})</Button>
                </div>
                <p className="small mt-2 mb-0">Будет передано {item.quantity} из {item.maxQuantity} шт.</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mass-total-info p-3">
          <div className="row text-center">
            <div className="col-12">
              <div className="mb-2">
                <div className="mass-total-label">Всего предметов к передаче:</div>
                <div className="mass-total-value">
                  {totalCount}
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-3">
            <small className="mass-total-note">
              <i className="fas fa-exclamation-circle me-1"></i>
              Передача безвозвратна. Убедитесь в правильности выбора
            </small>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button 
          variant="secondary" 
          onClick={onClose}
          disabled={loading}
          className="mass-cancel-btn"
        >
          <i className="fas fa-times me-2"></i>
          Отмена
        </Button>
        <Button 
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || !recipientName.trim()}
          className="mass-submit-btn mass-submit-gold"
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Передача...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane me-2"></i>
              Передать · {totalCount} шт.
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Массовое выбрасывание
export const MassDropModal = ({ show, onClose, selectedItems, inventory, onSuccess }) => {
  const [itemsWithQuantity, setItemsWithQuantity] = useState([]);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleQuantityChange = (itemId, quantity) => {
    setItemsWithQuantity(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, quantity: Math.min(Math.max(1, quantity), item.maxQuantity) }
        : item
    ));
  };

  const handleInputChange = (itemId, value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
      return;
    }
    setItemsWithQuantity(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, quantity: Math.min(numValue, item.maxQuantity) }
        : item
    ));
  };

  const handleSetMax = (itemId) => {
    const item = itemsWithQuantity.find(item => item.itemId === itemId);
    if (item) {
      handleQuantityChange(itemId, item.maxQuantity);
    }
  };

  const handleSetMin = (itemId) => {
    handleQuantityChange(itemId, 1);
  };

  const handleSubmit = async () => {
    if (confirmText !== "ПОДТВЕРЖДАЮ") {
      alert('Введите "ПОДТВЕРЖДАЮ" для подтверждения удаления');
      return;
    }

    const itemsToSubmit = itemsWithQuantity.map(item => ({
      itemId: item.itemId,
      quantity: item.quantity
    }));
    
    setLoading(true);
    try {
      const result = await MassDropItems(itemsToSubmit);
      
      alert(result.message || 'Предметы успешно выброшены!');
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Ошибка массового выбрасывания:', error);
      alert(error.response?.data?.detail || error.message || 'Ошибка при выбрасывании предметов');
    } finally {
      setLoading(false);
    }
  };

  const totalCount = itemsWithQuantity.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Modal 
      show={show} 
      onHide={onClose}
      backdrop="static"
      centered
      className="fantasy-modal mass-operation-modal"
    >
      <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-danger">
        <Modal.Title className="d-flex align-items-center fantasy-text-gold">
          <i className="fas fa-skull-crossbones me-2"></i>
          Уничтожение предметов
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="alert alert-danger mb-4 mass-modal-alert mass-danger-alert">
          <div className="d-flex align-items-start">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <div>
              <strong>КРИТИЧЕСКОЕ ПРЕДУПРЕЖДЕНИЕ!</strong>
              <div className="mt-1">
                Вы собираетесь уничтожить предметы.
                Это действие <strong>НЕЛЬЗЯ ОТМЕНИТЬ</strong>!
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="mass-modal-title mb-2">
            <i className="fas fa-boxes me-2"></i>
            Предметы к удалению:
          </div>
          
          <div className="selected-items-list">
            {itemsWithQuantity.map(item => (
              <div key={item.itemId} className="item-quantity-row mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="item-name-mass">{item.name}</span>
                  <span className="item-available">
                    доступно: {item.maxQuantity} шт
                  </span>
                </div>
                
                <div className="d-flex flex-column gap-3">
                  {/* Ползунок */}
                  <div className="d-flex align-items-center gap-3">
                    <span className="mass-quantity-label">Ползунок:</span>
                    <Form.Range
                      min="1"
                      max={item.maxQuantity}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value))}
                      className="mass-quantity-slider flex-grow-1"
                      disabled={loading}
                    />
                  </div>
                  
                  {/* Прямой ввод числа */}
                  <div className="d-flex align-items-center gap-3">
                    <span className="mass-quantity-label">Прямой ввод:</span>
                    <div className="d-flex align-items-center gap-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleSetMin(item.itemId)}
                        disabled={item.quantity <= 1 || loading}
                        className="mass-quantity-btn"
                        title="Установить минимум"
                      >
                        Мин
                      </Button>
                      
                      <InputGroup size="sm" style={{ width: '120px' }}>
                        <Button
                          variant="outline-secondary"
                          onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                          disabled={item.quantity <= 1 || loading}
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
                          disabled={loading}
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxQuantity || loading}
                        >
                          +
                        </Button>
                      </InputGroup>
                      
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleSetMax(item.itemId)}
                        disabled={item.quantity >= item.maxQuantity || loading}
                        className="mass-quantity-btn"
                        title="Установить максимум"
                      >
                        Макс
                      </Button>
                    </div>
                  </div>
                  
                  {/* Быстрые кнопки */}
                  <div className="d-flex align-items-center gap-3">
                    <span className="mass-quantity-label">Быстрый выбор:</span>
                    <div className="d-flex gap-1">
                      {[1, 5, 10, 25, 50].map(num => (
                        <Button
                          key={num}
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleQuantityChange(item.itemId, Math.min(num, item.maxQuantity))}
                          disabled={loading || num > item.maxQuantity}
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
                  <div className="d-flex justify-content-between small text-muted">
                    <span>0</span>
                    <span>Использовано: {item.quantity} из {item.maxQuantity}</span>
                    <span>{item.maxQuantity}</span>
                  </div>
                  <div className="progress" style={{ height: '5px' }}>
                    <div 
                      className="progress-bar bg-danger" 
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
        </div>
        
        <div className="mb-4 p-3 mass-confirm-box">
          <div className="mass-modal-title mb-2">
            <i className="fas fa-keyboard me-2"></i>
            Подтверждение удаления:
          </div>
          <Form.Control
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Введите "ПОДТВЕРЖДАЮ" для подтверждения'
            className="mass-input mb-2"
            disabled={loading}
          />
          <small className="mass-confirm-note">
            Введите слово ПОДТВЕРЖДАЮ заглавными буквами для подтверждения удаления
          </small>
        </div>
        
        <div className="mass-total-info p-3">
          <div className="row text-center">
            <div className="col-12">
              <div className="mb-2">
                <div className="mass-total-label">Всего предметов к удалению:</div>
                <div className="mass-total-value">
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
          disabled={loading}
          className="mass-cancel-btn"
        >
          <i className="fas fa-times me-2"></i>
          Отмена
        </Button>
        <Button 
          variant="danger"
          onClick={handleSubmit}
          disabled={loading || confirmText !== "ПОДТВЕРЖДАЮ"}
          className="mass-submit-btn mass-submit-danger"
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Удаление...
            </>
          ) : (
            <>
              <i className="fas fa-trash me-2"></i>
              Уничтожить ({totalCount} шт)
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};