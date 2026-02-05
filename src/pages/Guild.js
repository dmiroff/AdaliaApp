// Guild.js - оптимизированная версия с атрибутами и навыками в деталях
import React, { useState, useContext, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  Container, 
  Spinner, 
  Tabs, 
  Tab, 
  Card, 
  Row, 
  Col, 
  Badge, 
  Button, 
  ListGroup,
  ProgressBar,
  Modal,
  Form,
  Alert,
  Table
} from "react-bootstrap";
import { Context } from "../index";
import { observer } from "mobx-react-lite";
import { 
  GetGuildData, 
  CreateGuild, 
  LeaveGuild, 
  GuildMemberAction,
  GuildRequestAction,
  UpdateGuildDescription,
  InviteToGuild
} from "../http/guildService";
import { dict_translator, attributes_dict } from "../utils/Helpers";
import "./Guild.css";
import CastleStorage from "../components/CastleStorage";
import SettlementComponent from "../components/settlement_tabs/SettlementComponent";

// Константы вынесены за компонент для предотвращения пересоздания
const DUNGEON_TRANSLATIONS = {
  "Dungeon_Stone": "🏔 Кристаллические горы",
  "Dungeon_Ice": "❄ Студёный престол", 
  "Dungeon_Electricity": "⚡ Грозовой перевал",
  "Dungeon_Light": "🌝 Цитадель света",
  "Dungeon_Death": "💀 Некрополь",
  "Dungeon_Fire": "🔥 Огненные озёра",
  "Dungeon_Dark": "🌚 Цитадель тьмы",
  "Dungeon_Life": "🌿 Сердце Цветения",
  "Dungeon_Wind": "💨 Штормовой грот",
  "Dungeon_Sound": "🌀 Пещеры эха",
  "Dungeon_Power": "👑 Чертог власти"
};

const ROLE_BADGES = {
  leader: <Badge bg="danger" className="ms-1">Лидер</Badge>,
  officer: <Badge bg="warning" text="dark" className="ms-1">Офицер</Badge>,
  member: <Badge bg="secondary" className="ms-1">Участник</Badge>
};

// Функция для расчета модификатора атрибута
const getModByAtt = (att, agi = false) => {
  let current = 10;
  let step = 1;
  if (agi) {
    step = 2;
  }
  let mod = 0;

  if (att < 10) {
    while (current - step >= att) {
      current -= step;
      step += 1;
      mod--;
    }
    if (current - att !== 0) {
      mod--;
    }
  } else {
    while (current + step <= att) {
      current += step;
      step += 1;
      mod++;
    }
  }

  return mod < 0 ? `${mod}` : `+${mod}`;
};

// Функция для подготовки строки атрибута
const prepareAttString = (att, att_inc, agi = false) => {
  const total = att + att_inc;
  const mod = getModByAtt(total, agi);
  return `${total} (${mod}), ${att} + ${att_inc}`;
};

// Вспомогательные функции вынесены за компонент
const getCharacterFallback = (characterClass) => {
  if (!characterClass) return "👤";
  const classLower = characterClass.toLowerCase();
  if (classLower.includes("маг") || classLower.includes("mage") || classLower.includes("wizard")) return "🔮";
  if (classLower.includes("воин") || classLower.includes("fighter") || classLower.includes("warrior")) return "⚔️";
  if (classLower.includes("лучник") || classLower.includes("ranger") || classLower.includes("archer")) return "🏹";
  if (classLower.includes("жрец") || classLower.includes("priest") || classLower.includes("cleric")) return "🙏";
  if (classLower.includes("разбойник") || classLower.includes("rogue") || classLower.includes("thief")) return "🗡️";
  if (classLower.includes("паладин") || classLower.includes("paladin") || classLower.includes("knight")) return "🛡️";
  return "👤";
};

// Компонент выпадающего меню для управления участниками
const MemberActionsDropdown = React.memo(({ 
  member, 
  currentUserRole,
  currentUserId,
  onAction,
  position = "bottom-end"
}) => {
  const [show, setShow] = useState(false);
  const targetRef = useRef(null);
  const dropdownRef = useRef(null);

  const isCurrentUser = member.id === currentUserId;
  const isTargetOfficer = member.role === "officer";
  const isTargetLeader = member.role === "leader";
  const isCurrentUserLeader = currentUserRole === "leader";
  const isCurrentUserOfficer = currentUserRole === "officer";

  // Проверка доступных действий
  const canPromote = isCurrentUserLeader && !isTargetLeader && !isTargetOfficer;
  const canDemote = isCurrentUserLeader && !isTargetLeader && isTargetOfficer;
  const canTransfer = isCurrentUserLeader && !isTargetLeader;
  const canKick = !isCurrentUser && (
    (isCurrentUserLeader && !isTargetLeader) ||
    (isCurrentUserOfficer && member.role === "member")
  );

  const handleAction = useCallback((action) => {
    setShow(false);
    let confirmMessage = "";

    switch (action) {
      case "promote":
        confirmMessage = `Назначить "${member.name}" офицером гильдии?`;
        break;
      case "demote":
        confirmMessage = `Разжаловать "${member.name}" из офицеров?`;
        break;
      case "transfer":
        confirmMessage = `Передать гильдию игроку "${member.name}"?\n\nВы перестанете быть лидером и станете офицером.`;
        break;
      case "kick":
        confirmMessage = `Вы уверены, что хотите исключить "${member.name}" из гильдии?`;
        break;
      default:
        return;
    }

    if (window.confirm(confirmMessage)) {
      onAction(action, member.name);
    }
  }, [member.name, onAction]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          targetRef.current && !targetRef.current.contains(event.target)) {
        setShow(false);
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show]);

  if (isCurrentUser || (!canPromote && !canDemote && !canTransfer && !canKick)) {
    return null;
  }

  return (
    <div ref={dropdownRef} className="position-relative">
      <button
        ref={targetRef}
        className={`member-action-btn ${isCurrentUserLeader ? 'leader' : 'officer'}`}
        onClick={(e) => {
          e.stopPropagation();
          setShow(!show);
        }}
        title={isCurrentUserLeader ? "Действия лидера" : "Действия офицера"}
      >
        {isCurrentUserLeader ? "👑" : "⭐"}
      </button>

      {show && (
        <div 
          className="guild-dropdown-menu show"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            zIndex: 1050,
            minWidth: '200px'
          }}
        >
          {canPromote && (
            <button
              className="dropdown-item"
              onClick={() => handleAction("promote")}
            >
              <i className="fas fa-star me-2"></i>
              Назначить офицером
            </button>
          )}
          
          {canDemote && (
            <button
              className="dropdown-item"
              onClick={() => handleAction("demote")}
            >
              <i className="fas fa-arrow-down me-2"></i>
              Разжаловать офицера
            </button>
          )}
          
          {canTransfer && (
            <button
              className="dropdown-item"
              onClick={() => handleAction("transfer")}
            >
              <i className="fas fa-crown me-2"></i>
              Передать гильдию
            </button>
          )}
          
          {(canPromote || canDemote || canTransfer) && canKick && (
            <div className="dropdown-divider"></div>
          )}
          
          {canKick && (
            <button
              className="dropdown-item text-danger"
              onClick={() => handleAction("kick")}
            >
              <i className="fas fa-user-times me-2"></i>
              Исключить из гильдии
            </button>
          )}
        </div>
      )}
    </div>
  );
});

const Guild = observer(() => {
  const { user, guild } = useContext(Context);
  const [activeTab, setActiveTab] = useState("general");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);
  const [showEditDescriptionModal, setShowEditDescriptionModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [guildName, setGuildName] = useState("");
  const [guildDescription, setGuildDescription] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [invitePlayerName, setInvitePlayerName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [memberDetailsTab, setMemberDetailsTab] = useState("attributes");

  // Мемоизированные утилиты
  const translateAttribute = useCallback((attribute) => attributes_dict[attribute] || attribute, []);
  const translateClass = useCallback((className) => className, []);
  const translateRace = useCallback((race) => race, []);
  const translateDungeon = useCallback((dungeonKey) => DUNGEON_TRANSLATIONS[dungeonKey] || dict_translator[dungeonKey] || dungeonKey, []);

  // Мемоизированная функция для получения бейджа роли
  const getRoleBadge = useCallback((role) => ROLE_BADGES[role] || ROLE_BADGES.member, []);

  // Получение данных гильдии
  useEffect(() => {
    fetchGuildData();
  }, []);

  const fetchGuildData = useCallback(async () => {
      guild.setLoading(true);
      setIsRefreshing(true);
      setError("");
      try {
          const result = await GetGuildData();
          if (result && result.status === 200) {
              guild.setGuildData(result.data);
              if (result.data.members) {
                  const processedMembers = result.data.members.map(member => {
                      return {
                          ...member,
                          // Данные уже структурированы на бэкенде
                          // attributes и skills уже готовы к использованию
                          class_display: translateClass(member.class),
                          race_display: translateRace(member.race),
                          dungeons: member.dungeons ? member.dungeons.map(dungeon => ({
                              ...dungeon,
                              display_name: translateDungeon(dungeon.key) || dungeon.display_name
                          })) : []
                      };
                  });
                  guild.setMembers(processedMembers);
              }
              setLastUpdated(new Date());
          } else {
              setError(result?.message || "Не удалось загрузить данные гильдии");
          }
      } catch (error) {
          setError("Ошибка при загрузке данных гильдии");
          console.error("Guild data fetch error:", error);
      } finally {
          guild.setLoading(false);
          setIsRefreshing(false);
      }
  }, [guild, translateClass, translateRace, translateDungeon]);

  // Оптимизированные обработчики
  const handleRefresh = useCallback(() => {
    fetchGuildData();
  }, [fetchGuildData]);

  const handleCreateGuild = useCallback(async () => {
    if (!guildName.trim()) {
      setError("Введите название гильдии");
      return;
    }

    setProcessingAction(true);
    setError("");
    const result = await CreateGuild(guildName, guildDescription);
    if (result && result.status === 200) {
      setSuccess("Гильдия успешно создана!");
      setShowCreateModal(false);
      setGuildName("");
      setGuildDescription("");
      fetchGuildData();
    } else {
      setError(result?.message || "Не удалось создать гильдию");
    }
    setProcessingAction(false);
  }, [guildName, guildDescription, fetchGuildData]);

  const handleLeaveGuild = useCallback(async () => {
    setProcessingAction(true);
    setError("");
    const result = await LeaveGuild();
    if (result && result.status === 200) {
      setSuccess("Вы успешно вышли из гильдии");
      setShowLeaveModal(false);
      guild.clear();
      fetchGuildData();
    } else {
      setError(result?.message || "Не удалось выйти из гильдии");
    }
    setProcessingAction(false);
  }, [guild, fetchGuildData]);

  const handleMemberAction = useCallback(async (action, playerName) => {
    setProcessingAction(true);
    setError("");
    setSuccess("");
    
    try {
      const result = await GuildMemberAction(action, playerName);
      if (result && result.status === 200) {
        setSuccess(result.message);
        setTimeout(() => {
          fetchGuildData();
        }, 500);
      } else {
        setError(result?.message || "Не удалось выполнить действие");
      }
    } catch (error) {
      setError("Ошибка при выполнении действия");
    } finally {
      setProcessingAction(false);
    }
  }, [fetchGuildData]);

  const handleRequestAction = useCallback(async (action, applicantName) => {
    setProcessingAction(true);
    setError("");
    setSuccess("");
    
    try {
      const result = await GuildRequestAction(action, applicantName);
      if (result && result.status === 200) {
        setSuccess(result.message);
        fetchGuildData();
      } else {
        setError(result?.message || "Не удалось выполнить действие");
      }
    } catch (error) {
      setError("Ошибка при обработке заявки");
    } finally {
      setProcessingAction(false);
    }
  }, [fetchGuildData]);

  const handleUpdateDescription = useCallback(async () => {
    setProcessingAction(true);
    setError("");
    
    try {
      const result = await UpdateGuildDescription(editDescription);
      if (result && result.status === 200) {
        setSuccess("Описание гильдии успешно обновлено!");
        setShowEditDescriptionModal(false);
        fetchGuildData();
      } else {
        setError(result?.message || "Не удалось обновить описание");
      }
    } catch (error) {
      setError("Ошибка при обновлении описания");
    } finally {
      setProcessingAction(false);
    }
  }, [editDescription, fetchGuildData]);

  const handleInvitePlayer = useCallback(async () => {
    if (!invitePlayerName.trim()) {
      setError("Введите имя игрока");
      return;
    }

    setProcessingAction(true);
    setError("");
    
    try {
      const result = await InviteToGuild(invitePlayerName);
      if (result && result.status === 200) {
        setSuccess(result.message || `Приглашение отправлено игроку ${invitePlayerName}`);
        setShowInviteModal(false);
        setInvitePlayerName("");
      } else {
        setError(result?.message || "Не удалось отправить приглашение");
      }
    } catch (error) {
      setError("Ошибка при отправке приглашения");
    } finally {
      setProcessingAction(false);
    }
  }, [invitePlayerName]);

  // Оптимизированные функции форматирования
  const formatOnlineStatus = useCallback((statusBlockTime) => {
    if (!statusBlockTime) return "давно";
    try {
      const now = new Date();
      const blockTime = new Date(statusBlockTime);
      const diffMs = now - blockTime;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "только что";
      if (diffMins < 60) return `${diffMins} мин назад`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ч назад`;
      return `${Math.floor(diffMins / 1440)} д назад`;
    } catch (e) {
      return "давно";
    }
  }, []);

  const formatLastUpdated = useCallback(() => {
    if (!lastUpdated) return "никогда";
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000);
    
    if (diff < 60) return "только что";
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
    return `${Math.floor(diff / 86400)} д назад`;
  }, [lastUpdated]);

  // Компонент для отображения прогресса подземелья
  const DungeonProgressItem = React.memo(({ dungeon, translateDungeon }) => {
    const dungeonName = dungeon.display_name || translateDungeon(dungeon.key) || dungeon.key;
    const maxFloor = dungeon.max_floor || 1;
    const currentFloor = dungeon.current_floor || 0;
    const progressPercentage = maxFloor > 0 ? (currentFloor / maxFloor) * 100 : 0;
    
    return (
      <div className="dungeon-list-item mb-2 p-2 border rounded">
        <div className="d-flex justify-content-between align-items-center">
          <span className="fantasy-text-dark">{dungeonName}</span>
          <div className="text-end">
            <div className="fantasy-text-dark">
              {currentFloor}/{maxFloor}
            </div>
            <ProgressBar 
              now={progressPercentage} 
              variant={
                progressPercentage >= 100 ? "success" : 
                progressPercentage >= 50 ? "warning" : 
                "info"
              }
              style={{ height: "4px", width: "100px" }}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    );
  });

  // Оптимизированные компоненты вкладок
  const renderGeneralTab = useCallback(() => {
    const guildData = guild.guildData;
    
    if (!guildData || !guildData.has_guild) {
      return (
        <Card className="fantasy-card">
          <Card.Header className="fantasy-card-header fantasy-card-header-primary">
            <div className="d-flex justify-content-between align-items-center">
              <h4>Вы не состоите в гильдии</h4>
              <Button 
                variant="outline-info" 
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <i className={`fas fa-sync-alt ${isRefreshing ? 'fa-spin' : ''}`}></i>
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="text-center">
            <div className="mb-4">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <p className="fantasy-text-muted">Присоединитесь к существующей или создайте свою гильдию!</p>
            </div>
            <div className="d-flex justify-content-center gap-3">
              <Button 
                variant="primary" 
                className="fantasy-btn fantasy-btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="fas fa-plus me-2"></i>
                Создать гильдию
              </Button>
            </div>
          </Card.Body>
        </Card>
      );
    }

    const fillPercentage = guildData.total_members && guildData.members_limit 
      ? (guildData.total_members / guildData.members_limit) * 100 
      : 0;
    const isLeader = guildData.player_role === "leader";
    const isOfficer = guildData.player_role === "officer";

    return (
      <>
        <Row className="g-3">
          <Col lg={8}>
            <Card className="fantasy-card h-100">
              <Card.Header className="fantasy-card-header fantasy-card-header-primary">
                <Row className="align-items-center">
                  <Col>
                    <h4 className="fantasy-text-gold mb-0">
                      <i className="fas fa-users me-2"></i>
                      {guildData.name}
                    </h4>
                  </Col>
                  <Col xs="auto">
                    <div className="d-flex align-items-center gap-2">
                      {getRoleBadge(guildData.player_role)}
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        title="Обновить данные"
                      >
                        <i className={`fas fa-sync-alt ${isRefreshing ? 'fa-spin' : ''}`}></i>
                      </Button>
                    </div>
                  </Col>
                </Row>
                {lastUpdated && (
                  <small className="fantasy-text-muted d-block mt-1">
                    <i className="fas fa-clock me-1"></i>
                    Обновлено: {formatLastUpdated()}
                  </small>
                )}
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="fantasy-text-dark mb-0">Описание гильдии:</h6>
                    {/* Показываем кнопку редактирования только офицерам и лидеру */}
                    {(isLeader || isOfficer) && (
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        className="fantasy-btn"
                        onClick={() => {
                          setEditDescription(guildData.description || "");
                          setShowEditDescriptionModal(true);
                        }}
                      >
                        <i className="fas fa-edit me-1"></i>
                        Изменить
                      </Button>
                    )}
                  </div>
                  <p className="fantasy-text-muted mb-0">
                    {guildData.description || "Нет описания"}
                  </p>
                </div>
                
                <Row className="mb-4">
                  <Col md={4}>
                    <div className="guild-stat">
                      <div className="fantasy-text-dark">
                        <i className="fas fa-user-friends me-2"></i>
                        Участников
                      </div>
                      <div className="fantasy-text-dark">
                        {guildData.total_members || 0}/{guildData.members_limit || 20}
                      </div>
                      <div className="mt-2">
                        <ProgressBar 
                          now={fillPercentage} 
                          variant={fillPercentage > 90 ? "danger" : fillPercentage > 70 ? "warning" : "success"}
                          style={{ height: "6px" }}
                        />
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="guild-stat">
                      <div className="fantasy-text-dark">
                        <i className="fas fa-castle me-2"></i>
                        Замков
                      </div>
                      <div className="fantasy-text-dark">{guildData.castles?.length || 0}</div>
                    </div>
                  </Col>
                </Row>

                <div className="d-flex gap-2 flex-wrap">
                  {(isLeader || isOfficer) && (
                    <Button 
                      variant="warning" 
                      className="fantasy-btn"
                      onClick={() => setShowOfficerModal(true)}
                    >
                      <i className="fas fa-crown me-2"></i>
                      Функции управления
                    </Button>
                  )}
                  
                  <Button 
                    variant="danger" 
                    className="fantasy-btn"
                    onClick={() => setShowLeaveModal(true)}
                    disabled={isLeader && guildData.total_members > 1}
                  >
                    <i className="fas fa-door-open me-2"></i>
                    Покинуть гильдию
                  </Button>
                </div>

                {isLeader && guildData.total_members > 1 && (
                  <Alert variant="warning" className="mt-3">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Вы не можете покинуть гильдию, пока являетесь лидером и в гильдии есть другие участники.
                    Сначала передайте лидерство другому участнику.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="fantasy-card h-100">
              <Card.Header className="fantasy-card-header fantasy-card-header-info">
                <h5 className="fantasy-text-gold">
                  <i className="fas fa-chart-bar me-2"></i>
                  Статистика
                </h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span className="fantasy-text-dark">
                      <i className="fas fa-wifi me-2"></i>
                      Онлайн:
                    </span>
                    <Badge bg="success">{guildData.online_members || 0}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span className="fantasy-text-dark">
                      <i className="fas fa-moon me-2"></i>
                      Оффлайн:
                    </span>
                    <Badge bg="secondary">{(guildData.total_members || 0) - (guildData.online_members || 0)}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span className="fantasy-text-dark">
                      <i className="fas fa-star me-2"></i>
                      Офицеров:
                    </span>
                    <Badge bg="warning">{guildData.officers?.length || 0}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span className="fantasy-text-dark">
                      <i className="fas fa-envelope me-2"></i>
                      Заявок:
                    </span>
                    <Badge bg="info">{Object.keys(guildData.requests || {}).length}</Badge>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-3">
          <Col xs={12}>
            <Card className="fantasy-card">
              <Card.Header className="fantasy-card-header fantasy-card-header-success">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fantasy-text-gold">
                    <i className="fas fa-users me-2"></i>
                    Состав гильдии ({guildData.total_members || 0})
                  </h5>
                </div>
              </Card.Header>
              <Card.Body>
                <Row>
                  {guild.members.map((member, index) => {
                    const memberId = member.id || index;
                    const isCurrentUser = member.id === user.user?.id;
                    const isCurrentUserLeader = guildData.player_role === "leader";
                    const isCurrentUserOfficer = guildData.player_role === "officer";
                    const isTargetOfficer = member.role === "officer";
                    const isTargetLeader = member.role === "leader";
                    
                    // Проверяем, может ли текущий пользователь управлять этим участником
                    const canLeaderManage = isCurrentUserLeader && !isCurrentUser;
                    const canOfficerManage = isCurrentUserOfficer && member.role === "member" && !isCurrentUser;
                    const shouldShowActions = canLeaderManage || canOfficerManage;
                    const canViewDetails = isCurrentUserLeader || isCurrentUserOfficer;

                    return (
                      <Col md={6} lg={4} key={memberId} className="mb-3">
                        <Card className="fantasy-card member-card h-100">
                          <Card.Body>
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center flex-grow-1">
                                <div className="member-avatar me-3">
                                  <div className={`avatar-circle ${member.is_online ? 'online' : 'offline'}`}>
                                    {getCharacterFallback(member.class)}
                                  </div>
                                </div>
                                <div className="member-info flex-grow-1">
                                  <div className="d-flex align-items-center">
                                    <h6 className="fantasy-text-dark mb-1 mb-0 me-2">{member.name || "Без имени"}</h6>
                                    {getRoleBadge(member.role)}
                                  </div>
                                  <div className="member-details">
                                    <small className="text-muted d-block">
                                      {member.class_display || translateClass(member.class)} • Ур. {member.level || 1}
                                    </small>
                                    <small className={member.is_online ? "text-success" : "text-muted"}>
                                      {member.is_online ? "🟢 Онлайн" : `⚫ ${formatOnlineStatus(member.status_block_time)}`}
                                    </small>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="d-flex align-items-center gap-1">
                                {/* Кнопка просмотра деталей */}
                                {canViewDetails && (<button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setShowMemberDetailsModal(true);
                                    setMemberDetailsTab("attributes");
                                  }}
                                  title="Просмотреть детали"
                                >
                                  <i className="fas fa-chart-bar"></i>
                                </button>)}
                                
                                {/* Кнопка действий - только для тех, у кого есть права */}
                                {shouldShowActions && (
                                  <MemberActionsDropdown
                                    member={member}
                                    currentUserRole={guildData.player_role}
                                    currentUserId={user.user?.id}
                                    onAction={handleMemberAction}
                                  />
                                )}
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </>
    );
  }, [guild.guildData, guild.members, user.user?.id, isRefreshing, lastUpdated, 
      handleRefresh, formatLastUpdated, getRoleBadge, formatOnlineStatus, 
      handleMemberAction, translateClass]);

  const renderCastlesTab = useCallback(() => {
    const guildData = guild.guildData;
    
    if (!guildData || !guildData.has_guild) {
      return (
        <Card className="fantasy-card">
          <Card.Body className="text-center">
            <i className="fas fa-castle fa-3x text-muted mb-3"></i>
            <p className="fantasy-text-muted">Вы не состоите в гильдии</p>
          </Card.Body>
        </Card>
      );
    }

    return (
      <Row className="g-3">
        {guildData.castles?.map((castle, index) => {
          const storagePercentage = castle.current_weight && castle.storage_capacity 
            ? (castle.current_weight / castle.storage_capacity) * 100 
            : 0;
          const totalWorkers = (castle.workers_wood?.length || 0) + 
                              (castle.workers_stone?.length || 0) + 
                              (castle.workers_steel?.length || 0) + 
                              (castle.workers_glass?.length || 0);
          const siegeStatus = castle.siege && Object.keys(castle.siege).length > 0 
            ? { hasSiege: true, status: "В осаде" }
            : { hasSiege: false, status: "Без осады" };

          return (
            <Col md={6} lg={4} key={castle.id || index}>
              <Card className="fantasy-card h-100">
                <Card.Header className="fantasy-card-header fantasy-card-header-warning">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fantasy-text-gold mb-0">
                      <i className="fas fa-castle me-2"></i>
                      {castle.name || "Без названия"}
                    </h5>
                    <Badge bg={siegeStatus.hasSiege ? "danger" : "success"} className="siege-badge">
                      {siegeStatus.status}
                    </Badge>
                  </div>
                </Card.Header>
                <Card.Body>                  
                  <div className="mb-4">
                    <h6 className="fantasy-text-dark mb-3">
                      <i className="fas fa-chart-bar me-2"></i>
                      Основные показатели
                    </h6>
                    <Row className="mb-3">
                      <Col xs={6}>
                        <div className="castle-stat">
                          <div className="stat-label">Уровень замка</div>
                          <div className="stat-value">
                            <Badge bg="warning">{castle.level || 1}</Badge>
                          </div>
                        </div>
                      </Col>
                      <Col xs={6}>
                        <div className="castle-stat">
                          <div className="stat-label">Руны</div>
                          <div className="stat-value">
                            <Badge bg="purple">{castle.current_runes || 0}</Badge>
                          </div>
                        </div>
                      </Col>
                    </Row>
                    
                    <div className="storage-info mb-3 p-2" style={{ background: 'var(--color-bg-lighter)', borderRadius: '6px' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fantasy-text-dark">
                          <i className="fas fa-warehouse me-2"></i>
                          Хранилище (ур. {castle.storage_lvl || 1})
                        </span>
                        <Badge bg="secondary">{castle.storage_items_count || 0} предм.</Badge>
                      </div>
                      <ProgressBar 
                        now={storagePercentage} 
                        variant={storagePercentage > 90 ? "danger" : storagePercentage > 70 ? "warning" : "success"}
                        className="mb-1"
                      />
                      <div className="d-flex justify-content-between">
                        <small className="fantasy-text-muted">
                          {castle.current_weight ? castle.current_weight.toFixed(1) : 0} / {castle.storage_capacity || 1000} кг
                        </small>
                        <small className="fantasy-text-muted">{storagePercentage.toFixed(1)}%</small>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h6 className="fantasy-text-dark mb-3">
                      <i className="fas fa-tools me-2"></i>
                      Уровни построек
                    </h6>
                    <div className="buildings-grid">
                      {[
                        { name: "🏗️ Камнерезня", level: castle.stonecraft_lvl || 0, color: "secondary" },
                        { name: "🪵 Деревообр.", level: castle.woodcraft_lvl || 0, color: "success" },
                        { name: "🔥 Плавильня", level: castle.smelter_lvl || 0, color: "danger" },
                        { name: "🔮 Стеклодув", level: castle.glass_lvl || 0, color: "info" },
                        { name: "🏰 Стены", level: castle.wall_lvl || 0, color: "dark" },
                        { name: "⚔️ Казармы", level: castle.barracs_lvl || 0, color: "danger" },
                        { name: "🧪 Алхимик", level: castle.alchemist_lvl || 0, color: "purple" },
                        { name: "✨ Руны", level: castle.runestones_lvl || 0, color: "warning" },
                      ].map((building, idx) => (
                        <div key={idx} className="building-item">
                          <span className="building-name">{building.name}</span>
                          <Badge bg={building.color} className="building-level">{building.level}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h6 className="fantasy-text-dark mb-3">
                      <i className="fas fa-users me-2"></i>
                      Рабочие: {totalWorkers}
                    </h6>
                    <Row className="g-2">
                      {[
                        { icon: "tree", text: "Дерево", count: castle.workers_wood?.length || 0, color: "success" },
                        { icon: "mountain", text: "Камень", count: castle.workers_stone?.length || 0, color: "secondary" },
                        { icon: "industry", text: "Сталь", count: castle.workers_steel?.length || 0, color: "danger" },
                        { icon: "wine-glass", text: "Стекло", count: castle.workers_glass?.length || 0, color: "info" },
                      ].map((worker, idx) => (
                        <Col xs={6} key={idx}>
                          <div className="workers-type">
                            <i className={`fas fa-${worker.icon} me-2 text-${worker.color}`}></i>
                            {worker.text}: <Badge bg={worker.color}>{worker.count}</Badge>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                  
                  <div className="d-grid gap-2">
                    <Button 
                      variant="outline-warning" 
                      className="fantasy-btn"
                      onClick={() => {
                        guild.setSelectedCastle(castle);
                        setActiveTab("castleStorage");
                      }}
                    >
                      <i className="fas fa-warehouse me-2"></i>
                      Управление хранилищем
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
        
        {(!guildData.castles || guildData.castles.length === 0) && (
          <Col xs={12}>
            <Card className="fantasy-card">
              <Card.Body className="text-center">
                <i className="fas fa-castle fa-3x text-muted mb-3"></i>
                <h5 className="fantasy-text-muted mb-3">У гильдии пока нет замков</h5>
                <p className="fantasy-text-muted mb-4">
                  Захватите замок, чтобы получить доступ к общему хранилищу и улучшениям для гильдии!
                </p>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    );
  }, [guild.guildData, guild.setSelectedCastle]);

  // Мемоизированные модальные окна
  const renderCreateModal = useMemo(() => (
    <Modal 
      show={showCreateModal} 
      onHide={() => setShowCreateModal(false)} 
      centered
      className="fantasy-modal create-guild-modal"
      backdrop="static"
    >
      <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
        <Modal.Title className="fantasy-text-gold">
          <i className="fas fa-plus-circle me-2"></i>
          Создание гильдии
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="fantasy-card">
        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="fantasy-text-dark">Название гильдии</Form.Label>
            <Form.Control
              type="text"
              value={guildName}
              onChange={(e) => setGuildName(e.target.value)}
              placeholder="Введите название гильдии"
              autoFocus
              className="fantasy-input"
              maxLength={30}
            />
            <Form.Text className="text-muted">
              Максимум 30 символов
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fantasy-text-dark">Описание (необязательно)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={guildDescription}
              onChange={(e) => setGuildDescription(e.target.value)}
              placeholder="Опишите вашу гильдию..."
              className="fantasy-input"
              maxLength={200}
            />
            <Form.Text className="text-muted">
              Максимум 200 символов
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-top border-secondary">
        <Button 
          variant="secondary" 
          onClick={() => setShowCreateModal(false)}
          className="fantasy-btn"
          disabled={processingAction}
        >
          Отмена
        </Button>
        <Button 
          variant="primary" 
          onClick={handleCreateGuild}
          className="fantasy-btn"
          disabled={!guildName.trim() || processingAction}
        >
          {processingAction ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Создание...
            </>
          ) : (
            <>
              <i className="fas fa-plus me-2"></i>
              Создать гильдию
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  ), [showCreateModal, guildName, guildDescription, processingAction, handleCreateGuild]);

  const renderLeaveModal = useMemo(() => {
    const guildData = guild.guildData;
    
    return (
      <Modal 
        show={showLeaveModal} 
        onHide={() => setShowLeaveModal(false)} 
        centered
        className="fantasy-modal leave-guild-modal"
        backdrop="static"
      >
        <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-danger">
          <Modal.Title className="fantasy-text-gold">
            <i className="fas fa-door-open me-2"></i>
            Покинуть гильдию
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="fantasy-card">
          <div className="text-center mb-4">
            <i className="fas fa-door-open fa-3x text-danger mb-3"></i>
            <p className="fantasy-text-dark">Вы уверены, что хотите покинуть гильдию <strong>"{guildData?.name}"</strong>?</p>
          </div>
          {guildData?.player_role === "leader" && guildData?.total_members > 1 && (
            <Alert variant="danger" className="fantasy-alert">
              <div className="d-flex align-items-start">
                <i className="fas fa-exclamation-circle me-2 mt-1"></i>
                <div>
                  <strong>Вы являетесь лидером гильдии!</strong>
                  <p className="mb-0 mt-1">
                    Если вы выйдете сейчас, гильдия будет распущена, а все участники потеряют доступ к замкам и ресурсам.
                    Рассмотрите возможность передачи лидерства перед выходом.
                  </p>
                </div>
              </div>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top border-secondary">
          <Button 
            variant="secondary" 
            onClick={() => setShowLeaveModal(false)}
            className="fantasy-btn"
            disabled={processingAction}
          >
            Отмена
          </Button>
          <Button 
            variant="danger" 
            onClick={handleLeaveGuild}
            className="fantasy-btn"
            disabled={processingAction}
          >
            {processingAction ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Выход...
              </>
            ) : (
              <>
                <i className="fas fa-door-open me-2"></i>
                Покинуть гильдию
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }, [showLeaveModal, guild.guildData, processingAction, handleLeaveGuild]);

  const renderEditDescriptionModal = useMemo(() => (
    <Modal 
      show={showEditDescriptionModal} 
      onHide={() => setShowEditDescriptionModal(false)} 
      centered
      className="fantasy-modal"
      backdrop="static"
    >
      <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-info">
        <Modal.Title className="fantasy-text-gold">
          <i className="fas fa-edit me-2"></i>
          Изменить описание гильдии
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="fantasy-card">
        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="fantasy-text-dark">Новое описание</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Опишите вашу гильдию..."
              className="fantasy-input"
              maxLength={200}
            />
            <Form.Text className="text-muted">
              {editDescription.length}/200 символов
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-top border-secondary">
        <Button 
          variant="secondary" 
          onClick={() => setShowEditDescriptionModal(false)}
          className="fantasy-btn"
          disabled={processingAction}
        >
          Отмена
        </Button>
        <Button 
          variant="primary" 
          onClick={handleUpdateDescription}
          className="fantasy-btn"
          disabled={processingAction || !editDescription.trim()}
        >
          {processingAction ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Сохранение...
            </>
          ) : (
            <>
              <i className="fas fa-save me-2"></i>
              Сохранить
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  ), [showEditDescriptionModal, editDescription, processingAction, handleUpdateDescription]);

  const renderInviteModal = useMemo(() => (
    <Modal 
      show={showInviteModal} 
      onHide={() => setShowInviteModal(false)} 
      centered
      className="fantasy-modal"
      backdrop="static"
    >
      <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-success">
        <Modal.Title className="fantasy-text-gold">
          <i className="fas fa-user-plus me-2"></i>
          Пригласить игрока в гильдию
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="fantasy-card">
        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="fantasy-text-dark">Имя игрока</Form.Label>
            <Form.Control
              type="text"
              value={invitePlayerName}
              onChange={(e) => setInvitePlayerName(e.target.value)}
              placeholder="Введите имя игрока"
              className="fantasy-input"
              autoFocus
            />
            <Form.Text className="text-muted">
              Игрок получит приглашение присоединиться к вашей гильдии
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-top border-secondary">
        <Button 
          variant="secondary" 
          onClick={() => setShowInviteModal(false)}
          className="fantasy-btn"
          disabled={processingAction}
        >
          Отмена
        </Button>
        <Button 
          variant="success" 
          onClick={handleInvitePlayer}
          className="fantasy-btn"
          disabled={processingAction || !invitePlayerName.trim()}
        >
          {processingAction ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Отправка...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane me-2"></i>
              Отправить приглашение
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  ), [showInviteModal, invitePlayerName, processingAction, handleInvitePlayer]);

  // Рендер модальных окон, которые зависят от состояния
  const renderOfficerModal = () => {
    const guildData = guild.guildData;
    const isLeader = guildData?.player_role === "leader";
    const isOfficer = guildData?.player_role === "officer";
    const requests = guildData?.requests || {};
    const requestEntries = Object.entries(requests);
    
    return (
      <Modal 
        show={showOfficerModal} 
        onHide={() => setShowOfficerModal(false)} 
        size="lg" 
        centered
        className="fantasy-modal officer-modal"
        backdrop="static"
      >
        <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-warning">
          <Modal.Title className="fantasy-text-gold">
            <i className={`fas ${isLeader ? 'fa-crown' : 'fa-star'} me-2`}></i>
            {isLeader ? "Функции лидера" : "Функции офицера"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="fantasy-card">
          {/* Заявки на вступление */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fantasy-text-dark mb-0">
                <i className="fas fa-envelope me-2"></i>
                Заявки на вступление ({requestEntries.length})
              </h5>
              <Badge bg={requestEntries.length > 0 ? "info" : "secondary"}>
                {requestEntries.length}
              </Badge>
            </div>
            
            {requestEntries.length === 0 ? (
              <Alert variant="info" className="fantasy-alert">
                <i className="fas fa-info-circle me-2"></i>
                Нет заявок на вступление
              </Alert>
            ) : (
              <div className="requests-list">
                {requestEntries.map(([applicantName, requestInfo]) => (
                  <Card key={applicantName} className="fantasy-card mb-3">
                    <Card.Body>
                      <Row className="align-items-center">
                        <Col md={8}>
                          <div className="d-flex align-items-center mb-2">
                            <h6 className="fantasy-text-dark mb-0 me-3">{applicantName}</h6>
                            <Badge bg="primary">Ур. {requestInfo.level || 1}</Badge>
                          </div>
                          <div className="mb-2">
                            <small className="fantasy-text-muted">
                              <i className="fas fa-user me-2"></i>
                              {translateClass(requestInfo.class) || "Неизвестный класс"}
                            </small>
                          </div>
                          {requestInfo.message && (
                            <div className="mt-2">
                              <small className="fantasy-text-muted">
                                <i className="fas fa-comment me-2"></i>
                                {requestInfo.message}
                              </small>
                            </div>
                          )}
                        </Col>
                        <Col md={4} className="text-end">
                          <div className="d-flex flex-column gap-2">
                            <Button 
                              variant="success" 
                              size="sm"
                              className="fantasy-btn"
                              onClick={() => handleRequestAction("accept", applicantName)}
                              disabled={processingAction}
                            >
                              <i className="fas fa-check me-1"></i>
                              Принять
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              className="fantasy-btn"
                              onClick={() => handleRequestAction("reject", applicantName)}
                              disabled={processingAction}
                            >
                              <i className="fas fa-times me-1"></i>
                              Отклонить
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Быстрые действия */}
          <div className="mt-4 pt-4 border-top border-secondary">
            <h5 className="fantasy-text-dark mb-3">
              <i className="fas fa-bolt me-2"></i>
              Быстрые действия
            </h5>
            <div className="d-flex flex-wrap gap-2 mb-4">
              <Button 
                variant="outline-info" 
                className="fantasy-btn"
                onClick={() => {
                  setShowOfficerModal(false);
                  setShowInviteModal(true);
                }}
              >
                <i className="fas fa-user-plus me-2"></i>
                Пригласить игрока
              </Button>
              
              <Button 
                variant="outline-warning" 
                className="fantasy-btn"
                onClick={() => {
                  setShowOfficerModal(false);
                  setShowEditDescriptionModal(true);
                  setEditDescription(guildData.description || "");
                }}
              >
                <i className="fas fa-edit me-2"></i>
                Изменить описание
              </Button>

              <Button 
                variant="outline-info" 
                className="fantasy-btn"
                onClick={() => {
                  setShowOfficerModal(false);
                  setActiveTab("castles");
                }}
              >
                <i className="fas fa-castle me-2"></i>
                Управление замками
              </Button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top border-secondary">
          <Button 
            variant="secondary" 
            className="fantasy-btn"
            onClick={() => setShowOfficerModal(false)}
            disabled={processingAction}
          >
            <i className="fas fa-times me-2"></i>
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };
  // Внутри renderMemberDetailsModal обновляем отображение атрибутов и навыков
  const renderMemberDetailsModal = () => {
      if (!selectedMember) return null;

      // Атрибуты и навыки уже структурированы на бэкенде
      const attributes = selectedMember.attributes || {};
      const skills = selectedMember.skills || {};
      const dungeons = selectedMember.dungeons || [];

      // Функция для получения цвета прогресс-бара навыков
      const getSkillColor = (val) => {
          if (val >= 80) return "danger";
          if (val >= 60) return "warning";
          if (val >= 40) return "success";
          if (val >= 20) return "primary";
          return "secondary";
      };

      // Маппинг для ключей атрибутов (на всякий случай, но данные уже структурированы)
      const attributeKeys = [
          'perception', 'strength', 'agility', 'constitution',
          'intelligence', 'charisma', 'wisdom', 'luck'
      ];

      // Маппинг для ключей навыков
      const skillKeys = [
          'barter', 'intimidation', 'persuasion', 'sneak', 'observation',
          'identification', 'knowledge', 'lockpicking', 'animal_training',
          'athletics', 'calligraphy', 'fortitude', 'medicine', 'swords',
          'knifes', 'axes', 'hammers', 'bows', 'staffs', 'spears',
          'crossbows', 'throwing_weapon', 'shield'
      ];

      return (
          <Modal 
              show={showMemberDetailsModal} 
              onHide={() => setShowMemberDetailsModal(false)} 
              size="lg" 
              centered
              className="fantasy-modal member-details-modal"
              backdrop="static"
          >
              <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-info">
                  <Modal.Title className="fantasy-text-gold">
                      <i className="fas fa-user-circle me-2"></i>
                      Детали участника
                  </Modal.Title>
              </Modal.Header>
              <Modal.Body className="fantasy-card" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                  {/* Основная информация */}
                  <Row className="align-items-center mb-4">
                      <Col xs="auto">
                          <div className="member-details-avatar">
                              <div className={`avatar-circle-details ${selectedMember.is_online ? 'online' : 'offline'}`}>
                                  {getCharacterFallback(selectedMember.class)}
                              </div>
                          </div>
                      </Col>
                      <Col>
                          <h4 className="fantasy-text-dark mb-1">{selectedMember.name}</h4>
                          <div className="d-flex align-items-center flex-wrap gap-2">
                              <Badge bg="primary" className="fantasy-badge">
                                  Ур. {selectedMember.level || 1}
                              </Badge>
                              <Badge bg="secondary" className="fantasy-badge">
                                  {selectedMember.class_display || translateClass(selectedMember.class)}
                              </Badge>
                              <Badge bg="info" className="fantasy-badge">
                                  {selectedMember.race_display || translateRace(selectedMember.race)}
                              </Badge>
                              <Badge 
                                  bg={selectedMember.role === 'leader' ? 'danger' : selectedMember.role === 'officer' ? 'warning' : 'secondary'}
                                  className="fantasy-badge"
                              >
                                  {selectedMember.role === 'leader' ? 'Лидер' : selectedMember.role === 'officer' ? 'Офицер' : 'Участник'}
                              </Badge>
                          </div>
                          <div className="mt-2">
                              <Badge bg={selectedMember.is_online ? 'success' : 'secondary'}>
                                  {selectedMember.is_online ? '🟢 Онлайн' : '⚫ Оффлайн'}
                              </Badge>
                              {!selectedMember.is_online && selectedMember.status_block_time && (
                                  <small className="fantasy-text-muted ms-2">
                                      ({formatOnlineStatus(selectedMember.status_block_time)})
                                  </small>
                              )}
                          </div>
                      </Col>
                  </Row>

                  {/* Вкладки для деталей */}
                  <Tabs
                      activeKey={memberDetailsTab}
                      onSelect={(k) => setMemberDetailsTab(k)}
                      className="fantasy-tabs mb-3"
                      justify
                  >
                      <Tab eventKey="attributes" title={
                          <>
                              <i className="fas fa-chart-line me-1"></i>
                              Атрибуты
                          </>
                      }>
                          <div className="mt-3">
                              <h5 className="fantasy-text-dark mb-3">
                                  <i className="fas fa-chart-bar me-2"></i>
                                  Основные атрибуты
                              </h5>
                              {Object.keys(attributes).length > 0 ? (
                                  <div className="fantasy-attributes-grid">
                                      {attributeKeys.map(key => {
                                          const attr = attributes[key];
                                          if (!attr) return null;
                                          
                                          return (
                                              <div key={key} className="fantasy-attribute-item">
                                                  <div className="attribute-content">
                                                      <span className="fantasy-attribute-key">
                                                          {attr.icon} {attr.name}
                                                      </span>
                                                      <Badge className="fantasy-badge fantasy-badge-muted">
                                                          {attr.display_string || `${attr.total} (${attr.mod}), ${attr.base} + ${attr.increase}`}
                                                      </Badge>
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              ) : (
                                  <Alert variant="info" className="fantasy-alert">
                                      <i className="fas fa-info-circle me-2"></i>
                                      Нет информации об атрибутах
                                  </Alert>
                              )}
                          </div>
                      </Tab>
                      
                      <Tab eventKey="skills" title={
                          <>
                              <i className="fas fa-tools me-1"></i>
                              Навыки
                          </>
                      }>
                          <div className="mt-3">
                              <h5 className="fantasy-text-dark mb-3">
                                  <i className="fas fa-cogs me-2"></i>
                                  Навыки и умения
                              </h5>
                              {Object.keys(skills).length > 0 ? (
                                  <div className="fantasy-attributes-grid">
                                      {skillKeys.map(key => {
                                          const skill = skills[key];
                                          if (!skill) return null;
                                          
                                          return (
                                              <div key={key} className="fantasy-attribute-item">
                                                  <div className="attribute-content">
                                                      <span className="fantasy-attribute-key">
                                                          {skill.icon} {skill.name}
                                                      </span>
                                                      <div className="d-flex align-items-center" style={{ minWidth: '100px' }}>
                                                          <Badge className="fantasy-badge fantasy-badge-muted me-2">
                                                              {skill.value}
                                                          </Badge>
                                                          <ProgressBar
                                                              now={skill.value}
                                                              max={100}
                                                              variant={getSkillColor(skill.value)}
                                                              style={{ flexGrow: 1, height: '6px' }}
                                                          />
                                                      </div>
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              ) : (
                                  <Alert variant="info" className="fantasy-alert">
                                      <i className="fas fa-info-circle me-2"></i>
                                      Нет информации о навыках
                                  </Alert>
                              )}
                          </div>
                      </Tab>
                      
                      <Tab eventKey="dungeons" title={
                          <>
                              <i className="fas fa-dungeon me-1"></i>
                              Подземелья
                          </>
                      }>
                          <div className="mt-3">
                              <h5 className="fantasy-text-dark mb-3">
                                  <i className="fas fa-dungeon me-2"></i>
                                  Прогресс в подземельях
                              </h5>
                              {dungeons.length > 0 ? (
                                  <div className="dungeons-list">
                                      {dungeons.map((dungeon) => (
                                          <DungeonProgressItem 
                                              key={dungeon.key}
                                              dungeon={dungeon}
                                              translateDungeon={translateDungeon}
                                          />
                                      ))}                    
                                  </div>
                              ) : (
                                  <Alert variant="info" className="fantasy-alert">
                                      <i className="fas fa-info-circle me-2"></i>
                                      Нет информации о подземельях
                                  </Alert>
                              )}
                          </div>
                      </Tab>
                  </Tabs>
              </Modal.Body>
              <Modal.Footer className="border-top border-secondary">
                  <Button 
                      variant="secondary" 
                      className="fantasy-btn"
                      onClick={() => setShowMemberDetailsModal(false)}
                  >
                      <i className="fas fa-times me-2"></i>
                      Закрыть
                  </Button>
              </Modal.Footer>
          </Modal>
      );
  };

  if (guild.loading && !isRefreshing) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="secondary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="fantasy-text-gold mt-3">Загрузка данных гильдии...</p>
        </div>
      </div>
    );
  }

  return (
    <Container fluid className="guild-container">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")} className="mt-3">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")} className="mt-3">
          <i className="fas fa-check-circle me-2"></i>
          {success}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="fantasy-tabs mb-4"
        justify
      >
        <Tab eventKey="general" title={
          <>
            <i className="fas fa-users me-2"></i>
            Общее
          </>
        }>
          {renderGeneralTab()}
        </Tab>
        
        <Tab eventKey="castles" title={
          <>
            <i className="fas fa-castle me-2"></i>
            Замки
          </>
        }>
          {renderCastlesTab()}
        </Tab>
        
        <Tab eventKey="castleStorage" title={
          <>
            <i className="fas fa-warehouse me-2"></i>
            Хранилище замка
          </>
        }>
          {guild.hasGuild ? <CastleStorage /> : (
            <Card className="fantasy-card">
              <Card.Body className="text-center">
                <i className="fas fa-castle fa-3x text-muted mb-3"></i>
                <p className="fantasy-text-muted">Вы не состоите в гильдии</p>
              </Card.Body>
            </Card>
          )}
        </Tab>

        <Tab eventKey="settlements" title={
          <>
            <i className="fas fa-home me-2"></i>
            Поселение
          </>
        }>
          {guild.hasGuild ? <SettlementComponent /> : (
            <Card className="fantasy-card">
              <Card.Body className="text-center">
                <i className="fas fa-home fa-3x text-muted mb-3"></i>
                <p className="fantasy-text-muted">Вы не состоите в гильдии</p>
              </Card.Body>
            </Card>
          )}
        </Tab>
      </Tabs>

      {/* Модальные окна */}
      {renderCreateModal}
      {renderLeaveModal}
      {showOfficerModal && renderOfficerModal()}
      {showMemberDetailsModal && renderMemberDetailsModal()}
      {renderEditDescriptionModal}
      {renderInviteModal}
    </Container>
  );
});

export default Guild;