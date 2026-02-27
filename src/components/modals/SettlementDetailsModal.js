import React from 'react';
import { Modal, Button, Badge, Card, Row, Col, Alert, ListGroup, ProgressBar } from 'react-bootstrap';

// Словари для перевода (без изменений)
const buildingNameMap = {
  'main_building': 'Главное здание',
  'storage': 'Склад',
  'unit_t1_1': 'Казарма кобольдов',
  'unit_t2_1': 'Казарма лучников',
  'unit_t3_1': 'Улей',
  'unit_t4_1': 'Долина разрядов',
  'tower': 'Дозорная башня',
  'smith': 'Кузница',
  'barracks': 'Бараки',
  'ritual_place': 'Ритуальное место',
  'altar': 'Алтарь героев',
  'totem': 'Тотем Эона',
  'essence_regenerator': 'Регенератор',
  'hospital': 'Лазарет',
  'market': 'Рынок',
  'wall': 'Стена'
};

const typeNames = {
  'Light': 'Света',
  'Dark': 'Тьмы',
  'Sound': 'Звука',
  'Lighting': 'Молнии',
  'Electric': 'Молнии',
  'Fire': 'Огня',
  'Ice': 'Льда',
  'Wind': 'Ветра',
  'Stone': 'Камня',
  'Power': 'Власти',
  'Life': 'Жизни',
  'Death': 'Смерти'
};

const resourceNameMap = {
  '112': 'Древесина',
  '114': 'Камень',
  '115': 'Железо',
  '116': 'Золото',
  '117': 'Еда',
  '118': 'Мана',
  '119': 'Эссенция',
  '120': 'Кристаллы',
  '121': 'Руда',
  'essence': 'Эссенция'
};

const SettlementDetailsModal = ({
  show,
  onHide,
  settlement,
  onAttack,
  onSabotage
}) => {
  if (!settlement) return null;

  const data = settlement.known_info || settlement.info || settlement;

  const scoutType = settlement.scout_type || data.scout_type || 'standard';
  const discoveredAt = settlement.discovered_at || data.discovered_at;
  const lastScouted = settlement.last_scouted || data.scout_time || data.last_scouted;

  const getSettlementName = () => {
    if (data.name && data.name !== 'Unknown' && !/^\d+$/.test(String(data.name))) {
      return data.name;
    }
    let typeStr = data.type;
    if (typeStr && typeof typeStr !== 'string') {
      typeStr = String(typeStr);
    }
    const typeName = typeNames[typeStr] || data.type || 'Неизвестного типа';
    let name = `Поселение ${typeName}`;
    if (data.guild_name && data.guild_name !== 'Unknown') {
      name += ` (${data.guild_name})`;
    } else if (data.owner_name && data.owner_name !== 'Неизвестно') {
      name += ` (${data.owner_name})`;
    }
    return name;
  };

  const getScoutIcon = () => {
    switch(scoutType) {
      case 'deep': return 'fas fa-search-plus';
      case 'stealth': return 'fas fa-user-ninja';
      default: return 'fas fa-search';
    }
  };

  const getScoutTypeText = () => {
    switch(scoutType) {
      case 'deep': return 'Глубокая разведка';
      case 'stealth': return 'Скрытная разведка';
      default: return 'Стандартная разведка';
    }
  };

  const getBuildingName = (buildingKey, building) => {
    if (building && building.name) return building.name;
    return buildingNameMap[buildingKey] || buildingKey;
  };

  const getResourceName = (resKey) => {
    const strKey = String(resKey);
    return resourceNameMap[strKey] || strKey;
  };

  const formatConstructionTime = (minutes) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const renderDefense = () => {
    if (data.defense === undefined) return 'Неизвестна';
    if (typeof data.defense === 'object') {
      return data.defense.total || data.defense.heroes || JSON.stringify(data.defense);
    }
    return data.defense;
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      centered
      size="lg"
      scrollable
      className="fantasy-modal"
    >
      <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary border-secondary">
        <Modal.Title className="fantasy-text-black">
          <i className="fantasy-text-black"></i>
          Детали поселения
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="fantasy-card p-3 p-sm-4">
        <Card className="fantasy-card mb-3">
          <Card.Body className="p-3 p-sm-4">
            {/* Основная информация */}
            <Row className="mb-4 g-2">
              <Col xs={12} md={8}>
                <h4 className="fantasy-text-black h5 h4-md" style={{ fontWeight: 'bold', textShadow: '0 0 3px #ffd700' }}>
                  {getSettlementName()}
                </h4>
                <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                  <Badge bg="info" className="fantasy-badge fs-6 p-2">
                    <i className={getScoutIcon() + ' me-1'}></i>
                    {getScoutTypeText()}
                  </Badge>
                  {data.stealth_scout && (
                    <Badge bg="dark" className="fantasy-badge fs-6 p-2">
                      <i className="fas fa-mask me-1"></i>
                      Скрытно
                    </Badge>
                  )}
                </div>
              </Col>
            </Row>

            {/* Владелец и защита */}
            <Row className="mb-4 g-3">
              <Col xs={12} md={6}>
                <Card className="fantasy-card h-100">
                  <Card.Body className="p-3">
                    <h6 className="fantasy-text-muted mb-3 small">
                      <i className="fas fa-user me-2"></i> Владелец
                    </h6>
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <i className="fas fa-crown text-warning fs-4"></i>
                      </div>
                      <div className="text-truncate">
                        <p className="fantasy-text-dark mb-0 text-truncate">
                          {data.guild_name || data.owner_name || data.guild_id || 'Неизвестно'}
                        </p>
                        {data.guild_name && (
                          <small className="fantasy-text-muted text-truncate d-block">
                            Гильдия: {data.guild_name}
                          </small>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card className="fantasy-card h-100">
                  <Card.Body className="p-3">
                    <h6 className="fantasy-text-muted mb-3 small">
                      <i className="fas fa-shield-alt me-2"></i> Защита
                    </h6>
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <i className="fas fa-fort-awesome text-info fs-4"></i>
                      </div>
                      <div>
                        <p className="fantasy-text-dark mb-0">
                          {renderDefense()}
                        </p>
                        {data.total_units !== undefined && (
                          <small className="fantasy-text-muted d-block">Всего войск: {data.total_units}</small>
                        )}
                        {data.garrison && Object.keys(data.garrison).length > 0 && (
                          <small className="fantasy-text-muted d-block">
                            Типов юнитов: {Object.keys(data.garrison).length}
                          </small>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Склад — только заполненность */}
            {data.storage && Object.keys(data.storage).length > 0 && (
              <div className="mb-4">
                <h6 className="fantasy-text-muted mb-3 small">
                  <i className="fas fa-warehouse me-2"></i> Склад
                </h6>
                <Card className="fantasy-card">
                  <Card.Body className="p-3">
                    {(() => {
                      const CONSTRUCTION_CODES = ["112", "114", "115", "116", "117", "118", "119", "120", "121", "413", "414"];
                      let used = 0;
                      Object.entries(data.storage).forEach(([key, value]) => {
                        if (CONSTRUCTION_CODES.includes(key)) {
                          const amount = typeof value === 'object' ? (value.amount || 0) : Number(value) || 0;
                          used += amount;
                        }
                      });
                      let capacity = 10000;
                      if (data.buildings && data.buildings.storage && data.buildings.storage.max_capacity) {
                        capacity = data.buildings.storage.max_capacity;
                      } else if (data.max_capacity) {
                        capacity = data.max_capacity;
                      }
                      const percentage = Math.min(100, (used / capacity) * 100);
                      return (
                        <>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fantasy-text-muted small">Заполненность склада</span>
                            <Badge 
                              bg={percentage > 80 ? "danger" : percentage > 60 ? "warning" : "success"} 
                              className="fantasy-badge p-2"
                            >
                              {used.toLocaleString()} / {capacity.toLocaleString()}
                            </Badge>
                          </div>
                          <ProgressBar 
                            now={percentage} 
                            variant={percentage > 80 ? "danger" : percentage > 60 ? "warning" : "success"}
                            style={{ height: "8px", borderRadius: "4px" }}
                            className="mb-2"
                          />
                          <div className="d-flex justify-content-between">
                            <small className="fantasy-text-muted">Занято: {percentage.toFixed(1)}%</small>
                            <small className="fantasy-text-muted">Свободно: {(capacity - used).toLocaleString()}</small>
                          </div>
                        </>
                      );
                    })()}
                  </Card.Body>
                </Card>
              </div>
            )}

            {/* Постройки — только название, уровень и прочность */}
            {data.buildings && typeof data.buildings === 'object' && Object.keys(data.buildings).length > 0 ? (
              <div className="mb-4">
                <h6 className="fantasy-text-muted mb-3 small">
                  <i className="fas fa-building me-2"></i>
                  Постройки ({data.building_count || Object.keys(data.buildings).length})
                </h6>
                <ListGroup variant="flush" className="fantasy-card">
                  {Object.entries(data.buildings).map(([buildingKey, building]) => {
                    if (!building || typeof building !== 'object') return null;
                    return (
                      <ListGroup.Item key={buildingKey} className="fantasy-card border-secondary p-3">
                        <div className="d-flex justify-content-between align-items-start flex-wrap">
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <strong className="fantasy-text-dark fs-6">{getBuildingName(buildingKey, building)}</strong>
                            {building.level && (
                              <Badge bg="secondary" className="fantasy-badge ms-2">Ур. {building.level}</Badge>
                            )}
                            {building.durability !== undefined && building.max_durability !== undefined && (
                              <small className="fantasy-text-muted d-block mt-1">
                                <i className="fas fa-heartbeat me-1"></i>
                                Прочность: {building.durability}/{building.max_durability}
                              </small>
                            )}
                          </div>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              </div>
            ) : (
              scoutType !== 'deep' && (
                <Alert variant="secondary" className="fantasy-alert mt-3">
                  <i className="fas fa-info-circle me-2"></i>
                  Информация о постройках отсутствует (требуется глубокая разведка).
                </Alert>
              )
            )}

            {/* Гарнизон */}
            {data.garrison && Object.keys(data.garrison).length > 0 && (
              <div className="mb-4">
                <h6 className="fantasy-text-muted mb-3 small">
                  <i className="fas fa-users me-2"></i> Гарнизон
                </h6>
                <ListGroup variant="flush" className="fantasy-card">
                  {Object.entries(data.garrison).map(([unitKey, unit]) => (
                    <ListGroup.Item key={unitKey} className="fantasy-card border-secondary p-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fantasy-text-dark small">{unit.name || unitKey}</span>
                        <Badge bg="info" className="fantasy-badge">Количество: {unit.amount || unit.count || 0}</Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            {/* Эссенция и прочность */}
            {(data.current_essence !== undefined || data.durability !== undefined) && (
              <Row className="mb-4 g-2">
                {data.current_essence !== undefined && (
                  <Col xs={6}>
                    <Card className="fantasy-card">
                      <Card.Body className="p-2 text-center">
                        <h6 className="fantasy-text-muted small mb-1">
                          <i className="fas fa-star text-warning me-1"></i> Эссенция
                        </h6>
                        <p className="fantasy-text-dark mb-0 small">
                          {data.current_essence} / {data.max_essence || '?'}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                )}
                {data.durability !== undefined && (
                  <Col xs={6}>
                    <Card className="fantasy-card">
                      <Card.Body className="p-2 text-center">
                        <h6 className="fantasy-text-muted small mb-1">
                          <i className="fas fa-heartbeat text-danger me-1"></i> Прочность
                        </h6>
                        <p className="fantasy-text-dark mb-0 small">
                          {data.durability} / {data.max_durability || '?'}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                )}
              </Row>
            )}

            {/* Время обнаружения */}
            {(discoveredAt || lastScouted) && (
              <Alert variant="info" className="fantasy-alert mt-3 small p-2">
                {discoveredAt && (
                  <div>
                    <i className="fas fa-binoculars me-2"></i>
                    Обнаружено: {new Date(discoveredAt).toLocaleString()}
                  </div>
                )}
                {lastScouted && (
                  <div className="mt-1">
                    <i className="fas fa-history me-2"></i>
                    Последняя разведка: {new Date(lastScouted).toLocaleString()}
                  </div>
                )}
              </Alert>
            )}
          </Card.Body>
        </Card>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between border-top border-secondary p-3 fantasy-card">
        <Button variant="secondary" onClick={onHide} className="fantasy-btn">
          <i className="fas fa-times me-2"></i> Закрыть
        </Button>
        <div className="d-flex gap-2">
          <Button variant="outline-danger" onClick={() => { onAttack(settlement.id || data.id); onHide(); }} className="fantasy-btn">
            <i className="fas fa-skull me-2"></i> Атаковать
          </Button>
          <Button variant="outline-warning" onClick={() => { onSabotage(settlement.id || data.id); onHide(); }} className="fantasy-btn">
            <i className="fas fa-fire me-2"></i> Саботаж
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default SettlementDetailsModal;