import React, { useContext } from 'react';
import { Card, Alert, Button, Row, Col, Badge } from 'react-bootstrap';
import { observer } from "mobx-react-lite";
import { Context } from "../../index";

const SettlementMissions = observer(() => {
    const { settlement } = useContext(Context);
    const missions = settlement.missions || {};
    
    return (
        <div>
            <Card className="fantasy-card mb-4">
                <Card.Header className="fantasy-card-header fantasy-card-header-primary">
                    <h5 className="fantasy-text-gold mb-0">
                        <i className="fas fa-scroll me-2"></i>
                        Миссии поселения
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Alert variant="info" className="mb-4">
                        <i className="fas fa-info-circle me-2"></i>
                        Система миссий находится в разработке. В будущем здесь будут доступны:
                        <ul className="mt-2 mb-0">
                            <li>Разведка территорий</li>
                            <li>Диверсии во вражеских поселениях</li>
                            <li>Атаки на вражеские гарнизоны</li>
                            <li>Убийства важных персонажей</li>
                        </ul>
                    </Alert>
                    
                    <Row className="g-3">
                        <Col md={6}>
                            <Card className="fantasy-card h-100">
                                <Card.Header className="fantasy-card-header">
                                    <h6 className="fantasy-text-gold mb-0">Разведка</h6>
                                </Card.Header>
                                <Card.Body>
                                    <p className="fantasy-text-muted small">
                                        Отправьте героя на разведку территорий для получения информации о ресурсах и врагах.
                                    </p>
                                    <Button 
                                        variant="outline-primary" 
                                        size="sm"
                                        className="fantasy-btn w-100"
                                        disabled
                                    >
                                        <i className="fas fa-eye me-2"></i>
                                        Отправить разведчика
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        <Col md={6}>
                            <Card className="fantasy-card h-100">
                                <Card.Header className="fantasy-card-header">
                                    <h6 className="fantasy-text-gold mb-0">Диверсии</h6>
                                </Card.Header>
                                <Card.Body>
                                    <p className="fantasy-text-muted small">
                                        Проведите диверсионные операции во вражеских поселениях.
                                    </p>
                                    <Button 
                                        variant="outline-warning" 
                                        size="sm"
                                        className="fantasy-btn w-100"
                                        disabled
                                    >
                                        <i className="fas fa-fire me-2"></i>
                                        Провести диверсию
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        <Col md={6}>
                            <Card className="fantasy-card h-100">
                                <Card.Header className="fantasy-card-header">
                                    <h6 className="fantasy-text-gold mb-0">Атаки</h6>
                                </Card.Header>
                                <Card.Body>
                                    <p className="fantasy-text-muted small">
                                        Атакуйте вражеские гарнизоны для захвата территорий и ресурсов.
                                    </p>
                                    <Button 
                                        variant="outline-danger" 
                                        size="sm"
                                        className="fantasy-btn w-100"
                                        disabled
                                    >
                                        <i className="fas fa-crosshairs me-2"></i>
                                        Атаковать
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        <Col md={6}>
                            <Card className="fantasy-card h-100">
                                <Card.Header className="fantasy-card-header">
                                    <h6 className="fantasy-text-gold mb-0">Убийства</h6>
                                </Card.Header>
                                <Card.Body>
                                    <p className="fantasy-text-muted small">
                                        Устраните важных вражеских персонажей для ослабления противника.
                                    </p>
                                    <Button 
                                        variant="outline-dark" 
                                        size="sm"
                                        className="fantasy-btn w-100"
                                        disabled
                                    >
                                        <i className="fas fa-skull me-2"></i>
                                        Устранить цель
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </div>
    );
});

export default SettlementMissions;