import React from 'react';
import { Modal, Button, Alert, Badge, Spinner } from 'react-bootstrap';

const AgentMissionModal = ({
  show,
  onHide,
  selectedHero,
  selectedRegion,
  agentMissionType,
  discoveredSettlements,
  handleSendAgent,
  loading,
  showNotification,
  getAgentTypeInfo,
  getRegionInfo,
  translateSkill,
  getSkillIcon
}) => {
  return (
    <Modal 
      show={show} 
      onHide={onHide}
      centered
      contentClassName="bg-dark text-light"
    >
      <Modal.Header closeButton className="fantasy-modal-header border-secondary">
        <Modal.Title className="fantasy-text-gold">
          <i className="fas fa-user-secret me-2"></i>
          Отправить героя на миссию
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-light">
        {selectedHero && (selectedRegion || (agentMissionType !== 'scout')) && (
          <Alert variant="info" className="fantasy-alert mb-3">
            <div className="d-flex align-items-center">
              <div className="me-3" style={{ fontSize: '2rem' }}>
                {getAgentTypeInfo(agentMissionType).icon}
              </div>
              <div>
                <strong className="text-dark">{getAgentTypeInfo(agentMissionType).name}: {selectedHero.name}</strong>
                <div className="small">
                  {agentMissionType === 'scout' 
                    ? `Регион: ${getRegionInfo(selectedRegion).name}`
                    : `Цель: ${discoveredSettlements.find(s => s.id === selectedRegion)?.name || selectedRegion}`}
                </div>
              </div>
            </div>
          </Alert>
        )}

        {agentMissionType === 'scout' ? (
          <Alert variant="warning" className="fantasy-alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {selectedHero?.name} будет занят 2-6 часов
          </Alert>
        ) : agentMissionType === 'assassin' ? (
          <Alert variant="danger" className="fantasy-alert">
            <i className="fas fa-skull-crossbones me-2"></i>
            {selectedHero?.name} будет занят 6-12 часов
          </Alert>
        ) : (
          <Alert variant="warning" className="fantasy-alert">
            <i className="fas fa-fire me-2"></i>
            {selectedHero?.name} будет занят 4-8 часов
          </Alert>
        )}

        <div className="text-center mt-4">
          <h5 className="fantasy-text-gold mb-3 text-light">Подтверждение</h5>
          <p className="text-muted">
            {agentMissionType === 'scout' 
              ? `Вы уверены, что хотите отправить героя ${selectedHero?.name} на разведку в регион ${selectedRegion ? getRegionInfo(selectedRegion).name : ''}?`
              : `Вы уверены, что хотите отправить героя ${selectedHero?.name} как ${agentMissionType === 'assassin' ? 'убийцу' : 'диверсанта'} на цель ${selectedRegion}?`}
          </p>
          <div className="mt-3">
            <strong className="text-warning">Навыки героя:</strong>
            <div className="d-flex justify-content-center flex-wrap gap-2 mt-2">
              {Object.entries(selectedHero?.skills || {}).map(([skill, level]) => (
                <Badge 
                  key={skill}
                  bg={
                    skill === 'assasin' || skill === 'assassin' ? 'danger' :
                    skill === 'diversion' || skill === 'sabotage' ? 'warning' :
                    skill === 'spy' ? 'info' :
                    skill === 'scout' ? 'primary' : 'secondary'
                  }
                >
                  {getSkillIcon(skill)} {translateSkill(skill)}: {level}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between border-top border-secondary">
        <Button 
          variant="secondary" 
          onClick={onHide}
          disabled={loading}
          className="fantasy-btn"
        >
          <i className="fas fa-times me-2"></i>
          Отмена
        </Button>
        <Button 
          variant={agentMissionType === 'scout' ? 'success' : 'danger'}
          onClick={handleSendAgent}
          disabled={!selectedHero || (!selectedRegion && agentMissionType === 'scout') || loading}
          className="fantasy-btn"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Отправка...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane me-2"></i>
              Отправить {selectedHero?.name}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AgentMissionModal;