import React, { useContext, useState, useEffect } from 'react';
import { observer } from "mobx-react-lite";
import { Context } from "../../index";
import { 
    Card, Row, Col, Button, ProgressBar, Badge, 
    Alert, Spinner, Accordion, Table 
} from 'react-bootstrap';

const SettlementBuildings = observer(({ buildings, construction, settlementType, guildId }) => {
    const { settlement } = useContext(Context);
    const [loading, setLoading] = useState(false);
    
    // Защита от undefined/null
    const safeBuildings = buildings || {};
    const safeConstruction = construction || {};
    
    // Используем метод из стора или локальную логику
    const availableBuildings = settlement.getAvailableBuildings ? 
        settlement.getAvailableBuildings() : 
        getAvailableBuildingsFromData(safeBuildings, safeConstruction);

    // Функция для получения доступных зданий из данных
    function getAvailableBuildingsFromData(buildingsData, constructionData) {
        if (!buildingsData || typeof buildingsData !== 'object') {
            return [];
        }
        
        try {
            const buildingsEntries = Object.entries(buildingsData);
            const constructionEntries = Object.entries(constructionData || {});
            
            return buildingsEntries.map(([key, building]) => {
                const isUnderConstruction = constructionEntries.some(([consKey]) => consKey === key);
                const constructionInfo = isUnderConstruction ? constructionData[key] : null;
                
                return {
                    key,
                    ...building,
                    isUnderConstruction,
                    constructionData: constructionInfo
                };
            });
        } catch (error) {
            console.error('Error processing buildings data:', error);
            return [];
        }
    }

    // Функция для получения имени здания
    const getBuildingName = (buildingKey) => {
        const building = safeBuildings[buildingKey];
        if (!building) return buildingKey;
        
        if (building.name) return building.name;
        if (buildingKey === 'main_building') return 'Главное здание';
        if (buildingKey === 'storage') return 'Склад';
        if (buildingKey === 'wall') return 'Стена';
        if (buildingKey.includes('unit_')) return 'Казарма';
        if (buildingKey.includes('tower')) return 'Башня';
        if (buildingKey.includes('ritual')) return 'Ритуальное место';
        
        return buildingKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Функция для обработки строительства
    const handleConstruct = async (buildingKey, targetLevel) => {
        if (!guildId || !buildingKey) return;
        
        setLoading(true);
        try {
            // Здесь должен быть вызов API для начала строительства
            console.log(`Начало строительства ${buildingKey} до уровня ${targetLevel} для гильдии ${guildId}`);
            // await settlementService.constructBuilding(guildId, buildingKey, targetLevel);
        } catch (error) {
            console.error('Ошибка начала строительства:', error);
        } finally {
            setLoading(false);
        }
    };

    // Проверяем, есть ли данные
    if (Object.keys(safeBuildings).length === 0) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <i className="fas fa-building fa-3x text-muted mb-3"></i>
                    <h5 className="fantasy-text-muted mb-3">Нет данных о зданиях</h5>
                    <p className="fantasy-text-muted">Информация о зданиях поселения отсутствует.</p>
                </Card.Body>
            </Card>
        );
    }

    // Группируем здания по типам для лучшего отображения
    const buildingsByType = {
        main: [],
        military: [],
        resource: [],
        special: []
    };

    availableBuildings.forEach(building => {
        const { key } = building;
        
        if (key === 'main_building') {
            buildingsByType.main.push(building);
        } else if (key.includes('unit_') || key.includes('barracks') || key.includes('tower') || key.includes('wall')) {
            buildingsByType.military.push(building);
        } else if (key.includes('storage') || key.includes('essence') || key.includes('smith')) {
            buildingsByType.resource.push(building);
        } else {
            buildingsByType.special.push(building);
        }
    });

    return (
        <div className="settlement-buildings">
            <Card className="fantasy-card mb-4">
                <Card.Header className="fantasy-card-header fantasy-card-header-primary">
                    <h5 className="fantasy-text-gold mb-0">
                        <i className="fas fa-hard-hat me-2"></i>
                        Строительство зданий
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Alert variant="info" className="fantasy-alert">
                        <i className="fas fa-info-circle me-2"></i>
                        Здесь вы можете управлять строительством и улучшением зданий вашего поселения.
                        Улучшайте здания для увеличения их эффективности и открытия новых возможностей.
                    </Alert>
                    
                    {/* Текущие постройки */}
                    {Object.keys(safeConstruction).length > 0 && (
                        <div className="construction-section mb-4">
                            <h6 className="fantasy-text-dark mb-3">
                                <i className="fas fa-tools me-2"></i>
                                Текущие стройки ({Object.keys(safeConstruction).length})
                            </h6>
                            <Row>
                                {Object.entries(safeConstruction).map(([key, constructionData]) => (
                                    <Col md={6} lg={4} key={key} className="mb-3">
                                        <Card className="fantasy-card construction-card">
                                            <Card.Header className="fantasy-card-header fantasy-card-header-warning">
                                                <h6 className="fantasy-text-gold mb-0">
                                                    <i className="fas fa-hammer me-2"></i>
                                                    {getBuildingName(key)}
                                                </h6>
                                            </Card.Header>
                                            <Card.Body>
                                                <div className="mb-2">
                                                    <small className="fantasy-text-muted">Тип стройки:</small>
                                                    <div className="fantasy-text-dark">Улучшение</div>
                                                </div>
                                                <div className="mb-2">
                                                    <small className="fantasy-text-muted">Прогресс:</small>
                                                    <ProgressBar 
                                                        now={50} // Здесь должен быть реальный прогресс
                                                        variant="warning"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <small className="fantasy-text-muted">Завершение:</small>
                                                    <div className="fantasy-text-dark">~ 2 дня</div>
                                                </div>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm" 
                                                    className="w-100 fantasy-btn"
                                                    disabled={loading}
                                                >
                                                    <i className="fas fa-times me-2"></i>
                                                    Отменить
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    )}

                    {/* Доступные для строительства здания */}
                    <Accordion defaultActiveKey="main" className="mb-3">
                        {/* Главные здания */}
                        {buildingsByType.main.length > 0 && (
                            <Accordion.Item eventKey="main">
                                <Accordion.Header className="fantasy-accordion-header">
                                    <i className="fas fa-landmark me-2"></i>
                                    Главные здания ({buildingsByType.main.length})
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        {buildingsByType.main.map(building => (
                                            <BuildingCard 
                                                key={building.key}
                                                building={building}
                                                getBuildingName={getBuildingName}
                                                handleConstruct={handleConstruct}
                                                loading={loading}
                                                guildId={guildId}
                                            />
                                        ))}
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        )}

                        {/* Военные здания */}
                        {buildingsByType.military.length > 0 && (
                            <Accordion.Item eventKey="military">
                                <Accordion.Header className="fantasy-accordion-header">
                                    <i className="fas fa-shield-alt me-2"></i>
                                    Военные здания ({buildingsByType.military.length})
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        {buildingsByType.military.map(building => (
                                            <BuildingCard 
                                                key={building.key}
                                                building={building}
                                                getBuildingName={getBuildingName}
                                                handleConstruct={handleConstruct}
                                                loading={loading}
                                                guildId={guildId}
                                            />
                                        ))}
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        )}

                        {/* Ресурсные здания */}
                        {buildingsByType.resource.length > 0 && (
                            <Accordion.Item eventKey="resource">
                                <Accordion.Header className="fantasy-accordion-header">
                                    <i className="fas fa-coins me-2"></i>
                                    Ресурсные здания ({buildingsByType.resource.length})
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        {buildingsByType.resource.map(building => (
                                            <BuildingCard 
                                                key={building.key}
                                                building={building}
                                                getBuildingName={getBuildingName}
                                                handleConstruct={handleConstruct}
                                                loading={loading}
                                                guildId={guildId}
                                            />
                                        ))}
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        )}

                        {/* Специальные здания */}
                        {buildingsByType.special.length > 0 && (
                            <Accordion.Item eventKey="special">
                                <Accordion.Header className="fantasy-accordion-header">
                                    <i className="fas fa-star me-2"></i>
                                    Специальные здания ({buildingsByType.special.length})
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        {buildingsByType.special.map(building => (
                                            <BuildingCard 
                                                key={building.key}
                                                building={building}
                                                getBuildingName={getBuildingName}
                                                handleConstruct={handleConstruct}
                                                loading={loading}
                                                guildId={guildId}
                                            />
                                        ))}
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        )}
                    </Accordion>

                    {/* Общая статистика */}
                    <Card className="fantasy-card mt-4">
                        <Card.Header className="fantasy-card-header fantasy-card-header-info">
                            <h6 className="fantasy-text-gold mb-0">
                                <i className="fas fa-chart-bar me-2"></i>
                                Статистика зданий
                            </h6>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={3}>
                                    <div className="stat-item text-center">
                                        <div className="stat-value fantasy-text-dark">
                                            {Object.keys(safeBuildings).length}
                                        </div>
                                        <div className="stat-label fantasy-text-muted">Всего зданий</div>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="stat-item text-center">
                                        <div className="stat-value fantasy-text-dark">
                                            {Object.keys(safeConstruction).length}
                                        </div>
                                        <div className="stat-label fantasy-text-muted">В строительстве</div>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="stat-item text-center">
                                        <div className="stat-value fantasy-text-dark">
                                            {availableBuildings.filter(b => b.level >= 10).length}
                                        </div>
                                        <div className="stat-label fantasy-text-muted">Ур. 10+</div>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="stat-item text-center">
                                        <div className="stat-value fantasy-text-dark">
                                            {availableBuildings.filter(b => b.level >= 5).length}
                                        </div>
                                        <div className="stat-label fantasy-text-muted">Ур. 5+</div>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Card.Body>
            </Card>
        </div>
    );
});

// Компонент карточки здания
const BuildingCard = ({ building, getBuildingName, handleConstruct, loading, guildId }) => {
    const { key, level = 1, durability = 100, max_durability = 100, isUnderConstruction } = building;
    
    const durabilityPercentage = max_durability > 0 ? (durability / max_durability) * 100 : 100;
    
    return (
        <Col md={6} lg={4} className="mb-3">
            <Card className="fantasy-card building-card h-100">
                <Card.Header className="fantasy-card-header fantasy-card-header-secondary">
                    <h6 className="fantasy-text-gold mb-0">
                        {getBuildingName(key)}
                    </h6>
                </Card.Header>
                <Card.Body>
                    <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                            <span className="fantasy-text-dark">Уровень:</span>
                            <Badge bg="warning" className="p-2">{level}</Badge>
                        </div>
                        
                        <div className="mb-2">
                            <div className="d-flex justify-content-between mb-1">
                                <span className="fantasy-text-dark">Прочность:</span>
                                <span className="fantasy-text-dark">{durability}/{max_durability}</span>
                            </div>
                            <ProgressBar 
                                now={durabilityPercentage} 
                                variant={durabilityPercentage > 70 ? "success" : durabilityPercentage > 40 ? "warning" : "danger"}
                            />
                        </div>
                        
                        {isUnderConstruction ? (
                            <div className="mb-3">
                                <Badge bg="warning" className="p-2 w-100">
                                    <i className="fas fa-hammer me-2"></i>
                                    В строительстве
                                </Badge>
                            </div>
                        ) : (
                            <div className="mb-3">
                                <small className="fantasy-text-muted d-block mb-2">Следующий уровень:</small>
                                <div className="resource-costs">
                                    <div className="resource-item">
                                        <i className="fas fa-coins me-1 text-warning"></i>
                                        <span>1000 золота</span>
                                    </div>
                                    <div className="resource-item">
                                        <i className="fas fa-box me-1 text-info"></i>
                                        <span>500 дерева</span>
                                    </div>
                                    <div className="resource-item">
                                        <i className="fas fa-mountain me-1 text-secondary"></i>
                                        <span>300 камня</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="d-grid gap-2">
                        {isUnderConstruction ? (
                            <Button 
                                variant="outline-warning" 
                                className="fantasy-btn"
                                disabled={loading}
                            >
                                <i className="fas fa-eye me-2"></i>
                                Просмотр стройки
                            </Button>
                        ) : (
                            <Button 
                                variant="outline-primary" 
                                className="fantasy-btn"
                                onClick={() => handleConstruct(key, level + 1)}
                                disabled={loading || level >= 20}
                            >
                                {loading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Обработка...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-arrow-up me-2"></i>
                                        Улучшить до {level + 1}
                                    </>
                                )}
                            </Button>
                        )}
                        
                        <Button 
                            variant="outline-info" 
                            size="sm" 
                            className="fantasy-btn"
                        >
                            <i className="fas fa-info-circle me-2"></i>
                            Детали
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );
};

export default SettlementBuildings;