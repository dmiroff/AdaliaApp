import { useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { observer } from "mobx-react-lite";
import { Context } from "../../index";
import { 
    Card, Row, Col, Button, ProgressBar, Badge, 
    Alert, Spinner, Modal, Form, ListGroup, Tooltip, OverlayTrigger,
    InputGroup
} from 'react-bootstrap';
import { 
    rituals as RITUALS_DICT,
    totem_rewards as TOTEM_REWARDS,
    special_items_dict as SPECIAL_ITEMS_DICT,
    skill_translator as SKILL_TRANSLATOR
} from '../../utils/settlementConstants';
import { getResourceInfo } from '../../utils/resourceHelpers';
import { settlementService } from '../../services/SettlementService';

const SettlementRituals = observer(() => {
    const { settlement, user, guild } = useContext(Context);
    
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [showRitualModal, setShowRitualModal] = useState(false);
    const [showAllOfferingsModal, setShowAllOfferingsModal] = useState(false);
    const [selectedRitual, setSelectedRitual] = useState(null);
    
    const userData = useMemo(() => user?.user || {}, [user]);
    const userMoney = useMemo(() => userData?.money || 0, [userData]);
    const userDaleons = useMemo(() => userData?.daleons || 0, [userData]);
    
    const settlementData = useMemo(() => {
        return settlement?.currentSettlement || settlement?._settlementData || {};
    }, [settlement]);

    const buildings = useMemo(() => {
        return settlementData?.buildings || settlementData || {};
    }, [settlementData]);

    const totem = useMemo(() => buildings?.totem || null, [buildings]);
    const ritualPlace = useMemo(() => buildings?.ritual_place || null, [buildings]);
    
    const storage = useMemo(() => {
        if (settlementData?.storage && typeof settlementData.storage === 'object') {
            return settlementData.storage;
        }
        if (buildings?.storage?.resources) {
            return buildings.storage.resources;
        }
        return {};
    }, [settlementData, buildings]);
    
    const buffs = useMemo(() => settlementData?.buffs || {}, [settlementData]);
    const heroes = useMemo(() => settlementData?.heroes?.active_heroes || {}, [settlementData]);
    const settlementType = useMemo(() => settlementData?.type || 'neutral', [settlementData]);
    
    const currentBuff = useMemo(() => buffs?.current_buff || null, [buffs]);
    const obtainedRewardToday = useMemo(() => buffs?.obtained_reward_totem || false, [buffs]);
    
    const userRole = useMemo(() => {
        if (guild?.guildData?.player_role) {
            return guild.guildData.player_role;
        }
        if (user?.guildRole) {
            return user.guildRole;
        }
        return 'member';
    }, [guild, user]);

    const guildId = useMemo(() => {
        const id = guild?.guildData?.id || settlementData?.guild_id || userData?.guild_id;
        // Убедимся, что это число
        return Number(id) || null;
    }, [guild, settlementData, userData]);

    const playerId = useMemo(() => userData?.id, [userData]);

    const showNotification = useCallback((type, message) => {
        setNotification({ show: true, type, message });
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
    }, []);
    
    // Расчет шансов и эффектов ритуалов
    const getRitualInfo = useCallback((level) => {
        if (!level || !RITUALS_DICT[level]) {
            return { chances: [], effects: [] };
        }
        
        const ritualData = RITUALS_DICT[level];
        const chances = Object.keys(ritualData).map(chance => parseFloat(chance));
        const effects = Object.values(ritualData);
        
        return { chances, effects };
    }, []);
    
    // Получение максимального уровня навыка "faith_touch" среди героев
    const getMaxFaithTouch = useCallback(() => {
        if (!heroes) return 0;
        
        let maxFaithTouch = 0;
        
        Object.values(heroes).forEach(hero => {
            if (hero?.skills?.faith_touch && hero.skills.faith_touch > maxFaithTouch) {
                maxFaithTouch = hero.skills.faith_touch;
            }
        });
        
        return maxFaithTouch;
    }, [heroes]);
    
    // Расчет длительности баффа с учетом навыка faith_touch
    const calculateBuffDuration = useCallback(() => {
        const baseDuration = 120; // 2 часа в минутах
        const maxFaithTouch = getMaxFaithTouch();
        const bonus = maxFaithTouch * 25;
        return baseDuration * (1 + bonus / 100);
    }, [getMaxFaithTouch]);
    
    // ФИКС: фиксированная цена ритуала - 50 далеонов и 10000 монет
    const RITUAL_COST = useMemo(() => ({
        money: 10000,
        daleons: 50
    }), []);
    
    // Получение доступных ритуалов
    const availableRituals = useMemo(() => {
        if (!ritualPlace || !ritualPlace.level) return [];
        
        const ritualLevel = ritualPlace.level;
        const { chances, effects } = getRitualInfo(ritualLevel);
        
        if (chances.length === 0 || effects.length === 0) return [];
        
        const rituals = [
            { name: "Благословение силы", attribute: "Сила" },
            { name: "Благословение ловкости", attribute: "Ловкость" },
            { name: "Благословение выносливости", attribute: "Выносливость" },
            { name: "Благословение восприятия", attribute: "Восприятие" },
            { name: "Благословение интеллекта", attribute: "Интеллект" },
            { name: "Благословение мудрости", attribute: "Мудрость" },
            { name: "Благословение харизмы", attribute: "Харизма" },
            { name: "Благословение удачи", attribute: "Удача" }
        ];
        
        return rituals.map(ritual => ({
            ...ritual,
            level: ritualLevel,
            chances,
            effects,
            duration: calculateBuffDuration(),
            cost: RITUAL_COST
        }));
    }, [ritualPlace, getRitualInfo, calculateBuffDuration, RITUAL_COST]);
    
    // Упрощенная проверка - только проверяем наличие ритуального места и отсутствие активного баффа
    const canPerformRitual = useCallback((ritual) => {
        if (!ritual) return false;
        
        // Проверяем наличие активного баффа
        if (currentBuff) return false;
        
        // Проверяем наличие ритуального места
        if (!ritualPlace) return false;
        
        return true;
    }, [currentBuff, ritualPlace]);
    
    // ЭНДПОЙНТ: Проведение ритуала - ИСПРАВЛЕННЫЙ ВЫЗОВ
    const handlePerformRitual = useCallback(async (ritual) => {
        if (!guildId || !playerId) {
            showNotification('error', 'Не удалось определить гильдию или игрока');
            return;
        }
        
        if (!ritualPlace) {
            showNotification('error', 'Не построен ритуальный столб');
            return;
        }
        
        if (currentBuff) {
            showNotification('error', 'Уже есть активное благословение');
            return;
        }
        
        setLoading(true);
        
        try {
            // ИСПРАВЛЕННЫЙ ВЫЗОВ - передаем аргументы отдельно, а не объект
            const result = await settlementService.performRitual(
                guildId,
                playerId,
                ritual.name,
                ritual.attribute,
                ritual.cost
            );
            
            if (result.success) {
                showNotification('success', result.message || 'Ритуал успешно проведен');
                setShowRitualModal(false);
                setSelectedRitual(null);
                
                // Обновляем данные пользователя
                if (user?.fetchData) {
                    await user.fetchData();
                }
                
                // Обновляем данные поселения для получения нового баффа
                if (settlement?.fetchData) {
                    await settlement.fetchData();
                }
            } else {
                showNotification('error', result.message || 'Ошибка проведения ритуала');
            }
        } catch (error) {
            console.error('Ошибка проведения ритуала:', error);
            showNotification('error', error.message || 'Ошибка проведения ритуала');
        } finally {
            setLoading(false);
        }
    }, [guildId, playerId, ritualPlace, currentBuff, user, settlement, showNotification]);
    
    // Функции для подношений
    const getMaxAbbot = useCallback(() => {
        if (!heroes) return 0;
        
        let maxAbbot = 0;
        
        Object.values(heroes).forEach(hero => {
            if (hero?.skills?.abbot && hero.skills.abbot > maxAbbot) {
                maxAbbot = hero.skills.abbot;
            }
        });
        
        return maxAbbot;
    }, [heroes]);
    
    const getSpecialRecipes = useCallback(() => {
        const maxAbbot = getMaxAbbot();
        const recipes = [];
        
        if (maxAbbot > 0 && settlementType && SPECIAL_ITEMS_DICT[settlementType]) {
            for (let i = 1; i <= maxAbbot; i++) {
                if (SPECIAL_ITEMS_DICT[settlementType][i]) {
                    recipes.push({
                        level: i,
                        ingredients: SPECIAL_ITEMS_DICT[settlementType][i],
                        energy: (1 + 0.5 * maxAbbot)
                    });
                }
            }
        }
        
        return recipes;
    }, [settlementType, getMaxAbbot]);
    
    // Получение ресурсов для подношения (согласно логике бота)
    const getOfferingResources = useCallback(() => {
        const resources = [];
        const specialRecipes = getSpecialRecipes();
        
        // Основные реагенты (аналогично боту)
        const baseReagents = [
            { code: "112", name: "Железная руда", value: 0.1, type: "reagent" },
            { code: "114", name: "Бревно", value: 0.1, type: "reagent" },
            { code: "115", name: "Мешок угля", value: 0.1, type: "reagent" },
            { code: "116", name: "Песчаник", value: 0.1, type: "reagent" },
            { code: "117", name: "Мешок песка", value: 0.1, type: "reagent" },
            { code: "118", name: "Стекло", value: 0.1, type: "reagent" },
            { code: "119", name: "Доска", value: 0.1, type: "reagent" },
            { code: "120", name: "Сталь", value: 0.1, type: "reagent" },
            { code: "121", name: "Каменный блок", value: 0.1, type: "reagent" }
        ];
        
        baseReagents.forEach(resource => {
            const amount = storage[resource.code] || 0;
            if (amount > 0) {
                resources.push({
                    ...resource,
                    amount,
                    totalEnergy: amount * resource.value
                });
            }
        });
        
        // Специальные рецепты
        specialRecipes.forEach(recipe => {
            Object.entries(recipe.ingredients).forEach(([itemId, requiredCount]) => {
                const amount = storage[itemId] || 0;
                if (amount > 0) {
                    const resourceInfo = getResourceInfo(itemId);
                    const resourceName = resourceInfo ? resourceInfo.name : `Ресурс ${itemId}`;
                    
                    resources.push({
                        code: itemId,
                        name: resourceName,
                        value: 0.1, // базовая энергия за единицу
                        type: "special_reagent",
                        recipeLevel: recipe.level,
                        requiredCount,
                        amount,
                        recipeEnergy: recipe.energy,
                        totalEnergy: amount * 0.1
                    });
                }
            });
        });
        
        return resources.sort((a, b) => b.totalEnergy - a.totalEnergy);
    }, [storage, getSpecialRecipes]);
    
    // ЭНДПОЙНТ: Подношение всех ресурсов - ИСПРАВЛЕННЫЙ ВЫЗОВ
    const handleMakeOfferingAll = useCallback(async () => {
        if (!totem) {
            showNotification('error', 'Для подношений необходим тотем');
            return;
        }
        
        if (!guildId || !playerId) {
            showNotification('error', 'Не удалось определить гильдию или игрока');
            return;
        }
        
        if (obtainedRewardToday) {
            showNotification('warning', 'Ваша гильдия уже получала награду за подношения сегодня. Дождитесь следующего дня.');
            return;
        }
        
        const offeringResources = getOfferingResources();
        if (offeringResources.length === 0) {
            showNotification('warning', 'Нет доступных ресурсов для подношения');
            return;
        }
        
        setLoading(true);
        
        try {
            // ИСПРАВЛЕННЫЙ ВЫЗОВ - только guildId и playerId
            const result = await settlementService.makeOfferingAll(
                guildId,
                playerId
            );
            
            if (result.success) {
                showNotification('success', result.message || 'Подношение всех ресурсов успешно совершено');
                setShowAllOfferingsModal(false);
                
                if (settlement?.fetchData) {
                    await settlement.fetchData();
                }
            } else {
                showNotification('error', result.message || 'Ошибка подношения');
            }
        } catch (error) {
            console.error('Ошибка подношения всех ресурсов:', error);
            showNotification('error', error.message || 'Ошибка подношения всех ресурсов');
        } finally {
            setLoading(false);
        }
    }, [totem, obtainedRewardToday, guildId, playerId, settlement, showNotification, getOfferingResources]);
    
    // ЭНДПОЙНТ: Подношение по рецепту (новый метод)
    const handleMakeRecipeOffering = useCallback(async (recipeLevel) => {
        if (!totem) {
            showNotification('error', 'Для подношений необходим тотем');
            return;
        }
        
        if (!guildId || !playerId) {
            showNotification('error', 'Не удалось определить гильдию или игрока');
            return;
        }
        
        if (obtainedRewardToday) {
            showNotification('warning', 'Ваша гильдия уже получала награду за подношения сегодня. Дождитесь следующего дня.');
            return;
        }
        
        setLoading(true);
        
        try {
            // Вызываем подношение по рецепту
            const result = await settlementService.makeRecipeOffering(
                guildId,
                playerId,
                recipeLevel,
                1 // количество рецептов
            );
            
            if (result.success) {
                showNotification('success', result.message || 'Подношение по рецепту успешно совершено');
                
                if (settlement?.fetchData) {
                    await settlement.fetchData();
                }
            } else {
                showNotification('error', result.message || 'Ошибка подношения по рецепту');
            }
        } catch (error) {
            console.error('Ошибка подношения по рецепту:', error);
            showNotification('error', error.message || 'Ошибка подношения по рецепту');
        } finally {
            setLoading(false);
        }
    }, [totem, obtainedRewardToday, guildId, playerId, settlement, showNotification]);
    
    const getTotemRewards = useCallback((level) => {
        if (!level || !TOTEM_REWARDS[level]) return [];
        
        const rewards = TOTEM_REWARDS[level];
        const rewardList = [];
        
        Object.entries(rewards).forEach(([receiver, rewardData]) => {
            let receiverName = '';
            let rewardsText = '';
            
            switch (receiver) {
                case 'user':
                    receiverName = 'Исполнитель подношения';
                    break;
                case 'guild':
                    receiverName = 'Гильдия (Сердце поселения)';
                    break;
                case 'guild_leader':
                    receiverName = 'Лидер гильдии';
                    break;
                case 'random_guy':
                    receiverName = 'Случайный участник';
                    break;
                case 'head_cultist':
                    receiverName = 'Главный последователь';
                    break;
                default:
                    receiverName = receiver;
            }
            
            if (rewardData.loot && rewardData.loot_chances) {
                rewardsText = rewardData.loot.map((item, index) => {
                    const chance = rewardData.loot_chances[index];
                    if (item === 'scroll') {
                        return `Свиток поселения (${chance}%)`;
                    }
                    return `${item} (${chance}%)`;
                }).join(', ');
            }
            
            rewardList.push({
                receiver: receiverName,
                rewards: rewardsText,
                ...rewardData
            });
        });
        
        return rewardList;
    }, []);
    
    const formatTime = useCallback((minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours} час ${mins} мин`;
        }
        return `${mins} мин`;
    }, []);
    
    const calculateTotalOfferings = useCallback(() => {
        const resources = getOfferingResources();
        let totalAmount = 0;
        let totalEnergy = 0;
        
        resources.forEach(resource => {
            totalAmount += resource.amount || 0;
            totalEnergy += resource.totalEnergy || 0;
        });
        
        return { totalAmount, totalEnergy };
    }, [getOfferingResources]);
    
    // Функция для проверки доступности рецепта
    const canPrepareRecipe = useCallback((recipe) => {
        if (!recipe || !recipe.ingredients) return false;
        
        const ingredients = recipe.ingredients;
        const mainIngredientId = Object.keys(ingredients)[0];
        const additionalIngredientId = Object.keys(ingredients)[1];
        
        if (!mainIngredientId || !additionalIngredientId) return false;
        
        const mainCount = storage[mainIngredientId] || 0;
        const additionalCount = storage[additionalIngredientId] || 0;
        
        // Согласно логике бота: 8 основного и 2 дополнительного ингредиента
        return mainCount >= 8 && additionalCount >= 2;
    }, [storage]);
    
    if (!settlementData || !guildId) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Загрузка данных о ритуалах...</p>
                </Card.Body>
            </Card>
        );
    }
    
    const offeringResources = getOfferingResources();
    const specialRecipes = getSpecialRecipes();
    const totemRewards = totem ? getTotemRewards(totem.level) : [];
    const { totalAmount, totalEnergy } = calculateTotalOfferings();
    const maxFaithTouch = getMaxFaithTouch();
    const maxAbbot = getMaxAbbot();
    
    return (
        <div className="settlement-rituals">
            {notification.show && (
                <Alert 
                    variant={notification.type === 'success' ? 'success' : notification.type === 'error' ? 'danger' : 'warning'} 
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
                        <h5 className="fantasy-text-gold mb-0">
                            <i className="fas fa-magic me-2"></i>
                            Ритуалы и подношения
                        </h5>
                        <div className="d-flex align-items-center">
                            <Badge bg={userRole === 'leader' ? 'danger' : userRole === 'officer' ? 'warning' : 'info'} className="ms-2">
                                {userRole === 'leader' ? 'Лидер' : userRole === 'officer' ? 'Офицер' : 'Член'}
                            </Badge>
                        </div>
                    </div>
                </Card.Header>
                
                <Card.Body>                    
                    {/* Ритуальный столб */}
                    <Card className="fantasy-card mb-4">
                        <Card.Header className={`fantasy-card-header fantasy-card-header-${ritualPlace ? 'success' : 'secondary'}`}>
                            <div className="d-flex justify-content-between align-items-center">
                                <h6 className="fantasy-text-gold mb-0">
                                    <i className="fas fa-place-of-worship me-2"></i>
                                    Ритуальный столб
                                    {ritualPlace && ` (Уровень ${ritualPlace.level})`}
                                </h6>
                                {ritualPlace ? (
                                    <Badge bg="success">
                                        <i className="fas fa-check me-1"></i>
                                        Построен
                                    </Badge>
                                ) : (
                                    <Badge bg="secondary">
                                        <i className="fas fa-times me-1"></i>
                                        Не построен
                                    </Badge>
                                )}
                            </div>
                        </Card.Header>
                        
                        <Card.Body>
                            {currentBuff ? (
                                <Alert variant="success" className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div>
                                            <i className="fas fa-shield-alt me-2"></i>
                                            <strong>Активное благословение:</strong> {currentBuff.buff_name}
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <Badge bg="info" className="me-2">
                                                +{currentBuff.buff_strength} к {currentBuff.attribute}
                                            </Badge>
                                            <Badge bg="warning">
                                                {currentBuff.time_left} мин.
                                            </Badge>
                                        </div>
                                        <small className="fantasy-text-muted">
                                            Наложил: {currentBuff.caster_name}
                                        </small>
                                    </div>
                                </Alert>
                            ) : (
                                <Alert variant="info" className="mb-4">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Ритуальный столб позволяет проводить благословения, которые дают временное усиление атрибутов всем членам гильдии.
                                    <strong> Стоимость: 10,000 монет и 50 далеонов.</strong>
                                </Alert>
                            )}
                            
                            {ritualPlace ? (
                                <>
                                    {currentBuff ? (
                                        <div className="text-center">
                                            <Button variant="outline-secondary" disabled className="fantasy-btn">
                                                <i className="fas fa-hourglass-half me-2"></i>
                                                Ожидайте окончания текущего благословения
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <h6 className="fantasy-text-dark mb-3">Доступные благословения:</h6>
                                            <Row>
                                                {availableRituals.map((ritual, index) => {
                                                    const canPerform = canPerformRitual(ritual);
                                                    const ritualDuration = formatTime(ritual.duration);
                                                    
                                                    return (
                                                        <Col md={6} lg={4} key={index}>
                                                            <Card className="fantasy-card mb-3 h-100">
                                                                <Card.Header className={`fantasy-card-header fantasy-card-header-${canPerform ? 'primary' : 'secondary'}`}>
                                                                    <h6 className="fantasy-text-gold mb-0">{ritual.name}</h6>
                                                                </Card.Header>
                                                                
                                                                <Card.Body className="d-flex flex-column">
                                                                    <div className="mb-3 flex-grow-1">
                                                                        <div className="d-flex justify-content-between mb-2">
                                                                            <small className="fantasy-text-muted">Атрибут:</small>
                                                                            <Badge bg="info">{ritual.attribute}</Badge>
                                                                        </div>
                                                                        
                                                                        <div className="d-flex justify-content-between mb-2">
                                                                            <small className="fantasy-text-muted">Длительность:</small>
                                                                            <small className="fantasy-text-dark">{ritualDuration}</small>
                                                                        </div>
                                                                        
                                                                        <div className="d-flex justify-content-between mb-2">
                                                                            <small className="fantasy-text-muted">Стоимость:</small>
                                                                            <div>
                                                                                <Badge bg="warning" className="me-1">
                                                                                    {ritual.cost.money.toLocaleString()} монет
                                                                                </Badge>
                                                                                <Badge bg="primary">
                                                                                    {ritual.cost.daleons} далеонов
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="mt-2">
                                                                        <small className="fantasy-text-muted">Возможные исходы:</small>
                                                                        {ritual.chances.map((chance, idx) => (
                                                                            <div key={idx} className="d-flex justify-content-between align-items-center mt-1">
                                                                                <Badge bg="info" className="me-2">
                                                                                    {(chance * 100).toFixed(0)}%
                                                                                </Badge>
                                                                                <span className="fantasy-text-dark small">
                                                                                    Усиление +{ritual.effects[idx]}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    
                                                                    <div className="d-grid gap-2 mt-3">
                                                                        {canPerform ? (
                                                                            <Button 
                                                                                variant="outline-primary"
                                                                                className="fantasy-btn"
                                                                                onClick={() => {
                                                                                    setSelectedRitual(ritual);
                                                                                    setShowRitualModal(true);
                                                                                }}
                                                                                disabled={loading}
                                                                            >
                                                                                <i className="fas fa-magic me-2"></i>
                                                                                Провести ритуал
                                                                            </Button>
                                                                        ) : (
                                                                            <Button variant="outline-secondary" disabled className="fantasy-btn w-100">
                                                                                <i className="fas fa-info-circle me-2"></i>
                                                                                Недоступно
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        </Col>
                                                    );
                                                })}
                                            </Row>
                                            
                                            <div className="mt-4">
                                                <h6 className="fantasy-text-dark mb-2">Герои, влияющие на ритуалы:</h6>
                                                {Object.entries(heroes).filter(([_, heroData]) => heroData?.skills?.faith_touch).length > 0 ? (
                                                    Object.entries(heroes).map(([heroName, heroData]) => {
                                                        const faithTouch = heroData?.skills?.faith_touch;
                                                        if (!faithTouch) return null;
                                                        
                                                        return (
                                                            <Badge key={heroName} bg="info" className="me-2 mb-2 p-2">
                                                                <i className="fas fa-user me-1"></i>
                                                                {heroName}: {SKILL_TRANSLATOR.faith_touch} {faithTouch} (+{faithTouch * 25}%)
                                                            </Badge>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="fantasy-text-muted small">
                                                        Нет героев с навыком "Касание веры"
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <Alert variant="warning" className="mb-0">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    Для проведения ритуалов необходимо построить ритуальный столб.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                    
                    {/* Тотем */}
                    <Card className="fantasy-card">
                        <Card.Header className={`fantasy-card-header fantasy-card-header-${totem ? 'warning' : 'secondary'}`}>
                            <div className="d-flex justify-content-between align-items-center">
                                <h6 className="fantasy-text-gold mb-0">
                                    <i className="fas fa-totem me-2"></i>
                                    Тотем Эона
                                    {totem && ` (Уровень ${totem.level})`}
                                </h6>
                                {totem ? (
                                    <Badge bg="warning">
                                        <i className="fas fa-check me-1"></i>
                                        Построен
                                    </Badge>
                                ) : (
                                    <Badge bg="secondary">
                                        <i className="fas fa-times me-1"></i>
                                        Не построен
                                    </Badge>
                                )}
                            </div>
                        </Card.Header>
                        
                        <Card.Body>
                            {totem ? (
                                <>
                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="fantasy-text-dark">Божественная энергия:</span>
                                            <span className="fantasy-text-dark">
                                                {(totem.divine || 0).toFixed(1)} / {totem.max_divine || 500}
                                            </span>
                                        </div>
                                        <ProgressBar 
                                            now={((totem.divine || 0) / (totem.max_divine || 500)) * 100} 
                                            variant="success"
                                            className="mb-2"
                                            label={`${(((totem.divine || 0) / (totem.max_divine || 500)) * 100).toFixed(1)}%`}
                                        />
                                        
                                        {obtainedRewardToday && (
                                            <Alert variant="warning" className="mt-3 mb-0">
                                                <i className="fas fa-exclamation-triangle me-2"></i>
                                                Ваша гильдия уже получала награду за подношения сегодня. Дождитесь следующего дня.
                                            </Alert>
                                        )}
                                    </div>
                                    
                                    <Alert variant="info" className="mb-4">
                                        <i className="fas fa-info-circle me-2"></i>
                                        Подносите ресурсы со склада тотему для получения божественной энергии. При заполнении шкалы гильдия получает награды.
                                        Каждый ресурс дает 0.1 энергии. Специальные рецепты дают дополнительную энергию.
                                    </Alert>
                                    
                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="fantasy-text-dark mb-0">Ресурсы для подношения:</h6>
                                            <div>
                                                <span className="fantasy-text-muted me-2">
                                                    Всего: {totalAmount} шт. ({totalEnergy.toFixed(2)} энергии)
                                                </span>
                                                <Button 
                                                    variant="outline-warning"
                                                    size="sm"
                                                    onClick={() => setShowAllOfferingsModal(true)}
                                                    disabled={loading || offeringResources.length === 0 || obtainedRewardToday}
                                                >
                                                    <i className="fas fa-boxes me-2"></i>
                                                    Поднести всё
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {specialRecipes.length > 0 && (
                                        <div className="mb-4">
                                            <h6 className="fantasy-text-dark mb-3">Специальные рецепты подношений:</h6>
                                            <Row>
                                                {specialRecipes.map((recipe, index) => {
                                                    const canPrepare = canPrepareRecipe(recipe);
                                                    const ingredients = recipe.ingredients;
                                                    const mainIngredientId = Object.keys(ingredients)[0];
                                                    const additionalIngredientId = Object.keys(ingredients)[1];
                                                    const mainCount = storage[mainIngredientId] || 0;
                                                    const additionalCount = storage[additionalIngredientId] || 0;
                                                    
                                                    return (
                                                        <Col md={6} key={index}>
                                                            <Card className="fantasy-card mb-3">
                                                                <Card.Header className={`fantasy-card-header fantasy-card-header-${canPrepare ? 'success' : 'info'}`}>
                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                        <h6 className="fantasy-text-gold mb-0">Рецепт уровня {recipe.level}</h6>
                                                                        {canPrepare && (
                                                                            <Button 
                                                                                variant="outline-success"
                                                                                size="sm"
                                                                                onClick={() => handleMakeRecipeOffering(recipe.level)}
                                                                                disabled={loading || obtainedRewardToday}
                                                                            >
                                                                                <i className="fas fa-mortar-pestle me-1"></i>
                                                                                Поднести рецепт
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </Card.Header>
                                                                <Card.Body>
                                                                    <div className="mb-2">
                                                                        <small className="fantasy-text-muted">Ингредиенты:</small>
                                                                        <ul className="mb-0 mt-2">
                                                                            {Object.entries(recipe.ingredients).map(([itemId, count]) => {
                                                                                const available = storage[itemId] || 0;
                                                                                const hasEnough = available >= count;
                                                                                const resourceInfo = getResourceInfo(itemId);
                                                                                const resourceName = resourceInfo ? resourceInfo.name : `Ресурс ${itemId}`;
                                                                                
                                                                                return (
                                                                                    <li key={itemId} className={`fantasy-text-${hasEnough ? 'dark' : 'danger'}`}>
                                                                                        • {resourceName}: {count} шт. (есть: {available})
                                                                                    </li>
                                                                                );
                                                                            })}
                                                                        </ul>
                                                                    </div>
                                                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                                                        <small className="fantasy-text-muted">Энергия за рецепт:</small>
                                                                        <Badge bg="success">{recipe.energy.toFixed(2)}</Badge>
                                                                    </div>
                                                                    
                                                                    {!canPrepare && (
                                                                        <Alert variant="warning" size="sm" className="mt-3 mb-0">
                                                                            <small>
                                                                                <i className="fas fa-exclamation-triangle me-1"></i>
                                                                                Необходимо минимум {mainCount >= 8 ? '' : '8 основного и '}{additionalCount >= 2 ? '' : '2 дополнительного'} ингредиента
                                                                            </small>
                                                                        </Alert>
                                                                    )}
                                                                </Card.Body>
                                                            </Card>
                                                        </Col>
                                                    );
                                                })}
                                            </Row>
                                        </div>
                                    )}
                                    
                                    <div className="mt-4">
                                        <h6 className="fantasy-text-dark mb-2">Герои, влияющие на подношения:</h6>
                                        {Object.entries(heroes).filter(([_, heroData]) => heroData?.skills?.abbot).length > 0 ? (
                                            Object.entries(heroes).map(([heroName, heroData]) => {
                                                const abbot = heroData?.skills?.abbot;
                                                if (!abbot) return null;
                                                
                                                return (
                                                    <Badge key={heroName} bg="info" className="me-2 mb-2 p-2">
                                                        <i className="fas fa-user me-1"></i>
                                                        {heroName}: {SKILL_TRANSLATOR.abbot} {abbot}
                                                    </Badge>
                                                );
                                            })
                                        ) : (
                                            <div className="fantasy-text-muted small">
                                                Нет героев с навыком "Настоятель"
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <Alert variant="warning" className="mb-0">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    Для подношений необходим тотем.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Card.Body>
            </Card>
            
            {/* Модальное окно проведения ритуала */}
            <Modal show={showRitualModal} onHide={() => !loading && setShowRitualModal(false)} centered size="lg" backdrop={loading ? 'static' : true}>
                <Modal.Header closeButton={!loading} className="fantasy-card-header fantasy-card-header-primary">
                    <Modal.Title className="fantasy-text-gold">
                        <i className="fas fa-magic me-2"></i>
                        Проведение ритуала
                    </Modal.Title>
                </Modal.Header>
                
                <Modal.Body>
                    {selectedRitual && (
                        <>
                            <div className="text-center mb-4">
                                <h4 className="fantasy-text-gold mb-2">{selectedRitual.name}</h4>
                                <p className="fantasy-text-dark mb-0">Усиление атрибута: <strong>{selectedRitual.attribute}</strong></p>
                            </div>
                            
                            <div className="mb-4">
                                <h6 className="fantasy-text-dark mb-3">Детали ритуала:</h6>
                                
                                <Row className="mb-3">
                                    <Col md={6} className="mb-3">
                                        <Card className="fantasy-card h-100">
                                            <Card.Body className="text-center py-3">
                                                <div className="fantasy-text-muted small mb-1">Уровень ритуального столба</div>
                                                <div className="fantasy-text-dark h3 mb-0">{selectedRitual.level}</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Card className="fantasy-card h-100">
                                            <Card.Body className="text-center py-3">
                                                <div className="fantasy-text-muted small mb-1">Длительность</div>
                                                <div className="fantasy-text-dark h3 mb-0">{formatTime(selectedRitual.duration)}</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                                
                                <Card className="fantasy-card mb-3">
                                    <Card.Header className="fantasy-card-header fantasy-card-header-info">
                                        <h6 className="fantasy-text-gold mb-0">Возможные исходы</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        {selectedRitual.chances.map((chance, index) => (
                                            <div key={index} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary">
                                                <div className="d-flex align-items-center">
                                                    <Badge bg="info" className="me-2" style={{ minWidth: '60px' }}>
                                                        {(chance * 100).toFixed(0)}%
                                                    </Badge>
                                                    <span className="fantasy-text-dark">Шанс получить усиление</span>
                                                </div>
                                                <Badge bg="success" className="px-3 py-2">
                                                    +{selectedRitual.effects[index]}
                                                </Badge>
                                            </div>
                                        ))}
                                    </Card.Body>
                                </Card>
                            </div>
                            
                            <Alert variant="info">
                                <i className="fas fa-info-circle me-2"></i>
                                Ритуал будет действовать на всех членов гильдии в течение указанного времени.
                                {maxFaithTouch > 0 && (
                                    <span> Длительность увеличена на <strong>{maxFaithTouch * 25}%</strong> благодаря навыку "Касание веры" ваших героев.</span>
                                )}
                            </Alert>
                        </>
                    )}
                </Modal.Body>
                
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowRitualModal(false)}
                        disabled={loading}
                        className="fantasy-btn"
                    >
                        Отмена
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={() => handlePerformRitual(selectedRitual)}
                        disabled={loading || !selectedRitual}
                        className="fantasy-btn"
                    >
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Проведение...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-magic me-2"></i>
                                Провести ритуал
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* Модальное окно подношения всех ресурсов */}
            <Modal show={showAllOfferingsModal} onHide={() => !loading && setShowAllOfferingsModal(false)} centered backdrop={loading ? 'static' : true}>
                <Modal.Header closeButton={!loading} className="fantasy-card-header fantasy-card-header-danger">
                    <Modal.Title className="fantasy-text-gold">
                        <i className="fas fa-boxes me-2"></i>
                        Подношение всех ресурсов
                    </Modal.Title>
                </Modal.Header>
                
                <Modal.Body>
                    <div className="text-center mb-4">
                        <div className="fantasy-warning-icon mb-3">
                            <i className="fas fa-exclamation-triangle fa-3x text-warning"></i>
                        </div>
                        <h4 className="fantasy-text-gold mb-3">Вы уверены?</h4>
                    </div>
                    
                    <Card className="fantasy-card mb-4">
                        <Card.Body>
                            <div className="text-center mb-3">
                                <div className="h2 fantasy-text-warning mb-2">{totalAmount}</div>
                                <div className="fantasy-text-muted">Всего единиц ресурсов</div>
                            </div>
                            
                            <div className="text-center">
                                <div className="h2 fantasy-text-success mb-2">{totalEnergy.toFixed(2)}</div>
                                <div className="fantasy-text-muted">Всего божественной энергии</div>
                            </div>
                        </Card.Body>
                    </Card>
                    
                    <Alert variant="warning" className="mb-4">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Вы собираетесь поднести <strong>все доступные ресурсы</strong> тотему. Это действие нельзя отменить!
                        {obtainedRewardToday && (
                            <div className="mt-2">
                                <strong className="text-danger">Внимание:</strong> Ваша гильдия уже получала награду за подношения сегодня.
                            </div>
                        )}
                    </Alert>
                    
                    <div className="small fantasy-text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        Будут поднесены все ресурсы, доступные для подношения, включая специальные рецепты.
                        Подношение совершится по правилам бота: все реагенты будут поднесены автоматически.
                    </div>
                </Modal.Body>
                
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowAllOfferingsModal(false)}
                        disabled={loading}
                        className="fantasy-btn"
                    >
                        Отмена
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={handleMakeOfferingAll}
                        disabled={loading || offeringResources.length === 0 || obtainedRewardToday}
                        className="fantasy-btn"
                    >
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Подношение...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-boxes me-2"></i>
                                Поднести все ({totalAmount} шт.)
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
});

export default SettlementRituals;