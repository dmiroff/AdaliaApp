import { useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { observer } from "mobx-react-lite";
import { Context } from "../../index";
import { 
    Card, Row, Col, Button, Badge, 
    Alert, Spinner, Accordion, Tooltip, OverlayTrigger,
    Modal, ProgressBar
} from 'react-bootstrap';
import { 
    HEROES_DICT,
    SETTLEMENT_TYPE_NAMES,
    SKILL_TRANSLATOR,
    SKILL_ICONS
} from '../../utils/settlementConstants';
import { settlementService } from '../../services/SettlementService';

const getSkillName = (skillKey) => {
    return SKILL_TRANSLATOR[skillKey] || skillKey;
};

const getSkillIcon = (skillKey) => {
    return SKILL_ICONS[skillKey] || 'fas fa-question';
};

const SettlementHeroes = observer(() => {
    const { settlement, user, guild } = useContext(Context);
    
    const [loading, setLoading] = useState(false);
    const [hireLoading, setHireLoading] = useState({});
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [selectedHero, setSelectedHero] = useState(null);
    const [showHireModal, setShowHireModal] = useState(false);
    const [localHeroes, setLocalHeroes] = useState({});
    const [availableHeroes, setAvailableHeroes] = useState([]);
    
    const settlementData = useMemo(() => {
        return settlement?._settlementData || settlement?.currentSettlement || {};
    }, [settlement]);

    const heroes = useMemo(() => {
        return localHeroes.current || settlementData?.heroes?.active_heroes || {};
    }, [settlementData?.heroes, localHeroes]);

    const woundedHeroes = useMemo(() => {
        return settlementData?.heroes?.wounded_heroes || {};
    }, [settlementData]);

    const heroesOnMission = useMemo(() => {
        return settlementData?.heroes?.heroes_on_mission || {};
    }, [settlementData]);

    const buildings = useMemo(() => settlementData?.buildings || {}, [settlementData]);
    const currentEssence = useMemo(() => settlementData?.current_essence || 0, [settlementData]);
    const guildId = useMemo(() => settlementData?.id, [settlementData]);
    const settlementType = useMemo(() => settlementData?.type, [settlementData]);
    
    const userRole = useMemo(() => {
        if (guild?.guildData?.player_role) {
            return guild.guildData.player_role;
        }
        if (user?.guildRole) {
            return user.guildRole;
        }
        return 'member';
    }, [guild, user]);
    
    // Инициализируем локальное состояние при загрузке данных
    useEffect(() => {
        if (settlementData?.heroes?.active_heroes) {
            setLocalHeroes(prev => ({ ...prev, current: settlementData.heroes.active_heroes }));
        }
    }, [settlementData]);
    
    const showNotification = useCallback((type, message) => {
        setNotification({ show: true, type, message });
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
    }, []);
    
    const hasAltar = useMemo(() => {
        return buildings?.altar && buildings.altar.level > 0;
    }, [buildings]);
    
    const mainBuildingLevel = useMemo(() => {
        return buildings?.main_building?.level || 0;
    }, [buildings]);
    
    // Функция проверки, нанят ли уже герой (по id или по имени)
    const isHeroHired = useCallback((heroName, heroData) => {
        // Собираем всех текущих героев (активные, раненые, в миссии) в массив объектов
        const allCurrentHeroes = [
            ...Object.values(heroes),
            ...Object.values(woundedHeroes),
            ...Object.values(heroesOnMission)
        ];
        
        if (heroData.id) {
            // У героя есть уникальный id – проверяем наличие такого же id среди нанятых
            return allCurrentHeroes.some(h => h.id === heroData.id);
        } else {
            // Нет id – проверяем по имени (ключу в объекте)
            return !!(heroes[heroName] || woundedHeroes[heroName] || heroesOnMission[heroName]);
        }
    }, [heroes, woundedHeroes, heroesOnMission]);
    
    // Функция для получения доступных героев (ещё не нанятых)
    const calculateAvailableHeroes = useCallback(() => {
        const available = [];
        
        if (!settlementType || !HEROES_DICT[settlementType]) {
            return available;
        }
        
        const settlementHeroesDict = HEROES_DICT[settlementType];
        
        // Проверяем все уровни от 1 до текущего уровня главного здания
        for (let level = 1; level <= mainBuildingLevel; level++) {
            const heroesAtLevel = settlementHeroesDict[level];
            if (!heroesAtLevel) continue;
            
            Object.entries(heroesAtLevel).forEach(([heroName, heroData]) => {
                // Проверяем, не нанят ли уже герой (по id или имени)
                const alreadyHired = isHeroHired(heroName, heroData);
                
                if (!alreadyHired) {
                    available.push({
                        name: heroName,
                        levelRequired: level,
                        essence: heroData.essence || 0,
                        skills: heroData.skills || {},
                        hasId: !!heroData.id,
                        id: heroData.id,
                        canHire: currentEssence >= (heroData.essence || 0) && 
                                hasAltar && 
                                (userRole === 'leader' || userRole === 'officer')
                    });
                }
            });
        }
        
        // Сортируем по уровню главного здания и стоимости
        return available.sort((a, b) => {
            if (a.levelRequired === b.levelRequired) {
                return a.essence - b.essence;
            }
            return a.levelRequired - b.levelRequired;
        });
    }, [settlementType, mainBuildingLevel, currentEssence, hasAltar, userRole, isHeroHired]);
    
    // Обновляем список доступных героев при изменении зависимостей
    useEffect(() => {
        setAvailableHeroes(calculateAvailableHeroes());
    }, [calculateAvailableHeroes]);
    
    const getHeroSkills = useCallback((heroData) => {
        const skills = [];
        
        if (heroData.skills && typeof heroData.skills === 'object') {
            Object.entries(heroData.skills).forEach(([skillKey, skillLevel]) => {
                skills.push({
                    key: skillKey,
                    name: getSkillName(skillKey),
                    level: skillLevel,
                    icon: getSkillIcon(skillKey)
                });
            });
        }
        
        // Сортируем навыки по алфавиту
        return skills.sort((a, b) => a.name.localeCompare(b.name));
    }, []);
    
    const getHeroState = useCallback((heroName) => {
        if (heroesOnMission[heroName]) {
            return {
                status: 'mission',
                text: 'В миссии',
                variant: 'warning',
                icon: 'fas fa-running'
            };
        }
        
        if (woundedHeroes[heroName]) {
            return {
                status: 'wounded',
                text: 'Ранен',
                variant: 'danger',
                icon: 'fas fa-heartbeat'
            };
        }
        
        return {
            status: 'active',
            text: 'Активен',
            variant: 'success',
            icon: 'fas fa-check-circle'
        };
    }, [heroesOnMission, woundedHeroes]);
    
    const handleHireHero = useCallback(async (hero) => {
        if (!hero || !guildId) {
            showNotification('error', 'Ошибка: не указаны необходимые данные');
            return;
        }
        
        if (!hasAltar) {
            showNotification('error', 'Для призыва героев необходим алтарь');
            return;
        }
        
        if (userRole !== 'leader' && userRole !== 'officer') {
            showNotification('error', 'Только лидер и офицеры могут призывать героев');
            return;
        }
        
        if (currentEssence < hero.essence) {
            showNotification('error', `Недостаточно воплощений: ${currentEssence}/${hero.essence}`);
            return;
        }
        
        setHireLoading(prev => ({
            ...prev,
            [hero.name]: true
        }));
        
        try {
            console.log(`Попытка найма героя: ${hero.name} для гильдии ${guildId}`);
            
            const result = await settlementService.hireHero(
                guildId,
                hero.name
            );
            
            console.log('Результат найма героя:', result);
            
            if (result.status === 200) {
                showNotification('success', result.message || `Герой "${hero.name}" успешно призван`);
                setShowHireModal(false);
                setSelectedHero(null);
                
                // Локально обновляем состояние героев
                const newHeroData = result.data?.hero || {
                    name: hero.name,
                    skills: hero.skills,
                    essence: hero.essence,
                    id: hero.id // сохраняем id, если он есть
                };
                
                setLocalHeroes(prev => ({
                    current: {
                        ...prev.current,
                        [hero.name]: newHeroData
                    }
                }));
                
                // Убираем героя из списка доступных
                setAvailableHeroes(prev => prev.filter(h => h.name !== hero.name));
                
                // Обновляем данные поселения
                if (settlement?.fetchData) {
                    await settlement.fetchData();
                }
            } else {
                showNotification('error', result.message || 'Ошибка призыва героя');
            }
        } catch (error) {
            console.error('Ошибка призыва героя:', error);
            showNotification('error', error.message || 'Ошибка призыва героя');
        } finally {
            setHireLoading(prev => ({
                ...prev,
                [hero.name]: false
            }));
        }
    }, [showNotification, settlement, guildId, hasAltar, userRole, currentEssence]);
    
    const renderSkillBadge = useCallback((skill) => {
        return (
            <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={`tooltip-${skill.key}`}>{skill.name}</Tooltip>}
            >
                <Badge bg="info" className="me-1 mb-1" style={{ fontSize: '0.75rem' }}>
                    <i className={`${skill.icon} me-1`}></i>
                    {skill.level}
                </Badge>
            </OverlayTrigger>
        );
    }, []);
    
    const renderHeroCard = useCallback((heroName, heroData, isAvailable = false) => {
        const state = getHeroState(heroName);
        const skills = getHeroSkills(heroData);
        const isLoading = hireLoading[heroName] || false;
        
        return (
            <Col xs={12} md={6} lg={4} className="mb-3">
                <Card className="fantasy-card hero-card h-100">
                    <Card.Header className={`fantasy-card-header fantasy-card-header-${state.variant}`}>
                        <div className="d-flex justify-content-between align-items-center">
                            <h6 className="fantasy-text-gold mb-0">
                                <i className={`${state.icon} me-2`}></i>
                                {heroName}
                            </h6>
                            <Badge bg={state.variant}>
                                {state.text}
                            </Badge>
                        </div>
                    </Card.Header>
                    
                    <Card.Body className="d-flex flex-column">
                        {skills.length > 0 && (
                            <div className="mb-3">
                                <small className="fantasy-text-muted">Навыки:</small>
                                <div className="mt-2">
                                    {skills.map(skill => renderSkillBadge(skill))}
                                </div>
                            </div>
                        )}
                        
                        {heroData.essence > 0 && (
                            <div className="mb-3">
                                <small className="fantasy-text-muted">Стоимость призыва:</small>
                                <div className="d-flex align-items-center justify-content-between mt-1">
                                    <div className="d-flex align-items-center">
                                        <i className="fas fa-star me-2 text-primary"></i>
                                        <span className="fantasy-text-dark">Воплощение:</span>
                                    </div>
                                    <Badge bg={currentEssence >= heroData.essence ? "primary" : "danger"}>
                                        {heroData.essence}
                                    </Badge>
                                </div>
                            </div>
                        )}
                        
                        {isAvailable && (
                            <div className="mt-auto">
                                <Button 
                                    variant="primary"
                                    className="fantasy-btn w-100"
                                    onClick={() => {
                                        setSelectedHero({
                                            name: heroName,
                                            ...heroData,
                                            levelRequired: availableHeroes.find(h => h.name === heroName)?.levelRequired
                                        });
                                        setShowHireModal(true);
                                    }}
                                    disabled={isLoading || !heroData.canHire}
                                >
                                    {isLoading ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Призываем...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-crown me-2"></i>
                                            Призвать героя
                                        </>
                                    )}
                                </Button>
                                
                                {(!hasAltar || (userRole !== 'leader' && userRole !== 'officer') || currentEssence < heroData.essence) && (
                                    <div className="mt-2">
                                        {!hasAltar && (
                                            <small className="fantasy-text-danger d-block">
                                                <i className="fas fa-exclamation-triangle me-1"></i>
                                                Требуется алтарь
                                            </small>
                                        )}
                                        {userRole !== 'leader' && userRole !== 'officer' && (
                                            <small className="fantasy-text-danger d-block">
                                                <i className="fas fa-exclamation-triangle me-1"></i>
                                                Только для лидера и офицеров
                                            </small>
                                        )}
                                        {currentEssence < heroData.essence && (
                                            <small className="fantasy-text-danger d-block">
                                                <i className="fas fa-exclamation-triangle me-1"></i>
                                                Недостаточно воплощений
                                            </small>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {!isAvailable && heroData.id && (
                            <div className="mt-2">
                                <small className="fantasy-text-info">
                                    <i className="fas fa-shield-alt me-1"></i>
                                    Уникальный герой - доступен в гарнизоне
                                </small>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Col>
        );
    }, [getHeroState, getHeroSkills, hireLoading, currentEssence, hasAltar, userRole, availableHeroes, renderSkillBadge]);
    
    const renderAvailableHeroCard = useCallback((hero) => {
        return renderHeroCard(hero.name, hero, true);
    }, [renderHeroCard]);
    
    const getHeroRequirements = useMemo(() => {
        if (!settlementType || !HEROES_DICT[settlementType]) {
            return [];
        }
        
        const requirements = [];
        const settlementHeroesDict = HEROES_DICT[settlementType];
        
        // Проверяем героев, которые еще не доступны из-за уровня главного здания
        for (let level = mainBuildingLevel + 1; level <= 10; level++) {
            const heroesAtLevel = settlementHeroesDict[level];
            if (!heroesAtLevel) continue;
            
            Object.entries(heroesAtLevel).forEach(([heroName, heroData]) => {
                // Проверяем, не нанят ли уже герой (по id или имени)
                const alreadyHired = isHeroHired(heroName, heroData);
                
                if (!alreadyHired) {
                    requirements.push({
                        heroName,
                        levelRequired: level,
                        currentLevel: mainBuildingLevel,
                        essence: heroData.essence || 0,
                        skills: heroData.skills || {},
                        hasId: !!heroData.id,
                        id: heroData.id
                    });
                }
            });
        }
        
        return requirements.sort((a, b) => a.levelRequired - b.levelRequired);
    }, [settlementType, mainBuildingLevel, isHeroHired]);
    
    if (!settlementData) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Загрузка данных о героях...</p>
                </Card.Body>
            </Card>
        );
    }
    
    return (
        <div className="settlement-heroes">
            {notification.show && (
                <Alert 
                    variant={notification.type === 'success' ? 'success' : notification.type === 'error' ? 'danger' : 'info'} 
                    className="position-fixed top-0 end-0 m-3" 
                    style={{ zIndex: 9999, maxWidth: '400px' }}
                    dismissible
                    onClose={() => setNotification({ show: false, type: '', message: '' })}
                >
                    <div dangerouslySetInnerHTML={{ __html: notification.message.replace(/\n/g, '<br/>') }} />
                </Alert>
            )}
            
            <Card className="fantasy-card mb-4">
                <Card.Header className="fantasy-card-header fantasy-card-header-primary">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="fantasy-text-gold mb-0">
                                <i className="fas fa-crown me-2"></i>
                                Герои поселения
                            </h5>
                            <div className="fantasy-text-muted mt-1">
                                Тип: {typeof SETTLEMENT_TYPE_NAMES[settlementType] === 'string' 
                                    ? SETTLEMENT_TYPE_NAMES[settlementType] 
                                    : settlementType}
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <Badge bg={userRole === 'leader' ? 'danger' : userRole === 'officer' ? 'warning' : 'info'}>
                                {userRole === 'leader' ? 'Лидер' : userRole === 'officer' ? 'Офицер' : 'Член'}
                            </Badge>
                            <Badge bg="primary">
                                <i className="fas fa-star me-1"></i>
                                {currentEssence} воплощений
                            </Badge>
                        </div>
                    </div>
                </Card.Header>
                
                <Card.Body>
                    <Alert variant="info" className="fantasy-alert mb-4">
                        <i className="fas fa-info-circle me-2"></i>
                        <div>
                            <div className="mt-2">
                                <small className="fantasy-text-muted">
                                    <i className="fas fa-landmark me-1"></i>
                                    Уровень главного здания: <Badge bg="warning">{mainBuildingLevel}</Badge>
                                    {' '} | {' '}
                                    <i className="fas fa-church me-1"></i>
                                    Алтарь: <Badge bg={hasAltar ? "success" : "danger"}>
                                        {hasAltar ? `Уровень ${buildings.altar?.level || 1}` : 'Не построен'}
                                    </Badge>
                                    {' '} | {' '}
                                    <i className="fas fa-crown me-1"></i>
                                    Активные герои: <Badge bg="success">{Object.keys(heroes).length}</Badge>
                                </small>
                            </div>
                        </div>
                    </Alert>
                    
                    {!hasAltar && (
                        <Alert variant="warning" className="mb-4">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            Для призыва героев необходимо построить алтарь.
                        </Alert>
                    )}
                    
                    {userRole !== 'leader' && userRole !== 'officer' && (
                        <Alert variant="info" className="mb-4">
                            <i className="fas fa-info-circle me-2"></i>
                            Призывать героев могут только лидер и офицеры гильдии.
                        </Alert>
                    )}
                    
                    <Accordion defaultActiveKey={['active', 'available']} alwaysOpen className="mb-3">
                        {/* Активные герои */}
                        <Accordion.Item eventKey="active">
                            <Accordion.Header className="fantasy-accordion-header">
                                <i className="fas fa-check-circle me-2 text-success"></i>
                                Активные герои ({Object.keys(heroes).length})
                            </Accordion.Header>
                            <Accordion.Body>
                                {Object.keys(heroes).length > 0 ? (
                                    <Row>
                                        {Object.entries(heroes).map(([heroName, heroData]) => 
                                            renderHeroCard(heroName, heroData)
                                        )}
                                    </Row>
                                ) : (
                                    <Alert variant="info">
                                        <i className="fas fa-info-circle me-2"></i>
                                        У вас пока нет призванных героев. Постройте алтарь и призовите первого героя.
                                    </Alert>
                                )}
                            </Accordion.Body>
                        </Accordion.Item>
                        
                        {/* Раненые герои */}
                        {Object.keys(woundedHeroes).length > 0 && (
                            <Accordion.Item eventKey="wounded">
                                <Accordion.Header className="fantasy-accordion-header">
                                    <i className="fas fa-heartbeat me-2 text-danger"></i>
                                    Раненые герои ({Object.keys(woundedHeroes).length})
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        {Object.entries(woundedHeroes).map(([heroName, heroData]) => 
                                            renderHeroCard(heroName, heroData)
                                        )}
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        )}
                        
                        {/* Герои на миссии */}
                        {Object.keys(heroesOnMission).length > 0 && (
                            <Accordion.Item eventKey="mission">
                                <Accordion.Header className="fantasy-accordion-header">
                                    <i className="fas fa-running me-2 text-warning"></i>
                                    Герои на миссии ({Object.keys(heroesOnMission).length})
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        {Object.entries(heroesOnMission).map(([heroName, heroData]) => 
                                            renderHeroCard(heroName, heroData)
                                        )}
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        )}
                        
                        {/* Доступные для призыва герои */}
                        <Accordion.Item eventKey="available">
                            <Accordion.Header className="fantasy-accordion-header">
                                <i className="fas fa-crown me-2 text-primary"></i>
                                Доступные для призыва ({availableHeroes.length})
                            </Accordion.Header>
                            <Accordion.Body>
                                {availableHeroes.length > 0 ? (
                                    <Row>
                                        {availableHeroes.map(hero => 
                                            renderAvailableHeroCard(hero)
                                        )}
                                    </Row>
                                ) : (
                                    <Alert variant="info">
                                        <i className="fas fa-info-circle me-2"></i>
                                        Все доступные герои призваны или недоступны из-за уровня главного здания.
                                    </Alert>
                                )}
                            </Accordion.Body>
                        </Accordion.Item>
                        
                        {/* Будущие герои (требуют повышения уровня) */}
                        {getHeroRequirements.length > 0 && (
                            <Accordion.Item eventKey="future">
                                <Accordion.Header className="fantasy-accordion-header">
                                    <i className="fas fa-lock me-2 text-secondary"></i>
                                    Будущие герои ({getHeroRequirements.length})
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Alert variant="info" className="mb-3">
                                        <i className="fas fa-info-circle me-2"></i>
                                        Эти герои станут доступны после повышения уровня главного здания.
                                    </Alert>
                                    
                                    <Row>
                                        {getHeroRequirements.map((req, index) => {
                                            const skills = getHeroSkills(req);
                                            
                                            return (
                                                <Col xs={12} md={6} lg={4} key={index} className="mb-3">
                                                    <Card className="fantasy-card hero-card h-100">
                                                        <Card.Header className="fantasy-card-header fantasy-card-header-secondary">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <h6 className="fantasy-text-gold mb-0">{req.heroName}</h6>
                                                                <Badge bg="secondary">
                                                                    Ур. {req.levelRequired}
                                                                </Badge>
                                                            </div>
                                                        </Card.Header>
                                                        
                                                        <Card.Body>
                                                            <div className="mb-3">
                                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                                    <span className="fantasy-text-dark">Требуется уровень:</span>
                                                                    <div className="d-flex align-items-center">
                                                                        <Badge bg={mainBuildingLevel >= req.levelRequired ? "success" : "warning"}>
                                                                            {mainBuildingLevel}/{req.levelRequired}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                <ProgressBar 
                                                                    now={(mainBuildingLevel / req.levelRequired) * 100}
                                                                    variant={mainBuildingLevel >= req.levelRequired ? "success" : "warning"}
                                                                    className="mb-3"
                                                                />
                                                            </div>
                                                            
                                                            {req.essence > 0 && (
                                                                <div className="mb-3">
                                                                    <small className="fantasy-text-muted">Стоимость призыва:</small>
                                                                    <div className="d-flex align-items-center justify-content-between mt-1">
                                                                        <div className="d-flex align-items-center">
                                                                            <i className="fas fa-star me-2 text-primary"></i>
                                                                            <span className="fantasy-text-dark">Воплощение:</span>
                                                                        </div>
                                                                        <Badge bg="primary">
                                                                            {req.essence}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {skills.length > 0 && (
                                                                <div className="mb-3">
                                                                    <small className="fantasy-text-muted">Навыки:</small>
                                                                    <div className="mt-2">
                                                                        {skills.map(skill => renderSkillBadge(skill))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            <Button 
                                                                variant="outline-secondary"
                                                                className="w-100"
                                                                disabled
                                                            >
                                                                <i className="fas fa-lock me-2"></i>
                                                                Доступен с {req.levelRequired} уровня
                                                            </Button>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        )}
                    </Accordion>
                </Card.Body>
            </Card>
            
            {/* Модальное окно подтверждения найма героя */}
            <Modal
                show={showHireModal}
                onHide={() => setShowHireModal(false)}
                centered
                className="fantasy-modal"
            >
                <Modal.Header className="fantasy-modal-header fantasy-modal-header-primary" closeButton>
                    <Modal.Title>
                        <i className="fas fa-crown me-2"></i>
                        Призвать героя
                    </Modal.Title>
                </Modal.Header>
                
                <Modal.Body className="fantasy-modal-body">
                    {selectedHero && (
                        <>
                            <Alert variant="info" className="fantasy-alert mb-3">
                                <i className="fas fa-info-circle me-2"></i>
                                Вы собираетесь призвать героя <strong>{selectedHero.name}</strong>.
                                Убедитесь, что у вас достаточно воплощений и построен алтарь.
                            </Alert>
                            
                            <div className="mb-3">
                                <h6 className="fantasy-text-gold">Детали героя:</h6>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Уровень доступа:</span>
                                    <Badge bg="warning">Ур. {selectedHero.levelRequired}</Badge>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Стоимость:</span>
                                    <div className="d-flex align-items-center">
                                        <i className="fas fa-star me-2 text-primary"></i>
                                        <Badge bg={currentEssence >= selectedHero.essence ? "primary" : "danger"}>
                                            {selectedHero.essence} воплощений
                                        </Badge>
                                    </div>
                                </div>
                                
                                {selectedHero.skills && Object.keys(selectedHero.skills).length > 0 && (
                                    <div className="mt-3">
                                        <h6 className="fantasy-text-gold">Навыки:</h6>
                                        {getHeroSkills(selectedHero).map(skill => (
                                            <div key={skill.key} className="d-flex justify-content-between mb-1">
                                                <span>
                                                    <i className={`${skill.icon} me-2 text-info`}></i>
                                                    {skill.name}
                                                </span>
                                                <Badge bg="info">{skill.level}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {selectedHero.hasId && (
                                    <Alert variant="success" className="mt-3">
                                        <i className="fas fa-shield-alt me-2"></i>
                                        Этот герой будет добавлен в гарнизон как уникальная единица.
                                    </Alert>
                                )}
                            </div>
                            
                            <div className="mt-4 pt-3 border-top">
                                <div className="row g-2">
                                    <div className="col-6">
                                        <Button 
                                            variant="outline-secondary"
                                            className="w-100"
                                            onClick={() => setShowHireModal(false)}
                                            disabled={hireLoading[selectedHero.name]}
                                        >
                                            Отмена
                                        </Button>
                                    </div>
                                    <div className="col-6">
                                        <Button 
                                            variant="primary"
                                            className="fantasy-btn w-100"
                                            onClick={() => handleHireHero(selectedHero)}
                                            disabled={hireLoading[selectedHero.name] || 
                                                     !hasAltar || 
                                                     (userRole !== 'leader' && userRole !== 'officer') ||
                                                     currentEssence < selectedHero.essence}
                                        >
                                            {hireLoading[selectedHero.name] ? (
                                                <>
                                                    <Spinner animation="border" size="sm" className="me-2" />
                                                    Призываем...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-crown me-2"></i>
                                                    Призвать за {selectedHero.essence} воплощений
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
});

export default SettlementHeroes;