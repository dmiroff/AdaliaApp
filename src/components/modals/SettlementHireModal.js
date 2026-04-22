import React, { useContext, useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Row, Col, Badge, Card, InputGroup, Spinner } from 'react-bootstrap';
import { observer } from "mobx-react-lite";
import { Context } from "../../index";
import { hireUnit } from '../../services/SettlementService'; // предположим, что функция уже есть
import apiClient from '../../http/apiClient'; // ваш apiClient

const SettlementHireModal = observer(() => {
    const { settlement, guild, user } = useContext(Context);
    const { modal, hideModal } = settlement;
    
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedTier, setSelectedTier] = useState(0);
    const [loading, setLoading] = useState(false);
    const [costLoading, setCostLoading] = useState(false);
    const [availableUnits, setAvailableUnits] = useState([]);
    const [costData, setCostData] = useState(null);
    const [buildingKey, setBuildingKey] = useState(null);
    
    // Загружаем список доступных юнитов с сервера
    useEffect(() => {
        if (modal.show && modal.type === 'hire') {
            loadAvailableUnits();
        }
    }, [modal.show, modal.type]);
    
    // При изменении выбранного юнита, тира или количества – запрашиваем стоимость
    useEffect(() => {
        if (selectedUnit && modal.show && modal.type === 'hire') {
            fetchCost();
        } else {
            setCostData(null);
        }
    }, [selectedUnit, selectedTier, quantity, modal.show]);
    
    const loadAvailableUnits = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/guild/${guild.guildData.id}/settlement/hire-units`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setAvailableUnits(response.data.units || []);
        } catch (error) {
            console.error("Ошибка загрузки юнитов:", error);
            alert("Не удалось загрузить список юнитов");
        } finally {
            setLoading(false);
        }
    };
    
    const fetchCost = async () => {
        if (!selectedUnit) return;
        setCostLoading(true);
        try {
            const response = await apiClient.post(`/guild/${guild.guildData.id}/settlement/hire-cost`, {
                unitId: selectedUnit.id,
                tier: selectedTier,
                quantity: quantity
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setCostData(response.data);
            setBuildingKey(response.data.buildingKey);
        } catch (error) {
            console.error("Ошибка расчёта стоимости:", error);
            setCostData({ canHire: false, reasons: "Ошибка сервера" });
        } finally {
            setCostLoading(false);
        }
    };
    
    const handleHire = async () => {
        if (!selectedUnit || !buildingKey || !costData?.canHire) return;
        
        setLoading(true);
        try {
            const result = await hireUnit(
                guild.guildData.id,
                buildingKey,
                quantity,
                selectedTier,
                selectedUnit.name,
                selectedUnit.id
            );
            if (result.status === 200) {
                // Обновляем store поселения (эссенция, хранилище)
                if (result.data.new_essence !== undefined) {
                    settlement.setCurrentEssence(result.data.new_essence);
                }
                if (result.data.new_storage) {
                    settlement.setStorage(result.data.new_storage);
                }
                alert(`${quantity} юнит(ов) "${selectedUnit.name}" успешно наняты!`);
                hideModal();
                // Сброс формы
                setSelectedUnit(null);
                setQuantity(1);
                setSelectedTier(0);
                setCostData(null);
            } else {
                alert(result.message || "Ошибка найма");
            }
        } catch (error) {
            console.error("Ошибка найма:", error);
            alert("Произошла ошибка при найме");
        } finally {
            setLoading(false);
        }
    };
    
    const currentEssence = settlement.currentEssence || 0;
    const unit = selectedUnit ? availableUnits.find(u => u.id === selectedUnit) : null;
    
    if (!modal.show || modal.type !== 'hire') return null;
    
    return (
        <Modal show={true} onHide={hideModal} backdrop="static" centered size="lg" className="fantasy-modal mass-operation-modal">
            <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
                <Modal.Title className="d-flex align-items-center fantasy-text-gold">
                    <i className="fas fa-user-plus me-2"></i>
                    Найм юнитов
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!selectedUnit ? (
                    // Шаг 1: выбор типа юнита
                    <>
                        <div className="mb-4">
                            <div className="mass-modal-title mb-3">
                                <i className="fas fa-users me-2"></i>
                                Выберите тип юнита для найма:
                            </div>
                            {loading ? (
                                <div className="text-center p-4"><Spinner animation="border" /></div>
                            ) : (
                                <Row className="g-3">
                                    {availableUnits.map(unit => (
                                        <Col md={6} lg={4} key={unit.id}>
                                            <Card className="fantasy-card unit-select-card h-100">
                                                <Card.Body className="d-flex flex-column">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 className="fantasy-text-gold mb-0">{unit.name}</h6>
                                                        <Badge bg="warning" className="fs-6">
                                                            {unit.baseCost}
                                                            <i className="fas fa-gem ms-1" style={{ fontSize: '0.8em' }}></i>
                                                        </Badge>
                                                    </div>
                                                    <div className="mb-3">
                                                        <p className="text-muted small mb-2">{unit.description}</p>
                                                        <div className="d-flex justify-content-between small">
                                                            <span className="text-muted"><i className="fas fa-clock me-1"></i>{unit.hireTime} мин.</span>
                                                            <span className="text-muted"><i className="fas fa-shield-alt me-1"></i>T{unit.availableTiers.join(', T')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-auto">
                                                        <Button variant="outline-primary" size="sm" className="fantasy-btn w-100" onClick={() => setSelectedUnit(unit)}>
                                                            <i className="fas fa-arrow-right me-2"></i>Выбрать
                                                        </Button>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </div>
                        <div className="mass-total-info p-3">
                            <div className="row text-center">
                                <div className="col-6">
                                    <div className="mass-total-label">Доступно юнитов:</div>
                                    <div className="mass-total-value">{availableUnits.length} типов</div>
                                </div>
                                <div className="col-6">
                                    <div className="mass-total-label">Ваша эссенция:</div>
                                    <div className="mass-total-value">{currentEssence}<i className="fas fa-gem ms-1"></i></div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    // Шаг 2: настройка количества, тира и подтверждение
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fantasy-text-gold mb-0"><i className="fas fa-user-check me-2"></i>Нанимаем: {unit.name}</h5>
                            <Button variant="outline-secondary" size="sm" onClick={() => setSelectedUnit(null)} disabled={loading}>
                                <i className="fas fa-arrow-left me-2"></i>Назад
                            </Button>
                        </div>
                        
                        <Form>
                            {/* Количество */}
                            <div className="mb-4">
                                <div className="mass-modal-title mb-3"><i className="fas fa-hashtag me-2"></i>Количество юнитов:</div>
                                <div className="item-quantity-row">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="item-name-mass">Количество для найма</span>
                                        <span className="item-available">максимум: {costData?.maxQuantity || 1000} шт</span>
                                    </div>
                                    <div className="d-flex flex-column gap-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <span className="mass-quantity-label">Ползунок:</span>
                                            <Form.Range min="1" max={costData?.maxQuantity || 1000} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} className="mass-quantity-slider flex-grow-1" disabled={loading || costLoading} />
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <span className="mass-quantity-label">Прямой ввод:</span>
                                            <div className="d-flex align-items-center gap-2">
                                                <Button variant="outline-secondary" size="sm" onClick={() => setQuantity(1)} disabled={quantity <= 1 || loading}>Мин</Button>
                                                <InputGroup size="sm" style={{ width: '120px' }}>
                                                    <Button variant="outline-secondary" onClick={() => setQuantity(Math.max(1, quantity-1))} disabled={quantity <= 1 || loading}>-</Button>
                                                    <Form.Control type="number" min="1" max={costData?.maxQuantity || 1000} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="text-center" disabled={loading || costLoading} />
                                                    <Button variant="outline-secondary" onClick={() => setQuantity(Math.min(costData?.maxQuantity || 1000, quantity+1))} disabled={quantity >= (costData?.maxQuantity || 1000) || loading}>+</Button>
                                                </InputGroup>
                                                <Button variant="outline-secondary" size="sm" onClick={() => setQuantity(costData?.maxQuantity || 1000)} disabled={quantity >= (costData?.maxQuantity || 1000) || loading}>Макс</Button>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <span className="mass-quantity-label">Быстрый выбор:</span>
                                            <div className="d-flex gap-1">
                                                {[1,5,10,25,50,100].map(num => (
                                                    <Button key={num} variant="outline-primary" size="sm" onClick={() => setQuantity(Math.min(num, costData?.maxQuantity || 1000))} disabled={loading || costLoading} active={quantity === num}>{num}</Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="d-flex justify-content-between small text-muted"><span>0</span><span>Нанимается: {quantity}</span><span>{costData?.maxQuantity || 1000}</span></div>
                                        <div className="progress" style={{ height: '5px' }}>
                                            <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${(quantity / (costData?.maxQuantity || 1000)) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Уровень оснащения */}
                            <div className="mb-4">
                                <div className="mass-modal-title mb-3"><i className="fas fa-shield-alt me-2"></i>Уровень оснащения:</div>
                                <div className="d-flex flex-wrap gap-2">
                                    {unit?.availableTiers.map(tier => (
                                        <Button key={tier} variant={selectedTier === tier ? "primary" : "outline-primary"} onClick={() => setSelectedTier(tier)} disabled={loading || costLoading} className="tier-btn">
                                            <div className="d-flex flex-column align-items-center"><span className="fw-bold">T{tier}</span><small className="opacity-75">Уровень {tier}</small></div>
                                        </Button>
                                    ))}
                                </div>
                                <div className="mt-2"><small className="text-muted"><i className="fas fa-info-circle me-1"></i>Более высокий уровень увеличивает стоимость, но улучшает характеристики</small></div>
                            </div>
                            
                            {/* Стоимость */}
                            <div className="mb-4">
                                <div className="mass-modal-title mb-3"><i className="fas fa-calculator me-2"></i>Стоимость найма:</div>
                                {costLoading ? (
                                    <div className="text-center p-3"><Spinner animation="border" size="sm" /> Расчёт стоимости...</div>
                                ) : costData ? (
                                    <Alert variant={costData.canHire ? "success" : "danger"} className="mass-total-info">
                                        <div className="row">
                                            <div className="col-6">
                                                <div className="mass-total-label">Эссенция:</div>
                                                <div className={`mass-total-value ${costData.essenceCost > currentEssence ? 'text-danger' : ''}`}>
                                                    {costData.essenceCost} <i className="fas fa-gem ms-1"></i>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="mass-total-label">Время найма:</div>
                                                <div className="mass-total-value">{unit.hireTime * quantity} мин</div>
                                            </div>
                                        </div>
                                        {Object.keys(costData.resourceCosts).length > 0 && (
                                            <>
                                                <hr className="my-2" />
                                                <div className="mass-total-label mb-2">Дополнительные ресурсы (T{selectedTier}):</div>
                                                {Object.entries(costData.resourceCosts).map(([code, amount]) => (
                                                    <div key={code} className="d-flex justify-content-between align-items-center mb-1">
                                                        <span>{getResourceName(code)}:</span>
                                                        <Badge bg="secondary">{amount}</Badge>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                        {!costData.canHire && costData.reasons && (
                                            <Alert variant="warning" className="mt-2 mb-0 small">{costData.reasons}</Alert>
                                        )}
                                    </Alert>
                                ) : (
                                    <Alert variant="info">Выберите параметры для расчёта стоимости</Alert>
                                )}
                            </div>
                        </Form>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-between">
                {!selectedUnit ? (
                    <Button variant="secondary" onClick={hideModal} disabled={loading}><i className="fas fa-times me-2"></i>Отмена</Button>
                ) : (
                    <>
                        <Button variant="secondary" onClick={() => setSelectedUnit(null)} disabled={loading}><i className="fas fa-arrow-left me-2"></i>Назад</Button>
                        <Button variant="primary" onClick={handleHire} disabled={loading || !costData?.canHire} className="mass-submit-btn mass-submit-gold">
                            {loading ? <><Spinner as="span" animation="border" size="sm" className="me-2" /> Наём...</> : <><i className="fas fa-user-plus me-2"></i>Нанять {quantity} юнит(ов)</>}
                        </Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
});

// Вспомогательная функция для названий ресурсов
function getResourceName(code) {
    const names = {
        "112": "Железная руда",
        "119": "Доски",
        "120": "Сталь",
        "121": "Каменные блоки",
        "essence": "Эссенция"
    };
    return names[code] || code;
}

export default SettlementHireModal;