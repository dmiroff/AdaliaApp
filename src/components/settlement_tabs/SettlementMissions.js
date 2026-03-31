import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { 
  Card, Alert, Button, Row, Col, Badge, 
  Tab, Nav, 
  ListGroup, Container, Spinner, ButtonGroup,
  Table
} from 'react-bootstrap';
import { observer } from "mobx-react-lite";
import { toJS } from 'mobx';
import { Context } from "../../index";
import SettlementMissionsService from "../../services/SettlementMissionsService";
import DungeonGroupModal from '../modals/DungeonGroupModal';
import AgentMissionModal from '../modals/AgentMissionModal';
import SettlementDetailsModal from '../modals/SettlementDetailsModal';
import { safeToString, translateSkill, getSkillIcon, getRegionInfo, getAgentTypeInfo, getMissionStatusBadge, formatTimeRemaining } from '../../utils/missionUtils';
import './SettlementMissions.css';

const SettlementMissions = observer(() => {
  const { settlement, user, guild } = useContext(Context);
  
  const settlementData = useMemo(() => {
    if (!settlement) return null;
    return toJS(settlement);
  }, [settlement]);
  
  const buildingsData = useMemo(() => {
    if (!settlementData) return {};
    return settlementData?._settlementData?.buildings || {};
  }, [settlementData]);
  
  const towerData = buildingsData?.tower;
  const towerLevel = towerData?.level || 0;
  const towerName = towerData?.name || 'Дозорная башня';
  const hasTower = towerLevel > 0;
  
  const heroesData = useMemo(() => {
    if (!settlementData) return {};
    return settlementData?._settlementData?.heroes || {};
  }, [settlementData]);
  
  const activeHeroes = useMemo(() => {
    return heroesData?.active_heroes || {};
  }, [heroesData]);
  
  const woundedHeroes = useMemo(() => {
    return heroesData?.wounded_heroes || {};
  }, [heroesData]);
  
  const heroesOnMission = useMemo(() => {
    return heroesData?.heroes_on_mission || {};
  }, [heroesData]);
  
  const [activeTab, setActiveTab] = useState('dungeon');
  const [showDungeonModal, setShowDungeonModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showSettlementDetails, setShowSettlementDetails] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [missionLimits, setMissionLimits] = useState(null);
  const [activeGroups, setActiveGroups] = useState([]);
  const [agentResults, setAgentResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [targetType, setTargetType] = useState('region');
  const [regionsInfo, setRegionsInfo] = useState([]);
  const [availableDungeons, setAvailableDungeons] = useState([]);
  const [knownSettlements, setKnownSettlements] = useState([]);
  const [guildMembersList, setGuildMembersList] = useState([]);
  const [selectedDungeon, setSelectedDungeon] = useState(null);
  const [selectedHero, setSelectedHero] = useState(null);
  const [agentMissionType, setAgentMissionType] = useState('scout');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  // ========== ПРОВЕРКА НАЛИЧИЯ ГИЛЬДИИ ==========
  const hasGuild = useMemo(() => guild.guildData?.has_guild || false, [guild.guildData]);
  
  // ========== ID ГИЛЬДИИ (МОЖЕТ БЫТЬ 0) ==========
  const guildId = useMemo(() => {
    if (guild.guildData?.id !== undefined) return guild.guildData.id;
    if (settlementData?._settlementData?.guild_id !== undefined) return settlementData._settlementData.guild_id;
    return undefined;
  }, [guild.guildData, settlementData]);

  // ========== АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ targetType ==========
  useEffect(() => {
    if (agentMissionType === 'scout') {
      setTargetType('region');
    } else {
      setTargetType('settlement');
    }
    setSelectedRegion(null);
  }, [agentMissionType]);

  // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
  const getSettlementTypeIcon = (type) => {
    const icons = {
      'Light': 'fa-sun',
      'Dark': 'fa-moon',
      'Sound': 'fa-music',
      'Lighting': 'fa-bolt',
      'Electric': 'fa-bolt',
      'Fire': 'fa-fire',
      'Ice': 'fa-snowflake',
      'Wind': 'fa-wind',
      'Stone': 'fa-mountain',
      'Power': 'fa-bolt',
      'Life': 'fa-heart',
      'Death': 'fa-skull'
    };
    return icons[type] || 'fa-flag';
  };

  const getSettlementDisplayName = useCallback((settlement) => {
    const data = settlement.info || settlement;
    if (data.name && data.name !== 'Unknown') return data.name;
    
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
    const typeName = typeNames[data.type] || data.type || 'Неизвестного типа';
    let name = `Поселение ${typeName}`;
    if (data.guild_name && data.guild_name !== 'Unknown') {
      name += ` (${data.guild_name})`;
    } else if (data.owner_name && data.owner_name !== 'Неизвестно') {
      name += ` (${data.owner_name})`;
    }
    return name;
  }, []);

  const showNotification = useCallback((type, message) => {
    setNotification({ 
      show: true, 
      type, 
      message: safeToString(message) 
    });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
  }, []);

  useEffect(() => {
    setSelectedHero(null);
  }, [agentMissionType]);

  const availableHeroes = useMemo(() => {
    const heroes = [];
    Object.entries(activeHeroes).forEach(([heroName, heroData]) => {
      if (!woundedHeroes[heroName] && !heroesOnMission[heroName]) {
        heroes.push({
          name: heroName,
          data: heroData,
          status: 'active',
          skills: heroData.skills || {}
        });
      }
    });
    return heroes.sort((a, b) => a.name.localeCompare(b.name));
  }, [activeHeroes, woundedHeroes, heroesOnMission]);

  const filteredHeroesByMissionType = useMemo(() => {
    if (!agentMissionType) return availableHeroes;
    
    const skillMap = {
      scout: ['assasin', 'diversion', 'spy'],
      assassin: ['assasin', 'assassin'],
      saboteur: ['diversion', 'sabotage']
    };
    
    const requiredSkills = skillMap[agentMissionType] || [];
    
    if (requiredSkills.length === 0) return availableHeroes;
    
    return availableHeroes.filter(hero => {
      const skills = hero.skills || {};
      return requiredSkills.some(skill => skills[skill] && skills[skill] > 0);
    });
  }, [availableHeroes, agentMissionType]);

  const playerRole = useMemo(() => {
    if (guild.guildData && guild.guildData.player_role) {
      return guild.guildData.player_role;
    }
    return 'member';
  }, [guild.guildData]);

  const canStartMissions = useMemo(() => {
    return playerRole === 'leader' || playerRole === 'officer' || playerRole === 'veteran';
  }, [playerRole]);

  const guildMembers = useMemo(() => {
    if (!guild.members || !Array.isArray(guild.members)) return guildMembersList;
    return guild.members.map(member => ({
      id: member.id,
      name: member.name,
      level: member.level || 1,
      class: member.class_display || member.class || 'Adventurer',
      is_online: member.is_online || false,
      is_in_dungeon: member.active_event === "passing_dungeon"
    }));
  }, [guild.members, guildMembersList]);

  const sortedGuildMembers = useMemo(() => {
    return [...guildMembers].sort((a, b) => (b.level || 0) - (a.level || 0));
  }, [guildMembers]);

  const availableMissions = useMemo(() => availableHeroes.length, [availableHeroes]);
  const activeGroupsCount = useMemo(() => activeGroups.length, [activeGroups]);

  const currentSettlementId = useMemo(() => {
    return settlementData?._settlementData?.id || settlementData?.id || null;
  }, [settlementData]);

  const discoveredSettlements = useMemo(() => {
    let settlements = [];
    if (knownSettlements && knownSettlements.length > 0) {
      settlements = knownSettlements;
    } else {
      settlements = agentResults.filter(r => 
        r.mission_type === 'scout' && 
        r.result?.type === 'settlement_found' &&
        r.status === 'completed'
      ).map(r => r.result?.settlement).filter(Boolean);
    }
    return settlements.filter(s => 
      s.id !== null && 
      s.id !== undefined && 
      String(s.id) !== String(currentSettlementId)
    );
  }, [agentResults, knownSettlements, currentSettlementId]);

  const availableRegions = useMemo(() => {
    if (regionsInfo && regionsInfo.length > 0) {
      return regionsInfo.map(region => region.id);
    }
    return ['forest', 'steppe', 'mountains', 'coast'];
  }, [regionsInfo]);

  // ========== ЗАГРУЗКА ДАННЫХ ==========
  const loadMissionData = useCallback(async () => {
    // Проверяем наличие гильдии и башни
    if (!hasGuild || !hasTower) {
      console.log('Cannot load mission data:', { hasGuild, hasTower });
      return;
    }
    // guildId может быть 0, но должен быть определён
    if (guildId === undefined) {
      console.error('guildId is undefined despite hasGuild=true');
      return;
    }

    try {
      const methods = [
        { method: 'getMissionLimits', call: () => SettlementMissionsService.getMissionLimits(guildId, towerLevel), setter: setMissionLimits },
        { method: 'getActiveDungeonGroups', call: () => SettlementMissionsService.getActiveDungeonGroups(guildId), setter: setActiveGroups },
        { method: 'getRegionsInfo', call: () => SettlementMissionsService.getRegionsInfo(), setter: setRegionsInfo },
        { method: 'getAvailableDungeons', call: () => SettlementMissionsService.getAvailableDungeons(guildId, towerLevel), setter: setAvailableDungeons },
        { method: 'getKnownSettlements', call: () => SettlementMissionsService.getKnownSettlements(guildId), setter: setKnownSettlements },
        { method: 'getGuildMembers', call: () => SettlementMissionsService.getGuildMembers(guildId), setter: setGuildMembersList }
      ];

      if (typeof SettlementMissionsService.getHeroMissionsResults === 'function') {
        methods.push({ 
          method: 'getHeroMissionsResults', 
          call: () => SettlementMissionsService.getHeroMissionsResults(guildId, { limit: 20 }),
          setter: setAgentResults 
        });
      }

      for (const { method, call, setter } of methods) {
        try {
          const response = await call();
          if (response && response.success) {
            setter(response.data);
            console.log(`${method} успешно загружен`);
          } else {
            console.warn(`${method} вернул ошибку:`, response);
          }
        } catch (error) {
          console.warn(`Ошибка при вызове ${method}:`, error);
          if (method === 'getHeroMissionsResults') {
            setAgentResults([]);
          }
        }
      }

      if (availableDungeons.length > 0 && !selectedDungeon) {
        setSelectedDungeon(availableDungeons[0]);
      }
      
    } catch (error) {
      console.error("Ошибка загрузки данных миссий:", error);
      showNotification('error', 'Ошибка загрузки данных миссий');
    }
  }, [guildId, hasGuild, hasTower, towerLevel, showNotification, selectedDungeon, availableDungeons.length]);

  const refreshAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      if (guild && guild.fetchGuildData) {
        await guild.fetchGuildData();
      }
      
      await loadMissionData();
      showNotification('success', 'Данные миссий обновлены');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showNotification('error', 'Ошибка при обновлении данных');
    } finally {
      setRefreshing(false);
    }
  }, [loadMissionData, showNotification, guild]);

  useEffect(() => {
    if (hasGuild && hasTower) {
      loadMissionData();
    }
  }, [hasGuild, hasTower, loadMissionData]);

  // ========== ОБРАБОТЧИКИ ==========
  const handleStartDungeon = async () => {
    if (!hasGuild) {
      showNotification('error', 'Вы не состоите в гильдии');
      return;
    }
    if (guildId === undefined) {
      showNotification('error', 'Ошибка идентификатора гильдии');
      return;
    }
    if (selectedPlayers.length === 0) {
        showNotification('warning', 'Выберите хотя бы одного игрока');
        return;
    }
    if (missionLimits?.available <= 0) {
        showNotification('warning', 'Нет доступных миссий на сегодня');
        return;
    }

    setLoading(true);
    try {
        const leaderId = selectedPlayers[0].id;
        
        console.log('Отправляемые данные:', {
          guildId,
          leaderId,
          playerIds: selectedPlayers.map(p => p.id),
          towerLevel
        });
        
        const response = await SettlementMissionsService.startDungeonMission(
          guildId,
          leaderId,
          selectedPlayers.map(p => p.id),
          towerLevel
        );

        if (response.success) {
          showNotification('success', 'Группа отправлена в подземелье!');
          if (response.data?.dungeon_run_id) {
            showNotification('info', `ID прохождения: ${response.data.dungeon_run_id}`);
          }
          setShowDungeonModal(false);
          setSelectedPlayers([]);
          await loadMissionData();
        } else {
          console.error('Ошибка отправки группы:', response);
          const errorMessage = response.data?.message || response.message || 'Ошибка отправки группы';
          showNotification('error', errorMessage);
        }
    } catch (error) {
        console.error('Error starting dungeon mission:', error);
        showNotification('error', 'Произошла ошибка при отправке группы');
    } finally {
        setLoading(false);
    }
  };

  const handleSendAgent = async () => {
    if (!hasGuild) {
      showNotification('error', 'Вы не состоите в гильдии');
      return;
    }
    if (guildId === undefined) {
      showNotification('error', 'Ошибка идентификатора гильдии');
      return;
    }
    if (!selectedHero) {
      showNotification('warning', 'Выберите героя для отправки');
      return;
    }
    if (!selectedRegion) {
      showNotification('warning', 'Выберите цель для миссии');
      return;
    }
    if (selectedRegion === currentSettlementId) {
      showNotification('error', 'Нельзя отправить миссию на своё поселение');
      return;
    }

    const isHeroBusy = heroesOnMission[selectedHero.name] || woundedHeroes[selectedHero.name];
    if (isHeroBusy) {
      showNotification('error', 'Этот герой сейчас не может быть отправлен на миссию');
      return;
    }

    setLoading(true);
    try {
      const missionData = {
        target_type: targetType,
        target_id: selectedRegion,
        mission_type: agentMissionType,
        hero_name: selectedHero.name,
        hero_id: selectedHero.data?.id || null,
        hero_skills: selectedHero.skills || {},
        hero_level: selectedHero.data?.level || 1,
        hero_essence_cost: 0,
        scout_type: 'standard',
        estimated_duration: 6
      };

      if (typeof SettlementMissionsService.sendHeroMission !== 'function') {
        showNotification('error', 'Функция отправки героя временно недоступна');
        setLoading(false);
        return;
      }

      const response = await SettlementMissionsService.sendHeroMission(
        guildId,
        missionData
      );

      if (response.success) {
        showNotification('success', `${selectedHero.name} отправлен на миссию!`);
        setShowAgentModal(false);
        setSelectedHero(null);
        setSelectedRegion(null);
        await loadMissionData();
        
        if (settlement?.fetchData) {
          await settlement.fetchData();
        }
      } else {
        if (response.status === 401) {
          showNotification('error', 'Требуется авторизация. Пожалуйста, войдите снова.');
        } else {
          showNotification('error', response.message || 'Ошибка отправки героя');
        }
      }
    } catch (error) {
      console.error('Error sending agent:', error);
      showNotification('error', 'Произошла ошибка при отправке героя');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAgentMission = async (missionId) => {
    if (!hasGuild) {
      showNotification('error', 'Вы не состоите в гильдии');
      return;
    }
    if (guildId === undefined) {
      showNotification('error', 'Ошибка идентификатора гильдии');
      return;
    }
    try {
      if (typeof SettlementMissionsService.completeHeroMission !== 'function') {
        showNotification('error', 'Функция завершения миссии временно недоступна');
        return;
      }

      const response = await SettlementMissionsService.completeHeroMission(guildId, missionId);
      if (response.success) {
        showNotification('success', 'Миссия завершена!');
        await loadMissionData();
        
        if (settlement?.fetchData) {
          await settlement.fetchData();
        }
      } else {
        showNotification('error', response.message);
      }
    } catch (error) {
      console.error('Error completing agent mission:', error);
      showNotification('error', 'Ошибка завершения миссии');
    }
  };

  const handleAbandonDungeon = async (dungeonRunId) => {
    if (!hasGuild) {
      showNotification('error', 'Вы не состоите в гильдии');
      return;
    }
    if (guildId === undefined) {
      showNotification('error', 'Ошибка идентификатора гильдии');
      return;
    }
    if (!window.confirm('Вы уверены, что хотите отменить это подземелье?\nИгроки не получат награды.')) {
      return;
    }
    
    try {
      if (typeof SettlementMissionsService.abandonDungeon !== 'function') {
        showNotification('error', 'Функция отмены подземелья временно недоступна');
        return;
      }

      const response = await SettlementMissionsService.abandonDungeon(guildId, dungeonRunId);
      if (response.success) {
        showNotification('success', 'Подземелье отменено');
        await loadMissionData();
      } else {
        showNotification('error', response.message);
      }
    } catch (error) {
      console.error('Error abandoning dungeon:', error);
      showNotification('error', 'Ошибка отмены подземелья');
    }
  };

  const togglePlayerSelection = (player) => {
    if (selectedPlayers.some(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else {
      if (selectedPlayers.length < 5) {
        if (player.is_in_dungeon) {
          showNotification('warning', `Игрок ${player.name} уже находится в подземелье`);
          return;
        }
        setSelectedPlayers([...selectedPlayers, player]);
      } else {
        showNotification('warning', 'Максимум 5 игроков в группе');
      }
    }
  };

  const calculateAverageLevel = () => {
    if (selectedPlayers.length === 0) return 0;
    const total = selectedPlayers.reduce((sum, player) => sum + (player.level || 1), 0);
    return Math.round(total / selectedPlayers.length);
  };

  const handleViewSettlement = (settlement) => {
    setSelectedSettlement(settlement);
    setShowSettlementDetails(true);
  };

  const handleAttackFromModal = (settlementId) => {
    setActiveTab('agents');
    setAgentMissionType('assassin');
    setSelectedRegion(settlementId);
    showNotification('info', 'Выберите героя для отправки');
  };

  const handleSabotageFromModal = (settlementId) => {
    setActiveTab('agents');
    setAgentMissionType('saboteur');
    setSelectedRegion(settlementId);
    showNotification('info', 'Выберите героя для отправки');
  };

  // ========== РЕНДЕР ==========
  if (!hasGuild) {
    return (
      <Container>
        <Card className="fantasy-card">
          <Card.Body className="text-center py-5">
            <i className="fas fa-users fa-3x text-muted mb-3"></i>
            <h5 className="fantasy-text-muted mb-3">Вы не состоите в гильдии</h5>
            <p className="fantasy-text-muted mb-4">
              Для доступа к миссиям поселения необходимо быть членом гильдии
            </p>
            <Button 
              variant="primary" 
              onClick={() => window.location.href = '/guilds'}
              className="fantasy-btn"
            >
              <i className="fas fa-users me-2"></i>
              Перейти к гильдиям
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (!hasTower) {
    return (
      <Container className="settlement-missions-container">
        <Card className="fantasy-card">
          <Card.Header className="fantasy-card-header">
            <h5 className="fantasy-text-gold mb-0">
              <i className="fas fa-tower-observation me-2"></i>
              Миссии поселения
            </h5>
          </Card.Header>
          <Card.Body className="text-center">
            <div className="mb-3" style={{ fontSize: '4rem' }}>
              🏗️
            </div>
            <h5 className="fantasy-text-dark">Дозорная башня не построена</h5>
            <p className="fantasy-text-dark">
              Постройте Дозорную башню, чтобы отправлять группы в подземелья
              и исследовать окрестности
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <Button 
                variant="primary" 
                onClick={() => window.location.href = '/settlement/buildings'}
                className="fantasy-btn"
              >
                <i className="fas fa-hammer me-2"></i>
                Перейти к строительству
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="settlement-missions-container">
      {notification.show && (
        <Alert 
          variant={notification.type === 'success' ? 'success' : 'danger'} 
          className="position-fixed top-0 end-0 m-3" 
          style={{ zIndex: 9999 }}
          dismissible
          onClose={() => setNotification({ show: false, type: '', message: '' })}
        >
          {safeToString(notification.message)}
        </Alert>
      )}
      
      <Card className="fantasy-card mb-4">
        <Card.Header className="fantasy-card-header fantasy-card-header-success">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fantasy-text-gold mb-0">
                <i className="fas fa-tower-observation me-2"></i>
                {towerName} (Уровень {towerLevel})
              </h5>
              <div className="fantasy-text-gold mt-1">
                Дозорная башня позволяет отправлять миссии
                {!canStartMissions && (
                  <span className="ms-2 text-warning">
                    <small>(Только просмотр)</small>
                  </span>
                )}
              </div>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-info" 
                size="sm"
                onClick={refreshAllData}
                disabled={refreshing}
                className="fantasy-btn"
              >
                {refreshing ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <i className="fas fa-sync me-1"></i>
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card.Header>
        
        <Card.Body className="fantasy-card">
          <Row className="mb-3">
            <Col md={4} className="mb-3 mb-md-0">
              <Card className="fantasy-card h-100 text-center">
                <Card.Body>
                  <div className="fantasy-text-dark fs-4 fw-bold">
                    {filteredHeroesByMissionType.length}
                  </div>
                  <div className="fantasy-text-muted">Доступных героев</div>
                  <div className="mt-2">
                    <Badge bg={filteredHeroesByMissionType.length > 0 ? "success" : "danger"}>
                      <i className="fas fa-user me-1"></i>
                      {filteredHeroesByMissionType.length}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3 mb-md-0">
              <Card className="fantasy-card h-100 text-center">
                <Card.Body>
                  <div className="fantasy-text-dark fs-4 fw-bold">
                    {activeGroupsCount}
                  </div>
                  <div className="fantasy-text-muted">Активных групп</div>
                  <div className="mt-2">
                    <Badge bg="success">
                      <i className="fas fa-users me-1"></i>
                      {activeGroupsCount}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3 mb-md-0">
              <Card className="fantasy-card h-100 text-center">
                <Card.Body>
                  <div className="fantasy-text-dark fs-4 fw-bold">
                    {discoveredSettlements.length}
                  </div>
                  <div className="fantasy-text-muted">Доступных целей</div>
                  <div className="mt-2">
                    <Badge bg="warning">
                      <i className="fas fa-flag me-1"></i>
                      {discoveredSettlements.length}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Nav variant="pills" className="fantasy-nav mb-3" fill>
              <Nav.Item>
                <Nav.Link eventKey="dungeon" className="fantasy-nav-link">
                  <i className="fas fa-dungeon me-1"></i>
                  Подземелья
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="agents" className="fantasy-nav-link">
                  <i className="fas fa-user-secret me-1"></i>
                  Агенты
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="results" className="fantasy-nav-link">
                  <i className="fas fa-binoculars me-1"></i>
                  Результаты
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="settlements" className="fantasy-nav-link">
                  <i className="fas fa-flag me-1"></i>
                  Поселения
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey="dungeon">
                {!canStartMissions && (
                  <Alert variant="warning" className="fantasy-alert mb-3">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Ваша роль: <Badge bg="secondary">{safeToString(playerRole)}</Badge>. 
                    Только офицеры, ветераны и лидер гильдии могут начинать миссии.
                  </Alert>
                )}
                
                {canStartMissions && (
                  <Button 
                    variant="primary" 
                    className="w-100 mb-3 fantasy-btn"
                    onClick={() => {
                      if (availableDungeons.length === 0) {
                        showNotification('warning', 'Нет доступных подземелий');
                        return;
                      }
                      setShowDungeonModal(true);
                    }}
                  >
                    <i className="fas fa-users me-2"></i>
                    Собрать группу для подземелья
                  </Button>
                )}

                {availableDungeons.length > 0 && (
                  <Card className="fantasy-card mb-3">
                    <Card.Header className="fantasy-card-header">
                      <h6 className="fantasy-text-gold mb-0">
                        <i className="fas fa-map me-2"></i>
                        Доступные подземелья
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <Row className="g-2">
                        {availableDungeons.map(dungeon => (
                          <Col key={dungeon.id} xs={12} sm={6} md={4} lg={3}>
                            <Card 
                              className={`fantasy-card dungeon-card ${selectedDungeon?.id === dungeon.id ? 'selected-dungeon' : ''}`}
                              onClick={() => setSelectedDungeon(dungeon)}
                            >
                              <Card.Body className="text-center">
                                <div className="mb-2" style={{ fontSize: '1.5rem' }}>
                                  <i className="fas fa-dungeon"></i>
                                </div>
                                <h6 className="fantasy-text-dark">{dungeon.name}</h6>
                                <Badge bg="secondary" className="me-1">
                                  {dungeon.difficulty}
                                </Badge>
                                <Badge bg="info">
                                  {dungeon.estimated_time} мин
                                </Badge>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                {activeGroups.length > 0 ? (
                  <Card className="fantasy-card mb-3">
                    <Card.Header className="fantasy-card-header">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="fantasy-text-gold mb-0">
                          <i className="fas fa-running me-2"></i>
                          Активные группы ({activeGroups.length})
                        </h6>
                        <Badge bg="info">
                          {activeGroups.reduce((sum, g) => sum + (g.player_count || 1), 0)} игроков
                        </Badge>
                      </div>
                    </Card.Header>
                    <Table hover className="fantasy-table mb-0">
                      <thead>
                        <tr>
                          <th>Подземелье</th>
                          <th>Лидер</th>
                          <th>Игроки</th>
                          <th>Уровень</th>
                          <th>Создано</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeGroups.map(group => (
                          <tr key={group.id}>
                            <td className="fantasy-text-dark">
                              <strong>{group.dungeon_name || group.dungeon_id}</strong>
                              <div className="small fantasy-text-muted">
                                ID: {group.id}
                              </div>
                            </td>
                            <td>
                              <small className="fantasy-text-muted">{group.leader_name}</small>
                            </td>
                            <td>
                              <Badge bg="primary" className="fantasy-badge">
                                {group.player_count || 1}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg="secondary" className="fantasy-badge">
                                ур. {group.avg_level?.toFixed(1) || 1}
                              </Badge>
                            </td>
                            <td>
                              <small className="fantasy-text-muted">
                                {new Date(group.created_at).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleAbandonDungeon(group.id)}
                                disabled={loading}
                              >
                                <i className="fas fa-times me-1"></i>
                                Отменить
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card>
                ) : (
                  <Alert variant="secondary" className="text-center">
                    <i className="fas fa-users-slash me-2"></i>
                    Нет активных групп в подземельях
                  </Alert>
                )}
              </Tab.Pane>

              <Tab.Pane eventKey="agents">
                <Alert variant="info" className="mb-3 fantasy-alert">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  Отправляйте героев на миссии. Только герои с нужными навыками доступны для каждого типа миссии.
                </Alert>

                <Card className="fantasy-card mb-3">
                  <Card.Header className="fantasy-card-header">
                    <h6 className="fantasy-text-gold mb-0">
                      <i className="fas fa-user-secret me-2"></i>
                      Выберите тип миссии
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-3">
                      {['scout', 'assassin', 'saboteur'].map(type => {
                        const info = getAgentTypeInfo(type);
                        return (
                          <Col key={type} md={4}>
                            <Card 
                              className={`fantasy-card agent-type-card ${agentMissionType === type ? 'selected-agent' : ''}`}
                              onClick={() => setAgentMissionType(type)}
                            >
                              <Card.Body className="text-center">
                                <div className="mb-2" style={{ fontSize: '2rem' }}>
                                  {info.icon}
                                </div>
                                <h6 className="fantasy-text-dark">{info.name}</h6>
                                <p className="fantasy-text-muted small mb-2">{info.description}</p>
                                <Badge bg="secondary" className="mb-2">Длительность: {info.duration}</Badge>
                                <div className="small text-info">
                                  <i className="fas fa-graduation-cap me-1"></i>
                                  Требуемый навык: {info.requiredSkill}
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="fantasy-card mb-3">
                  <Card.Header className="fantasy-card-header">
                    <h6 className="fantasy-text-gold mb-0">
                      <i className="fas fa-crown me-2"></i>
                      Доступные герои для миссии "{getAgentTypeInfo(agentMissionType).name}" ({filteredHeroesByMissionType.length})
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    {filteredHeroesByMissionType.length > 0 ? (
                      <Row className="g-2">
                        {filteredHeroesByMissionType.map(hero => (
                          <Col key={hero.name} xs={12} sm={6} md={4} lg={3}>
                            <Card 
                              className={`fantasy-card hero-card ${selectedHero?.name === hero.name ? 'selected-hero' : ''}`}
                              onClick={() => setSelectedHero(hero)}
                            >
                              <Card.Body className="text-center">
                                <div className="mb-2" style={{ fontSize: '1.5rem' }}>
                                  <i className="fas fa-crown"></i>
                                </div>
                                <h6 className="fantasy-text-dark">{hero.name}</h6>
                                
                                <div className="mt-2">
                                  {Object.entries(hero.skills || {}).map(([skill, level]) => (
                                    <Badge 
                                      key={skill} 
                                      bg={
                                        skill === 'assasin' || skill === 'assassin' ? 'danger' :
                                        skill === 'diversion' || skill === 'sabotage' ? 'warning' :
                                        skill === 'spy' ? 'info' :
                                        skill === 'scout' ? 'primary' : 'secondary'
                                      } 
                                      className="me-1 mb-1"
                                      title={`${translateSkill(skill)}: уровень ${level}`}
                                    >
                                      {getSkillIcon(skill)} {translateSkill(skill)}: {level}
                                    </Badge>
                                  ))}
                                </div>
                                
                                {hero.data?.essence && (
                                  <div className="small fantasy-text-muted mt-2">
                                    <i className="fas fa-star text-warning me-1"></i>
                                    {hero.data.essence} воплощений
                                  </div>
                                )}
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Alert variant="warning" className="text-center">
                        <i className="fas fa-user-slash me-2"></i>
                        Нет героев с нужным навыком для этой миссии
                        <div className="small mt-2">
                          Требуется навык: <Badge bg="info">{getAgentTypeInfo(agentMissionType).requiredSkill}</Badge>
                          <div className="mt-1">
                            <small className="text-muted">
                              Проверьте свободных героев в поселении на наличие нужного навыка
                            </small>
                          </div>
                        </div>
                      </Alert>
                    )}
                  </Card.Body>
                </Card>

                {agentMissionType === 'scout' && (
                  <>
                    <h6 className="fantasy-text-gold mb-3">
                      <i className="fas fa-map me-2"></i>
                      Выберите регион для разведки
                    </h6>
                    <Row className="g-3 mb-3">
                      {availableRegions.map(regionId => {
                        const regionInfo = getRegionInfo(regionId);
                        return (
                          <Col key={regionId} md={3} className="mb-3">
                            <Card 
                              className={`fantasy-card region-card ${selectedRegion === regionId ? 'selected-region' : ''}`}
                              onClick={() => setSelectedRegion(regionId)}
                            >
                              <Card.Body className="text-center">
                                <div className="mb-2" style={{ fontSize: '2rem' }}>
                                  {regionInfo.icon}
                                </div>
                                <h6 className="fantasy-text-dark mb-0">{regionInfo.name}</h6>
                                {selectedRegion === regionId && (
                                  <div className="mt-2">
                                    <i className="fas fa-check-circle text-success"></i>
                                  </div>
                                )}
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>

                    {!canStartMissions ? (
                      <Alert variant="warning" className="fantasy-alert">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Вы не можете отправлять героев. Требуется роль офицера, ветерана или лидера.
                      </Alert>
                    ) : (
                      <Button 
                        variant="success" 
                        className="w-100 mb-3 fantasy-btn"
                        onClick={() => setShowAgentModal(true)}
                        disabled={!selectedHero || !selectedRegion || filteredHeroesByMissionType.length === 0}
                      >
                        <i className="fas fa-paper-plane me-2"></i>
                        {!selectedHero ? 'Выберите героя' : 
                         !selectedRegion ? 'Выберите регион' : 
                         `Отправить ${selectedHero.name} на разведку`}
                      </Button>
                    )}
                  </>
                )}

                {(agentMissionType === 'assassin' || agentMissionType === 'saboteur') && discoveredSettlements.length > 0 && (
                  <>
                    <h6 className="fantasy-text-gold mb-3">
                      <i className="fas fa-crosshairs me-2"></i>
                      Выберите цель для {agentMissionType === 'assassin' ? 'убийцы' : 'диверсанта'}
                    </h6>
                    <Card className="fantasy-card mb-3">
                      <Card.Body>
                        <Alert variant="danger" className="fantasy-alert">
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          {agentMissionType === 'assassin' 
                            ? 'Убийца будет пытаться устранить лидера вражеского поселения. Высокий риск провала.'
                            : 'Диверсант будет пытаться подорвать ресурсы вражеского поселения. Средний риск провала.'}
                        </Alert>
                        
                        <ListGroup variant="flush">
                          {discoveredSettlements.map((settlement, idx) => (
                            <ListGroup.Item 
                              key={idx} 
                              className="fantasy-list-item"
                              onClick={() => {
                                setSelectedRegion(settlement.id);
                                showNotification('info', `Выбрано поселение: ${getSettlementDisplayName(settlement)}`);
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <h6 className="fantasy-text-dark mb-1">
                                    {getSettlementDisplayName(settlement)}
                                  </h6>
                                  <div className="small fantasy-text-muted">
                                    <Badge bg="secondary" className="me-2">
                                      Ур. {settlement.level || (settlement.info?.level) || '?'}
                                    </Badge>
                                    {settlement.owner_name && (
                                      <Badge bg="info" className="me-2">
                                        {settlement.owner_name}
                                      </Badge>
                                    )}
                                    {settlement.defense && (
                                      <span>Защита: {settlement.defense}</span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  {selectedRegion === settlement.id && (
                                    <i className="fas fa-check-circle text-success fs-4"></i>
                                  )}
                                </div>
                              </div>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      </Card.Body>
                    </Card>

                    {!canStartMissions ? (
                      <Alert variant="warning" className="fantasy-alert">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Вы не можете отправлять героев. Требуется роль офицера, ветерана или лидера.
                      </Alert>
                    ) : (
                      <Button 
                        variant="danger" 
                        className="w-100 mb-3 fantasy-btn"
                        onClick={() => setShowAgentModal(true)}
                        disabled={!selectedHero || !selectedRegion || filteredHeroesByMissionType.length === 0}
                      >
                        <i className="fas fa-paper-plane me-2"></i>
                        {!selectedHero ? 'Выберите героя' : 
                         !selectedRegion ? 'Выберите цель' : 
                         `Отправить ${selectedHero.name} как ${agentMissionType === 'assassin' ? 'убийцу' : 'диверсанта'}`}
                      </Button>
                    )}
                  </>
                )}

                {(agentMissionType === 'assassin' || agentMissionType === 'saboteur') && discoveredSettlements.length === 0 && (
                  <Alert variant="info" className="text-center">
                    <i className="fas fa-tools me-2"></i>
                    Для отправки {agentMissionType === 'assassin' ? 'убийцы' : 'диверсанта'} нужно обнаружить вражеские поселения.
                    <div className="small mt-2">
                      Сначала отправьте разведчика в регионы, чтобы обнаружить вражеские поселения.
                    </div>
                    <Button 
                      variant="outline-info" 
                      className="mt-2"
                      onClick={() => {
                        setAgentMissionType('scout');
                        showNotification('info', 'Переключено на режим разведки');
                      }}
                    >
                      <i className="fas fa-binoculars me-2"></i>
                      Перейти к разведке
                    </Button>
                  </Alert>
                )}
              </Tab.Pane>

              <Tab.Pane eventKey="results">
                <Card className="fantasy-card mb-3">
                  <Card.Header className="fantasy-card-header">
                    <h6 className="fantasy-text-gold mb-0">
                      <i className="fas fa-tasks me-2"></i>
                      Результаты миссий ({agentResults.length})
                    </h6>
                  </Card.Header>
                  {agentResults.length > 0 ? (
                    <Table hover className="fantasy-table">
                      <thead>
                        <tr>
                          <th>Герой</th>
                          <th>Тип</th>
                          <th>Цель</th>
                          <th>Отправлен</th>
                          <th>Статус</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agentResults.map(result => {
                          const agentInfo = getAgentTypeInfo(result.mission_type);
                          const regionInfo = getRegionInfo(result.target_id);
                          
                          return (
                            <tr key={result.id}>
                              <td>
                                <strong>{result.hero_name || 'Не указан'}</strong>
                              </td>
                              <td>
                                <Badge bg="info" className="fantasy-badge">
                                  {agentInfo.icon} {agentInfo.name}
                                </Badge>
                              </td>
                              <td>
                                <div>
                                  <strong>{result.target_type === 'region' ? regionInfo.name : `Поселение ${result.target_id}`}</strong>
                                </div>
                              </td>
                              <td>
                                <small className="fantasy-text-muted">
                                  {new Date(result.sent_at || result.created_at).toLocaleDateString()}
                                </small>
                              </td>
                              <td>
                                <Badge bg={getMissionStatusBadge(result.status).variant}>
                                  <i className={`fas ${getMissionStatusBadge(result.status).icon} me-1`}></i>
                                  {getMissionStatusBadge(result.status).text}
                                </Badge>
                                {result.completed_at && result.status === 'active' && (
                                  <div className="small fantasy-text-muted">
                                    {formatTimeRemaining(result.completed_at)}
                                  </div>
                                )}
                              </td>
                              <td>
                                {result.status === 'active' && (
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    onClick={() => handleCompleteAgentMission(result.id)}
                                    disabled={loading}
                                  >
                                    <i className="fas fa-check me-1"></i>
                                    Завершить
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  ) : (
                    <Card.Body className="text-center">
                      <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                      <h6 className="fantasy-text-muted">Нет завершенных миссий</h6>
                      <p className="fantasy-text-muted small">
                        {typeof SettlementMissionsService.getHeroMissionsResults === 'function' 
                          ? 'Отправьте героев на задания, чтобы увидеть результаты здесь'
                          : 'Функция просмотра результатов миссий временно недоступна'}
                      </p>
                    </Card.Body>
                  )}
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="settlements">
                {discoveredSettlements.length > 0 ? (
                  <Card className="fantasy-card">
                    <Card.Header className="fantasy-card-header">
                      <h6 className="fantasy-text-gold mb-0">
                        <i className="fas fa-flag me-2"></i>
                        Обнаруженные поселения ({discoveredSettlements.length})
                      </h6>
                    </Card.Header>
                    <ListGroup variant="flush">
                      {discoveredSettlements.map((settlement, idx) => {
                        const data = settlement.info || settlement;
                        return (
                          <ListGroup.Item key={idx} className="fantasy-list-item">
                            <div className="d-flex justify-content-between align-items-center">
                              <div style={{ flex: 1 }}>
                                <h6 className="fantasy-text-dark mb-1">
                                  <i className={`fas ${getSettlementTypeIcon(data.type)} me-2`} style={{ width: '1.2rem' }}></i>
                                  {getSettlementDisplayName(settlement)}
                                </h6>
                                <div className="small fantasy-text-muted d-flex flex-wrap gap-2 align-items-center">
                                  <Badge bg="secondary" className="fantasy-badge">
                                    Ур. {data.level || '?'}
                                  </Badge>
                                  {data.guild_name && (
                                    <Badge bg="info" className="fantasy-badge">
                                      <i className="fas fa-users me-1"></i>
                                      {data.guild_name}
                                    </Badge>
                                  )}
                                  {data.owner_name && !data.guild_name && (
                                    <Badge bg="secondary" className="fantasy-badge">
                                      <i className="fas fa-crown me-1"></i>
                                      {data.owner_name}
                                    </Badge>
                                  )}
                                  {data.defense && (
                                    <span className="text-muted">
                                      <i className="fas fa-shield-alt me-1"></i>
                                      Защита: {data.defense}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-end ms-3">
                                <ButtonGroup size="sm">
                                  <Button 
                                    variant="outline-info"
                                    onClick={() => handleViewSettlement(settlement)}
                                    title="Просмотреть детали"
                                  >
                                    <i className="fas fa-eye"></i>
                                  </Button>
                                  <Button 
                                    variant="outline-danger"
                                    onClick={() => {
                                      setAgentMissionType('assassin');
                                      setActiveTab('agents');
                                      setSelectedRegion(settlement.id);
                                      showNotification('info', 'Выберите героя для отправки');
                                    }}
                                    title="Отправить убийцу"
                                  >
                                    <i className="fas fa-skull"></i>
                                  </Button>
                                  <Button 
                                    variant="outline-warning"
                                    onClick={() => {
                                      setAgentMissionType('saboteur');
                                      setActiveTab('agents');
                                      setSelectedRegion(settlement.id);
                                      showNotification('info', 'Выберите героя для отправки');
                                    }}
                                    title="Отправить диверсанта"
                                  >
                                    <i className="fas fa-fire"></i>
                                  </Button>
                                </ButtonGroup>
                              </div>
                            </div>
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  </Card>
                ) : (
                  <Alert variant="secondary" className="text-center">
                    <i className="fas fa-flag fa-2x text-muted mb-3"></i>
                    <h6 className="fantasy-text-muted">Нет обнаруженных поселений</h6>
                    <p className="fantasy-text-muted small">
                      Отправьте разведчиков в регионы, чтобы обнаружить вражеские поселения
                    </p>
                  </Alert>
                )}
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>

      <DungeonGroupModal
        show={showDungeonModal}
        onHide={() => setShowDungeonModal(false)}
        missionLimits={missionLimits}
        towerLevel={towerLevel}
        availableDungeons={availableDungeons}
        selectedDungeon={selectedDungeon}
        setSelectedDungeon={setSelectedDungeon}
        sortedGuildMembers={sortedGuildMembers}
        selectedPlayers={selectedPlayers}
        togglePlayerSelection={togglePlayerSelection}
        calculateAverageLevel={calculateAverageLevel}
        handleStartDungeon={handleStartDungeon}
        loading={loading}
        setLoading={setLoading}
        showNotification={showNotification}
        onReorderPlayers={setSelectedPlayers}
      />

      <AgentMissionModal
        show={showAgentModal}
        onHide={() => setShowAgentModal(false)}
        selectedHero={selectedHero}
        selectedRegion={selectedRegion}
        agentMissionType={agentMissionType}
        discoveredSettlements={discoveredSettlements}
        handleSendAgent={handleSendAgent}
        loading={loading}
        showNotification={showNotification}
        getAgentTypeInfo={getAgentTypeInfo}
        getRegionInfo={getRegionInfo}
        translateSkill={translateSkill}
        getSkillIcon={getSkillIcon}
      />

      <SettlementDetailsModal
        show={showSettlementDetails}
        onHide={() => setShowSettlementDetails(false)}
        settlement={selectedSettlement}
        onAttack={handleAttackFromModal}
        onSabotage={handleSabotageFromModal}
      />
    </Container>
  );
});

export default SettlementMissions;