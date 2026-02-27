import { Modal, Button, Alert, Badge, Card, Spinner } from 'react-bootstrap';

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
  showNotification
}) => {
  console.log('DungeonGroupModal debug:', {
    show,
    availableDungeons,
    selectedDungeon,
    selectedPlayersCount: selectedPlayers?.length || 0,
    missionLimits
  });

  // Проверяем, есть ли лимиты миссий
  const hasMissionLimits = missionLimits && typeof missionLimits.available !== 'undefined';
  const canStartMission = hasMissionLimits ? missionLimits.available > 0 : true;
  
  // Показываем сообщение, если нет доступных миссий
  const noMissionsAvailable = hasMissionLimits && missionLimits.available <= 0;

  const handleStartClick = async () => {
    console.log('Начинаем отправку группы:', {
      selectedPlayersCount: selectedPlayers.length,
      missionLimits
    });

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
      contentClassName="bg-dark text-light"
    >
      <Modal.Header closeButton className="fantasy-modal-header border-secondary">
        <Modal.Title className="fantasy-text-gold">
          <i className="fas fa-users me-2"></i>
          Собрать группу для подземелья
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-light">
        {hasMissionLimits && (
          <Alert variant={canStartMission ? "info" : "warning"} className="fantasy-alert mb-3">
            <i className="fas fa-info-circle me-2"></i>
            Уровень башни: {towerLevel}
            <div className="mt-2">
              <small>
                Доступно миссий на сегодня: 
                <Badge bg={canStartMission ? "success" : "danger"} className="ms-2">
                  {missionLimits.available || 0}
                </Badge>
                {missionLimits.total !== undefined && (
                  <span className="ms-3">
                    Всего в день: <Badge bg="secondary">{missionLimits.total}</Badge>
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

        <Alert variant="info" className="fantasy-alert mb-3">
          <i className="fas fa-info-circle me-2"></i>
          Группа может состоять от 1 до 5 игроков. Сила группы зависит от количества и уровня игроков.
        </Alert>

        <div className="mb-4">
          <h6 className="fantasy-text-gold mb-3 text-light">
            Выберите игроков (от 1 до 5): {sortedGuildMembers.length} доступно
          </h6>
          <div className="members-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {sortedGuildMembers.map(member => {
              const isSelected = selectedPlayers.some(p => p.id === member.id);
              const isInDungeon = member.is_in_dungeon || member.active_event === "passing_dungeon";
              
              return (
                <div 
                  key={member.id}
                  className={`member-item ${isSelected ? 'selected' : ''} ${isInDungeon ? 'in-dungeon' : ''}`}
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
                  style={{
                    cursor: isInDungeon ? 'not-allowed' : 'pointer',
                    opacity: isInDungeon ? 0.6 : 1,
                    backgroundColor: isSelected ? 'rgba(13, 110, 253, 0.2)' : 'transparent',
                    borderRadius: '5px',
                    marginBottom: '5px',
                    border: isSelected ? '1px solid #0d6efd' : '1px solid transparent',
                    transition: 'all 0.2s'
                  }}
                  title={isInDungeon ? `${member.name} уже в подземелье` : ''}
                >
                  <div className="d-flex justify-content-between align-items-center p-2">
                    <div>
                      <strong className="text-light">{member.name}</strong>
                      <div className="small text-muted">
                        Уровень {member.level || 1} • {member.class || 'Adventurer'}
                        {isInDungeon && (
                          <Badge bg="danger" className="ms-2">
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
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-3">
          <h6 className="fantasy-text-gold mb-3 text-light">
            Выбранные игроки ({selectedPlayers.length}/5):
          </h6>
          {selectedPlayers.length > 0 ? (
            <div className="selected-players mb-3">
              <div className="d-flex flex-wrap gap-2 mb-3">
                {selectedPlayers.map(player => (
                  <Badge 
                    key={player.id} 
                    bg="primary" 
                    className="p-2 d-flex align-items-center"
                    style={{ fontSize: '0.9rem' }}
                  >
                    {player.name} (ур. {player.level || 1})
                    <button 
                      className="btn-close btn-close-white btn-close-sm ms-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlayerSelection(player);
                      }}
                      aria-label="Удалить"
                      style={{ padding: '0.25rem' }}
                    ></button>
                  </Badge>
                ))}
              </div>
              
              <Card className="fantasy-card bg-secondary">
                <Card.Body className="text-center">
                  <h6 className="fantasy-text-light mb-2">Сводка группы</h6>
                  <div className="row">
                    <div className="col-6">
                      <div className="text-muted small">Игроков:</div>
                      <div className="text-light fs-5">{selectedPlayers.length}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Ср. уровень:</div>
                      <div className="text-light fs-5">{calculateAverageLevel()}</div>
                    </div>
                    <div className="col-12 mt-3">
                      <div className="text-muted small">Подземелье:</div>
                      <div className="text-light">
                        <i className="fas fa-dungeon me-2"></i>
                        Будет выбрано случайное подземелье
                      </div>
                      <div className="small text-info mt-1">
                        <i className="fas fa-info-circle me-1"></i>
                        Сложность и время будут определены автоматически
                      </div>
                    </div>
                  </div>
                  
                  {selectedPlayers.length < 3 && selectedPlayers.length > 0 && (
                    <Alert variant="warning" className="mt-3 mb-0 p-2 small">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Маленькая группа ({selectedPlayers.length} игроков) может быть менее эффективной
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </div>
          ) : (
            <Alert variant="secondary" className="fantasy-alert">
              <i className="fas fa-user-slash me-2"></i>
              Выберите хотя бы одного игрока для отправки в подземелье
            </Alert>
          )}
        </div>
        
        {/* Отладка */}
        <div className="debug-info small text-muted mt-3 p-2 border-top">
          <div>Отладка:</div>
          <div>• Выбрано игроков: {selectedPlayers.length}</div>
          <div>• Лимит миссий: {hasMissionLimits ? `${missionLimits.available}/${missionLimits.total}` : 'нет данных'}</div>
          <div>• Можно отправить: {noMissionsAvailable ? 'Нет' : 'Да'}</div>
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
          disabled={
            selectedPlayers.length === 0 || 
            loading || 
            noMissionsAvailable
          }
          className="fantasy-btn fantasy-btn-primary"
          title={
            noMissionsAvailable ? "Лимит миссий исчерпан" :
            selectedPlayers.length === 0 ? "Выберите игроков" :
            ""
          }
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Отправка...
            </>
          ) : (
            <>
              <i className="fas fa-dungeon me-2"></i>
              {noMissionsAvailable ? "Лимит исчерпан" :
               `Отправить группу (${selectedPlayers.length} игроков)`}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DungeonGroupModal;