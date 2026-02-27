import React from 'react';
import { Modal, Button, Alert, Badge, Card, Row, Col } from 'react-bootstrap';
import { getAgentTypeInfo, getRegionInfo, formatTimeRemaining } from '../utils/missionUtils';

const MissionDetailsModal = ({
  show,
  onHide,
  mission
}) => {
  if (!mission) return null;

  const agentInfo = getAgentTypeInfo(mission.mission_type);
  const regionInfo = getRegionInfo(mission.target_id);

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      centered
      size="lg"
      contentClassName="bg-dark text-light"
    >
      <Modal.Header closeButton className="fantasy-modal-header border-secondary">
        <Modal.Title className="fantasy-text-gold">
          <i className="fas fa-info-circle me-2"></i>
          Детали миссии
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-light">
        <Card className="fantasy-card bg-secondary mb-3">
          <Card.Body>
            <Row className="mb-3">
              <Col md={6}>
                <h6 className="fantasy-text-light">Герой:</h6>
                <p className="text-light">{mission.hero_name}</p>
              </Col>
              <Col md={6}>
                <h6 className="fantasy-text-light">Тип миссии:</h6>
                <Badge bg="info" className="fantasy-badge">
                  {agentInfo.icon} {agentInfo.name}
                </Badge>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <h6 className="fantasy-text-light">Цель:</h6>
                <p className="text-light">
                  {mission.target_type === 'region' 
                    ? `${regionInfo.icon} ${regionInfo.name}`
                    : `Поселение: ${mission.target_id}`}
                </p>
              </Col>
              <Col md={6}>
                <h6 className="fantasy-text-light">Статус:</h6>
                <Badge bg={
                  mission.status === 'completed' ? 'success' :
                  mission.status === 'failed' ? 'danger' :
                  mission.status === 'active' ? 'warning' : 'secondary'
                }>
                  {mission.status === 'completed' ? 'Завершена' :
                   mission.status === 'failed' ? 'Провалена' :
                   mission.status === 'active' ? 'В процессе' : 'Ожидает'}
                </Badge>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <h6 className="fantasy-text-light">Отправлена:</h6>
                <p className="text-muted">
                  {new Date(mission.sent_at || mission.created_at).toLocaleString()}
                </p>
              </Col>
              <Col md={6}>
                <h6 className="fantasy-text-light">Завершена:</h6>
                <p className="text-muted">
                  {mission.completed_at 
                    ? new Date(mission.completed_at).toLocaleString()
                    : 'Еще не завершена'}
                </p>
              </Col>
            </Row>

            {mission.result && (
              <div className="mt-4">
                <h6 className="fantasy-text-light mb-2">Результат:</h6>
                <Card className="bg-dark">
                  <Card.Body>
                    {mission.result.type === 'settlement_found' ? (
                      <Alert variant="warning">
                        <i className="fas fa-flag me-2"></i>
                        Найдено новое поселение!
                      </Alert>
                    ) : mission.result.type === 'resources_found' ? (
                      <Alert variant="success">
                        <i className="fas fa-coins me-2"></i>
                        Найдены ресурсы
                      </Alert>
                    ) : mission.result.success ? (
                      <Alert variant="success">
                        <i className="fas fa-check-circle me-2"></i>
                        Миссия успешно выполнена
                      </Alert>
                    ) : (
                      <Alert variant="danger">
                        <i className="fas fa-times-circle me-2"></i>
                        Миссия провалена
                      </Alert>
                    )}
                    
                    {mission.result.details && (
                      <p className="text-light mt-2">{mission.result.details}</p>
                    )}
                    
                    {mission.result.rewards && (
                      <div className="mt-3">
                        <h6 className="fantasy-text-light">Награды:</h6>
                        <ul className="text-light">
                          {Object.entries(mission.result.rewards).map(([key, value]) => (
                            <li key={key}>
                              <strong>{key}:</strong> {value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>
            )}

            {mission.status === 'active' && mission.completed_at && (
              <Alert variant="info" className="mt-3">
                <i className="fas fa-clock me-2"></i>
                Завершится через: {formatTimeRemaining(mission.completed_at)}
              </Alert>
            )}
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between border-top border-secondary">
        <Button 
          variant="secondary" 
          onClick={onHide}
          className="fantasy-btn"
        >
          <i className="fas fa-times me-2"></i>
          Закрыть
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MissionDetailsModal;