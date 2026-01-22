import { observer } from "mobx-react-lite";
import { Card, Row, Col, ProgressBar, Badge, Button, Spinner } from 'react-bootstrap';
import { determineSettlementType, SETTLEMENT_TYPE_NAMES } from '../../utils/settlementConstants';

const SettlementOverview = observer(({ settlementData, guildId, onRefresh, isLoading }) => {
    // Защита от undefined
    if (!settlementData) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center">
                    <p className="fantasy-text-muted">Нет данных о поселении</p>
                    {onRefresh && (
                        <Button 
                            variant="primary" 
                            onClick={onRefresh}
                            className="mt-3"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Загрузка...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sync me-2"></i>
                                    Загрузить данные
                                </>
                            )}
                        </Button>
                    )}
                </Card.Body>
            </Card>
        );
    }

    const { 
        current_essence = 0, 
        max_essence = 0,
        buildings = {},
        garrison = {},
        storage = {},
        construction = {},
        resources = {}
    } = settlementData;

    // Определяем тип поселения
    const settlementType = determineSettlementType(buildings, garrison);
    const settlementTypeName = SETTLEMENT_TYPE_NAMES[settlementType] || 'Неизвестного типа';

    const essencePercentage = max_essence > 0 ? (current_essence / max_essence) * 100 : 0;
    const mainBuildingLevel = buildings?.main_building?.level || 0;
    const totalBuildings = Object.keys(buildings).length;
    const totalGarrison = Object.values(garrison).reduce((sum, unit) => sum + (unit.amount || 0), 0);
    const totalStorage = Object.values(storage).reduce((sum, val) => sum + (val || 0), 0);
    const constructionCount = Object.keys(construction || {}).length;

    // Рассчитываем общую сумму ресурсов (для отображения)
    const totalResources = Object.values(resources || {}).reduce((sum, val) => sum + (val || 0), 0);

    return (
        <div className="settlement-overview">
            <Row className="g-3">
                <Col md={6}>
                    <Card className="fantasy-card h-100">
                        <Card.Header className="fantasy-card-header fantasy-card-header-info">
                            <h6 className="fantasy-text-gold mb-0">
                                <i className="fas fa-heart me-2"></i>
                                Сущность поселения
                            </h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="fantasy-text-dark">Текущая эссенция:</span>
                                    <span className="fantasy-text-dark fw-bold">
                                        {current_essence.toLocaleString()}
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="fantasy-text-dark">Максимум:</span>
                                    <span className="fantasy-text-dark">
                                        {max_essence.toLocaleString()}
                                    </span>
                                </div>
                                <ProgressBar 
                                    now={essencePercentage} 
                                    variant={essencePercentage > 80 ? "success" : essencePercentage > 50 ? "warning" : "danger"}
                                    style={{ height: "10px" }}
                                    className="mb-2"
                                />
                                <div className="text-center">
                                    <Badge bg="info" className="p-2 mt-2">
                                        <i className="fas fa-chart-line me-2"></i>
                                        Заполнено: {essencePercentage.toFixed(1)}%
                                    </Badge>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="fantasy-card h-100">
                        <Card.Header className="fantasy-card-header fantasy-card-header-primary d-flex justify-content-between align-items-center">
                            <h6 className="fantasy-text-gold mb-0">
                                <i className="fas fa-chart-bar me-2"></i>
                                Статистика поселения
                            </h6>
                            <Button 
                                variant="outline-light"
                                size="sm"
                                onClick={onRefresh}
                                disabled={isLoading}
                                className="refresh-btn"
                                title="Обновить данные"
                            >
                                {isLoading ? (
                                    <Spinner animation="border" size="sm" />
                                ) : (
                                    <i className="fas fa-sync"></i>
                                )}
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col xs={6} className="text-center mb-3">
                                    <div className="stat-item">
                                        <div className="stat-value fantasy-text-primary">{totalBuildings}</div>
                                        <div className="stat-label fantasy-text-muted">Зданий</div>
                                    </div>
                                </Col>
                                <Col xs={6} className="text-center mb-3">
                                    <div className="stat-item">
                                        <div className="stat-value fantasy-text-success">{totalGarrison}</div>
                                        <div className="stat-label fantasy-text-muted">Юнитов в гарнизоне</div>
                                    </div>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={6} className="text-center">
                                    <div className="stat-item">
                                        <div className="stat-value fantasy-text-warning">{mainBuildingLevel}</div>
                                        <div className="stat-label fantasy-text-muted">Ур. главного здания</div>
                                    </div>
                                </Col>
                                <Col xs={6} className="text-center">
                                    <div className="stat-item">
                                        <div className="stat-value fantasy-text-info">{constructionCount}</div>
                                        <div className="stat-label fantasy-text-muted">В строительстве</div>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Дополнительная информация */}
            <Row className="mt-3">
                <Col xs={12}>
                    <Card className="fantasy-card">
                        <Card.Header className="fantasy-card-header fantasy-card-header-success">
                            <h6 className="fantasy-text-gold mb-0">
                                <i className="fas fa-info-circle me-2"></i>
                                Информация о поселении
                            </h6>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={3} sm={6}>
                                    <div className="info-item p-3 border rounded">
                                        <div className="d-flex align-items-center mb-2">
                                            <i className="fas fa-home me-2 text-primary"></i>
                                            <span className="fantasy-text-dark fw-bold">Тип поселения:</span>
                                        </div>
                                        <div className="text-center">
                                            <Badge bg="primary" className="p-2 fs-6">
                                                {settlementTypeName}
                                            </Badge>
                                        </div>
                                    </div>
                                </Col>                                
                                <Col md={3} sm={6}>
                                    <div className="info-item p-3 border rounded">
                                        <div className="d-flex align-items-center mb-2">
                                            <i className="fas fa-users me-2 text-success"></i>
                                            <span className="fantasy-text-dark fw-bold">Разных типов юнитов:</span>
                                        </div>
                                        <div className="text-center">
                                            <Badge bg="success" className="p-2 fs-6">
                                                {Object.keys(garrison).length}
                                            </Badge>
                                        </div>
                                    </div>
                                </Col>
                                
                                <Col md={3} sm={6}>
                                    <div className="info-item p-3 border rounded">
                                        <div className="d-flex align-items-center mb-2">
                                            <i className="fas fa-tools me-2 text-info"></i>
                                            <span className="fantasy-text-dark fw-bold">ID гильдии:</span>
                                        </div>
                                        <div className="text-center">
                                            <Badge bg="info" className="p-2 fs-6">
                                                {guildId || 'Не указан'}
                                            </Badge>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                            
                            {/* Быстрый просмотр ресурсов */}
                            {resources && Object.keys(resources).length > 0 && (
                                <div className="mt-4">
                                    <h6 className="fantasy-text-dark mb-3">
                                        <i className="fas fa-box-open me-2"></i>
                                        Основные ресурсы:
                                    </h6>
                                    <Row className="g-2">
                                        {Object.entries(resources).slice(0, 6).map(([resourceId, amount]) => (
                                            <Col xs={4} sm={2} key={resourceId}>
                                                <div className="resource-item text-center p-2 border rounded">
                                                    <div className="resource-amount fantasy-text-dark fw-bold">
                                                        {amount.toLocaleString()}
                                                    </div>
                                                    <div className="resource-name fantasy-text-muted small">
                                                        Ресурс {resourceId}
                                                    </div>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
});

export default SettlementOverview;