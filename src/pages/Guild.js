// Guild.jsx - исправленная версия без моргания
import React, { useState, useContext, useEffect, useRef, useLayoutEffect } from "react";
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
  Alert
} from "react-bootstrap";
import { Context } from "../index";
import { observer } from "mobx-react-lite";
import { 
  GetGuildData, 
  CreateGuild, 
  LeaveGuild, 
  GuildMemberAction,
  GuildRequestAction
} from "../http/guildService";
import { SERVER_APP_API_URL } from "../utils/constants";
import { dict_translator, attributes_dict } from "../utils/Helpers";
import "./Guild.css";

// Компонент выпадающего меню
const GuildDropdownMenu = ({ 
  isOpen, 
  onClose, 
  target, 
  member, 
  onMemberAction
}) => {
  const menuRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [isPositionReady, setIsPositionReady] = useState(false);

  useLayoutEffect(() => {
    if (isOpen && target) {
      const updatePosition = () => {
        const rect = target.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Ожидаемые размеры меню
        const menuWidth = 180;
        const menuHeight = 200;
        
        // Рассчитываем позицию
        let top = rect.bottom + 5;
        let left = rect.right - menuWidth;
        
        // Проверяем, помещается ли меню снизу
        if (top + menuHeight > viewportHeight - 20) {
          // Не помещается снизу - показываем сверху
          top = rect.top - menuHeight - 5;
        }
        
        // Проверяем, чтобы не вылезло за левый край
        if (left < 10) {
          left = 10;
        }
        
        // Проверяем, чтобы не вылезло за правый край
        if (left + menuWidth > viewportWidth - 10) {
          left = viewportWidth - menuWidth - 10;
        }
        
        setPosition({ top, left });
        setIsPositionReady(true);
      };
      
      // Сбрасываем состояние готовности
      setIsPositionReady(false);
      
      // Используем requestAnimationFrame для синхронизации с браузером
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updatePosition();
        });
      });
      
      const handleResizeAndScroll = () => {
        updatePosition();
      };
      
      window.addEventListener('resize', handleResizeAndScroll);
      window.addEventListener('scroll', handleResizeAndScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResizeAndScroll);
        window.removeEventListener('scroll', handleResizeAndScroll, true);
      };
    } else {
      setPosition(null);
      setIsPositionReady(false);
    }
  }, [isOpen, target]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          target && !target.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen && isPositionReady) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 10);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, target, onClose, isPositionReady]);

  if (!isOpen || !isPositionReady || !position) return null;

  const handleAction = (action, playerName) => {
    onClose();
    let message = '';
    let confirmAction = false;
    
    switch (action) {
      case "promote":
        message = `Назначить "${playerName}" офицером гильдии?`;
        confirmAction = window.confirm(message);
        break;
      case "demote":
        message = `Разжаловать "${playerName}" из офицеров?`;
        confirmAction = window.confirm(message);
        break;
      case "transfer":
        message = `Передать гильдию игроку "${playerName}"?\n\nВы перестанете быть лидером и станете офицером.`;
        confirmAction = window.confirm(message);
        break;
      case "kick":
        message = `Вы уверены, что хотите исключить "${playerName}" из гильдии?`;
        confirmAction = window.confirm(message);
        break;
    }
    
    if (confirmAction) {
      onMemberAction(action, playerName);
    }
  };

  return (
    <div 
      ref={menuRef}
      className="guild-dropdown-menu show"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 99999,
        minWidth: '180px',
        pointerEvents: 'auto'
      }}
    >
      {!member.isTargetLeader && (
        <>
          {!member.isTargetOfficer ? (
            <button
              className="dropdown-item"
              onClick={() => handleAction("promote", member.name)}
            >
              ⭐ Назначить офицером
            </button>
          ) : (
            <button
              className="dropdown-item"
              onClick={() => handleAction("demote", member.name)}
            >
              ⬇️ Разжаловать офицера
            </button>
          )}
          <button
            className="dropdown-item"
            onClick={() => handleAction("transfer", member.name)}
          >
            👑 Передать гильдию
          </button>
          <div className="dropdown-divider" />
        </>
      )}
      
      {(member.isCurrentUserOfficer && member.role !== "leader") || 
      (member.isCurrentUserLeader && !member.isTargetLeader) ? (
        <button
          className="dropdown-item text-danger"
          onClick={() => handleAction("kick", member.name)}
        >
          🚫 Исключить из гильдии
        </button>
      ) : null}
    </div>
  );
};

const Guild = observer(() => {
  const { user, guild } = useContext(Context);
  const [activeTab, setActiveTab] = useState("general");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);
  const [guildName, setGuildName] = useState("");
  const [guildDescription, setGuildDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const triggerRefs = useRef({});

  // Словарь для перевода названий подземелий
  const dungeonTranslations = {
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

  // Функция для перевода характеристик
  const translateAttribute = (attribute) => {
    return attributes_dict[attribute] || attribute;
  };

  // Функция для перевода класса
  const translateClass = (className) => {
    return className;
  };

  // Функция для перевода расы
  const translateRace = (race) => {
    return race;
  };

  // Функция для перевода подземелья
  const translateDungeon = (dungeonKey) => {
    return dungeonTranslations[dungeonKey] || dict_translator[dungeonKey] || dungeonKey;
  };

  useEffect(() => {
    fetchGuildData();
    const interval = setInterval(() => {
      if (guild.hasGuild) {
        fetchGuildData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [guild.hasGuild]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && triggerRefs.current[openDropdownId]) {
        if (!triggerRefs.current[openDropdownId].contains(event.target)) {
          // Проверяем, был ли клик по меню
          const menu = document.querySelector('.guild-dropdown-menu.show');
          if (!menu || !menu.contains(event.target)) {
            setOpenDropdownId(null);
          }
        }
      }
    };

    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [openDropdownId]);

  const fetchGuildData = async () => {
    guild.setLoading(true);
    setError("");
    const result = await GetGuildData();
    
    if (result && result.status === 200) {
      console.log("Guild data received:", result.data);
      guild.setGuildData(result.data);
      
      if (result.data.members) {
        const processedMembers = result.data.members.map(member => ({
          ...member,
          class_display: translateClass(member.class),
          race_display: translateRace(member.race),
          dungeons: member.dungeons ? member.dungeons.map(dungeon => ({
            ...dungeon,
            display_name: translateDungeon(dungeon.key) || dungeon.display_name
          })) : []
        }));
        guild.setMembers(processedMembers);
      }
    } else {
      setError(result?.message || "Не удалось загрузить данные гильдии");
    }
    guild.setLoading(false);
  };

  const handleCreateGuild = async () => {
    if (!guildName.trim()) {
      setError("Введите название гильдии");
      return;
    }

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
  };

  const handleLeaveGuild = async () => {
    const result = await LeaveGuild();
    if (result && result.status === 200) {
      setSuccess("Вы успешно вышли из гильдии");
      setShowLeaveModal(false);
      guild.clear();
      fetchGuildData();
    } else {
      setError(result?.message || "Не удалось выйти из гильдии");
    }
  };

  const handleMemberAction = async (action, playerName) => {
    setError("");
    setSuccess("");
    
    const result = await GuildMemberAction(action, playerName);
    if (result && result.status === 200) {
      setSuccess(result.message);
      setOpenDropdownId(null);
      setTimeout(() => {
        fetchGuildData();
      }, 300);
    } else {
      setError(result?.message || "Не удалось выполнить действие");
    }
  };

  const handleViewMemberDetails = (memberId) => {
    const member = guild.getMemberById(memberId);
    if (member) {
      const enrichedMember = {
        ...member,
        class_display: member.class_display || translateClass(member.class),
        race_display: member.race_display || translateRace(member.race),
        strength_display: translateAttribute("strength"),
        agility_display: translateAttribute("agility"),
        intelligence_display: translateAttribute("intelligence"),
        stamina_display: translateAttribute("constitution")
      };
      guild.setSelectedMember(enrichedMember);
      setShowMemberDetailsModal(true);
    } else {
      setError("Данные участника не найдены");
    }
  };

  const renderMemberDetailsModal = () => {
    const selectedMemberDetails = guild.selectedMember;
    if (!selectedMemberDetails) return null;

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
            📊 Детали участника
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="fantasy-card" style={{ background: 'linear-gradient(135deg, var(--color-bg-light) 0%, var(--color-bg-light) 100%)' }}>
          <div className="mb-4">
            <Row className="align-items-center mb-3">
              <Col xs="auto">
                <div className="member-details-avatar">
                  {getCharacterImageUrl(selectedMemberDetails.character_art) ? (
                    <img 
                      src={getCharacterImageUrl(selectedMemberDetails.character_art)}
                      alt={selectedMemberDetails.name}
                      className="avatar-img-details"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.parentNode.querySelector('.avatar-circle-details');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                      style={{ display: 'block' }}
                    />
                  ) : null}
                  <div 
                    className={`avatar-circle-details ${selectedMemberDetails.is_online ? 'online' : 'offline'}`}
                    style={!getCharacterImageUrl(selectedMemberDetails.character_art) ? { display: 'flex' } : { display: 'none' }}
                  >
                    {getCharacterFallback(selectedMemberDetails.class)}
                  </div>
                </div>
              </Col>
              <Col>
                <h4 className="fantasy-text-dark mb-1">{selectedMemberDetails.name}</h4>
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <Badge bg="primary" className="fantasy-badge">
                    Ур. {selectedMemberDetails.level}
                  </Badge>
                  <Badge bg="secondary" className="fantasy-badge">
                    {selectedMemberDetails.class_display || translateClass(selectedMemberDetails.class)}
                  </Badge>
                  <Badge bg="info" className="fantasy-badge">
                    {selectedMemberDetails.race_display || translateRace(selectedMemberDetails.race)}
                  </Badge>
                  <Badge 
                    bg={selectedMemberDetails.role === 'leader' ? 'danger' : selectedMemberDetails.role === 'officer' ? 'warning' : 'secondary'}
                    className="fantasy-badge"
                  >
                    {selectedMemberDetails.role_display || selectedMemberDetails.role}
                  </Badge>
                </div>
                <div className="mt-2">
                  <span className={selectedMemberDetails.is_online ? 'fantasy-text-success' : 'fantasy-text-muted'}>
                    {selectedMemberDetails.online_status || (selectedMemberDetails.is_online ? 'Онлайн' : 'Оффлайн')}
                  </span>
                </div>
              </Col>
            </Row>

            {/* Характеристики */}
            {(selectedMemberDetails.strength || selectedMemberDetails.agility || 
              selectedMemberDetails.intelligence || selectedMemberDetails.constitution) && (
              <div className="mb-4">
                <h5 className="fantasy-text-dark mb-3">💪 Характеристики</h5>
                <Row>
                  <Col md={3} sm={6} className="mb-3">
                    <Card className="fantasy-card attribute-card">
                      <Card.Body className="text-center">
                        <div className="attribute-value fantasy-text-dark">
                          {selectedMemberDetails.strength || 0}
                        </div>
                        <div className="attribute-label fantasy-text-muted">
                          {selectedMemberDetails.strength_display || translateAttribute("strength")}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3} sm={6} className="mb-3">
                    <Card className="fantasy-card attribute-card">
                      <Card.Body className="text-center">
                        <div className="attribute-value fantasy-text-dark">
                          {selectedMemberDetails.agility || 0}
                        </div>
                        <div className="attribute-label fantasy-text-muted">
                          {selectedMemberDetails.agility_display || translateAttribute("agility")}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3} sm={6} className="mb-3">
                    <Card className="fantasy-card attribute-card">
                      <Card.Body className="text-center">
                        <div className="attribute-value fantasy-text-dark">
                          {selectedMemberDetails.intelligence || 0}
                        </div>
                        <div className="attribute-label fantasy-text-muted">
                          {selectedMemberDetails.intelligence_display || translateAttribute("intelligence")}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3} sm={6} className="mb-3">
                    <Card className="fantasy-card attribute-card">
                      <Card.Body className="text-center">
                        <div className="attribute-value fantasy-text-dark">
                          {selectedMemberDetails.constitution || 0}
                        </div>
                        <div className="attribute-label fantasy-text-muted">
                          {selectedMemberDetails.stamina_display || translateAttribute("constitution")}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {/* Прогресс по подземельям */}
            {selectedMemberDetails.dungeons && selectedMemberDetails.dungeons.length > 0 ? (
              <div className="mb-4">
                <h5 className="fantasy-text-dark mb-3">🏆 Прогресс по подземельям</h5>
                <Row className="g-3">
                  {selectedMemberDetails.dungeons.map((dungeon) => (
                    <Col md={6} key={dungeon.key || dungeon.display_name}>
                      <Card className="fantasy-card dungeon-card">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="fantasy-text-dark mb-0">
                              {dungeon.display_name || translateDungeon(dungeon.key) || "Подземелье"}
                            </h6>
                            <Badge bg="warning" className="fantasy-badge">
                              {dungeon.current_floor || 0}/{dungeon.max_floor || 0}
                            </Badge>
                          </div>
                          <ProgressBar 
                            now={dungeon.progress_percent || 0} 
                            variant="warning" 
                            className="mb-2"
                            style={{ height: '8px' }}
                          />
                          <div className="d-flex justify-content-between">
                            <small className="fantasy-text-muted">
                              Этаж {dungeon.current_floor || 0}
                            </small>
                            <small className="fantasy-text-muted">
                              {(dungeon.progress_percent || 0).toFixed(1)}%
                            </small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ) : (
              <div className="mb-4">
                <h5 className="fantasy-text-dark mb-3">🏆 Прогресс по подземельям</h5>
                <Alert variant="info" className="fantasy-text-muted">
                  У игрока нет прогресса по подземельям
                </Alert>
              </div>
            )}

            {/* Дополнительная информация */}
            {selectedMemberDetails.guild_join_date && (
              <div>
                <h5 className="fantasy-text-dark mb-3">📅 Информация о вступлении</h5>
                <Card className="fantasy-card">
                  <Card.Body>
                    <p className="fantasy-text-muted mb-0">
                      В гильдии с: {new Date(selectedMemberDetails.guild_join_date).toLocaleDateString('ru-RU')}
                    </p>
                  </Card.Body>
                </Card>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top border-secondary">
          <Button 
            variant="secondary" 
            className="fantasy-btn"
            onClick={() => setShowMemberDetailsModal(false)}
          >
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const handleRequestAction = async (action, applicantName) => {
    setError("");
    setSuccess("");
    
    const result = await GuildRequestAction(action, applicantName);
    if (result && result.status === 200) {
      setSuccess(result.message);
      fetchGuildData();
    } else {
      setError(result?.message || "Не удалось выполнить действие");
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      leader: <Badge bg="danger" className="ms-1">Лидер</Badge>,
      officer: <Badge bg="warning" text="dark" className="ms-1">Офицер</Badge>,
      member: <Badge bg="secondary" className="ms-1">Участник</Badge>
    };
    return badges[role] || <Badge bg="secondary">Участник</Badge>;
  };

  const formatOnlineStatus = (statusBlockTime) => {
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
  };

  const toggleDropdown = (memberId, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setOpenDropdownId(openDropdownId === memberId ? null : memberId);
  };

  const getCharacterImageUrl = (characterArt) => {
    if (!characterArt) return null;
    
    let imageUrl = characterArt;
    if (imageUrl.includes('.gif') || imageUrl.includes('.png')) {
      imageUrl = imageUrl.replace('.gif', '.webp').replace('.png', '.webp');
    } else if (!imageUrl.includes('.webp')) {
      imageUrl = imageUrl + '.webp';
    }
    
    return `${SERVER_APP_API_URL}/images/characters/${imageUrl}`;
  };

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

  const calculateGuildFillPercentage = (guildData) => {
    if (!guildData || !guildData.total_members || !guildData.members_limit) return 0;
    return (guildData.total_members / guildData.members_limit) * 100;
  };

  const renderGeneralTab = () => {
    const guildData = guild.guildData;
    
    if (!guildData || !guildData.has_guild) {
      return (
        <Card className="fantasy-card">
          <Card.Header className="fantasy-card-header fantasy-card-header-primary">
            <h4>Вы не состоите в гильдии</h4>
          </Card.Header>
          <Card.Body className="text-center">
            <div className="mb-4">
              <p className="fantasy-text-muted">Присоединитесь к существующей или создайте свою гильдию!</p>
            </div>
            <div className="d-flex justify-content-center gap-3">
              <Button 
                variant="primary" 
                className="fantasy-btn fantasy-btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                Создать гильдию
              </Button>
            </div>
          </Card.Body>
        </Card>
      );
    }

    const fillPercentage = calculateGuildFillPercentage(guildData);

    return (
      <>
        <Row className="g-3">
          <Col lg={8}>
            <Card className="fantasy-card h-100">
              <Card.Header className="fantasy-card-header fantasy-card-header-primary">
                <Row className="align-items-center">
                  <Col>
                    <h4 className="fantasy-text-gold mb-0">{guildData.name}</h4>
                  </Col>
                  <Col xs="auto">
                    {getRoleBadge(guildData.player_role)}
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <p className="fantasy-text-muted">{guildData.description || "Нет описания"}</p>
                </div>
                
                <Row className="mb-4">
                  <Col md={4}>
                    <div className="guild-stat">
                      <div className="fantasy-text-dark">Участников</div>
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
                      <div className="fantasy-text-dark">Замков</div>
                      <div className="fantasy-text-dark">{guildData.castles?.length || 0}</div>
                    </div>
                  </Col>
                </Row>

                <div className="d-flex gap-2 flex-wrap">
                  {(guildData.player_role === "leader" || guildData.player_role === "officer") && (
                    <Button 
                      variant="warning" 
                      className="fantasy-btn"
                      onClick={() => setShowOfficerModal(true)}
                    >
                      👑 Офицерские функции
                    </Button>
                  )}
                  <Button 
                    variant="danger" 
                    className="fantasy-btn"
                    onClick={() => setShowLeaveModal(true)}
                  >
                    🚪 Покинуть гильдию
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="fantasy-card h-100">
              <Card.Header className="fantasy-card-header fantasy-card-header-info">
                <h5 className="fantasy-text-gold">📊 Статистика</h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span>Онлайн:</span>
                    <Badge bg="success">{guildData.online_members || 0}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span>Оффлайн:</span>
                    <Badge bg="secondary">{(guildData.total_members || 0) - (guildData.online_members || 0)}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span>Офицеров:</span>
                    <Badge bg="warning">{guildData.officers?.length || 0}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span>Заявок:</span>
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
                <h5 className="fantasy-text-gold">👥 Состав гильдии ({guildData.total_members || 0})</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {guild.members.map((member, index) => {
                    const memberId = member.id || index;
                    const isCurrentUserLeader = guildData?.player_role === "leader";
                    const isCurrentUserOfficer = guildData?.player_role === "officer";
                    const isTargetOfficer = member.role === "officer";
                    const isTargetLeader = member.role === "leader";
                    const isCurrentUser = member.id === user.user?.id;
                    const canManage = (isCurrentUserLeader || isCurrentUserOfficer) && !isCurrentUser;
                    const characterImageUrl = getCharacterImageUrl(member.character_art);
                    const isDropdownOpen = openDropdownId === memberId;
                    
                    return (
                      <Col md={6} lg={4} key={memberId} className="mb-3">
                        <Card className="fantasy-card member-card">
                          <Card.Body style={{ position: 'relative' }}>
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center flex-grow-1">
                                <div className="member-avatar me-3">
                                  {characterImageUrl ? (
                                    <>
                                      <img 
                                        src={characterImageUrl}
                                        alt={member.name}
                                        className={`avatar-img ${member.is_online ? 'online' : 'offline'}`}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          const fallback = e.target.parentNode.querySelector('.avatar-circle');
                                          if (fallback) fallback.style.display = 'flex';
                                        }}
                                        style={{ display: 'block' }}
                                      />
                                      <div 
                                        className={`avatar-circle ${member.is_online ? 'online' : 'offline'}`}
                                        style={{ display: 'none' }}
                                      >
                                        {getCharacterFallback(member.class)}
                                      </div>
                                    </>
                                  ) : (
                                    <div className={`avatar-circle ${member.is_online ? 'online' : 'offline'}`}>
                                      {getCharacterFallback(member.class)}
                                    </div>
                                  )}
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
                                    <small className="text-muted">
                                      {member.is_online ? "🟢 Онлайн" : `⚫ ${formatOnlineStatus(member.status_block_time)}`}
                                    </small>
                                  </div>
                                </div>
                              </div>
                              {canManage && (
                                <div 
                                  className="dropdown-container"
                                  style={{ position: 'relative' }}
                                >
                                  <button
                                    className="btn btn-sm btn-outline-info me-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleViewMemberDetails(member.id);
                                    }}
                                    title="Просмотреть детали"
                                  >
                                    📊
                                  </button>
                                  <button
                                    ref={el => triggerRefs.current[memberId] = el}
                                    className="member-action-btn"
                                    onClick={(e) => toggleDropdown(memberId, e)}
                                    aria-label="Действия с участником"
                                  >
                                    ⋯
                                  </button>
                                </div>
                              )}
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
  };

  const renderCastlesTab = () => {
    const guildData = guild.guildData;
    
    if (!guildData || !guildData.has_guild) {
      return (
        <Card className="fantasy-card">
          <Card.Body className="text-center">
            <p className="fantasy-text-muted">Вы не состоите в гильдии</p>
          </Card.Body>
        </Card>
      );
    }

    return (
      <Row className="g-3">
        {guildData.castles?.map((castle, index) => (
          <Col md={6} lg={4} key={castle.id || index}>
            <Card className="fantasy-card h-100">
              <Card.Header className="fantasy-card-header fantasy-card-header-warning">
                <h5>🏰 {castle.name || "Без названия"}</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <p className="fantasy-text-muted">
                    <strong>Локация:</strong> {castle.location || "Неизвестно"}
                  </p>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Уровень:</span>
                    <span>{castle.level || 1}</span>
                  </div>
                  <ProgressBar now={(castle.level || 1) * 20} variant="warning" />
                </div>
                
                <ListGroup variant="flush" className="mb-3">
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Защита:</span>
                    <Badge bg="danger">{castle.defense || 0}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Гарнизон:</span>
                    <Badge bg="info">{castle.garrison || 0}/{castle.max_garrison || 100}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>Построек:</span>
                    <Badge bg="secondary">{(castle.buildings && Object.keys(castle.buildings).length) || 0}</Badge>
                  </ListGroup.Item>
                </ListGroup>
                
                <Button variant="outline-warning" className="w-100 fantasy-btn">
                  Управление замком
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
        
        {(!guildData.castles || guildData.castles.length === 0) && (
          <Col xs={12}>
            <Card className="fantasy-card">
              <Card.Body className="text-center">
                <p className="fantasy-text-muted">У гильдии пока нет замков</p>
                <Button variant="primary" className="fantasy-btn">
                  Захватить замок
                </Button>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    );
  };

  const renderSettlementTab = () => {
    const guildData = guild.guildData;
    
    if (!guildData || !guildData.has_guild) {
      return (
        <Card className="fantasy-card">
          <Card.Body className="text-center">
            <p className="fantasy-text-muted">Вы не состоите в гильдии</p>
          </Card.Body>
        </Card>
      );
    }

    const settlement = guildData.settlement;
    if (!settlement) {
      return (
        <Card className="fantasy-card">
          <Card.Body className="text-center">
            <p className="fantasy-text-muted">У гильдии нет поселения</p>
            <Button variant="primary" className="fantasy-btn">
              Основать поселение
            </Button>
          </Card.Body>
        </Card>
      );
    }
    
    return (
      <Row className="g-3">
        <Col xs={12}>
          <Card className="fantasy-card">
            <Card.Header className="fantasy-card-header fantasy-card-header-success">
              <h4>🏘️ {settlement.name || "Поселение"}</h4>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                <Col md={4}>
                  <div className="settlement-stat">
                    <div className="settlement-stat-label">Уровень поселения</div>
                    <div className="settlement-stat-value">{settlement.level || 1}</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="settlement-stat">
                    <div className="settlement-stat-label">Население</div>
                    <div className="settlement-stat-value">{settlement.population || 0}</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="settlement-stat">
                    <div className="settlement-stat-label">Защита</div>
                    <div className="settlement-stat-value">{settlement.defense || 0}</div>
                  </div>
                </Col>
              </Row>
              
              <div className="text-center">
                <p className="fantasy-text-muted">Раздел поселения в разработке</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderOfficerModal = () => {
    const guildData = guild.guildData;
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
          <Modal.Title className="fantasy-text-muted">👑 Офицерские функции</Modal.Title>
        </Modal.Header>
        <Modal.Body className="fantasy-card" style={{ background: 'linear-gradient(135deg, var(--color-bg-light) 0%, var(--color-bg-light) 100%)', padding: '1.5rem' }}>
          <div className="mb-4">
            <h5 className="fantasy-text-dark mb-3">📨 Заявки на вступление ({requestEntries.length})</h5>
            {requestEntries.length === 0 ? (
              <div className="text-center py-4">
                <p className="fantasy-text-muted mb-0">Нет заявок на вступление</p>
              </div>
            ) : (
              <Row className="mt-3 g-3">
                {requestEntries.map(([applicantName, requestInfo]) => (
                  <Col md={6} key={applicantName}>
                    <Card className="fantasy-card request-card" style={{ border: '2px solid var(--color-accent-bronze-light)' }}>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="fantasy-text-dark mb-2">{applicantName}</h6>
                            {requestInfo.level && (
                              <small className="fantasy-text-muted">
                                Ур. {requestInfo.level} • {translateClass(requestInfo.class) || "Неизвестный класс"}
                              </small>
                            )}
                          </div>
                          <div className="d-flex flex-column gap-2">
                            <Button 
                              variant="success" 
                              size="sm"
                              className="fantasy-btn"
                              onClick={() => handleRequestAction("accept", applicantName)}
                            >
                              ✅ Принять
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              className="fantasy-btn"
                              onClick={() => handleRequestAction("reject", applicantName)}
                            >
                              ❌ Отклонить
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-top border-secondary">
            <h5 className="fantasy-text-dark mb-3">⚙️ Быстрые действия</h5>
            <div className="d-flex gap-2 flex-wrap">
              <Button variant="outline-info" className="fantasy-btn">
                📨 Пригласить игрока
              </Button>
              <Button variant="outline-info" className="fantasy-btn">
                ⚙️ Настройки гильдии
              </Button>
              <Button variant="outline-info" className="fantasy-btn" onClick={() => { setShowOfficerModal(false); setActiveTab("castles"); }}>
                🏰 Управление замками
              </Button>
              <Button variant="outline-info" className="fantasy-btn">
                💰 Ресурсы гильдии
              </Button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top border-secondary">
          <Button 
            variant="secondary" 
            className="fantasy-btn"
            onClick={() => setShowOfficerModal(false)}
          >
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  if (guild.loading) {
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
          ⚠️ {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")} className="mt-3">
          ✅ {success}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="fantasy-tabs mb-4"
        justify
      >
        <Tab eventKey="general" title="🏰 Общее">
          {renderGeneralTab()}
        </Tab>
        
        <Tab 
          eventKey="castles" 
          title="🏯 Замки"
          disabled={!guild.hasGuild}
        >
          {guild.hasGuild ? renderCastlesTab() : (
            <Card className="fantasy-card">
              <Card.Body className="text-center">
                <p className="fantasy-text-muted">Вы не состоите в гильдии</p>
              </Card.Body>
            </Card>
          )}
        </Tab>
        
        <Tab 
          eventKey="settlement" 
          title="🏘️ Поселение"
          disabled={!guild.hasGuild}
        >
          {guild.hasGuild ? renderSettlementTab() : (
            <Card className="fantasy-card">
              <Card.Body className="text-center">
                <p className="fantasy-text-muted">Вы не состоите в гильдии</p>
              </Card.Body>
            </Card>
          )}
        </Tab>
      </Tabs>

      <Modal 
        show={showCreateModal} 
        onHide={() => setShowCreateModal(false)} 
        centered
        className="fantasy-modal create-guild-modal"
        backdrop="static"
      >
        <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
          <Modal.Title className="fantasy-text-gold">Создание гильдии</Modal.Title>
        </Modal.Header>
        <Modal.Body className="fantasy-card" style={{ background: 'linear-gradient(135deg, var(--color-bg-light) 0%, var(--color-bg-light) 100%)' }}>
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
          >
            Отмена
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateGuild}
            className="fantasy-btn"
            disabled={!guildName.trim()}
          >
            Создать гильдию
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal 
        show={showLeaveModal} 
        onHide={() => setShowLeaveModal(false)} 
        centered
        className="fantasy-modal leave-guild-modal"
        backdrop="static"
      >
        <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-danger">
          <Modal.Title className="fantasy-text-gold">Покинуть гильдию</Modal.Title>
        </Modal.Header>
        <Modal.Body className="fantasy-card" style={{ background: 'linear-gradient(135deg, var(--color-bg-light) 0%, var(--color-bg-light) 100%)' }}>
          <p className="fantasy-text-dark">Вы уверены, что хотите покинуть гильдию <strong>"{guild.guildData?.name}"</strong>?</p>
          {guild.guildData?.player_role === "leader" && (
            <Alert variant="warning" className="mt-3">
              ⚠️ Вы являетесь лидером гильдии! Если вы выйдете, гильдия будет распущена.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top border-secondary">
          <Button 
            variant="secondary" 
            onClick={() => setShowLeaveModal(false)}
            className="fantasy-btn"
          >
            Отмена
          </Button>
          <Button 
            variant="danger" 
            onClick={handleLeaveGuild}
            className="fantasy-btn"
          >
            Покинуть гильдию
          </Button>
        </Modal.Footer>
      </Modal>

      {showOfficerModal && renderOfficerModal()}
      {showMemberDetailsModal && renderMemberDetailsModal()}

      {/* Рендерим выпадающее меню вне дерева карточек */}
      {openDropdownId && triggerRefs.current[openDropdownId] && guild.members.find(m => (m.id || m.name) === openDropdownId) && (
        <GuildDropdownMenu
          isOpen={true}
          onClose={() => setOpenDropdownId(null)}
          target={triggerRefs.current[openDropdownId]}
          member={{
            ...guild.members.find(m => (m.id || m.name) === openDropdownId),
            isCurrentUserLeader: guild.guildData?.player_role === "leader",
            isCurrentUserOfficer: guild.guildData?.player_role === "officer",
            isTargetOfficer: guild.members.find(m => (m.id || m.name) === openDropdownId)?.role === "officer",
            isTargetLeader: guild.members.find(m => (m.id || m.name) === openDropdownId)?.role === "leader"
          }}
          onMemberAction={handleMemberAction}
        />
      )}
    </Container>
  );
});

export default Guild;