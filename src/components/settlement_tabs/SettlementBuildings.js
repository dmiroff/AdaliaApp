import { useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { observer } from "mobx-react-lite";
import { Context } from "../../index";
import { 
    Card, Row, Col, Button, ProgressBar, Badge, 
    Alert, Spinner, Accordion, Tooltip, OverlayTrigger
} from 'react-bootstrap';
import { 
    BUILDINGS_DICT, 
    RESOURCE_NAMES,
    determineSettlementType,
    SETTLEMENT_TYPE_NAMES
} from '../../utils/settlementConstants';
import CurrentConstructionsModal from '../modals/CurrentConstructionsModal';
import UpgradeBuildingModal from '../modals/UpgradeBuildingModal';
import { getResourceInfo } from '../../utils/resourceHelpers';
import { settlementService } from '../../services/SettlementService';

const getBuildingName = (buildingKey, buildingData) => {
    if (!buildingData) return buildingKey;
    
    let name = buildingKey;
    
    if (typeof buildingData === 'object') {
        if (buildingData.name) {
            name = typeof buildingData.name === 'string' ? buildingData.name : String(buildingData.name);
        }
    } else if (typeof buildingData === 'string') {
        name = buildingData;
    }
    
    return name;
};

const getResourceAmount = (storage, resourceId) => {
    const resourceObj = storage[resourceId];
    if (!resourceObj) return 0;
    
    if (typeof resourceObj === 'object' && resourceObj !== null && 'count' in resourceObj) {
        return resourceObj.count || 0;
    }
    
    if (typeof resourceObj === 'number') {
        return resourceObj;
    }
    
    return 0;
};

const SettlementBuildings = observer(() => {
    const { settlement, user, guild } = useContext(Context);
    
    const [loading, setLoading] = useState(false);
    const [constructionLoading, setConstructionLoading] = useState({});
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [showCurrentConstructionsModal, setShowCurrentConstructionsModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [activeTab, setActiveTab] = useState('current');
    const [localConstruction, setLocalConstruction] = useState({});
    const [localBuildings, setLocalBuildings] = useState({});
    
    const settlementData = useMemo(() => {
        return settlement?._settlementData || settlement?.currentSettlement || {};
    }, [settlement]);

    const buildings = useMemo(() => {
        return localBuildings.current || settlementData?.buildings || {};
    }, [settlementData?.buildings, localBuildings]);

    const construction = useMemo(() => {
        return localConstruction.current || settlementData?.construction || {};
    }, [settlementData?.construction, localConstruction]);

    const storage = useMemo(() => settlementData?.storage || {}, [settlementData]);
    const currentEssence = useMemo(() => settlementData?.current_essence || 0, [settlementData]);
    const guildId = useMemo(() => settlementData?.id, [settlementData]);
    
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
        if (settlementData?.buildings) {
            setLocalBuildings(prev => ({ ...prev, current: settlementData.buildings }));
        }
        if (settlementData?.construction) {
            setLocalConstruction(prev => ({ ...prev, current: settlementData.construction }));
        }
    }, [settlementData]);
    
    const heroes = useMemo(() => {
        try {
            const heroesData = settlementData?.heroes?.active_heroes;
            if (!heroesData || typeof heroesData !== 'object') {
                return {};
            }
            return heroesData;
        } catch (error) {
            console.error('Ошибка при получении данных о героях:', error);
            return {};
        }
    }, [settlementData]);
    
    const settlementType = useMemo(() => {
        return settlementData?.type || determineSettlementType(buildings, settlementData?.garrison || {});
    }, [settlementData, buildings]);
    
    const buildingsData = useMemo(() => BUILDINGS_DICT[settlementType] || {}, [settlementType]);
    
    const showNotification = useCallback((type, message) => {
        setNotification({ show: true, type, message });
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
    }, []);
    
    const getPossibleConcurrentConstructions = useMemo(() => {
        let possibleConstructions = 1;
        
        if (heroes && typeof heroes === 'object') {
            Object.values(heroes).forEach(hero => {
                if (hero && hero.skills) {
                    let skillsArray;
                    
                    if (Array.isArray(hero.skills)) {
                        skillsArray = hero.skills;
                    } else if (typeof hero.skills === 'string') {
                        skillsArray = hero.skills.split(',').map(s => s.trim());
                    } else if (typeof hero.skills === 'object' && hero.skills !== null) {
                        skillsArray = Object.keys(hero.skills);
                    } else {
                        skillsArray = [];
                    }
                    
                    if (skillsArray.includes('builder')) {
                        possibleConstructions += 1;
                    }
                }
            });
        }
        
        return possibleConstructions;
    }, [heroes]);
    
    const hasNextLevel = useCallback((buildingKey, currentLevel) => {
        if (!buildingsData[buildingKey]) return false;
        
        const nextLevel = currentLevel + 1;
        const nextLevelKey = nextLevel.toString();
        
        return buildingsData[buildingKey][nextLevel] !== undefined || 
               buildingsData[buildingKey][nextLevelKey] !== undefined;
    }, [buildingsData]);
    
    const isMaxLevel = useCallback((buildingKey, currentLevel) => {
        return !hasNextLevel(buildingKey, currentLevel);
    }, [hasNextLevel]);
    
    const checkBuildingRequirements = useCallback((buildingKey, currentLevel, targetLevel, buildingData) => {
        const buildingInfo = buildingsData[buildingKey];
        if (!buildingInfo || typeof buildingInfo !== 'object') {
            return { canBuild: false, reasons: ["Информация о здании не найдена"] };
        }
        
        const targetLevelInfo = buildingInfo[targetLevel] || buildingInfo[String(targetLevel)];
        if (!targetLevelInfo) {
            return { canBuild: false, reasons: ["Информация об уровне не найдена"] };
        }
        
        const reasons = [];
        let canBuild = true;
        
        if (currentLevel > 0) {
            const currentExp = buildingData?.exp || 0;
            const currentLevelData = buildingInfo[currentLevel] || buildingInfo[String(currentLevel)];
            
            if (currentLevelData?.exp_for_levelup && currentExp < currentLevelData.exp_for_levelup) {
                reasons.push(`Недостаточно опыта здания: ${currentExp}/${currentLevelData.exp_for_levelup}`);
                canBuild = false;
            }
        }
        
        if (targetLevelInfo?.required_buildings && typeof targetLevelInfo.required_buildings === 'object') {
            Object.entries(targetLevelInfo.required_buildings).forEach(([reqBuilding, reqLevel]) => {
                const reqBuildingLevel = buildings[reqBuilding]?.level || 0;
                if (reqBuildingLevel < reqLevel) {
                    const reqBuildingName = getBuildingName(reqBuilding, buildingsData[reqBuilding]);
                    reasons.push(`Требуется ${reqBuildingName} уровень ${reqLevel} (текущий: ${reqBuildingLevel})`);
                    canBuild = false;
                }
            });
        }
        
        const durability = buildingData?.durability || 0;
        const maxDurability = buildingData?.max_durability || 100;
        if (durability < maxDurability && currentLevel > 0) {
            reasons.push(`Здание повреждено: ${durability}/${maxDurability}`);
            canBuild = false;
        }
        
        if (isMaxLevel(buildingKey, currentLevel)) {
            reasons.push("Достигнут максимальный уровень");
            canBuild = false;
        }
        
        if (construction[buildingKey]) {
            reasons.push("Уже в процессе строительства");
            canBuild = false;
        }
        
        if (Object.keys(construction).length >= getPossibleConcurrentConstructions) {
            reasons.push(`Достигнут лимит строек: ${Object.keys(construction).length}/${getPossibleConcurrentConstructions}`);
            canBuild = false;
        }
        
        return { 
            canBuild, 
            reasons, 
            targetLevelInfo,
            requiredEssence: targetLevelInfo?.essence || 0
        };
    }, [buildingsData, buildings, construction, isMaxLevel, getPossibleConcurrentConstructions]);
    
    const checkResourcesAvailability = useCallback((resources = {}, requiredEssence = 0) => {
        const missingResources = [];
        let totalRequired = 0;
        let totalAvailable = 0;
        
        if (resources && typeof resources === 'object') {
            Object.entries(resources).forEach(([resourceId, amount]) => {
                totalRequired += amount;
                const availableAmount = getResourceAmount(storage, resourceId);
                totalAvailable += Math.min(availableAmount, amount);
                if (availableAmount < amount) {
                    const resourceInfo = getResourceInfo(resourceId, RESOURCE_NAMES);
                    missingResources.push(`${resourceInfo.name}: ${availableAmount}/${amount}`);
                }
            });
        }
        
        if (requiredEssence > 0) {
            totalRequired += requiredEssence;
            totalAvailable += Math.min(currentEssence, requiredEssence);
            if (currentEssence < requiredEssence) {
                missingResources.push(`Воплощение: ${currentEssence}/${requiredEssence}`);
            }
        }
        
        const progressPercentage = totalRequired > 0 ? (totalAvailable / totalRequired) * 100 : 100;
        
        return {
            hasEnoughResources: missingResources.length === 0,
            missingResources,
            progressPercentage,
            totalRequired,
            totalAvailable
        };
    }, [storage, currentEssence]);
    
    const getAvailableBuildings = useMemo(() => {
        const available = [];
        
        if (!buildingsData || typeof buildingsData !== 'object') {
            return available;
        }
        
        Object.entries(buildingsData).forEach(([buildingKey, buildingInfo]) => {
            const currentLevel = buildings[buildingKey]?.level || 0;
            const buildingData = buildings[buildingKey];
            const buildingName = getBuildingName(buildingKey, buildingInfo);
            
            const targetLevel = currentLevel === 0 ? 1 : currentLevel + 1;
            
            const { canBuild, reasons, targetLevelInfo, requiredEssence } = checkBuildingRequirements(
                buildingKey, 
                currentLevel, 
                targetLevel, 
                buildingData
            );
            
            if (canBuild) {
                const { hasEnoughResources, missingResources, progressPercentage } = checkResourcesAvailability(
                    targetLevelInfo?.resources || {},
                    requiredEssence
                );
                
                available.push({
                    key: buildingKey,
                    name: buildingName,
                    currentLevel,
                    targetLevel,
                    resources: targetLevelInfo?.resources || {},
                    essence: requiredEssence,
                    constructionTime: targetLevelInfo?.construction_time || 60,
                    targetLevelInfo,
                    isNewConstruction: currentLevel === 0,
                    buildingData,
                    buildingInfo,
                    hasEnoughResources,
                    missingResources,
                    progressPercentage,
                    guildId: guildId
                });
            }
        });
        
        return available.sort((a, b) => {
            if (a.progressPercentage === b.progressPercentage) {
                return a.name.localeCompare(b.name);
            }
            return b.progressPercentage - a.progressPercentage;
        });
    }, [buildingsData, buildings, checkBuildingRequirements, checkResourcesAvailability, guildId]);
    
    const renderResources = useCallback((resources = {}, essence = 0, showAvailability = true) => {
        const allResources = { ...resources };
        
        if (essence > 0) {
            allResources['essence'] = essence;
        }
        
        if (!allResources || typeof allResources !== 'object' || Object.keys(allResources).length === 0) {
            return (
                <div className="fantasy-text-muted small">Ресурсы не требуются</div>
            );
        }
        
        return (
            <div className="mt-2">
                <small className="fantasy-text-muted">Ресурсы для улучшения:</small>
                {Object.entries(allResources).map(([resourceId, amount]) => {
                    if (resourceId === 'essence') {
                        const hasEnough = currentEssence >= amount;
                        
                        return (
                            <div key="essence" className="d-flex align-items-center justify-content-between mt-1">
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-star me-2 text-primary"></i>
                                    <span className={`fantasy-text-${hasEnough ? 'dark' : 'danger'}`}>
                                        Воплощение:
                                    </span>
                                </div>
                                <div className="d-flex align-items-center">
                                    {showAvailability && (
                                        <span className={`me-2 ${hasEnough ? 'fantasy-text-success' : 'fantasy-text-danger'}`}>
                                            {currentEssence}/
                                        </span>
                                    )}
                                    <Badge bg={hasEnough ? "primary" : "danger"}>
                                        {amount}
                                    </Badge>
                                </div>
                            </div>
                        );
                    }
                    
                    const resourceInfo = getResourceInfo(resourceId, RESOURCE_NAMES);
                    const availableAmount = getResourceAmount(storage, resourceId);
                    const hasEnough = availableAmount >= amount;
                    
                    return (
                        <div key={`resource-${resourceId}`} className="d-flex align-items-center justify-content-between mt-1">
                            <div className="d-flex align-items-center">
                                <i className={`${resourceInfo.icon} me-2 text-${resourceInfo.color}`}></i>
                                <span className={`fantasy-text-${hasEnough ? 'dark' : 'danger'}`}>
                                    {resourceInfo.name}:
                                </span>
                            </div>
                            <div className="d-flex align-items-center">
                                {showAvailability && (
                                    <span className={`me-2 ${hasEnough ? 'fantasy-text-success' : 'fantasy-text-danger'}`}>
                                        {availableAmount}/
                                    </span>
                                )}
                                <Badge bg={hasEnough ? "success" : "danger"}>
                                    {amount}
                                </Badge>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }, [storage, currentEssence]);
    
    const handleStartConstruction = useCallback(async (building) => {
        if (!building || !guildId) {
            showNotification('error', 'Ошибка: не указаны необходимые данные');
            return;
        }
        
        setConstructionLoading(prev => ({
            ...prev,
            [building.key]: true
        }));
        
        try {
            const result = await settlementService.startConstruction(
                guildId,
                building.key,
                building.targetLevel
            );
            
            if (result.status === 200) {
                showNotification('success', result.message || 'Строительство добавлено в очередь');
                setShowUpgradeModal(false);
                setSelectedBuilding(null);
                
                // Локально обновляем состояние строительства
                const newConstructionData = result.data || {};
                setLocalConstruction(prev => ({
                    current: {
                        ...prev.current,
                        [building.key]: newConstructionData
                    }
                }));
                
                // Обновляем данные поселения
                if (settlement?.fetchData) {
                    await settlement.fetchData();
                }
                
                // Автоматически открываем модалку текущих строек
                setShowCurrentConstructionsModal(true);
            } else {
                showNotification('error', result.message || 'Ошибка начала строительства');
            }
        } catch (error) {
            console.error('Ошибка начала строительства:', error);
            showNotification('error', 'Ошибка начала строительства');
        } finally {
            setConstructionLoading(prev => ({
                ...prev,
                [building.key]: false
            }));
        }
    }, [showNotification, settlement, guildId]);
    
    const handleQuickConstruction = useCallback(async (building) => {
        if (!building || !guildId) {
            showNotification('error', 'Ошибка: не указаны необходимые данные');
            return;
        }
        
        const { canBuild, reasons } = checkBuildingRequirements(
            building.key, 
            building.currentLevel, 
            building.targetLevel, 
            building.buildingData
        );
        
        if (!canBuild) {
            showNotification('error', `Нельзя начать строительство:\n${reasons.join('\n')}`);
            return;
        }
        
        await handleStartConstruction(building);
    }, [checkBuildingRequirements, handleStartConstruction, guildId]);
    
    const getBuildingRequirements = useCallback((buildingKey, currentLevel) => {
        const buildingInfo = buildingsData[buildingKey];
        const targetLevel = currentLevel + 1;
        const targetLevelInfo = buildingInfo?.[targetLevel] || buildingInfo?.[String(targetLevel)];
        
        if (!targetLevelInfo) return null;
        
        const buildingData = buildings[buildingKey];
        const { reasons, requiredEssence } = checkBuildingRequirements(
            buildingKey, 
            currentLevel, 
            targetLevel, 
            buildingData
        );
        
        const { missingResources, progressPercentage } = checkResourcesAvailability(
            targetLevelInfo?.resources || {},
            requiredEssence
        );
        
        return {
            reasons,
            missingResources,
            targetLevelInfo,
            requiredEssence,
            currentLevel,
            targetLevel,
            progressPercentage
        };
    }, [buildingsData, buildings, checkBuildingRequirements, checkResourcesAvailability]);
    
    const groupedBuildings = useMemo(() => {
        const groups = {
            main: [], military: [], resource: [], special: [], ritual: []
        };
        
        if (!buildingsData || typeof buildingsData !== 'object') {
            return groups;
        }
        
        Object.entries(buildingsData).forEach(([key, data]) => {
            if (!data || typeof data !== 'object') return;
            
            const buildingName = getBuildingName(key, data);
            const currentLevel = buildings[key]?.level || 0;
            const isUnderConstruction = !!construction[key];
            const maxLevel = isMaxLevel(key, currentLevel);
            const canUpgrade = getAvailableBuildings.some(b => b.key === key);
            
            let buildingRequirements = null;
            if (!isUnderConstruction && !maxLevel && !canUpgrade) {
                buildingRequirements = getBuildingRequirements(key, currentLevel);
            }
            
            const targetLevel = currentLevel + 1;
            const targetLevelInfo = data[targetLevel] || data[String(targetLevel)];
            
            const building = {
                key,
                name: buildingName,
                currentData: buildings[key] || null,
                isUnderConstruction,
                constructionData: construction[key],
                currentLevel,
                maxLevel,
                canUpgrade,
                buildingRequirements,
                isMaxLevel: maxLevel,
                targetLevelInfo,
                buildingData: buildings[key] || {},
                buildingsData: data
            };
            
            if (key.includes('main') || key === 'heart' || key === 'main_building') {
                groups.main.push(building);
            } else if (key.includes('unit_') || key.includes('barracks') || key.includes('tower') || key.includes('wall')) {
                groups.military.push(building);
            } else if (key.includes('storage') || key.includes('smith') || key.includes('workshop')) {
                groups.resource.push(building);
            } else if (key.includes('ritual') || key.includes('altar') || key.includes('totem')) {
                groups.ritual.push(building);
            } else {
                groups.special.push(building);
            }
        });
        
        return groups;
    }, [buildingsData, buildings, construction, isMaxLevel, getAvailableBuildings, getBuildingRequirements]);
    
    const BuildingCard = ({ building }) => {
        const { 
            key, 
            name: buildingName, 
            currentData, 
            isUnderConstruction, 
            constructionData,
            currentLevel,
            maxLevel,
            canUpgrade,
            buildingRequirements,
            targetLevelInfo
        } = building;
        
        const durability = currentData?.durability || 0;
        const maxDurability = currentData?.max_durability || 100;
        const durabilityPercentage = maxDurability > 0 ? (durability / maxDurability) * 100 : 100;
        const exp = currentData?.exp || 0;
        const expForLevelup = currentData?.exp_for_levelup || 0;
        const expPercentage = expForLevelup > 0 ? Math.min((exp / expForLevelup) * 100, 100) : 0;
        const isLoading = constructionLoading[key] || false;
        const requirementsText = buildingRequirements?.reasons?.join(', ') || "Требования не выполнены";
        
        return (
            <Col md={6} lg={4} className="mb-3">
                <Card className="fantasy-card building-card h-100">
                    <Card.Header className={`fantasy-card-header fantasy-card-header-${isUnderConstruction ? 'warning' : maxLevel ? 'success' : 'secondary'}`}>
                        <div className="d-flex justify-content-between align-items-center">
                            <h6 className="fantasy-text-gold mb-0">{buildingName}</h6>
                            <Badge bg={isUnderConstruction ? "warning" : maxLevel ? "success" : "info"}>
                                Ур. {currentLevel} {maxLevel && " (макс.)"}
                            </Badge>
                        </div>
                    </Card.Header>
                    
                    <Card.Body>
                        <div className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                                <span className="fantasy-text-muted">Прочность:</span>
                                <span className={`fantasy-text-${durabilityPercentage > 70 ? 'success' : durabilityPercentage > 40 ? 'warning' : 'danger'}`}>
                                    {durability}/{maxDurability}
                                </span>
                            </div>
                            <ProgressBar 
                                now={durabilityPercentage}
                                variant={durabilityPercentage > 70 ? "success" : durabilityPercentage > 40 ? "warning" : "danger"}
                                className="mb-2"
                            />
                        </div>
                        
                        {expForLevelup > 0 && (
                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="fantasy-text-muted">Опыт здания:</span>
                                    <span className={`fantasy-text-${expPercentage >= 100 ? 'success' : 'dark'}`}>
                                        {exp}/{expForLevelup}
                                    </span>
                                </div>
                                <ProgressBar now={expPercentage} variant={expPercentage >= 100 ? "success" : "info"} />
                            </div>
                        )}
                        
                        {targetLevelInfo && !isUnderConstruction && !maxLevel && (
                            <div className="mb-3">
                                <small className="fantasy-text-muted">Нужно для улучшения:</small>
                                {renderResources(targetLevelInfo.resources, targetLevelInfo.essence, true)}
                            </div>
                        )}
                        
                        {buildingRequirements && buildingRequirements.reasons && buildingRequirements.reasons.length > 0 && (
                            <div className="mb-3">
                                <small className="fantasy-text-danger">
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    Требования для уровня {buildingRequirements.targetLevel}:
                                </small>
                                {buildingRequirements.reasons.map((reason, index) => (
                                    <div key={`req-${index}`} className="fantasy-text-danger small mt-1">
                                        • {reason}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="d-grid gap-2">
                            {isUnderConstruction ? (
                                <>
                                    <Button variant="warning" disabled className="mb-2">
                                        <i className="fas fa-hammer me-2"></i>
                                        В строительстве до {constructionData?.level || 1}
                                    </Button>
                                    {(userRole === 'leader' || userRole === 'officer') && (
                                        <Button 
                                            variant="outline-danger" 
                                            size="sm"
                                            onClick={() => {
                                                showNotification('info', 'Отмена доступна в разделе "Текущие стройки"');
                                                setShowCurrentConstructionsModal(true);
                                            }}
                                        >
                                            <i className="fas fa-times me-2"></i>
                                            Отменить стройку
                                        </Button>
                                    )}
                                </>
                            ) : maxLevel ? (
                                <Button variant="success" disabled>
                                    <i className="fas fa-check me-2"></i>
                                    Максимальный уровень
                                </Button>
                            ) : canUpgrade ? (
                                <>
                                    <Button 
                                        variant="primary"
                                        onClick={() => {
                                            const buildingInfo = getAvailableBuildings.find(b => b.key === key);
                                            setSelectedBuilding(buildingInfo);
                                            setShowUpgradeModal(true);
                                        }}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Spinner animation="border" size="sm" className="me-2" />
                                        ) : (
                                            <i className="fas fa-arrow-up me-2"></i>
                                        )}
                                        Улучшить до {currentLevel + 1}
                                    </Button>
                                    
                                    {(userRole === 'leader' || userRole === 'officer') && (
                                        <Button 
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => {
                                                const buildingInfo = getAvailableBuildings.find(b => b.key === key);
                                                if (buildingInfo) {
                                                    handleQuickConstruction(buildingInfo);
                                                }
                                            }}
                                            disabled={isLoading}
                                            title="Начать строительство сразу"
                                        >
                                            {isLoading ? (
                                                <Spinner animation="border" size="sm" className="me-1" />
                                            ) : (
                                                <i className="fas fa-bolt me-1"></i>
                                            )}
                                            Быстрое улучшение
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <OverlayTrigger
                                    placement="top"
                                    overlay={<Tooltip id={`tooltip-${key}`}>{requirementsText}</Tooltip>}
                                >
                                    <Button 
                                        variant="outline-secondary"
                                        onClick={() => {
                                            let message = `<strong>${buildingName}</strong> (Ур. ${currentLevel} → ${buildingRequirements?.targetLevel || currentLevel + 1})\n\n`;
                                            
                                            if (buildingRequirements?.reasons && buildingRequirements.reasons.length > 0) {
                                                message += "<strong>Не выполнено:</strong>\n";
                                                buildingRequirements.reasons.forEach((reason, index) => {
                                                    message += `${index + 1}. ${reason}\n`;
                                                });
                                            }
                                            
                                            if (buildingRequirements?.targetLevelInfo) {
                                                const { resources, essence } = buildingRequirements.targetLevelInfo;
                                                if ((resources && Object.keys(resources).length > 0) || essence > 0) {
                                                    message += "\n<strong>Ресурсы для улучшения:</strong>\n";
                                                    
                                                    if (resources && typeof resources === 'object') {
                                                        Object.entries(resources).forEach(([resourceId, amount]) => {
                                                            const resourceInfo = getResourceInfo(resourceId, RESOURCE_NAMES);
                                                            const availableAmount = getResourceAmount(storage, resourceId);
                                                            const hasEnough = availableAmount >= amount;
                                                            message += `• ${resourceInfo.name}: ${availableAmount}/${amount} ${hasEnough ? '✓' : '✗'}\n`;
                                                        });
                                                    }
                                                    
                                                    if (essence > 0) {
                                                        message += `• Воплощение: ${currentEssence}/${essence} ${currentEssence >= essence ? '✓' : '✗'}\n`;
                                                    }
                                                }
                                            }
                                            
                                            showNotification('info', message);
                                        }}
                                    >
                                        <i className="fas fa-info-circle me-2"></i>
                                        Требования не выполнены
                                    </Button>
                                </OverlayTrigger>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        );
    };
    
    if (!settlementData) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Загрузка данных о зданиях...</p>
                </Card.Body>
            </Card>
        );
    }
    
    return (
        <div className="settlement-buildings">
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
                                <i className="fas fa-building me-2"></i>
                                Постройки поселения
                            </h5>
                            <div className="fantasy-text-muted mt-1">
                                Тип: {typeof SETTLEMENT_TYPE_NAMES[settlementType] === 'string' 
                                    ? SETTLEMENT_TYPE_NAMES[settlementType] 
                                    : settlementType}
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <Badge bg={userRole === 'leader' ? 'danger' : userRole === 'officer' ? 'warning' : 'info'} className="me-2">
                                {userRole === 'leader' ? 'Лидер' : userRole === 'officer' ? 'Офицер' : 'Член'}
                            </Badge>
                            <Button 
                                variant={Object.keys(construction).length > 0 ? "warning" : "outline-warning"}
                                size="sm"
                                onClick={() => setShowCurrentConstructionsModal(true)}
                                className="fantasy-btn"
                            >
                                <i className="fas fa-hammer me-2"></i>
                                Текущие стройки ({Object.keys(construction).length}/{getPossibleConcurrentConstructions})
                            </Button>
                        </div>
                    </div>
                </Card.Header>
                
                <Card.Body>
                    <Alert variant="info" className="fantasy-alert">
                        <i className="fas fa-info-circle me-2"></i>
                        <div>
                            <div className="mt-2">
                                <small className="fantasy-text-muted">
                                    <i className="fas fa-tools me-1"></i>
                                    Доступно для строительства: <Badge bg="success">{getAvailableBuildings.length}</Badge>
                                    {' '} | {' '}
                                    <i className="fas fa-hammer me-1"></i>
                                    Текущие стройки: <Badge bg={Object.keys(construction).length >= getPossibleConcurrentConstructions ? "danger" : "warning"}>
                                        {Object.keys(construction).length}/{getPossibleConcurrentConstructions}
                                    </Badge>
                                    {' '} | {' '}
                                    <i className="fas fa-star me-1"></i>
                                    Воплощение: <Badge bg="primary">{currentEssence}</Badge>
                                </small>
                            </div>
                        </div>
                    </Alert>
                    
                    <Accordion defaultActiveKey={['main', 'military']} alwaysOpen className="mb-3">
                        {groupedBuildings.main.length > 0 && (
                            <Accordion.Item eventKey="main">
                                <Accordion.Header className="fantasy-accordion-header">
                                    <i className="fas fa-landmark me-2"></i>
                                    Главные здания ({groupedBuildings.main.length})
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Row>{groupedBuildings.main.map(building => <BuildingCard key={building.key} building={building} />)}</Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        )}
                        
                        {groupedBuildings.military.length > 0 && (
                            <Accordion.Item eventKey="military">
                                <Accordion.Header className="fantasy-accordion-header">
                                    <i className="fas fa-shield-alt me-2"></i>
                                    Военные здания ({groupedBuildings.military.length})
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Row>{groupedBuildings.military.map(building => <BuildingCard key={building.key} building={building} />)}</Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        )}
                        
                        {groupedBuildings.resource.length > 0 && (
                            <Accordion.Item eventKey="resource">
                                <Accordion.Header className="fantasy-accordion-header">
                                    <i className="fas fa-coins me-2"></i>
                                    Ресурсные здания ({groupedBuildings.resource.length})
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Row>{groupedBuildings.resource.map(building => <BuildingCard key={building.key} building={building} />)}</Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        )}
                        
                        {groupedBuildings.ritual.length > 0 && (
                            <Accordion.Item eventKey="ritual">
                                <Accordion.Header className="fantasy-accordion-header">
                                    <i className="fas fa-magic me-2"></i>
                                    Ритуальные здания ({groupedBuildings.ritual.length})
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Row>{groupedBuildings.ritual.map(building => <BuildingCard key={building.key} building={building} />)}</Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        )}
                        
                        {groupedBuildings.special.length > 0 && (
                            <Accordion.Item eventKey="special">
                                <Accordion.Header className="fantasy-accordion-header">
                                    <i className="fas fa-star me-2"></i>
                                    Специальные здания ({groupedBuildings.special.length})
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Row>{groupedBuildings.special.map(building => <BuildingCard key={building.key} building={building} />)}</Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        )}
                    </Accordion>
                </Card.Body>
            </Card>
            
            <CurrentConstructionsModal
                showCurrentConstructionsModal={showCurrentConstructionsModal}
                setShowCurrentConstructionsModal={setShowCurrentConstructionsModal}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                construction={construction}
                buildingsData={buildingsData}
                showNotification={showNotification}
                getBuildingName={getBuildingName}
                getResourceInfo={(resourceId) => getResourceInfo(resourceId, RESOURCE_NAMES)}
                getResourceAmount={getResourceAmount}
                settlementService={settlementService}
                guildId={guildId}
                settlement={settlement}
                storage={storage}
                currentEssence={currentEssence}
                userRole={userRole}
                setLocalConstruction={setLocalConstruction}
                localConstruction={localConstruction.current}
            />
            
            <UpgradeBuildingModal
                selectedBuilding={selectedBuilding}
                showUpgradeModal={showUpgradeModal}
                setShowUpgradeModal={setShowUpgradeModal}
                construction={construction}
                getPossibleConcurrentConstructions={getPossibleConcurrentConstructions}
                renderResources={renderResources}
                handleStartConstruction={handleStartConstruction}
                showNotification={showNotification}
                buildings={buildings}
                storage={storage}
                loading={loading}
                getResourceInfo={(resourceId) => getResourceInfo(resourceId, RESOURCE_NAMES)}
                currentEssence={currentEssence}
                getResourceAmount={getResourceAmount}
                settlementService={settlementService}
                guildId={guildId}
                userRole={userRole}
            />
        </div>
    );
});

export default SettlementBuildings;