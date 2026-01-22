import React, { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Row, Col, Card, Badge, Button, Alert, Modal, Form, Spinner, Tabs, Tab, InputGroup } from 'react-bootstrap';
import { observer } from "mobx-react-lite";
import { toJS } from 'mobx';
import { Context } from "../../index";
import { 
    HIRE_COSTS, 
    UNIT_NAME_TO_ID, 
    RESOURCE_PER_TIER, 
    RESOURCE_NAMES,
    SETTLEMENT_TYPE_NAMES,
    determineSettlementType
} from '../../utils/settlementConstants';
import { settlementService } from '../../services/SettlementService';

const SettlementGarrison = observer(() => {
    const { settlement } = useContext(Context);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [showTakeModal, setShowTakeModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('garrison');
    const [selectedHireUnit, setSelectedHireUnit] = useState(null);
    const [showHireModal, setShowHireModal] = useState(false);
    const [hireQuantity, setHireQuantity] = useState(1);
    const [selectedTier, setSelectedTier] = useState(0);
    const [hireLoading, setHireLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });

    // Показать уведомление
    const showNotification = (type, message) => {
        setNotification({ show: true, type, message });
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
    };

    // Получаем текущие данные поселения
    const settlementData = useMemo(() => {
        if (!settlement) return null;
        return toJS(settlement);
    }, [settlement]);

    // Получаем ID гильдии
    const guildId = useMemo(() => {
        return settlementData?._settlementData?.id || settlementData?.id;
    }, [settlementData]);

    // Получаем данные гарнизона
    const garrisonData = useMemo(() => {
        if (!settlementData) return {};
        return settlementData?._settlementData?.garrison || {};
    }, [settlementData]);

    // Получаем данные построек
    const buildingsData = useMemo(() => {
        if (!settlementData) return {};
        return settlementData?._settlementData?.buildings || {};
    }, [settlementData]);

    // Получаем текущие ресурсы из storage
    const currentResources = useMemo(() => {
        if (!settlementData) return {};
        
        const resources = settlementData?.resources || 
                         settlementData?._settlementData?.resources || 
                         settlementData?._settlementData?.storage || 
                         settlementData?.storage || {};
        
        const formattedResources = {};
        Object.entries(resources).forEach(([key, value]) => {
            formattedResources[String(key)] = value;
        });
        
        return formattedResources;
    }, [settlementData]);

    // Получаем текущую эссенцию
    const currentEssence = useMemo(() => {
        if (!settlementData) return 0;
        return settlementData?._settlementData?.current_essence || 0;
    }, [settlementData]);

    // Получаем уровень кузницы
    const smithLevel = useMemo(() => {
        if (!buildingsData) return 0;
        return buildingsData["smith"]?.level || 0;
    }, [buildingsData]);

    // Определяем тип поселения
    const settlementType = useMemo(() => {
        return determineSettlementType(buildingsData, garrisonData);
    }, [buildingsData, garrisonData]);

    // Получаем доступные юниты для найма
    const availableUnits = useMemo(() => {
        try {
            if (!buildingsData || Object.keys(buildingsData).length === 0) {
                return [];
            }

            const availableUnitsList = [];

            Object.entries(buildingsData).forEach(([buildingKey, buildingData]) => {
                if (buildingData.hire) {
                    const unitName = buildingData.hire;
                    const unitId = UNIT_NAME_TO_ID[unitName];
                    
                    let baseCost = 100;
                    if (unitId !== undefined) {
                        const costKey = unitId < 0 ? unitId.toString() : unitId;
                        baseCost = HIRE_COSTS[costKey] || 100;
                    }
                    
                    let buildingTier = 0;
                    const tierMatch = buildingKey.match(/unit_t(\d+)_/);
                    if (tierMatch) {
                        buildingTier = parseInt(tierMatch[1]);
                    }
                    
                    const unitInfo = {
                        id: buildingKey,
                        buildingKey: buildingKey,
                        name: unitName,
                        unitId: unitId,
                        buildingName: buildingData.name || buildingKey,
                        level: buildingData.level || 1,
                        buildingTier: buildingTier,
                        cost: baseCost,
                        hireTime: buildingData.hire_time || 60,
                        hireExp: buildingData.hire_exp || 1,
                        description: `Нанимается из ${buildingData.name || buildingKey} (уровень ${buildingData.level || 1})`,
                        resources: buildingData.resources || {}
                    };
                    
                    availableUnitsList.push(unitInfo);
                }
            });

            return availableUnitsList;
            
        } catch (error) {
            console.error('Error getting available hire units:', error);
            return [];
        }
    }, [buildingsData]);

    // Функция для извлечения тира из названия юнита
    const extractTierFromName = (unitName) => {
        const tierPattern = /\s*[ТTтt]\s*([0-3])\s*/i;
        const match = unitName.match(tierPattern);
        let tier = 0;
        let nameWithoutTier = unitName;

        if (match) {
            tier = parseInt(match[1], 10);
            nameWithoutTier = unitName.replace(tierPattern, '').trim();
        }

        return { tier, nameWithoutTier };
    };

    // Проверяем доступные уровни оснащения
    const checkAvailableTiers = useCallback((buildingTier) => {
        const tiers = [0];
        
        if (smithLevel >= buildingTier && buildingTier > 0) {
            tiers.push(1, 2, 3);
        }
        
        return tiers;
    }, [smithLevel]);

    // Рассчитываем стоимость найма
    const calculateHireCost = useCallback((unit, tier, quantity) => {
        const baseEssenceCost = unit.cost * quantity;
        const tierResources = RESOURCE_PER_TIER[tier] || {};
        
        const resourcesCost = {};
        Object.entries(tierResources).forEach(([resourceCode, baseAmount]) => {
            resourcesCost[resourceCode] = baseAmount * unit.buildingTier * quantity;
        });
        
        return {
            essence: baseEssenceCost,
            resources: resourcesCost
        };
    }, []);

    // Проверяем, хватает ли ресурсов для найма
    const checkResourcesAvailability = useCallback((cost) => {
        if (cost.essence > currentEssence) {
            return { 
                available: false, 
                missing: 'essence', 
                amount: cost.essence - currentEssence 
            };
        }
        
        for (const [resourceCode, requiredAmount] of Object.entries(cost.resources)) {
            const resourceKey = String(resourceCode);
            const currentAmount = currentResources[resourceKey] || 0;
            
            if (currentAmount < requiredAmount) {
                return { 
                    available: false, 
                    missing: 'resource', 
                    resourceCode: resourceKey, 
                    amount: requiredAmount - currentAmount 
                };
            }
        }
        
        return { available: true };
    }, [currentEssence, currentResources]);

    useEffect(() => {
        const loadData = () => {
            setIsLoading(true);
            try {
                // Данные уже вычисляются через useMemo
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const handleTakeUnit = async () => {
        if (!selectedUnit) return;

        // Формируем строку с названием юнита и тиром
        const unitNameWithTier = selectedUnit.tier > 0 
            ? `${selectedUnit.name} T${selectedUnit.tier}`
            : selectedUnit.name;

        console.log('Taking units:', {
            unitNameWithTier: unitNameWithTier,
            guildId: guildId,
            quantity: quantity
        });

        try {
            if (!guildId) {
                showNotification('error', 'Не удалось определить ID гильдии');
                return;
            }

            // Используем новый эндпоинт через settlementService
            const result = await settlementService.takeFromGarrison(guildId, unitNameWithTier, quantity);
            
            console.log('Take unit result:', result);

            if (result.status === 200) {
                showNotification('success', result.message || `Успешно взято ${quantity} юнитов из гарнизона`);
                
                // Обновляем данные поселения через MobX
                if (settlement && settlement.fetchData) {
                    await settlement.fetchData();
                }
                
                setShowTakeModal(false);
                setSelectedUnit(null);
                setQuantity(1);
            } else {
                showNotification('error', result.message || "Ошибка при взятии юнитов");
            }
        } catch (error) {
            console.error('Error taking unit:', error);
            
            if (error.response) {
                const errorMessage = error.response.data?.message || 
                                   error.response.data?.detail || 
                                   `Ошибка ${error.response.status}`;
                showNotification('error', `Ошибка сервера: ${errorMessage}`);
            } else if (error.request) {
                showNotification('error', 'Нет ответа от сервера. Проверьте подключение к интернету.');
            } else {
                showNotification('error', 'Произошла ошибка при взятии юнитов.');
            }
        }
    };

    const handleHireUnit = async () => {
        if (!selectedHireUnit) return;

        const hireCost = calculateHireCost(selectedHireUnit, selectedTier, hireQuantity);
        
        console.log('Hiring units:', {
            buildingKey: selectedHireUnit.buildingKey,
            quantity: hireQuantity,
            unitName: selectedHireUnit.name,
            tier: selectedTier,
            cost: hireCost
        });

        setHireLoading(true);
        try {
            const result = await settlementService.hireUnit(
                guildId,
                selectedHireUnit.buildingKey,
                hireQuantity,
                selectedTier,
                selectedHireUnit.name
            );

            console.log('Hire unit result:', result);

            if (result.status === 200) {
                showNotification('success', `${hireQuantity} юнит(ов) "${selectedHireUnit.name} T${selectedTier}" успешно добавлены в очередь найма!`);
                
                // Обновляем данные поселения через MobX
                if (settlement && settlement.fetchData) {
                    await settlement.fetchData();
                }

                setShowHireModal(false);
                setSelectedHireUnit(null);
                setHireQuantity(1);
                setSelectedTier(0);
            } else {
                showNotification('error', result.message || 'Ошибка при найме юнита');
            }
        } catch (error) {
            console.error('Error hiring unit:', error);
            
            if (error.response) {
                const errorMessage = error.response.data?.message || 
                                   error.response.data?.detail || 
                                   `Ошибка ${error.response.status}`;
                showNotification('error', `Ошибка сервера: ${errorMessage}`);
            } else if (error.request) {
                showNotification('error', 'Нет ответа от сервера. Проверьте подключение к интернету.');
            } else {
                showNotification('error', 'Произошла ошибка при найме юнита.');
            }
        } finally {
            setHireLoading(false);
        }
    };

    const handleOpenHireModal = (unit) => {
        setSelectedHireUnit(unit);
        setHireQuantity(1);
        
        const tiers = checkAvailableTiers(unit.buildingTier);
        setSelectedTier(0);
        
        setShowHireModal(true);
    };

    const handleOpenTakeModal = (unit) => {
        setSelectedUnit({ 
            id: unit.id, 
            name: unit.nameWithoutTier,
            originalName: unit.originalName,
            tier: unit.tier,
            amount: unit.amount 
        });
        setQuantity(1);
        setShowTakeModal(true);
    };

    const renderGarrisonUnitCard = (unitId, unitData) => {
        if (!unitData || typeof unitData !== 'object') {
            return null;
        }

        const amount = unitData.amount || 0;
        const originalName = unitData.name || `Юнит ${unitId}`;
        
        // Извлекаем тир из названия
        const { tier, nameWithoutTier } = extractTierFromName(originalName);
        const displayName = nameWithoutTier;
        const unitType = UNIT_NAME_TO_ID[nameWithoutTier] ? 'Доступен для найма' : 'Особый юнит';

        if (amount <= 0) {
            return null;
        }

        return (
            <Col md={6} lg={4} key={unitId}>
                <Card className="fantasy-card mb-3">
                    <Card.Header className="fantasy-card-header d-flex justify-content-between align-items-center">
                        <h6 className="fantasy-text-gold mb-0">
                            {displayName}
                            {tier > 0 && <Badge bg="warning" className="ms-2">T{tier}</Badge>}
                        </h6>
                        <Badge bg="primary">{amount} шт.</Badge>
                    </Card.Header>
                    <Card.Body>
                        <div className="mb-2">
                            <small className="text-muted d-block">
                                <i className="fas fa-info-circle me-1"></i>
                                {unitType}
                            </small>
                        </div>
                        <div className="d-grid gap-2">
                            <Button 
                                variant="outline-primary" 
                                size="sm"
                                className="fantasy-btn"
                                onClick={() => handleOpenTakeModal({
                                    id: unitId,
                                    nameWithoutTier: nameWithoutTier,
                                    originalName: originalName,
                                    tier: tier,
                                    amount: amount
                                })}
                            >
                                <i className="fas fa-user-plus me-2"></i>
                                Взять в отряд
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        );
    };

    const renderHireUnitCard = (unit) => {
        if (!unit) return null;

        const isUnitAvailable = unit.cost <= currentEssence;
        const availableTiersList = checkAvailableTiers(unit.buildingTier);

        return (
            <Col md={6} lg={4} key={unit.id}>
                <Card className="fantasy-card mb-3">
                    <Card.Header className="fantasy-card-header d-flex justify-content-between align-items-center">
                        <div>
                            <h6 className="fantasy-text-gold mb-0">{unit.name}</h6>
                        </div>
                        <div>
                            <Badge bg="info">T{unit.buildingTier}</Badge>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <div className="mb-3">
                            <small className="text-muted d-block mb-1">
                                <i className="fas fa-building me-1"></i>
                                {unit.buildingName}
                            </small>
                            <small className="text-muted d-block mb-1">
                                <i className="fas fa-clock me-1"></i>
                                Время найма: {unit.hireTime} мин.
                            </small>
                            <small className="text-muted d-block mb-1">
                                <i className="fas fa-gem me-1"></i>
                                Стоимость: <span className={isUnitAvailable ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                    {unit.cost} эссенции
                                </span>
                            </small>
                            <small className="text-muted d-block mb-1">
                                <i className="fas fa-star me-1"></i>
                                Опыт за найм: {unit.hireExp}
                            </small>
                            
                            <div className="mt-2">
                                <small className="text-muted d-block mb-1">
                                    <i className="fas fa-shield-alt me-1"></i>
                                    Доступные уровни оснащения:
                                </small>
                                <div className="d-flex gap-1 flex-wrap">
                                    {availableTiersList.map(tier => (
                                        <Badge 
                                            key={tier} 
                                            bg={tier === 0 ? "secondary" : smithLevel >= unit.buildingTier ? "warning" : "secondary"}
                                            className="p-2"
                                        >
                                            T{tier}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="d-grid gap-2">
                            <Button 
                                variant={isUnitAvailable ? "outline-success" : "outline-secondary"}
                                size="sm"
                                className="fantasy-btn"
                                onClick={() => handleOpenHireModal(unit)}
                                disabled={!isUnitAvailable}
                            >
                                <i className="fas fa-user-plus me-2"></i>
                                Нанять {unit.cost} <i className="fas fa-gem ms-1"></i>
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        );
    };

    // Вычисляем общие показатели
    const totalUnits = useMemo(() => {
        return Object.values(garrisonData).reduce((sum, unit) => {
            if (!unit || typeof unit !== 'object') return sum;
            return sum + (unit.amount || 0);
        }, 0);
    }, [garrisonData]);

    const unitTypes = useMemo(() => {
        return Object.keys(garrisonData).filter(id => {
            const unit = garrisonData[id];
            if (!unit || typeof unit !== 'object') return false;
            const amount = unit.amount || 0;
            return amount > 0;
        }).length;
    }, [garrisonData]);

    // Рассчитываем стоимость найма для отображения
    const hireCost = selectedHireUnit ? calculateHireCost(selectedHireUnit, selectedTier, hireQuantity) : { essence: 0, resources: {} };
    const resourceCheck = selectedHireUnit ? checkResourcesAvailability(hireCost) : { available: true };

    if (isLoading) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Загрузка данных гарнизона...</p>
                </Card.Body>
            </Card>
        );
    }

    if (!settlementData) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h5>Данные поселения не загружены</h5>
                    <p className="text-muted">Попробуйте обновить страницу</p>
                </Card.Body>
            </Card>
        );
    }

    return (
        <div>
            {/* Уведомления */}
            {notification.show && (
                <Alert 
                    variant={notification.type === 'success' ? 'success' : 'danger'} 
                    className="position-fixed top-0 end-0 m-3" 
                    style={{ zIndex: 9999 }}
                    dismissible
                    onClose={() => setNotification({ show: false, type: '', message: '' })}
                >
                    {notification.message}
                </Alert>
            )}

            <Card className="fantasy-card mb-4">
                <Card.Header className="fantasy-card-header fantasy-card-header-info">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="fantasy-text-gold mb-0">
                                <i className="fas fa-shield-alt me-2"></i>
                                Управление юнитами
                            </h5>
                            <small className="fantasy-text-muted">
                                Тип поселения: <Badge bg="primary">{SETTLEMENT_TYPE_NAMES[settlementType]}</Badge>
                            </small>
                        </div>
                        <div>
                            <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={async () => {
                                    if (settlement?.fetchData) {
                                        await settlement.fetchData();
                                        showNotification('info', 'Данные обновлены');
                                    }
                                }}
                            >
                                <i className="fas fa-sync me-1"></i>
                                Обновить
                            </Button>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className="mb-4 fantasy-tabs"
                    >
                        <Tab eventKey="garrison" title={
                            <span>
                                <i className="fas fa-users me-1"></i>
                                Гарнизон
                                {totalUnits > 0 && <Badge bg="primary" className="ms-2">{totalUnits}</Badge>}
                            </span>
                        }>
                            <div className="mt-4">
                                <div className="mb-4">
                                    <Row>
                                        <Col md={4}>
                                            <Card className="fantasy-card h-100">
                                                <Card.Body className="text-center">
                                                    <div className="fantasy-text-dark fs-4 fw-bold">{totalUnits}</div>
                                                    <div className="fantasy-text-muted">Всего юнитов</div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={4}>
                                            <Card className="fantasy-card h-100">
                                                <Card.Body className="text-center">
                                                    <div className="fantasy-text-dark fs-4 fw-bold">{unitTypes}</div>
                                                    <div className="fantasy-text-muted">Разных типов</div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={4}>
                                            <Card className="fantasy-card h-100">
                                                <Card.Body className="text-center">
                                                    <div className="fantasy-text-dark fs-4 fw-bold">{availableUnits.length}</div>
                                                    <div className="fantasy-text-muted">Доступно для найма</div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </div>

                                {unitTypes > 0 ? (
                                    <Row>
                                        {Object.entries(garrisonData).map(([unitId, unitData]) => 
                                            renderGarrisonUnitCard(unitId, unitData)
                                        )}
                                    </Row>
                                ) : (
                                    <Alert variant="info">
                                        <i className="fas fa-info-circle me-2"></i>
                                        Гарнизон пуст. Нанять юнитов можно во вкладке "Наем".
                                    </Alert>
                                )}
                            </div>
                        </Tab>
                        
                        <Tab eventKey="hire" title={
                            <span>
                                <i className="fas fa-user-plus me-1"></i>
                                Наем юнитов
                                {availableUnits.length > 0 && <Badge bg="success" className="ms-2">{availableUnits.length}</Badge>}
                            </span>
                        }>
                            <div className="mt-4">
                                <Alert variant="info" className="mb-4">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Здесь можно нанимать юнитов из построенных зданий. 
                                    <strong> Уровни оснащения (T1-T3) доступны только если уровень кузницы ({smithLevel}) ≥ уровню здания.</strong>
                                </Alert>

                                <Row className="mb-4">
                                    <Col md={3}>
                                        <Card className="fantasy-card h-100">
                                            <Card.Body className="text-center">
                                                <div className="fantasy-text-dark fs-4 fw-bold">{availableUnits.length}</div>
                                                <div className="fantasy-text-muted">Доступных зданий</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="fantasy-card h-100">
                                            <Card.Body className="text-center">
                                                <div className="fantasy-text-dark fs-4 fw-bold">{smithLevel}</div>
                                                <div className="fantasy-text-muted">Уровень кузницы</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="fantasy-card h-100">
                                            <Card.Body className="text-center">
                                                <div className="fantasy-text-dark fs-4 fw-bold">
                                                    {currentEssence}
                                                    <i className="fas fa-gem ms-1" style={{ fontSize: '0.8em' }}></i>
                                                </div>
                                                <div className="fantasy-text-muted">Ваша эссенция</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="fantasy-card h-100">
                                            <Card.Body className="text-center">
                                                <div className="fantasy-text-dark fs-4 fw-bold">
                                                    {Object.keys(currentResources).length}
                                                </div>
                                                <div className="fantasy-text-muted">Видов ресурсов</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                {availableUnits.length > 0 ? (
                                    <Row>
                                        {availableUnits.map(unit => renderHireUnitCard(unit))}
                                    </Row>
                                ) : (
                                    <Alert variant="warning">
                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                        Нет доступных зданий для найма юнитов. Постройте соответствующие здания во вкладке "Здания".
                                    </Alert>
                                )}
                            </div>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>

            {/* Модальное окно для взятия юнитов из гарнизона */}
            <Modal 
                show={showTakeModal} 
                onHide={() => setShowTakeModal(false)}
                backdrop="static"
                centered
                className="fantasy-modal mass-operation-modal"
            >
                <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
                    <Modal.Title className="d-flex align-items-center fantasy-text-gold">
                        <i className="fas fa-user-plus me-2"></i>
                        Взять юнитов в отряд
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedUnit && (
                        <>
                            <div className="mb-4">
                                <h6 className="fantasy-text-gold">
                                    <i className="fas fa-user me-2"></i>
                                    {selectedUnit.originalName || selectedUnit.name}
                                    {selectedUnit.tier > 0 && (
                                        <Badge bg="warning" className="ms-2">T{selectedUnit.tier}</Badge>
                                    )}
                                </h6>
                                <div className="mass-modal-alert alert alert-info">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Юниты будут добавлены в ваш отряд и доступны для использования в боях.
                                    <br />
                                    <small>Можно взять до {selectedUnit.amount} юнитов.</small>
                                </div>
                            </div>

                            <div className="item-quantity-row mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="item-name-mass">Количество для взятия</span>
                                    <span className="item-available">
                                        доступно: {selectedUnit.amount} шт
                                    </span>
                                </div>

                                <div className="d-flex flex-column gap-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="mass-quantity-label">Прямой ввод:</span>
                                        <div className="d-flex align-items-center gap-2">
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => setQuantity(1)}
                                                disabled={quantity <= 1}
                                                className="mass-quantity-btn"
                                                title="Установить минимум"
                                            >
                                                Мин
                                            </Button>

                                            <InputGroup size="sm" style={{ width: '120px' }}>
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    disabled={quantity <= 1}
                                                >
                                                    -
                                                </Button>
                                                <Form.Control
                                                    type="number"
                                                    min="1"
                                                    max={selectedUnit.amount}
                                                    value={quantity}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value) || 1;
                                                        setQuantity(Math.min(Math.max(1, value), selectedUnit.amount));
                                                    }}
                                                    className="text-center"
                                                />
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => setQuantity(Math.min(selectedUnit.amount, quantity + 1))}
                                                    disabled={quantity >= selectedUnit.amount}
                                                >
                                                    +
                                                </Button>
                                            </InputGroup>

                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => setQuantity(selectedUnit.amount)}
                                                disabled={quantity >= selectedUnit.amount}
                                                className="mass-quantity-btn"
                                                title="Установить максимум"
                                            >
                                                Макс
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-3">
                                        <span className="mass-quantity-label">Быстрый выбор:</span>
                                        <div className="d-flex gap-1">
                                            {[1, 5, 10, 25, 50].map(num => (
                                                <Button
                                                    key={num}
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => setQuantity(Math.min(num, selectedUnit.amount))}
                                                    className="mass-quantity-btn"
                                                    active={quantity === Math.min(num, selectedUnit.amount)}
                                                >
                                                    {num}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <div className="d-flex justify-content-between small text-muted">
                                        <span>0</span>
                                        <span>Берется: {quantity} из {selectedUnit.amount}</span>
                                        <span>{selectedUnit.amount}</span>
                                    </div>
                                    <div className="progress" style={{ height: '5px' }}>
                                        <div 
                                            className="progress-bar bg-primary" 
                                            role="progressbar" 
                                            style={{ width: `${(quantity / selectedUnit.amount) * 100}%` }}
                                            aria-valuenow={quantity}
                                            aria-valuemin="0"
                                            aria-valuemax={selectedUnit.amount}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mass-total-info p-3">
                                <div className="row text-center">
                                    <div className="col-12">
                                        <div className="mb-2">
                                            <div className="mass-total-label">Будет взято:</div>
                                            <div className="mass-total-value">
                                                {quantity} юнит(ов)
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between">
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowTakeModal(false)}
                        className="mass-cancel-btn"
                    >
                        <i className="fas fa-times me-2"></i>
                        Отмена
                    </Button>
                    <Button 
                        variant="primary"
                        onClick={handleTakeUnit}
                        disabled={!selectedUnit}
                        className="mass-submit-btn mass-submit-gold"
                    >
                        <i className="fas fa-user-plus me-2"></i>
                        Взять {quantity} юнит(ов) в отряд
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Модальное окно для найма юнитов */}
            <Modal 
                show={showHireModal} 
                onHide={() => setShowHireModal(false)}
                backdrop="static"
                centered
                className="fantasy-modal mass-operation-modal"
                size="lg"
            >
                <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-success">
                    <Modal.Title className="d-flex align-items-center fantasy-text-gold">
                        <i className="fas fa-user-plus me-2"></i>
                        Наем юнитов
                        {selectedHireUnit && (
                            <Badge bg="info" className="ms-2">ID: {selectedHireUnit.unitId}</Badge>
                        )}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedHireUnit && (
                        <>
                            <div className="mb-4">
                                <h6 className="fantasy-text-gold">
                                    <i className="fas fa-user me-2"></i>
                                    {selectedHireUnit.name}
                                </h6>
                                <div className="mass-modal-alert alert alert-info">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Юнит будет добавлен в очередь найма после подтверждения.
                                    <div className="mt-2">
                                        <small>
                                            <strong>Уровень кузницы:</strong> {smithLevel}
                                            <br/>
                                            <strong>Уровень здания:</strong> {selectedHireUnit.buildingTier}
                                            {smithLevel >= selectedHireUnit.buildingTier ? 
                                                <Badge bg="success" className="ms-2">Доступны улучшения T1-T3</Badge> :
                                                <Badge bg="warning" className="ms-2">Только T0 (нужна кузница уровня {selectedHireUnit.buildingTier} для улучшений)</Badge>
                                            }
                                        </small>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h6 className="fantasy-text-dark mb-3">
                                    <i className="fas fa-shield-alt me-2"></i>
                                    Уровень оснащения:
                                </h6>
                                <div className="d-flex flex-wrap gap-2">
                                    {checkAvailableTiers(selectedHireUnit.buildingTier).map(tier => {
                                        const isAvailable = tier === 0 || smithLevel >= selectedHireUnit.buildingTier;
                                        return (
                                            <Button
                                                key={tier}
                                                variant={selectedTier === tier ? "primary" : "outline-primary"}
                                                onClick={() => isAvailable && setSelectedTier(tier)}
                                                disabled={!isAvailable || hireLoading}
                                                className="tier-btn"
                                            >
                                                <div className="d-flex flex-column align-items-center">
                                                    <span className="fw-bold">T{tier}</span>
                                                    <small className="opacity-75">
                                                        {tier === 0 ? 'Базовая' : 
                                                         tier === 1 ? '+ Кожа' :
                                                         tier === 2 ? '+ Кожа, Руда' : '+ Кожа, Сталь'}
                                                    </small>
                                                </div>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="item-quantity-row mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="item-name-mass">Количество для найма</span>
                                    <span className="item-available">
                                        здание: {selectedHireUnit.buildingName} (ур. {selectedHireUnit.level})
                                    </span>
                                </div>

                                <div className="d-flex flex-column gap-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="mass-quantity-label">Прямой ввод:</span>
                                        <div className="d-flex align-items-center gap-2">
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => setHireQuantity(1)}
                                                disabled={hireQuantity <= 1 || hireLoading}
                                                className="mass-quantity-btn"
                                                title="Установить минимум"
                                            >
                                                Мин
                                            </Button>

                                            <InputGroup size="sm" style={{ width: '120px' }}>
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => setHireQuantity(Math.max(1, hireQuantity - 1))}
                                                    disabled={hireQuantity <= 1 || hireLoading}
                                                >
                                                    -
                                                </Button>
                                                <Form.Control
                                                    type="number"
                                                    min="1"
                                                    max={100}
                                                    value={hireQuantity}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value) || 1;
                                                        setHireQuantity(Math.min(Math.max(1, value), 100));
                                                    }}
                                                    className="text-center"
                                                    disabled={hireLoading}
                                                />
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => setHireQuantity(Math.min(100, hireQuantity + 1))}
                                                    disabled={hireQuantity >= 100 || hireLoading}
                                                >
                                                    +
                                                </Button>
                                            </InputGroup>

                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => setHireQuantity(100)}
                                                disabled={hireQuantity >= 100 || hireLoading}
                                                className="mass-quantity-btn"
                                                title="Установить максимум"
                                            >
                                                Макс
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-3">
                                        <span className="mass-quantity-label">Быстрый выбор:</span>
                                        <div className="d-flex gap-1">
                                            {[1, 5, 10, 25, 50, 100].map(num => (
                                                <Button
                                                    key={num}
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => setHireQuantity(Math.min(num, 100))}
                                                    disabled={hireLoading}
                                                    className="mass-quantity-btn"
                                                    active={hireQuantity === Math.min(num, 100)}
                                                >
                                                    {num}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <div className="d-flex justify-content-between small text-muted">
                                        <span>0</span>
                                        <span>Нанимается: {hireQuantity} из 100</span>
                                        <span>100</span>
                                    </div>
                                    <div className="progress" style={{ height: '5px' }}>
                                        <div 
                                            className="progress-bar bg-success" 
                                            role="progressbar" 
                                            style={{ width: `${(hireQuantity / 100) * 100}%` }}
                                            aria-valuenow={hireQuantity}
                                            aria-valuemin="0"
                                            aria-valuemax={100}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mass-total-info p-3">
                                <div className="row text-center">
                                    <div className="col-6">
                                        <div className="mb-2">
                                            <div className="mass-total-label">Общая стоимость:</div>
                                            <div className="mass-total-value">
                                                {hireCost.essence}
                                                <i className="fas fa-gem ms-1" style={{ fontSize: '0.8em' }}></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="mb-2">
                                            <div className="mass-total-label">Общее время:</div>
                                            <div className="mass-total-value">
                                                {selectedHireUnit.hireTime * hireQuantity} мин
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {Object.keys(hireCost.resources).length > 0 && (
                                <Alert variant="warning" className="mt-3">
                                    <i className="fas fa-boxes me-2"></i>
                                    <strong>Дополнительные ресурсы для T{selectedTier}:</strong>
                                    <div className="mt-2">
                                        {Object.entries(hireCost.resources).map(([resourceCode, amount]) => {
                                            const resourceKey = String(resourceCode);
                                            const resourceName = RESOURCE_NAMES[resourceKey] || `Ресурс ${resourceKey}`;
                                            const currentAmount = currentResources[resourceKey] || 0;
                                            const hasEnough = currentAmount >= amount;
                                            
                                            return (
                                                <div key={resourceKey} className="d-flex justify-content-between mb-1">
                                                    <span className={hasEnough ? 'text-dark' : 'text-danger'}>
                                                        {resourceName}:
                                                    </span>
                                                    <div>
                                                        <Badge bg={hasEnough ? "secondary" : "danger"}>
                                                            {amount} шт
                                                        </Badge>
                                                        <small className="ms-2 text-muted">
                                                            (есть: {currentAmount})
                                                        </small>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <small className="text-muted d-block mt-2">
                                            <i className="fas fa-info-circle me-1"></i>
                                            Ресурсы умножаются на уровень здания ({selectedHireUnit.buildingTier}) и количество ({hireQuantity})
                                        </small>
                                    </div>
                                </Alert>
                            )}

                            {!resourceCheck.available && (
                                <Alert variant="danger" className="mt-3">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    {resourceCheck.missing === 'essence' ? 
                                        `Недостаточно эссенции. Не хватает: ${resourceCheck.amount}` :
                                        `Недостаточно ресурса ${RESOURCE_NAMES[resourceCheck.resourceCode] || `#${resourceCheck.resourceCode}`}. Не хватает: ${resourceCheck.amount}`
                                    }
                                </Alert>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between">
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowHireModal(false)}
                        disabled={hireLoading}
                        className="mass-cancel-btn"
                    >
                        <i className="fas fa-times me-2"></i>
                        Отмена
                    </Button>
                    <Button 
                        variant="success"
                        onClick={handleHireUnit}
                        disabled={hireLoading || !resourceCheck.available}
                        className="mass-submit-btn mass-submit-gold"
                    >
                        {hireLoading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Наем...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-user-plus me-2"></i>
                                Нанять {hireQuantity} юнит(ов) T{selectedTier}
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
});

export default SettlementGarrison;