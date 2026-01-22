import React, { useContext, useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Row, Col, Badge, Card, InputGroup, Spinner } from 'react-bootstrap';
import { observer } from "mobx-react-lite";
import { Context } from "../../index";

const SettlementHireModal = observer(() => {
    const { settlement, guild } = useContext(Context);
    const { modal, hideModal } = settlement;
    
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedTier, setSelectedTier] = useState(0);
    const [loading, setLoading] = useState(false);
    const [availableUnits, setAvailableUnits] = useState([]);
    
    // Загружаем доступные юниты
    useEffect(() => {
        if (modal.show && modal.type === 'hire') {
            loadAvailableUnits();
        }
    }, [modal.show, modal.type]);
    
    const loadAvailableUnits = () => {
        // Заглушка - в реальном приложении это будет API запрос
        const units = [
            { id: 1, name: "Гоблин", baseCost: 50, hireTime: 60, tiers: [0, 1, 2, 3], description: "Слабое существо, но в больших количествах может быть опасно" },
            { id: 2, name: "Орк", baseCost: 100, hireTime: 120, tiers: [0, 1, 2], description: "Сильный и выносливый воин, отличный выбор для ближнего боя" },
            { id: 3, name: "Эльф-лучник", baseCost: 150, hireTime: 180, tiers: [0, 1], description: "Точный стрелок на дальних дистанциях" },
            { id: 4, name: "Рыцарь", baseCost: 200, hireTime: 240, tiers: [0, 1, 2, 3], description: "Тяжелая кавалерия, прорывает любую оборону" },
            { id: 5, name: "Маг", baseCost: 300, hireTime: 300, tiers: [0, 1, 2], description: "Мощный заклинатель, наносит урон по площади" },
            { id: 6, name: "Лекарь", baseCost: 180, hireTime: 150, tiers: [0, 1], description: "Поддерживает союзников, исцеляет раны" }
        ];
        setAvailableUnits(units);
    };
    
    // Стоимость ресурсов для улучшения
    const tierCosts = {
        0: { essence: 1 },
        1: { "112": 10, essence: 5 }, // Железная руда
        2: { "120": 5, "119": 10, essence: 10 }, // Сталь и доски
        3: { "121": 5, "120": 10, "119": 20, essence: 20 } // Каменные блоки, сталь, доски
    };
    
    const getResourceName = (code) => {
        const resources = {
            "112": "Железная руда",
            "119": "Доски",
            "120": "Сталь",
            "121": "Каменные блоки",
            "essence": "Эссенция"
        };
        return resources[code] || code;
    };
    
    const handleHireUnit = async () => {
        if (!selectedUnit) return;
        
        setLoading(true);
        try {
            const unit = availableUnits.find(u => u.id === selectedUnit);
            if (!unit) return;
            
            // settlement.hireUnit({
            //     unitId: selectedUnit,
            //     unitName: unit.name,
            //     quantity,
            //     tier: selectedTier,
            //     userId: guild.user?.id,
            //     guildId: guild.guildData?.id
            // });
            
            // Имитация задержки
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            alert(`${quantity} юнит(ов) "${unit.name}" успешно наняты!`);
            
            hideModal();
            setSelectedUnit(null);
            setQuantity(1);
            setSelectedTier(0);
        } catch (error) {
            console.error('Ошибка найма юнита:', error);
            alert('Ошибка при найме юнита. Проверьте консоль для деталей.');
        } finally {
            setLoading(false);
        }
    };
    
    const calculateCost = (unit, tier) => {
        const baseEssenceCost = unit.baseCost * quantity;
        const tierCost = tierCosts[tier] || {};
        
        return {
            essence: baseEssenceCost + (tierCost.essence || 0) * quantity,
            resources: Object.entries(tierCost)
                .filter(([key]) => key !== 'essence')
                .reduce((acc, [key, value]) => {
                    acc[key] = value * quantity;
                    return acc;
                }, {})
        };
    };
    
    const currentEssence = settlement.currentEssence || 1000;
    const cost = selectedUnit ? calculateCost(
        availableUnits.find(u => u.id === selectedUnit),
        selectedTier
    ) : { essence: 0, resources: {} };
    
    const unit = selectedUnit ? availableUnits.find(u => u.id === selectedUnit) : null;
    const maxQuantity = 100; // Максимальное количество для найма за раз
    
    if (!modal.show || modal.type !== 'hire') {
        return null;
    }
    
    return (
        <Modal 
            show={true} 
            onHide={hideModal}
            backdrop="static"
            centered
            size="lg"
            className="fantasy-modal mass-operation-modal"
        >
            <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
                <Modal.Title className="d-flex align-items-center fantasy-text-gold">
                    <i className="fas fa-user-plus me-2"></i>
                    Найм юнитов
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!selectedUnit ? (
                    <>
                        <div className="mb-4">
                            <div className="mass-modal-title mb-3">
                                <i className="fas fa-users me-2"></i>
                                Выберите тип юнита для найма:
                            </div>
                            
                            <Alert variant="info" className="mass-modal-alert">
                                <i className="fas fa-info-circle me-2"></i>
                                <div>
                                    <strong>Информация о найме:</strong>
                                    <ul className="mb-0 mt-2">
                                        <li>Стоимость указана за 1 юнита</li>
                                        <li>Время найма зависит от количества</li>
                                        <li>Уровень оснащения влияет на характеристики</li>
                                    </ul>
                                </div>
                            </Alert>
                            
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
                                                    <p className="text-muted small mb-2">
                                                        <i className="fas fa-file-alt me-1"></i>
                                                        {unit.description}
                                                    </p>
                                                    <div className="d-flex justify-content-between small">
                                                        <span className="text-muted">
                                                            <i className="fas fa-clock me-1"></i>
                                                            {unit.hireTime} мин.
                                                        </span>
                                                        <span className="text-muted">
                                                            <i className="fas fa-shield-alt me-1"></i>
                                                            T{unit.tiers.join(', T')}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-auto">
                                                    <Button 
                                                        variant="outline-primary" 
                                                        size="sm"
                                                        className="fantasy-btn w-100"
                                                        onClick={() => setSelectedUnit(unit.id)}
                                                    >
                                                        <i className="fas fa-arrow-right me-2"></i>
                                                        Выбрать
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                        
                        <div className="mass-total-info p-3">
                            <div className="row text-center">
                                <div className="col-6">
                                    <div className="mb-2">
                                        <div className="mass-total-label">Доступно юнитов:</div>
                                        <div className="mass-total-value">
                                            {availableUnits.length} типов
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="mb-2">
                                        <div className="mass-total-label">Ваша эссенция:</div>
                                        <div className="mass-total-value">
                                            {currentEssence}
                                            <i className="fas fa-gem ms-1" style={{ fontSize: '0.8em' }}></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fantasy-text-gold mb-0">
                                <i className="fas fa-user-check me-2"></i>
                                Нанимаем: {unit?.name}
                            </h5>
                            <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={() => setSelectedUnit(null)}
                                disabled={loading}
                                className="mass-cancel-btn"
                            >
                                <i className="fas fa-arrow-left me-2"></i>
                                Назад к выбору
                            </Button>
                        </div>
                        
                        <div className="mb-4">
                            <Alert variant="info" className="mass-modal-alert">
                                <i className="fas fa-info-circle me-2"></i>
                                {unit?.description}
                            </Alert>
                        </div>
                        
                        <Form>
                            {/* Количество */}
                            <div className="mb-4">
                                <div className="mass-modal-title mb-3">
                                    <i className="fas fa-hashtag me-2"></i>
                                    Количество юнитов:
                                </div>
                                
                                <div className="item-quantity-row">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="item-name-mass">Количество для найма</span>
                                        <span className="item-available">
                                            максимум: {maxQuantity} шт
                                        </span>
                                    </div>
                                    
                                    <div className="d-flex flex-column gap-3">
                                        {/* Ползунок */}
                                        <div className="d-flex align-items-center gap-3">
                                            <span className="mass-quantity-label">Ползунок:</span>
                                            <Form.Range
                                                min="1"
                                                max={maxQuantity}
                                                value={quantity}
                                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
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
                                                    onClick={() => setQuantity(1)}
                                                    disabled={quantity <= 1 || loading}
                                                    className="mass-quantity-btn"
                                                    title="Установить минимум"
                                                >
                                                    Мин
                                                </Button>
                                                
                                                <InputGroup size="sm" style={{ width: '120px' }}>
                                                    <Button
                                                        variant="outline-secondary"
                                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                        disabled={quantity <= 1 || loading}
                                                    >
                                                        -
                                                    </Button>
                                                    <Form.Control
                                                        type="number"
                                                        min="1"
                                                        max={maxQuantity}
                                                        value={quantity}
                                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                        className="text-center"
                                                        disabled={loading}
                                                    />
                                                    <Button
                                                        variant="outline-secondary"
                                                        onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                                                        disabled={quantity >= maxQuantity || loading}
                                                    >
                                                        +
                                                    </Button>
                                                </InputGroup>
                                                
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() => setQuantity(maxQuantity)}
                                                    disabled={quantity >= maxQuantity || loading}
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
                                                {[1, 5, 10, 25, 50, 100].map(num => (
                                                    <Button
                                                        key={num}
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => setQuantity(Math.min(num, maxQuantity))}
                                                        disabled={loading || num > maxQuantity}
                                                        className="mass-quick-btn"
                                                        active={quantity === Math.min(num, maxQuantity)}
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
                                            <span>Нанимается: {quantity} из {maxQuantity}</span>
                                            <span>{maxQuantity}</span>
                                        </div>
                                        <div className="progress" style={{ height: '5px' }}>
                                            <div 
                                                className="progress-bar bg-primary" 
                                                role="progressbar" 
                                                style={{ width: `${(quantity / maxQuantity) * 100}%` }}
                                                aria-valuenow={quantity}
                                                aria-valuemin="0"
                                                aria-valuemax={maxQuantity}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Уровень оснащения */}
                            <div className="mb-4">
                                <div className="mass-modal-title mb-3">
                                    <i className="fas fa-shield-alt me-2"></i>
                                    Уровень оснащения:
                                </div>
                                
                                <div className="d-flex flex-wrap gap-2">
                                    {unit?.tiers.map(tier => (
                                        <Button
                                            key={tier}
                                            variant={selectedTier === tier ? "primary" : "outline-primary"}
                                            onClick={() => setSelectedTier(tier)}
                                            disabled={loading}
                                            className="tier-btn"
                                        >
                                            <div className="d-flex flex-column align-items-center">
                                                <span className="fw-bold">T{tier}</span>
                                                <small className="opacity-75">Уровень {tier}</small>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                                
                                <div className="mt-2">
                                    <small className="text-muted">
                                        <i className="fas fa-info-circle me-1"></i>
                                        Более высокий уровень увеличивает стоимость, но улучшает характеристики юнита
                                    </small>
                                </div>
                            </div>
                            
                            {/* Стоимость */}
                            <div className="mb-4">
                                <div className="mass-modal-title mb-3">
                                    <i className="fas fa-calculator me-2"></i>
                                    Стоимость найма:
                                </div>
                                
                                <Alert variant={cost.essence <= currentEssence ? "success" : "danger"} className="mass-total-info">
                                    <div className="row">
                                        <div className="col-6">
                                            <div className="mb-2">
                                                <div className="mass-total-label">Эссенция:</div>
                                                <div className={`mass-total-value ${cost.essence > currentEssence ? 'text-danger' : ''}`}>
                                                    {cost.essence}
                                                    <i className="fas fa-gem ms-1" style={{ fontSize: '0.8em' }}></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="mb-2">
                                                <div className="mass-total-label">Время найма:</div>
                                                <div className="mass-total-value">
                                                    {unit?.hireTime * quantity} мин
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {Object.entries(cost.resources).length > 0 && (
                                        <>
                                            <hr className="my-2" />
                                            <div className="mass-total-label mb-2">Дополнительные ресурсы (T{selectedTier}):</div>
                                            {Object.entries(cost.resources).map(([resourceCode, amount]) => (
                                                <div key={resourceCode} className="d-flex justify-content-between align-items-center mb-1">
                                                    <span>{getResourceName(resourceCode)}:</span>
                                                    <Badge bg="secondary">{amount}</Badge>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                    
                                    <hr className="my-2" />
                                    <div className="text-center">
                                        {cost.essence > currentEssence ? (
                                            <small className="text-danger">
                                                <i className="fas fa-exclamation-triangle me-1"></i>
                                                Недостаточно эссенции для найма
                                            </small>
                                        ) : (
                                            <small className="text-muted">
                                                <i className="fas fa-check-circle me-1"></i>
                                                Все условия для найма выполнены
                                            </small>
                                        )}
                                    </div>
                                </Alert>
                            </div>
                        </Form>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-between">
                {!selectedUnit ? (
                    <>
                        <div></div>
                        <Button 
                            variant="secondary" 
                            onClick={hideModal}
                            disabled={loading}
                            className="mass-cancel-btn"
                        >
                            <i className="fas fa-times me-2"></i>
                            Отмена
                        </Button>
                        <div></div>
                    </>
                ) : (
                    <>
                        <Button 
                            variant="secondary" 
                            onClick={() => setSelectedUnit(null)}
                            disabled={loading}
                            className="mass-cancel-btn"
                        >
                            <i className="fas fa-arrow-left me-2"></i>
                            Назад
                        </Button>
                        
                        <Button 
                            variant="primary"
                            onClick={handleHireUnit}
                            disabled={loading || cost.essence > currentEssence}
                            className="mass-submit-btn mass-submit-gold"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Наем...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-user-plus me-2"></i>
                                    Нанять {quantity} юнит(ов) {cost.essence > currentEssence && '(недостаточно ресурсов)'}
                                </>
                            )}
                        </Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
});

export default SettlementHireModal;