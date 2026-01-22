import React, { useContext, useState, useEffect } from 'react';
import { observer } from "mobx-react-lite";
import { Context } from "../../index";
import { Modal, Button, Form, Row, Col, Alert, ListGroup, Badge } from 'react-bootstrap';

const SettlementConstructionModal = observer(() => {
    const { settlement, guild } = useContext(Context);
    const [resourcesSource, setResourcesSource] = useState('storage');
    const [requirements, setRequirements] = useState(null);
    const [loadingRequirements, setLoadingRequirements] = useState(false);
    
    useEffect(() => {
        if (settlement.modal.type === 'construction' && settlement.modal.data) {
            loadBuildingRequirements();
        }
    }, [settlement.modal]);
    
    const loadBuildingRequirements = async () => {
        if (!settlement.modal.data || !guild.guildData?.id) return;
        
        setLoadingRequirements(true);
        try {
            const buildingKey = settlement.modal.data.building;
            const targetLevel = settlement.modal.data.level;
            
            // Получаем требования из store
            const req = settlement.getBuildingRequirements(buildingKey, targetLevel);
            setRequirements(req);
        } catch (error) {
            console.error("Error loading requirements:", error);
        } finally {
            setLoadingRequirements(false);
        }
    };
    
    const handleClose = () => {
        settlement.closeModal();
        setResourcesSource('storage');
        setRequirements(null);
    };
    
    const handleSubmit = async () => {
        if (!settlement.modal.data || !guild.guildData?.id) return;
        
        const buildingKey = settlement.modal.data.building;
        const targetLevel = settlement.modal.data.level;
        
        const result = await settlement.constructBuilding(
            guild.guildData.id,
            buildingKey,
            targetLevel,
            resourcesSource
        );
        
        if (result.success) {
            handleClose();
        }
    };
    
    if (!settlement.modal.data) return null;
    
    const buildingData = settlement.modal.data;
    const canConstruct = settlement.canConstructBuilding(buildingData.building, buildingData.level);
    
    return (
        <Modal show={settlement.modal.type === 'construction'} onHide={handleClose} size="lg">
            <Modal.Header closeButton className="fantasy-card-header">
                <Modal.Title>
                    <i className="fas fa-hammer me-2"></i>
                    {buildingData.currentLevel === 0 ? 'Строительство' : 'Улучшение'}: {buildingData.name}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loadingRequirements ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Загрузка...</span>
                        </div>
                        <p className="mt-2">Загрузка требований...</p>
                    </div>
                ) : requirements ? (
                    <>
                        <Alert variant={canConstruct ? "info" : "warning"}>
                            <i className={`fas fa-${canConstruct ? 'info-circle' : 'exclamation-triangle'} me-2`}></i>
                            {buildingData.currentLevel === 0 
                                ? `Вы начинаете строительство нового здания. Требуемый уровень: ${buildingData.level}`
                                : `Вы улучшаете здание с уровня ${buildingData.currentLevel} до уровня ${buildingData.level}`}
                        </Alert>
                        
                        <h5>Требуемые ресурсы:</h5>
                        <ListGroup className="mb-3">
                            {/* Воплощения */}
                            {requirements.essence > 0 && (
                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <i className="fas fa-heart text-danger me-2"></i>
                                        <span>Воплощения</span>
                                    </div>
                                    <div>
                                        <Badge bg={settlement.currentEssence >= requirements.essence ? "success" : "danger"}>
                                            {requirements.essence}
                                        </Badge>
                                        <small className="text-muted ms-2">
                                            (доступно: {settlement.currentEssence})
                                        </small>
                                    </div>
                                </ListGroup.Item>
                            )}
                            
                            {/* Ресурсы */}
                            {Object.entries(requirements.resources || {}).map(([resourceId, amount]) => {
                                const available = settlement.storage[resourceId] || 0;
                                const hasEnough = available >= amount;
                                
                                return (
                                    <ListGroup.Item key={resourceId} className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <i className={`fas ${settlement.getResourceIcon(resourceId)} me-2`}></i>
                                            <span>{settlement.getResourceName(resourceId)}</span>
                                        </div>
                                        <div>
                                            <Badge bg={hasEnough ? "success" : "danger"}>
                                                {amount}
                                            </Badge>
                                            <small className="text-muted ms-2">
                                                (на складе: {available})
                                            </small>
                                        </div>
                                    </ListGroup.Item>
                                );
                            })}
                        </ListGroup>
                        
                        {/* Время строительства */}
                        {requirements.construction_time && (
                            <div className="mb-3">
                                <h6>Время строительства:</h6>
                                <Badge bg="secondary" className="p-2">
                                    <i className="fas fa-clock me-2"></i>
                                    {requirements.construction_time} минут
                                </Badge>
                            </div>
                        )}
                        
                        {/* Требуемые здания */}
                        {requirements.required_buildings && Object.keys(requirements.required_buildings).length > 0 && (
                            <div className="mb-3">
                                <h6>Требуемые здания:</h6>
                                <ListGroup>
                                    {Object.entries(requirements.required_buildings).map(([buildingKey, requiredLevel]) => {
                                        const buildingLevel = settlement.buildings[buildingKey]?.level || 0;
                                        const hasRequired = buildingLevel >= requiredLevel;
                                        const buildingName = settlement.getBuildingName(buildingKey, settlement.type);
                                        
                                        return (
                                            <ListGroup.Item key={buildingKey} className="d-flex justify-content-between align-items-center">
                                                <span>{buildingName}</span>
                                                <Badge bg={hasRequired ? "success" : "danger"}>
                                                    Ур. {buildingLevel} / {requiredLevel}
                                                </Badge>
                                            </ListGroup.Item>
                                        );
                                    })}
                                </ListGroup>
                            </div>
                        )}
                        
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Источник ресурсов:</Form.Label>
                                <Form.Select 
                                    value={resourcesSource} 
                                    onChange={(e) => setResourcesSource(e.target.value)}
                                    disabled={!canConstruct}
                                >
                                    <option value="storage">Со склада поселения</option>
                                    <option value="inventory">Из моего инвентаря</option>
                                    <option value="both">Со склада, если недостаточно - из инвентаря</option>
                                </Form.Select>
                                <Form.Text className="text-muted">
                                    Ресурсы будут списаны в указанном порядке
                                </Form.Text>
                            </Form.Group>
                        </Form>
                    </>
                ) : (
                    <Alert variant="danger">
                        Не удалось загрузить требования для строительства
                    </Alert>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Отмена
                </Button>
                <Button 
                    variant={canConstruct ? "primary" : "danger"}
                    onClick={handleSubmit}
                    disabled={settlement.loading || !canConstruct}
                >
                    {settlement.loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Обработка...
                        </>
                    ) : !canConstruct ? (
                        "Недостаточно ресурсов"
                    ) : buildingData.currentLevel === 0 ? (
                        "Начать строительство"
                    ) : (
                        "Начать улучшение"
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
});

export default SettlementConstructionModal;