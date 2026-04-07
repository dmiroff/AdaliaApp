import { Row, Col, Modal, Button, Alert, Badge, Card, Spinner, ListGroup } from 'react-bootstrap';
import '../settlement_tabs/SettlementMissions.css';

const DungeonGroupModal = ({
  show,
  onHide,
  missionLimits,
  towerLevel,
  availableDungeons,
  selectedDungeon,
  setSelectedDungeon,
  sortedGuildMembers,
  selectedPlayers,
  togglePlayerSelection,
  calculateAverageLevel,
  handleStartDungeon,
  loading,
  setLoading,
  showNotification,
  onReorderPlayers,          // новая функция для изменения порядка выбранных игроков
}) => {
  console.log('DungeonGroupModal debug:', {
    show,
    availableDungeons,
    selectedDungeon,
    selectedPlayersCount: selectedPlayers?.length || 0,
    missionLimits
  });

  const hasMissionLimits = missionLimits && typeof missionLimits.available !== 'undefined';
  const canStartMission = hasMissionLimits ? missionLimits.available > 0 : true;
  const noMissionsAvailable = hasMissionLimits && missionLimits.available <= 0;

  // Функция для назначения игрока лидером (перемещает в начало массива)
  const makeLeader = (playerId) => {
    const index = selectedPlayers.findIndex(p => p.id === playerId);
    if (index <= 0) return; // уже лидер или не найден
    const newOrder = [
      selectedPlayers[index],
      ...selectedPlayers.slice(0, index),
      ...selectedPlayers.slice(index + 1)
    ];
    onReorderPlayers(newOrder);
  };

  // Удаление игрока (обёртка над togglePlayerSelection)
  const removePlayer = (player) => {
    togglePlayerSelection(player);
  };

  const handleStartClick = async () => {
    if (selectedPlayers.length === 0) {
      showNotification('warning', 'Выберите хотя бы одного игрока');
      return;
    }
    if (noMissionsAvailable) {
      showNotification('warning', 'Нет доступных миссий на сегодня');
      return;
    }
    try {
      await handleStartDungeon();
    } catch (error) {
      console.error('Ошибка в handleStartClick:', error);
      showNotification('error', `Ошибка отправки: ${error.message}`);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      centered
      size="lg"
      contentClassName="bg-dark text-light fantasy-modal-content"
    >
      <Modal.Header closeButton className="fantasy-modal-header border-secondary">
        <Modal.Title className="fantasy-text-gold">
          <i className="fas fa-users me-2"></i>
          Собрать группу для подземелья
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="bg-dark text-light">
        {/* Блок с лимитами миссий */}
        {hasMissionLimits && (
          <Alert variant={canStartMission ? "info" : "warning"} className="fantasy-alert mb-3">
            <i className="fas fa-info-circle me-2"></i>
            Уровень башни: {towerLevel}
            <div className="mt-2">
              <small>
                Доступно миссий на сегодня: 
                <Badge bg={canStartMission ? "success" : "danger"} className="ms-2 fantasy-badge">
                  {missionLimits.available || 0}
                </Badge>
                {missionLimits.total !== undefined && (
                  <span className="ms-3">
                    Всего в день: <Badge bg="secondary" className="fantasy-badge">{missionLimits.total}</Badge>
                  </span>
                )}
              </small>
            </div>
            {noMissionsAvailable && (
              <div className="mt-2 small text-warning">
                <i className="fas fa-exclamation-triangle me-1"></i>
                Дождитесь сброса лимитов или повысьте уровень башни
              </div>
            )}
          </Alert>
        )}

        {/* Подсказка */}
        <Alert variant="info" className="fantasy-alert mb-3">
          <i className="fas fa-info-circle me-2"></i>
          Группа может состоять от 1 до 5 игроков. Первый игрок в списке будет лидером группы.
        </Alert>

        {/* Список доступных игроков */}
        <div className="mb-4">
          <h6 className="fantasy-text-gold mb-3">
            <i className="fas fa-users me-2"></i>
            Выберите игроков (от 1 до 5): {sortedGuildMembers.length} доступно
          </h6>
          <div className="members-list fantasy-scrollbar" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {sortedGuildMembers.map(member => {
              const isSelected = selectedPlayers.some(p => p.id === member.id);
              const isInDungeon = member.is_in_dungeon || member.active_event === "passing_dungeon";
              
              return (
                <div 
                  key={member.id}
                  className={`member-item d-flex justify-content-between align-items-center p-2 ${isSelected ? 'selected' : ''} ${isInDungeon ? 'in-dungeon' : ''}`}
                  onClick={() => {
                    if (isInDungeon) {
                      showNotification('warning', `${member.name} уже находится в подземелье`);
                      return;
                    }
                    if (selectedPlayers.length >= 5 && !isSelected) {
                      showNotification('warning', 'Максимум 5 игроков в группе');
                      return;
                    }
                    togglePlayerSelection(member);
                  }}
                  title={isInDungeon ? `${member.name} уже в подземелье` : ''}
                >
                  <div>
                    <strong className="text-light">{member.name}</strong>
                    <div className="small fantasy-text-gold">
                      Уровень {member.level || 1} • {member.class || 'Странник'}
                      {isInDungeon && (
                        <Badge bg="danger" className="ms-2 fantasy-badge">
                          В данже
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg={isInDungeon ? "danger" : "secondary"} className="fantasy-badge">
                      ур. {member.level || 1}
                    </Badge>
                    {isSelected && (
                      <i className="fas fa-check-circle text-success fs-5"></i>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Выбранные игроки и сводка */}
        <div className="mb-3">
          <h6 className="fantasy-text-gold mb-3">
            <i className="fas fa-user-check me-2"></i>
            Выбранные игроки ({selectedPlayers.length}/5):
          </h6>

          {selectedPlayers.length > 0 ? (
            <>
              <Card className="fantasy-card mb-3">
                <Card.Header className="fantasy-card-header">
                  <h6 className="fantasy-text-gold mb-0">
                    <i className="fas fa-crown me-2"></i>
                    Состав группы
                  </h6>
                </Card.Header>
                <ListGroup variant="flush" className="bg-dark">
                  {selectedPlayers.map((player, idx) => (
                    <ListGroup.Item key={player.id} className="bg-dark text-light border-secondary d-flex justify-content-between align-items-center">
                      <div>
                        {idx === 0 && (
                          <Badge bg="warning" className="me-2 fantasy-badge">
                            <i className="fas fa-crown me-1"></i> Лидер
                          </Badge>
                        )}
                        <strong>{player.name}</strong>
                        <span className="ms-2 text-muted">(ур. {player.level || 1})</span>
                      </div>
                      <div className="d-flex gap-2">
                        {idx !== 0 && (
                          <Button 
                            variant="outline-warning" 
                            size="sm"
                            onClick={() => makeLeader(player.id)}
                            title="Сделать лидером"
                          >
                            <i className="fas fa-crown me-1"></i> Лидер
                          </Button>
                        )}
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => removePlayer(player)}
                          title="Удалить из группы"
                        >
                          <i className="fas fa-times"></i>
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>

              <Card className="fantasy-card">
                <Card.Header className="fantasy-card-header">
                  <h6 className="fantasy-text-gold mb-0">
                    <i className="fas fa-chart-pie me-2"></i>
                    Сводка группы
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row className="text-center">
                    <Col xs={6}>
                      <div className="fantasy-text-dark small">Игроков:</div>
                      <div className="fantasy-text-dark fs-5">{selectedPlayers.length}</div>
                    </Col>
                    <Col xs={6}>
                      <div className="fantasy-text-dark small">Ср. уровень:</div>
                      <div className="fantasy-text-dark fs-5">{calculateAverageLevel()}</div>
                    </Col>
                  </Row>
                  <hr className="bg-secondary" />
                  <div className="text-center">
                    <div className="fantasy-text-dark small">Подземелье:</div>
                    <div className="fantasy-text-dark">
                      <i className="fas fa-dungeon me-2"></i>
                      {selectedDungeon ? selectedDungeon.name : 'Будет выбрано случайное'}
                    </div>
                    <div className="small text-info mt-1">
                      <i className="fas fa-chart-line me-1"></i>
                      Сложность и время будут определены автоматически
                    </div>
                  </div>
                  
                  {selectedPlayers.length < 3 && selectedPlayers.length > 0 && (
                    <Alert variant="warning" className="mt-3 mb-0 p-2 small fantasy-alert">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Маленькая группа ({selectedPlayers.length} игроков) может быть менее эффективной
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </>
          ) : (
            <Alert variant="secondary" className="fantasy-alert">
              <i className="fas fa-user-slash me-2"></i>
              Выберите хотя бы одного игрока для отправки в подземелье
            </Alert>
          )}
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
          variant="primary" 
          onClick={handleStartClick}
          disabled={selectedPlayers.length === 0 || loading || noMissionsAvailable}
          className="fantasy-btn fantasy-btn-primary"
          title={
            noMissionsAvailable ? "Лимит миссий исчерпан" :
            selectedPlayers.length === 0 ? "Выберите игроков" : ""
          }
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              <span className="fantasy-text-black">Отправка...</span>
            </>
          ) : (
            <>
              <i className="fas fa-dungeon me-2"></i>
              <span className="fantasy-text-black">
                {noMissionsAvailable ? "Лимит исчерпан" : `Отправить группу (${selectedPlayers.length} игроков)`}
              </span>
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DungeonGroupModal;