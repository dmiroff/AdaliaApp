import React, { useState } from 'react';
import { Modal, Table, ProgressBar, Badge, Button, Alert, Tabs, Tab, Spinner } from 'react-bootstrap';
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

// Вспомогательная функция для безопасного доступа к currentResources
const getCurrentResourceAmount = (currentResources, resourceKey) => {
    if (!currentResources) return 0;
    
    // Пробуем несколько вариантов ключа, так как могут быть разные форматы
    const keyStr = String(resourceKey);
    const keyNum = Number(resourceKey);
    
    return currentResources[keyStr] || currentResources[keyNum] || 
           currentResources[resourceKey] || 0;
};

const ConstructionTab = ({ 
    construction, 
    buildingsData, 
    showNotification,
    settlementService,
    guildId,
    settlement,
    getBuildingName,
    getResourceInfo,
    storage,
    currentEssence,
    userRole,
    setLocalConstruction,
    localConstruction
}) => {
    const [loading, setLoading] = useState({});
    const [addResourcesLoading, setAddResourcesLoading] = useState({});
    const [startBuildingLoading, setStartBuildingLoading] = useState({});
    
    if (Object.keys(construction).length === 0) {
        return (
            <div className="text-center py-5">
                <i className="fas fa-hammer fa-3x text-muted mb-3"></i>
                <p className="fantasy-text-muted">Нет текущих строек</p>
                <small className="fantasy-text-muted">
                    Начните строительство здания в разделе "Постройки поселения"
                </small>
            </div>
        );
    }
    
    const areAllResourcesCollected = (constrData) => {
        if (!constrData?.required || !constrData?.current) return false;
        
        const allResourcesCollected = Object.entries(constrData.required).every(([resourceKey, requiredAmount]) => {
            if (resourceKey === 'essence') return true;
            const currentAmount = getCurrentResourceAmount(constrData.current, resourceKey);
            return currentAmount >= requiredAmount;
        });
        
        const essenceCollected = constrData.current_essence >= (constrData.required.essence || 0);
        
        return allResourcesCollected && essenceCollected;
    };
    
    const isBuildingInProgress = (constrData) => {
        return constrData?.status === 'building' || constrData?.construction_started;
    };
    
    // Функция для расчета прогресса строительства
    const calculateConstructionProgress = (constrData) => {
        const requiredResources = constrData?.required || {};
        const currentResources = constrData?.current || {};
        const currentEssenceAmount = constrData?.current_essence || 0;
        
        let totalRequired = 0;
        let totalCurrent = 0;
        
        Object.entries(requiredResources).forEach(([resourceKey, requiredAmount]) => {
            if (resourceKey === 'essence') {
                totalRequired += requiredAmount;
                totalCurrent += Math.min(currentEssenceAmount, requiredAmount);
            } else {
                totalRequired += requiredAmount;
                const currentAmount = getCurrentResourceAmount(currentResources, resourceKey);
                totalCurrent += Math.min(currentAmount, requiredAmount);
            }
        });
        
        const percentage = totalRequired > 0 ? (totalCurrent / totalRequired) * 100 : 0;
        return { percentage, totalRequired, totalCurrent };
    };
    
    const handleAddResources = async (buildingKey, constrData) => {
        if (!settlementService || !guildId) {
            showNotification('error', 'Ошибка: не указаны необходимые данные');
            return;
        }
        
        setAddResourcesLoading(prev => ({ ...prev, [buildingKey]: true }));
        
        try {
            const resourcesToAdd = {};
            let essenceToAdd = 0;
            
            const { required = {}, current = {}, current_essence = 0 } = constrData;
            
            Object.entries(required).forEach(([resourceKey, requiredAmount]) => {
                if (resourceKey === 'essence') {
                    const currentEssence = current_essence || 0;
                    if (currentEssence < requiredAmount) {
                        const availableEssence = currentEssence;
                        const missingEssence = requiredAmount - currentEssence;
                        if (availableEssence >= missingEssence) {
                            essenceToAdd = missingEssence;
                        } else {
                            essenceToAdd = availableEssence;
                        }
                    }
                } else {
                    const currentAmount = getCurrentResourceAmount(current, resourceKey);
                    if (currentAmount < requiredAmount) {
                        const availableAmount = getResourceAmount(storage, resourceKey);
                        const missingAmount = requiredAmount - currentAmount;
                        const amountToAdd = Math.min(availableAmount, missingAmount);
                        
                        if (amountToAdd > 0) {
                            resourcesToAdd[resourceKey] = amountToAdd;
                        }
                    }
                }
            });
            
            if (Object.keys(resourcesToAdd).length === 0 && essenceToAdd === 0) {
                showNotification('info', 'Все ресурсы уже собраны');
                return;
            }
            
            const result = await settlementService.contributeToConstruction(
                guildId, 
                buildingKey, 
                resourcesToAdd, 
                essenceToAdd
            );
            
            if (result.status === 200) {
                showNotification('success', result.message || 'Ресурсы успешно добавлены');
                
                // Локально обновляем состояние с добавленными ресурсами
                const updatedConstructionData = result.data || constrData;
                if (setLocalConstruction && localConstruction) {
                    setLocalConstruction({
                        ...localConstruction,
                        [buildingKey]: updatedConstructionData
                    });
                }
                
                // Обновляем данные поселения
                if (settlement?.fetchData) {
                    await settlement.fetchData();
                }
            } else {
                showNotification('error', result.message || 'Ошибка при добавлении ресурсов');
            }
        } catch (error) {
            console.error('Ошибка при добавлении ресурсов:', error);
            showNotification('error', 'Ошибка при добавлении ресурсов');
        } finally {
            setAddResourcesLoading(prev => ({ ...prev, [buildingKey]: false }));
        }
    };
    
    const handleStartBuilding = async (buildingKey) => {
        if (!settlementService || !guildId) {
            showNotification('error', 'Ошибка: не указаны необходимые данные');
            return;
        }
        
        setStartBuildingLoading(prev => ({ ...prev, [buildingKey]: true }));
        
        try {
            const result = await settlementService.startBuildingConstruction(guildId, buildingKey);
            
            if (result.status === 200) {
                showNotification('success', result.message || 'Строительство начато!');
                
                // Локально обновляем статус строительства
                const updatedConstructionData = result.data || construction[buildingKey];
                if (setLocalConstruction && localConstruction) {
                    setLocalConstruction({
                        ...localConstruction,
                        [buildingKey]: {
                            ...updatedConstructionData,
                            status: 'building',
                            construction_started: new Date().toISOString()
                        }
                    });
                }
                
                if (settlement?.fetchData) {
                    await settlement.fetchData();
                }
            } else {
                showNotification('error', result.message || 'Ошибка при запуске строительства');
            }
        } catch (error) {
            console.error('Ошибка при запуске строительства:', error);
            showNotification('error', 'Ошибка при запуске строительства');
        } finally {
            setStartBuildingLoading(prev => ({ ...prev, [buildingKey]: false }));
        }
    };
    
    const handleCancelConstruction = async (buildingKey) => {
        if (!window.confirm('Вы уверены, что хотите отменить строительство? Часть ресурсов может быть потеряна.')) {
            return;
        }
        
        if (!settlementService || !guildId) {
            showNotification('error', 'Ошибка: не указаны необходимые данные');
            return;
        }
        
        setLoading(prev => ({ ...prev, [buildingKey]: true }));
        
        try {
            const result = await settlementService.cancelConstruction(guildId, buildingKey);
            
            if (result.status === 200) {
                showNotification('success', result.message || 'Строительство отменено');
                
                // Локально удаляем строительство
                if (setLocalConstruction && localConstruction) {
                    const { [buildingKey]: removed, ...rest } = localConstruction;
                    setLocalConstruction(rest);
                }
                
                if (settlement?.fetchData) {
                    await settlement.fetchData();
                }
            } else {
                showNotification('error', result.message || 'Ошибка при отмене строительства');
            }
        } catch (error) {
            console.error('Ошибка при отмене строительства:', error);
            showNotification('error', 'Ошибка при отмене строительства');
        } finally {
            setLoading(prev => ({ ...prev, [buildingKey]: false }));
        }
    };
    
    return (
        <div className="table-responsive">
            <Table hover className="fantasy-table">
                <thead>
                    <tr>
                        <th>Здание</th>
                        <th>Уровень</th>
                        <th>Прогресс ресурсов</th>
                        <th>Время</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(construction).map(([buildingKey, constrData]) => {
                        if (!constrData) return null;
                        
                        const buildingName = getBuildingName(buildingKey, buildingsData[buildingKey]);
                        const timeLeft = constrData?.construction_time_left || 0;
                        const totalTime = constrData?.construction_time_total || constrData?.construction_time || 60;
                        const requiredResources = constrData?.required || {};
                        const currentResources = constrData?.current || {};
                        const currentEssenceAmount = constrData?.current_essence || 0;
                        
                        const allResourcesCollected = areAllResourcesCollected(constrData);
                        const buildingInProgress = isBuildingInProgress(constrData);
                        const canStartBuilding = allResourcesCollected && !buildingInProgress;
                        
                        // Рассчитываем прогресс
                        const progress = calculateConstructionProgress(constrData);
                        const overallProgress = progress.percentage;
                        const totalRequired = progress.totalRequired;
                        const totalCurrent = progress.totalCurrent;
                        
                        return (
                            <tr key={buildingKey}>
                                <td className="fantasy-text-dark">
                                    <div>
                                        <strong>{buildingName}</strong>
                                    </div>
                                </td>
                                <td>
                                    <Badge bg="warning">
                                        {constrData?.level - 1 || 0} → {constrData?.level || 1}
                                    </Badge>
                                </td>
                                <td style={{ minWidth: '300px' }}>
                                    {buildingInProgress ? (
                                        <div className="mb-2">
                                            <Badge bg="success" className="mb-2">
                                                <i className="fas fa-hammer me-1"></i>
                                                В процессе строительства
                                            </Badge>
                                        </div>
                                    ) : canStartBuilding ? (
                                        <div className="mb-2">
                                            <Badge bg="primary" className="mb-2">
                                                <i className="fas fa-check-circle me-1"></i>
                                                Все ресурсы собраны
                                            </Badge>
                                        </div>
                                    ) : (
                                        <div className="mb-2">
                                            <Badge bg="warning" className="mb-2">
                                                <i className="fas fa-clock me-1"></i>
                                                Ожидает ресурсов
                                            </Badge>
                                        </div>
                                    )}
                                    
                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between mb-1">
                                            <small className="fantasy-text-muted">Общий прогресс:</small>
                                            <small className={overallProgress >= 100 ? 'fantasy-text-dark' : 'fantasy-text-dark'}>
                                                {Math.round(overallProgress)}% ({Math.round(totalCurrent)}/{totalRequired})
                                            </small>
                                        </div>
                                        <ProgressBar 
                                            now={overallProgress}
                                            variant={overallProgress >= 100 ? "success" : "warning"}
                                            style={{ height: '10px' }}
                                        />
                                    </div>
                                    
                                    {Object.entries(requiredResources).map(([resourceKey, requiredAmount]) => {
                                        let currentAmount, resourceName, icon, color;
                                        
                                        if (resourceKey === 'essence') {
                                            currentAmount = currentEssenceAmount;
                                            resourceName = 'Воплощение';
                                            icon = 'fas fa-star';
                                            color = 'primary';
                                        } else {
                                            currentAmount = getCurrentResourceAmount(currentResources, resourceKey);
                                            const resourceInfo = getResourceInfo(resourceKey);
                                            resourceName = resourceInfo?.name || `Ресурс ${resourceKey}`;
                                            icon = resourceInfo?.icon || 'fas fa-box';
                                            color = resourceInfo?.color || 'secondary';
                                        }
                                        
                                        const percentage = requiredAmount > 0 ? Math.min((currentAmount / requiredAmount) * 100, 100) : 0;
                                        const missingAmount = Math.max(0, requiredAmount - currentAmount);
                                        
                                        return (
                                            <div key={resourceKey} className="mb-2">
                                                <div className="d-flex justify-content-between mb-1">
                                                    <small className="fantasy-text-muted">
                                                        <i className={`${icon} me-1 text-${color}`}></i>
                                                        {resourceName}:
                                                    </small>
                                                    <small className={percentage >= 100 ? 'fantasy-text-dark' : 'fantasy-text-dark'}>
                                                        {currentAmount}/{requiredAmount}
                                                        {missingAmount > 0 && ` (-${missingAmount})`}
                                                    </small>
                                                </div>
                                                <ProgressBar 
                                                    now={percentage}
                                                    variant={percentage >= 100 ? "success" : percentage >= 50 ? "warning" : "danger"}
                                                    style={{ height: '6px' }}
                                                />
                                            </div>
                                        );
                                    })}
                                </td>
                                <td>
                                    {buildingInProgress ? (
                                        <>
                                            <div className="fantasy-text-dark">
                                                <i className="fas fa-clock me-1 text-info"></i>
                                                {formatTime(timeLeft)}
                                            </div>
                                            <small className="fantasy-text-muted">
                                                Всего: {formatTime(totalTime)}
                                            </small>
                                            <div className="mt-1">
                                                <small className={timeLeft === 0 ? 'fantasy-text-dark' : 'fantasy-text-dark'}>
                                                    {timeLeft === 0 ? 'Готово!' : `${Math.round((totalTime - timeLeft) / totalTime * 100)}% выполнено`}
                                                </small>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="fantasy-text-muted">
                                            <small>Начнется после запуска</small>
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {buildingInProgress ? (
                                        <Badge bg="success">Строится</Badge>
                                    ) : canStartBuilding ? (
                                        <Badge bg="primary">Готово к запуску</Badge>
                                    ) : (
                                        <Badge bg="warning">Ожидает ресурсов</Badge>
                                    )}
                                </td>
                                <td>
                                    <div className="d-grid gap-2">
                                        {!allResourcesCollected && !buildingInProgress && (
                                            <Button 
                                                variant="outline-success" 
                                                size="sm"
                                                onClick={() => handleAddResources(buildingKey, constrData)}
                                                disabled={addResourcesLoading[buildingKey]}
                                                className="w-100"
                                            >
                                                {addResourcesLoading[buildingKey] ? (
                                                    <Spinner animation="border" size="sm" className="me-1" />
                                                ) : (
                                                    <i className="fas fa-plus me-1"></i>
                                                )}
                                                Добавить ресурсы
                                            </Button>
                                        )}
                                        
                                        {canStartBuilding && !buildingInProgress && (
                                            <Button 
                                                variant="primary" 
                                                size="sm"
                                                onClick={() => handleStartBuilding(buildingKey)}
                                                disabled={startBuildingLoading[buildingKey]}
                                                className="w-100"
                                            >
                                                {startBuildingLoading[buildingKey] ? (
                                                    <Spinner animation="border" size="sm" className="me-1" />
                                                ) : (
                                                    <i className="fas fa-play me-1"></i>
                                                )}
                                                Начать строительство
                                            </Button>
                                        )}
                                        
                                        {(userRole === 'leader' || userRole === 'officer') && !buildingInProgress && (
                                            <Button 
                                                variant="outline-danger" 
                                                size="sm"
                                                onClick={() => handleCancelConstruction(buildingKey)}
                                                disabled={loading[buildingKey]}
                                                className="w-100"
                                            >
                                                {loading[buildingKey] ? (
                                                    <Spinner animation="border" size="sm" className="me-1" />
                                                ) : (
                                                    <i className="fas fa-times me-1"></i>
                                                )}
                                                Отменить стройку
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </div>
    );
};

const CurrentConstructionsModal = ({
    showCurrentConstructionsModal,
    setShowCurrentConstructionsModal,
    activeTab,
    setActiveTab,
    construction,
    buildingsData,
    showNotification,
    getBuildingName,
    getResourceInfo,
    settlementService,
    guildId,
    settlement,
    storage,
    currentEssence,
    userRole,
    setLocalConstruction,
    localConstruction
}) => {
    return (
        <Modal 
            show={showCurrentConstructionsModal} 
            onHide={() => setShowCurrentConstructionsModal(false)} 
            size="xl"
            className="fantasy-modal"
        >
            <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
                <Modal.Title className="fantasy-text-dark">
                    <i className="fas fa-hammer me-2"></i>
                    Текущие стройки ({Object.keys(construction).length})
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3 fantasy-tabs">
                    <Tab eventKey="current" title={
                        <span className="fantasy-text-dark">
                            <i className="fas fa-tools me-1"></i>
                            Текущие стройки ({Object.keys(construction).length})
                        </span>
                    }>
                        <div className="p-3">
                            <Alert variant="info" className="fantasy-alert">
                                <i className="fas fa-info-circle me-2"></i>
                                <div className="fantasy-text-dark">
                                    <strong>Новая система строительства:</strong>
                                    <ul className="mt-2 mb-0">
                                        <li><strong>Шаг 1:</strong> Любой участник может начать стройку (добавить в список)</li>
                                        <li><strong>Шаг 2:</strong> Участники постепенно добавляют ресурсы к стройке</li>
                                        <li><strong>Шаг 3:</strong> Когда все ресурсы собраны, можно начать строительство</li>
                                        <li><strong>Шаг 4:</strong> Только офицеры и глава могут отменять стройки</li>
                                    </ul>
                                </div>
                            </Alert>
                            <ConstructionTab 
                                construction={construction}
                                buildingsData={buildingsData}
                                showNotification={showNotification}
                                getBuildingName={getBuildingName}
                                getResourceInfo={getResourceInfo}
                                settlementService={settlementService}
                                guildId={guildId}
                                settlement={settlement}
                                storage={storage}
                                currentEssence={currentEssence}
                                userRole={userRole}
                                setLocalConstruction={setLocalConstruction}
                                localConstruction={localConstruction}
                            />
                        </div>
                    </Tab>
                </Tabs>
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-between border-top border-secondary">
                <div className="fantasy-text-muted">
                    <small>
                        <i className="fas fa-info-circle me-1"></i>
                        Всего активных строек: {Object.keys(construction).length}
                    </small>
                </div>
                <Button variant="secondary" onClick={() => setShowCurrentConstructionsModal(false)}>
                    Закрыть
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CurrentConstructionsModal;