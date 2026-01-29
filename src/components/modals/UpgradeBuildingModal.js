import React, { useState, useEffect } from 'react';
import { Modal, Button, ProgressBar, Badge, Alert, Spinner } from 'react-bootstrap';
import { getResourceInfo } from '../../utils/resourceHelpers';
import { formatTime } from '../../utils/timeFormatter';

const getResourceAmount = (storage, resourceId) => {
    const resourceObj = storage[resourceId];
    if (!resourceObj) return 0;
    
    if (typeof resourceObj === 'object' && resourceObj !== null && 'count' in resourceObj) {
        return resourceObj.count || 0;
    }
    
    if (typeof resourceObj === 'number') {
        return resourceObj;
    }
    
    return 0;
};

const UpgradeBuildingModal = ({
    selectedBuilding,
    showUpgradeModal,
    setShowUpgradeModal,
    construction,
    getPossibleConcurrentConstructions,
    renderResources,
    handleStartConstruction,
    showNotification,
    buildings,
    storage,
    loading,
    getResourceInfo,
    currentEssence,
    getResourceAmount: propGetResourceAmount,
    settlementService,
    guildId,
    userRole
}) => {
    const [resourcesProgress, setResourcesProgress] = useState({});
    
    const safeGetResourceAmount = propGetResourceAmount || getResourceAmount;
    
    useEffect(() => {
        if (selectedBuilding) {
            const progress = {};
            const { resources, essence } = selectedBuilding;
            
            if (resources && typeof resources === 'object') {
                Object.entries(resources).forEach(([resourceId, requiredAmount]) => {
                    const availableAmount = safeGetResourceAmount(storage, resourceId);
                    const percentage = Math.min((availableAmount / requiredAmount) * 100, 100);
                    progress[resourceId] = {
                        required: requiredAmount,
                        available: availableAmount,
                        percentage: percentage,
                        hasEnough: availableAmount >= requiredAmount
                    };
                });
            }
            
            if (essence > 0) {
                const percentage = Math.min((currentEssence / essence) * 100, 100);
                progress['essence'] = {
                    required: essence,
                    available: currentEssence,
                    percentage: percentage,
                    hasEnough: currentEssence >= essence
                };
            }
            
            setResourcesProgress(progress);
        }
    }, [selectedBuilding, storage, currentEssence, safeGetResourceAmount]);
    
    if (!selectedBuilding) return null;
    
    const { 
        key, 
        name, 
        currentLevel, 
        targetLevel, 
        resources, 
        essence, 
        constructionTime,
        isNewConstruction,
        progressPercentage
    } = selectedBuilding;
    
    const calculateTotalProgress = () => {
        if (!resourcesProgress || Object.keys(resourcesProgress).length === 0) {
            return 0;
        }
        
        const totalRequired = Object.values(resourcesProgress).reduce(
            (sum, resource) => sum + resource.required, 0
        );
        const totalAvailable = Object.values(resourcesProgress).reduce(
            (sum, resource) => sum + resource.available, 0
        );
        
        return totalRequired > 0 ? Math.min((totalAvailable / totalRequired) * 100, 100) : 100;
    };
    
    const totalProgress = calculateTotalProgress();
    
    return (
        <Modal 
            show={showUpgradeModal} 
            onHide={() => setShowUpgradeModal(false)} 
            size="lg"
            className="fantasy-modal"
        >
            <Modal.Header closeButton className={`fantasy-card-header fantasy-card-header-${isNewConstruction ? "success" : "primary"}`}>
                <Modal.Title>
                    {isNewConstruction ? (
                        <><i className="fas fa-plus-circle me-2"></i>Новое строительство: {name}</>
                    ) : (
                        <><i className="fas fa-arrow-up me-2"></i>Улучшение здания: {name}</>
                    )}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert variant="info" className="fantasy-alert">
                    <i className="fas fa-info-circle me-2"></i>
                    <div>
                        <strong>Новая система строительства:</strong>
                        <ul className="mt-2 mb-0">
                            <li>Начав стройку, вы добавите здание в список строящихся</li>
                            <li>Ресурсы можно добавлять постепенно в процессе</li>
                            <li>Когда все ресурсы будут собраны, можно будет начать непосредственное строительство</li>
                        </ul>
                    </div>
                </Alert>
                
                <div className="mb-4">
                    <h6>Уровни:</h6>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="text-center">
                            <div className="fantasy-text-muted">Текущий</div>
                            <Badge bg="secondary" className="p-2 fs-6">{currentLevel}</Badge>
                        </div>
                        <div className="flex-grow-1 mx-3">
                            <div className="progress" style={{ height: '10px' }}>
                                <div className="progress-bar bg-primary" role="progressbar" style={{ width: '100%' }} />
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="fantasy-text-muted">Новый</div>
                            <Badge bg="primary" className="p-2 fs-6">{targetLevel}</Badge>
                        </div>
                    </div>
                </div>
                
                <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">Необходимые ресурсы:</h6>
                        <Badge bg={progressPercentage >= 100 ? "success" : progressPercentage >= 50 ? "warning" : "danger"}>
                            {Math.round(progressPercentage || totalProgress)}%
                        </Badge>
                    </div>
                    
                    {totalProgress > 0 && (
                        <div className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                                <small className="fantasy-text-muted">Доступность ресурсов:</small>
                                <small className="fantasy-text-dark">
                                    {Object.values(resourcesProgress).reduce((sum, r) => sum + r.available, 0)}/
                                    {Object.values(resourcesProgress).reduce((sum, r) => sum + r.required, 0)}
                                </small>
                            </div>
                            <ProgressBar 
                                now={totalProgress}
                                variant={totalProgress >= 100 ? "success" : totalProgress >= 50 ? "warning" : "danger"}
                                animated={totalProgress < 100}
                            />
                        </div>
                    )}
                    
                    <div className="fantasy-card p-3">
                        {renderResources(resources, essence)}
                        <div className="mt-3 fantasy-text-muted small border-top pt-2">
                            <i className="fas fa-info-circle me-1"></i>
                            <strong>Важно:</strong> Ресурсы можно будет добавлять постепенно после начала строительства
                        </div>
                    </div>
                </div>
                
                <div className="mb-4">
                    <h6>Время строительства:</h6>
                    <div className="fantasy-card p-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                                <i className="fas fa-clock fa-2x me-3 text-info"></i>
                                <div>
                                    <div className="fantasy-text-dark fs-5">{formatTime(constructionTime)}</div>
                                    <small className="fantasy-text-muted">
                                        После запуска строительства
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <Alert variant={Object.keys(construction).length >= getPossibleConcurrentConstructions ? "danger" : "info"}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <i className="fas fa-info-circle me-2"></i>
                            <strong>Одновременные стройки:</strong>
                            <div className="mt-1">
                                Текущие: <Badge bg={Object.keys(construction).length >= getPossibleConcurrentConstructions ? "danger" : "secondary"}>
                                    {Object.keys(construction).length}
                                </Badge>
                                {' '}/{' '}
                                Максимум: <Badge bg="info">{getPossibleConcurrentConstructions}</Badge>
                            </div>
                        </div>
                        {Object.keys(construction).length >= getPossibleConcurrentConstructions && (
                            <Badge bg="danger">
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                Лимит достигнут!
                            </Badge>
                        )}
                    </div>
                </Alert>
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-between border-top border-secondary">
                <Button variant="secondary" onClick={() => setShowUpgradeModal(false)} disabled={loading}>
                    Отмена
                </Button>
                <Button 
                    variant={isNewConstruction ? "success" : "primary"}
                    onClick={() => handleStartConstruction(selectedBuilding)}
                    disabled={loading || Object.keys(construction).length >= getPossibleConcurrentConstructions}
                >
                    {loading ? (
                        <><Spinner animation="border" size="sm" className="me-2" />Добавляем в очередь...</>
                    ) : isNewConstruction ? (
                        <><i className="fas fa-hammer me-2"></i>Добавить в список строек</>
                    ) : (
                        <><i className="fas fa-arrow-up me-2"></i>Начать улучшение</>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UpgradeBuildingModal;