import React, { useContext, useState } from 'react';
import { Row, Col, Card, Badge, Button, Alert, Modal, Form, ProgressBar } from 'react-bootstrap';
import { observer } from "mobx-react-lite";
import { Context } from "../../index";

const SettlementRituals = observer(() => {
    const { settlement, guild, user } = useContext(Context);
    const [showRitualModal, setShowRitualModal] = useState(false);
    const [showOfferingModal, setShowOfferingModal] = useState(false);
    const [selectedRitual, setSelectedRitual] = useState(null);
    const [selectedResource, setSelectedResource] = useState(null);
    const [quantity, setQuantity] = useState(1);
    
    const buildings = settlement.buildings || {};
    const totem = buildings.totem;
    const ritualPlace = buildings.ritual_place;
    const storage = settlement.storage || {};
    const buffs = settlement.buffs || {};
    
    const currentBuff = buffs.current_buff;
    
    // Доступные ритуалы
    const availableRituals = [
        { name: "Благословение силы", attribute: "Сила", cost: { money: 10000, daleons: 50 } },
        { name: "Благословение ловкости", attribute: "Ловкость", cost: { money: 10000, daleons: 50 } },
        { name: "Благословение выносливости", attribute: "Выносливость", cost: { money: 10000, daleons: 50 } },
        { name: "Благословение восприятия", attribute: "Восприятие", cost: { money: 10000, daleons: 50 } },
        { name: "Благословение интеллекта", attribute: "Интеллект", cost: { money: 10000, daleons: 50 } },
        { name: "Благословение мудрости", attribute: "Мудрость", cost: { money: 10000, daleons: 50 } },
        { name: "Благословение харизмы", attribute: "Харизма", cost: { money: 10000, daleons: 50 } },
        { name: "Благословение удачи", attribute: "Удача", cost: { money: 10000, daleons: 50 } }
    ];
    
    // Ресурсы для подношения
    const offeringResources = [
        { code: "112", name: "Железная руда", value: 0.1 },
        { code: "114", name: "Бревно", value: 0.1 },
        { code: "115", name: "Мешок угля", value: 0.1 },
        { code: "116", name: "Песчаник", value: 0.1 },
        { code: "117", name: "Мешок песка", value: 0.1 },
        { code: "118", name: "Стекло", value: 0.1 },
        { code: "119", name: "Доска", value: 0.1 },
        { code: "120", name: "Сталь", value: 0.1 },
        { code: "121", name: "Каменный блок", value: 0.1 }
    ];
    
    const handlePerformRitual = (ritual) => {
        if (!ritualPlace) {
            alert('Для проведения ритуалов необходимо построить ритуальное место');
            return;
        }
        
        if (currentBuff) {
            alert(`На членов гильдии уже наложено благословение, до истечения ${currentBuff.time_left} минут`);
            return;
        }
        
        // Проверка ресурсов у пользователя
        const userMoney = user.user?.money || 0;
        const userDaleons = user.user?.daleons || 0;
        
        if (userMoney < ritual.cost.money) {
            alert('Недостаточно монет для проведения ритуала');
            return;
        }
        
        if (userDaleons < ritual.cost.daleons) {
            alert('Недостаточно далеонов для проведения ритуала');
            return;
        }
        
        setSelectedRitual(ritual);
        setShowRitualModal(true);
    };
    
    const handleMakeOffering = (resource) => {
        if (!totem) {
            alert('Для подношений необходим тотем');
            return;
        }
        
        const availableAmount = storage[resource.code] || 0;
        if (availableAmount <= 0) {
            alert('На складе нет этого ресурса');
            return;
        }
        
        setSelectedResource(resource);
        setQuantity(1);
        setShowOfferingModal(true);
    };
    
    const confirmRitual = () => {
        if (!selectedRitual) return;
        
        // settlement.performRitual({
        //     ritualName: selectedRitual.name,
        //     userId: guild.user?.id,
        //     guildId: guild.guildData?.id
        // });
        
        setShowRitualModal(false);
        setSelectedRitual(null);
    };
    
    const confirmOffering = () => {
        if (!selectedResource) return;
        
        // settlement.makeOffering({
        //     resourceCode: selectedResource.code,
        //     quantity: quantity,
        //     userId: guild.user?.id,
        //     guildId: guild.guildData?.id
        // });
        
        setShowOfferingModal(false);
        setSelectedResource(null);
        setQuantity(1);
    };
    
    return (
        <div>
            {/* Ритуальное место */}
            {ritualPlace ? (
                <Card className="fantasy-card mb-4">
                    <Card.Header className="fantasy-card-header fantasy-card-header-primary">
                        <h5 className="fantasy-text-gold mb-0">
                            <i className="fas fa-magic me-2"></i>
                            Ритуальное место (Уровень {ritualPlace.level})
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        {currentBuff ? (
                            <Alert variant="success" className="mb-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <i className="fas fa-shield-alt me-2"></i>
                                        <strong>Активное благословение:</strong> {currentBuff.buff_name}
                                    </div>
                                    <Badge bg="info">
                                        {currentBuff.time_left} мин.
                                    </Badge>
                                </div>
                            </Alert>
                        ) : (
                            <Alert variant="info" className="mb-4">
                                <i className="fas fa-info-circle me-2"></i>
                                Стоимость ритуала: 10,000 монет и 50 далеонов. 
                                Все члены гильдии получат временное усиление атрибута на 2 часа.
                            </Alert>
                        )}
                        
                        <h6 className="fantasy-text-dark mb-3">Доступные ритуалы:</h6>
                        <Row>
                            {availableRituals.map((ritual, index) => (
                                <Col md={6} lg={4} key={index}>
                                    <Card className="fantasy-card mb-3">
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h6 className="fantasy-text-gold mb-0">{ritual.name}</h6>
                                                <Badge bg="warning">+{ritualPlace.level * 2} {ritual.attribute}</Badge>
                                            </div>
                                            
                                            <div className="mb-3">
                                                <div className="d-flex justify-content-between mb-1">
                                                    <small className="text-muted">Монеты:</small>
                                                    <small className="text-muted">10,000</small>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <small className="text-muted">Далеоны:</small>
                                                    <small className="text-muted">50</small>
                                                </div>
                                            </div>
                                            
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm"
                                                className="fantasy-btn w-100"
                                                onClick={() => handlePerformRitual(ritual)}
                                                disabled={!!currentBuff}
                                            >
                                                <i className="fas fa-magic me-2"></i>
                                                Провести ритуал
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Card.Body>
                </Card>
            ) : (
                <Alert variant="warning" className="mb-4">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Для проведения ритуалов необходимо построить ритуальное место.
                </Alert>
            )}
            
            {/* Тотем */}
            {totem ? (
                <Card className="fantasy-card mb-4">
                    <Card.Header className="fantasy-card-header fantasy-card-header-warning">
                        <h5 className="fantasy-text-gold mb-0">
                            <i className="fas fa-totem me-2"></i>
                            Тотем (Уровень {totem.level})
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="mb-4">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="fantasy-text-dark">Божественная энергия:</span>
                                <span className="fantasy-text-dark">
                                    {totem.divine?.toFixed(1) || 0} / {totem.max_divine}
                                </span>
                            </div>
                            <ProgressBar 
                                now={(totem.divine / totem.max_divine) * 100} 
                                variant="success"
                                label={`${((totem.divine / totem.max_divine) * 100).toFixed(1)}%`}
                            />
                        </div>
                        
                        <Alert variant="info" className="mb-4">
                            <i className="fas fa-info-circle me-2"></i>
                            Подносите ресурсы тотему для получения божественной энергии. 
                            При заполнении шкалы гильдия получает награды.
                        </Alert>
                        
                        <h6 className="fantasy-text-dark mb-3">Ресурсы для подношения:</h6>
                        <Row>
                            {offeringResources.map((resource, index) => {
                                const availableAmount = storage[resource.code] || 0;
                                
                                return (
                                    <Col md={6} lg={4} key={index}>
                                        <Card className="fantasy-card mb-3">
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <h6 className="fantasy-text-gold mb-0">{resource.name}</h6>
                                                    <Badge bg="secondary">{availableAmount} шт.</Badge>
                                                </div>
                                                
                                                <div className="mb-3">
                                                    <small className="text-muted">
                                                        Энергия за единицу: {resource.value}
                                                    </small>
                                                </div>
                                                
                                                <Button 
                                                    variant="outline-success" 
                                                    size="sm"
                                                    className="fantasy-btn w-100"
                                                    onClick={() => handleMakeOffering(resource)}
                                                    disabled={availableAmount <= 0}
                                                >
                                                    <i className="fas fa-gift me-2"></i>
                                                    Поднести ресурс
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                        
                        <div className="text-center mt-4">
                            <Button 
                                variant="outline-warning" 
                                className="fantasy-btn"
                                onClick={() => {
                                    // settlement.makeOfferingAll({ userId: guild.user?.id, guildId: guild.guildData?.id });
                                }}
                            >
                                <i className="fas fa-boxes me-2"></i>
                                Поднести все доступные ресурсы
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            ) : (
                <Alert variant="warning" className="mb-4">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Для подношений необходим тотем.
                </Alert>
            )}
            
            {/* Модалка ритуала */}
            <Modal show={showRitualModal} onHide={() => setShowRitualModal(false)} centered>
                <Modal.Header closeButton className="fantasy-card-header">
                    <Modal.Title className="fantasy-text-gold">
                        <i className="fas fa-magic me-2"></i>
                        Подтверждение ритуала
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedRitual && (
                        <>
                            <p>Вы собираетесь провести ритуал: <strong>{selectedRitual.name}</strong></p>
                            <p>Стоимость: 10,000 монет и 50 далеонов</p>
                            <p>Длительность: 2 часа</p>
                            <p>Все члены гильдии получат усиление атрибута <strong>{selectedRitual.attribute}</strong></p>
                            
                            <Alert variant="warning">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                Ритуал имеет шанс успеха в зависимости от уровня ритуального места.
                            </Alert>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRitualModal(false)}>
                        Отмена
                    </Button>
                    <Button variant="primary" onClick={confirmRitual}>
                        Провести ритуал
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* Модалка подношения */}
            <Modal show={showOfferingModal} onHide={() => setShowOfferingModal(false)} centered>
                <Modal.Header closeButton className="fantasy-card-header">
                    <Modal.Title className="fantasy-text-gold">
                        <i className="fas fa-gift me-2"></i>
                        Поднести ресурс
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedResource && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Количество {selectedResource.name} для подношения:
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    max={storage[selectedResource.code] || 0}
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, storage[selectedResource.code] || 0))}
                                />
                                <Form.Text className="text-muted">
                                    Доступно на складе: {storage[selectedResource.code] || 0} шт.
                                    <br />
                                    Полученная энергия: {(selectedResource.value * quantity).toFixed(2)}
                                </Form.Text>
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowOfferingModal(false)}>
                        Отмена
                    </Button>
                    <Button variant="success" onClick={confirmOffering}>
                        Поднести
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
});

export default SettlementRituals;