import React, { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Row, Col, Card, Badge, Button, Alert, Modal, Form, Spinner, Tabs, Tab, InputGroup } from 'react-bootstrap';
import { observer } from "mobx-react-lite";
import { toJS } from 'mobx';
import { Context } from "../../index";
import GetDataById from '../../http/GetData';
import { 
    HIRE_COSTS, 
    UNIT_NAME_TO_ID, 
    RESOURCE_PER_TIER, 
    RESOURCE_NAMES,
    SETTLEMENT_TYPE_NAMES,
    determineSettlementType,
    UNIT_WEIGHTS
} from '../../utils/settlementConstants';
import { settlementService } from '../../services/SettlementService';

// Вспомогательные функции
const createUnitIdToName = () => {
    const idToName = {};
    Object.entries(UNIT_NAME_TO_ID).forEach(([name, id]) => {
        idToName[id] = name;
        idToName[String(id)] = name;
    });
    return idToName;
};

const UNIT_ID_TO_NAME = createUnitIdToName();

const parseUnitId = (fullUnitId) => {
    const id = parseInt(fullUnitId);
    const absId = Math.abs(id);
    
    if (absId < 1000) {
        return {
            tier: 0,
            baseId: id,
            isNegative: id < 0,
            fullId: id
        };
    }
    
    const idStr = String(absId);
    
    if (idStr.length === 4) {
        const tier = parseInt(idStr[0]);
        const baseId = parseInt(idStr.substring(2));
        const signedBaseId = id < 0 ? -baseId : baseId;
        return {
            tier,
            baseId: signedBaseId,
            isNegative: signedBaseId < 0,
            fullId: id
        };
    }
    
    return {
        tier: 0,
        baseId: id,
        isNegative: id < 0,
        fullId: id
    };
};

const getUnitNameByFullId = (fullUnitId) => {
    const parsed = parseUnitId(fullUnitId);
    const baseName = UNIT_ID_TO_NAME[parsed.baseId] || `Юнит ${parsed.baseId}`;
    if (parsed.tier > 0) {
        return `${baseName} T${parsed.tier}`;
    }
    return baseName;
};

const getUnitNameWithoutTier = (fullUnitId) => {
    const parsed = parseUnitId(fullUnitId);
    return UNIT_ID_TO_NAME[parsed.baseId] || `Юнит ${parsed.baseId}`;
};

const SettlementGarrison = observer(() => {
    const { settlement, user, guild } = useContext(Context); // Добавлен guild
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [showTakeModal, setShowTakeModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('garrison');
    const [selectedHireUnit, setSelectedHireUnit] = useState(null);
    const [showHireModal, setShowHireModal] = useState(false);
    const [hireQuantity, setHireQuantity] = useState(1);
    const [selectedTier, setSelectedTier] = useState(0);
    const [hireLoading, setHireLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [loadingPlayer, setLoadingPlayer] = useState(false);
    const [playerPartyData, setPlayerPartyData] = useState(null);
    
    const [selectedPartyUnit, setSelectedPartyUnit] = useState(null);
    const [showDischargeModal, setShowDischargeModal] = useState(false);
    const [showStoreModal, setShowStoreModal] = useState(false);
    const [dischargeQuantity, setDischargeQuantity] = useState(1);
    const [storeQuantity, setStoreQuantity] = useState(1);
    const [dischargeLoading, setDischargeLoading] = useState(false);
    const [storeLoading, setStoreLoading] = useState(false);

    // Отладка
    useEffect(() => {
        console.log('=== SETTLEMENT GARRISON DEBUG ===');
        console.log('Component mounted');
    }, []);

    const showNotification = (type, message) => {
        setNotification({ show: true, type, message });
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
    };

    // Получаем данные игрока
    const playerData = useMemo(() => {
        if (!user) return null;
        return toJS(user.user) || toJS(user.player) || toJS(user.currentUser);
    }, [user]);

    // ID игрока (как в SettlementStorage)
    const playerId = useMemo(() => {
        return user.user?.id;
    }, [user.user]);

    // ID гильдии из контекста guild
    const guildId = useMemo(() => {
        return guild.guildData?.id;
    }, [guild.guildData]);

    const hasGuildData = useMemo(() => {
        return guild.guildData && guild.guildData.has_guild;
    }, [guild.guildData]);

    // Максимальный размер отряда
    const maxPartySize = useMemo(() => {
        console.log('DEBUG: Getting maxPartySize...');
        let size = 55;
        if (playerData) {
            const sizeFromData = 
                playerData.max_party_size ?? 
                playerData.maxPartySize ?? 
                playerData.max_party ?? 
                playerData.party_limit ??
                playerData.partySize ??
                55;
            if (sizeFromData !== undefined && sizeFromData !== null) {
                size = parseInt(sizeFromData);
            }
        }
        return size;
    }, [playerData]);

    // Загрузка данных игрока
    const loadPlayerData = useCallback(async (force = false) => {
        if (loadingPlayer && !force) return;
        setLoadingPlayer(true);
        try {
            const result = await GetDataById();
            if (result && result.data) {
                if (user?.setUser) user.setUser(result.data);
                if (user?.setPlayer) user.setPlayer(result.data);
                try {
                    localStorage.setItem('playerData', JSON.stringify(result.data));
                } catch (e) {}
                const partyDataFromServer = result.data.pets || result.data.party || {};
                if (Object.keys(partyDataFromServer).length > 0) {
                    setPlayerPartyData(partyDataFromServer);
                }
                return result.data;
            }
        } catch (error) {
            console.error('Error loading player data:', error);
        } finally {
            setLoadingPlayer(false);
        }
    }, [user, loadingPlayer]);

    // Инициализация
    useEffect(() => {
        const initData = async () => {
            try {
                const savedPlayerData = localStorage.getItem('playerData');
                if (savedPlayerData) {
                    const parsedData = JSON.parse(savedPlayerData);
                    const partyFromStorage = parsedData.pets || parsedData.party || {};
                    if (Object.keys(partyFromStorage).length > 0) {
                        setPlayerPartyData(partyFromStorage);
                    }
                }
            } catch (e) {}
            await loadPlayerData();
        };
        initData();
    }, []);

    // Загрузка данных поселения
    useEffect(() => {
        const loadSettlementData = async () => {
            setIsLoading(true);
            try {
                if (settlement && settlement.fetchData) {
                    await settlement.fetchData();
                }
            } catch (error) {
                console.error('Error loading settlement data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettlementData();
    }, [settlement]);

    // Данные отряда
    const partyData = useMemo(() => {
        if (playerPartyData && Object.keys(playerPartyData).length > 0) return playerPartyData;
        if (playerData && (playerData.pets || playerData.party)) {
            return playerData.pets || playerData.party || {};
        }
        try {
            const savedPlayerData = localStorage.getItem('playerData');
            if (savedPlayerData) {
                const parsedData = JSON.parse(savedPlayerData);
                return parsedData.pets || parsedData.party || {};
            }
        } catch (e) {}
        return {};
    }, [playerData, playerPartyData]);

    // Данные поселения
    const settlementData = useMemo(() => {
        if (!settlement) return null;
        return toJS(settlement);
    }, [settlement]);

    // Гарнизон, здания, ресурсы
    const garrisonData = useMemo(() => {
        return settlementData?._settlementData?.garrison || {};
    }, [settlementData]);

    const buildingsData = useMemo(() => {
        return settlementData?._settlementData?.buildings || {};
    }, [settlementData]);

    const currentResources = useMemo(() => {
        const resources = settlementData?.resources || 
                         settlementData?._settlementData?.resources || 
                         settlementData?._settlementData?.storage || 
                         settlementData?.storage || {};
        const formatted = {};
        Object.entries(resources).forEach(([key, value]) => {
            formatted[String(key)] = value;
        });
        return formatted;
    }, [settlementData]);

    const currentEssence = useMemo(() => {
        return settlementData?._settlementData?.current_essence || 0;
    }, [settlementData]);

    const smithLevel = useMemo(() => {
        return buildingsData["smith"]?.level || 0;
    }, [buildingsData]);

    const settlementType = useMemo(() => {
        return determineSettlementType(buildingsData, garrisonData);
    }, [buildingsData, garrisonData]);

    // Доступные для найма юниты
    const availableUnits = useMemo(() => {
        try {
            if (!buildingsData || Object.keys(buildingsData).length === 0) return [];
            const list = [];
            Object.entries(buildingsData).forEach(([buildingKey, buildingData]) => {
                if (buildingData.hire) {
                    const unitName = buildingData.hire;
                    const unitId = UNIT_NAME_TO_ID[unitName];
                    let baseCost = 100;
                    if (unitId !== undefined) {
                        const costKey = unitId < 0 ? unitId.toString() : unitId;
                        baseCost = HIRE_COSTS[costKey] || 100;
                    }
                    let buildingTier = 0;
                    const tierMatch = buildingKey.match(/unit_t(\d+)_/);
                    if (tierMatch) buildingTier = parseInt(tierMatch[1]);
                    list.push({
                        id: buildingKey,
                        buildingKey,
                        name: unitName,
                        unitId,
                        buildingName: buildingData.name || buildingKey,
                        level: buildingData.level || 1,
                        buildingTier,
                        cost: baseCost,
                        hireTime: buildingData.hire_time || 60,
                        hireExp: buildingData.hire_exp || 1,
                        description: `Нанимается из ${buildingData.name || buildingKey} (уровень ${buildingData.level || 1})`,
                        resources: buildingData.resources || {}
                    });
                }
            });
            return list;
        } catch (error) {
            console.error('Error getting available hire units:', error);
            return [];
        }
    }, [buildingsData]);

    // Вес юнита
    const getUnitWeight = useCallback((unitId) => {
        if (!unitId && unitId !== 0) return 1;
        const idNum = parseInt(unitId);
        if (!isNaN(idNum)) {
            const unitIdStr = Math.abs(idNum).toString();
            if (UNIT_WEIGHTS[unitIdStr] !== undefined) return UNIT_WEIGHTS[unitIdStr];
            if (idNum < 0) {
                const negativeKey = `-${Math.abs(idNum)}`;
                if (UNIT_WEIGHTS[negativeKey] !== undefined) return UNIT_WEIGHTS[negativeKey];
            }
        }
        return 1;
    }, []);

    // Текущее количество юнитов в отряде
    const currentPartyCount = useMemo(() => {
        if (!partyData || typeof partyData !== 'object' || Object.keys(partyData).length === 0) return 0;
        let total = 0;
        if (Array.isArray(partyData)) {
            partyData.forEach(pet => {
                if (!pet || typeof pet !== 'object') return;
                total += parseInt(pet.amount) || parseInt(pet.count) || 0;
            });
        } else {
            Object.entries(partyData).forEach(([key, pet]) => {
                if (typeof pet === 'number') total += pet;
                else if (pet && typeof pet === 'object') {
                    total += parseInt(pet.amount) || parseInt(pet.count) || 0;
                }
            });
        }
        return total;
    }, [partyData]);

    // Оставшиеся места
    const remainingSlots = useMemo(() => {
        return Math.max(0, maxPartySize - currentPartyCount);
    }, [maxPartySize, currentPartyCount]);

    // Список спутников для отображения
    const partyList = useMemo(() => {
        if (!partyData || typeof partyData !== 'object' || Object.keys(partyData).length === 0) return [];
        const list = [];
        if (Array.isArray(partyData)) {
            partyData.forEach((pet, index) => {
                if (!pet || typeof pet !== 'object') return;
                const fullUnitId = pet.pet_id || pet.id || index;
                const parsed = parseUnitId(fullUnitId);
                const unitName = getUnitNameByFullId(fullUnitId);
                const unitNameWithoutTier = getUnitNameWithoutTier(fullUnitId);
                const weight = getUnitWeight(fullUnitId);
                const amount = parseInt(pet.amount) || parseInt(pet.count) || 0;
                if (amount > 0) {
                    list.push({
                        id: fullUnitId,
                        fullId: fullUnitId,
                        baseId: parsed.baseId,
                        name: unitName,
                        nameWithoutTier: unitNameWithoutTier,
                        tier: parsed.tier,
                        amount,
                        weightPerUnit: weight,
                        totalWeight: amount * weight,
                        fights: pet.fights || 'no'
                    });
                }
            });
        } else {
            Object.entries(partyData).forEach(([key, pet]) => {
                if (typeof pet === 'number') {
                    const fullUnitId = key;
                    const parsed = parseUnitId(fullUnitId);
                    const unitName = getUnitNameByFullId(fullUnitId);
                    const unitNameWithoutTier = getUnitNameWithoutTier(fullUnitId);
                    const weight = getUnitWeight(fullUnitId);
                    const amount = pet;
                    if (amount > 0) {
                        list.push({
                            id: fullUnitId,
                            fullId: fullUnitId,
                            baseId: parsed.baseId,
                            name: unitName,
                            nameWithoutTier: unitNameWithoutTier,
                            tier: parsed.tier,
                            amount,
                            weightPerUnit: weight,
                            totalWeight: amount * weight,
                            fights: 'no'
                        });
                    }
                } else if (pet && typeof pet === 'object') {
                    let fullUnitId;
                    if (pet.pet_id !== undefined) fullUnitId = pet.pet_id;
                    else if (pet.id !== undefined) fullUnitId = pet.id;
                    else if (!isNaN(parseInt(key))) fullUnitId = parseInt(key);
                    else return;
                    const parsed = parseUnitId(fullUnitId);
                    const unitName = getUnitNameByFullId(fullUnitId);
                    const unitNameWithoutTier = getUnitNameWithoutTier(fullUnitId);
                    const weight = getUnitWeight(fullUnitId);
                    const amount = parseInt(pet.amount) || parseInt(pet.count) || 0;
                    if (amount > 0) {
                        list.push({
                            id: fullUnitId,
                            fullId: fullUnitId,
                            baseId: parsed.baseId,
                            name: unitName,
                            nameWithoutTier: unitNameWithoutTier,
                            tier: parsed.tier,
                            amount,
                            weightPerUnit: weight,
                            totalWeight: amount * weight,
                            fights: pet.fights || 'no'
                        });
                    }
                }
            });
        }
        return list;
    }, [partyData, getUnitWeight]);

    const currentPartyWeight = useMemo(() => {
        return partyList.reduce((sum, pet) => sum + (pet.totalWeight || 0), 0);
    }, [partyList]);

    // Доступные тиры для оснащения
    const checkAvailableTiers = useCallback((buildingTier) => {
        const tiers = [0];
        if (smithLevel >= buildingTier && buildingTier > 0) {
            tiers.push(1, 2, 3);
        }
        return tiers;
    }, [smithLevel]);

    // Расчёт стоимости найма
    const calculateHireCost = useCallback((unit, tier, quantity) => {
        const baseEssenceCost = unit.cost * quantity;
        const tierResources = RESOURCE_PER_TIER[tier] || {};
        const resourcesCost = {};
        Object.entries(tierResources).forEach(([resourceCode, baseAmount]) => {
            resourcesCost[resourceCode] = baseAmount * unit.buildingTier * quantity;
        });
        return { essence: baseEssenceCost, resources: resourcesCost };
    }, []);

    // Проверка наличия ресурсов
    const checkResourcesAvailability = useCallback((cost) => {
        if (cost.essence > currentEssence) {
            return { available: false, missing: 'essence', amount: cost.essence - currentEssence };
        }
        for (const [resourceCode, requiredAmount] of Object.entries(cost.resources)) {
            const resourceKey = String(resourceCode);
            const currentAmount = currentResources[resourceKey] || 0;
            if (currentAmount < requiredAmount) {
                return { available: false, missing: 'resource', resourceCode: resourceKey, amount: requiredAmount - currentAmount };
            }
        }
        return { available: true };
    }, [currentEssence, currentResources]);

    // Проверка места в отряде
    const checkPartySpaceForTake = useCallback((unitId, quantity) => {
        if (remainingSlots <= 0) return { available: false, message: 'В отряде нет свободного места' };
        if (quantity > remainingSlots) return { available: false, message: `Недостаточно места. Можно взять максимум ${remainingSlots} юнит(ов)` };
        return { available: true };
    }, [remainingSlots]);

    // Обновление всех данных
    const refreshAllData = async () => {
        try {
            if (settlement && settlement.fetchData) await settlement.fetchData();
            await loadPlayerData(true);
            showNotification('info', 'Данные обновлены');
        } catch (error) {
            showNotification('error', 'Ошибка при обновлении данных');
        }
    };

    // Извлечение тира из названия
    const extractTierFromName = (unitName) => {
        const tierPattern = /\s*[ТTтt]\s*([0-3])\s*/i;
        const match = unitName.match(tierPattern);
        let tier = 0;
        let nameWithoutTier = unitName;
        if (match) {
            tier = parseInt(match[1], 10);
            nameWithoutTier = unitName.replace(tierPattern, '').trim();
        }
        return { tier, nameWithoutTier };
    };

    // Обработчики модалок
    const handleOpenDischargeModal = (unit) => {
        if (!playerId) { showNotification('error', 'Не удалось определить ID игрока'); return; }
        if (!hasGuildData) { showNotification('error', 'Вы не состоите в гильдии'); return; }
        setSelectedPartyUnit(unit);
        setDischargeQuantity(1);
        setShowDischargeModal(true);
    };

    const handleOpenStoreModal = (unit) => {
        if (!playerId) { showNotification('error', 'Не удалось определить ID игрока'); return; }
        if (!hasGuildData || !guildId) { showNotification('error', 'Не удалось определить ID гильдии'); return; }
        setSelectedPartyUnit(unit);
        setStoreQuantity(1);
        setShowStoreModal(true);
    };

    const handleOpenTakeModal = (unit) => {
        const spaceCheck = checkPartySpaceForTake(null, 1);
        if (!spaceCheck.available) {
            showNotification('warning', spaceCheck.message);
            return;
        }
        setSelectedUnit({ 
            id: unit.id, 
            name: unit.nameWithoutTier,
            originalName: unit.originalName,
            tier: unit.tier,
            amount: unit.amount,
            unitId: unit.id // числовой ID
        });
        setQuantity(1);
        setShowTakeModal(true);
    };

    const handleOpenHireModal = (unit) => {
        setSelectedHireUnit(unit);
        setHireQuantity(1);
        setSelectedTier(0);
        setShowHireModal(true);
    };

    // Обработчик взятия юнита (исправлен: передаём unitId)
    const handleTakeUnit = async () => {
        if (!selectedUnit) return;
        const spaceCheck = checkPartySpaceForTake(null, quantity);
        if (!spaceCheck.available) {
            showNotification('error', spaceCheck.message);
            return;
        }
        const unitId = selectedUnit.unitId; // числовой ID
        try {
            if (!hasGuildData || !guildId) {
                showNotification('error', 'Не удалось определить ID гильдии');
                return;
            }
            const result = await settlementService.takeFromGarrison(guildId, unitId, quantity);
            if (result.status === 200) {
                showNotification('success', result.message || `Успешно взято ${quantity} юнитов из гарнизона`);
                await Promise.all([
                    settlement.fetchData?.(),
                    loadPlayerData(true)
                ]);
                setShowTakeModal(false);
                setSelectedUnit(null);
                setQuantity(1);
            } else {
                showNotification('error', result.message || "Ошибка при взятии юнитов");
            }
        } catch (error) {
            console.error('Error taking unit:', error);
            showNotification('error', error.response?.data?.message || 'Произошла ошибка');
        }
    };

    const handleHireUnit = async () => {
        if (!hasGuildData || !guildId) {
            showNotification('error', 'Не удалось определить ID гильдии');
            return;
        }
        if (!selectedHireUnit) return;
        const hireCost = calculateHireCost(selectedHireUnit, selectedTier, hireQuantity);
        setHireLoading(true);
        try {
            const result = await settlementService.hireUnit(
                guildId,
                selectedHireUnit.buildingKey,
                hireQuantity,
                selectedTier,
                selectedHireUnit.name
            );
            if (result.status === 200) {
                showNotification('success', `${hireQuantity} юнит(ов) "${selectedHireUnit.name} T${selectedTier}" успешно добавлены в очередь найма!`);
                await settlement.fetchData?.();
                setShowHireModal(false);
                setSelectedHireUnit(null);
                setHireQuantity(1);
                setSelectedTier(0);
            } else {
                showNotification('error', result.message || 'Ошибка при найме юнита');
            }
        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Ошибка при найме');
        } finally {
            setHireLoading(false);
        }
    };

    const handleDischargeUnit = async () => {
        if (!selectedPartyUnit || !playerId || !hasGuildData || !guildId) return;
        setDischargeLoading(true);
        try {
            const result = await settlementService.dischargeFromParty(
                playerId,
                selectedPartyUnit.fullId,
                dischargeQuantity
            );
            if (result.status === 200) {
                showNotification('success', result.message || `Успешно прогнано ${dischargeQuantity} юнитов из отряда`);
                await loadPlayerData(true);
                setShowDischargeModal(false);
                setSelectedPartyUnit(null);
                setDischargeQuantity(1);
            } else {
                showNotification('error', result.message || 'Ошибка при прогоне юнитов');
            }
        } catch (error) {
            showNotification('error', 'Произошла ошибка при прогоне юнитов');
        } finally {
            setDischargeLoading(false);
        }
    };

    const handleStoreUnit = async () => {
        if (!selectedPartyUnit || !playerId || !hasGuildData || !guildId) return;
        setStoreLoading(true);
        try {
            const result = await settlementService.storeToGarrison(
                guildId,
                playerId,
                selectedPartyUnit.fullId,
                storeQuantity
            );
            if (result.status === 200) {
                showNotification('success', result.message || `Успешно сложено ${storeQuantity} юнитов в гарнизон`);
                await Promise.all([
                    settlement.fetchData?.(),
                    loadPlayerData(true)
                ]);
                setShowStoreModal(false);
                setSelectedPartyUnit(null);
                setStoreQuantity(1);
            } else {
                showNotification('error', result.message || 'Ошибка при сложении юнитов в гарнизон');
            }
        } catch (error) {
            showNotification('error', 'Произошла ошибка при сложении');
        } finally {
            setStoreLoading(false);
        }
    };

    // Рендер карточки юнита в гарнизоне
    const renderGarrisonUnitCard = (unitId, unitData) => {
        if (!unitData || typeof unitData !== 'object') return null;
        const amount = unitData.amount || 0;
        const originalName = unitData.name || `Юнит ${unitId}`;
        const { tier, nameWithoutTier } = extractTierFromName(originalName);
        const displayName = nameWithoutTier;
        const unitType = UNIT_NAME_TO_ID[nameWithoutTier] ? 'Доступен для найма' : 'Особый юнит';
        const canTake = remainingSlots > 0;

        return (
            <Col md={6} lg={4} key={unitId}>
                <Card className="fantasy-card mb-3">
                    <Card.Header className="fantasy-card-header d-flex justify-content-between align-items-center">
                        <h6 className="fantasy-text-gold mb-0">
                            {displayName}
                            {tier > 0 && <Badge bg="warning" className="ms-2">T{tier}</Badge>}
                        </h6>
                        <Badge bg="primary">{amount} шт.</Badge>
                    </Card.Header>
                    <Card.Body>
                        <div className="mb-2">
                            <small className="text-muted d-block">
                                <i className="fas fa-info-circle me-1"></i>
                                {unitType}
                            </small>
                        </div>
                        <div className="d-grid gap-2">
                            <Button 
                                variant={canTake ? "outline-primary" : "outline-secondary"} 
                                size="sm"
                                className="fantasy-btn"
                                onClick={() => handleOpenTakeModal({
                                    id: unitId,
                                    nameWithoutTier,
                                    originalName,
                                    tier,
                                    amount
                                })}
                                disabled={!canTake}
                            >
                                <i className="fas fa-user-plus me-2"></i>
                                {canTake ? 'Взять в отряд' : 'Нет места'}
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        );
    };

    // Рендер карточки для найма
    const renderHireUnitCard = (unit) => {
        if (!unit) return null;
        const isUnitAvailable = unit.cost <= currentEssence;
        const availableTiersList = checkAvailableTiers(unit.buildingTier);

        return (
            <Col md={6} lg={4} key={unit.id}>
                <Card className="fantasy-card mb-3">
                    <Card.Header className="fantasy-card-header d-flex justify-content-between align-items-center">
                        <div>
                            <h6 className="fantasy-text-gold mb-0">{unit.name}</h6>
                        </div>
                        <div>
                            <Badge bg="info">T{unit.buildingTier}</Badge>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <div className="mb-3">
                            <small className="text-muted d-block mb-1">
                                <i className="fas fa-building me-1"></i>
                                {unit.buildingName}
                            </small>
                            <small className="text-muted d-block mb-1">
                                <i className="fas fa-clock me-1"></i>
                                Время найма: {unit.hireTime} мин.
                            </small>
                            <small className="text-muted d-block mb-1">
                                <i className="fas fa-gem me-1"></i>
                                Стоимость: <span className={isUnitAvailable ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                    {unit.cost} эссенции
                                </span>
                            </small>
                            <small className="text-muted d-block mb-1">
                                <i className="fas fa-star me-1"></i>
                                Опыт за найм: {unit.hireExp}
                            </small>
                            
                            <div className="mt-2">
                                <small className="text-muted d-block mb-1">
                                    <i className="fas fa-shield-alt me-1"></i>
                                    Доступные уровни оснащения:
                                </small>
                                <div className="d-flex gap-1 flex-wrap">
                                    {availableTiersList.map(tier => (
                                        <Badge 
                                            key={tier} 
                                            bg={tier === 0 ? "secondary" : smithLevel >= unit.buildingTier ? "warning" : "secondary"}
                                            className="p-2"
                                        >
                                            T{tier}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="d-grid gap-2">
                            <Button 
                                variant={isUnitAvailable ? "outline-success" : "outline-secondary"}
                                size="sm"
                                className="fantasy-btn"
                                onClick={() => handleOpenHireModal(unit)}
                                disabled={!isUnitAvailable}
                            >
                                <i className="fas fa-user-plus me-2"></i>
                                Нанять {unit.cost} <i className="fas fa-gem ms-1"></i>
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        );
    };

    // Подсчёты
    const totalUnits = useMemo(() => {
        return Object.values(garrisonData).reduce((sum, unit) => {
            if (!unit || typeof unit !== 'object') return sum;
            return sum + (unit.amount || 0);
        }, 0);
    }, [garrisonData]);

    const unitTypes = useMemo(() => {
        return Object.keys(garrisonData).filter(id => {
            const unit = garrisonData[id];
            if (!unit || typeof unit !== 'object') return false;
            return (unit.amount || 0) > 0;
        }).length;
    }, [garrisonData]);

    const hireCost = selectedHireUnit ? calculateHireCost(selectedHireUnit, selectedTier, hireQuantity) : { essence: 0, resources: {} };
    const resourceCheck = selectedHireUnit ? checkResourcesAvailability(hireCost) : { available: true };
    const canTakeSelectedUnits = quantity <= remainingSlots;

    // Если нет гильдии
    if (!hasGuildData) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <i className="fas fa-users fa-3x text-muted mb-3"></i>
                    <h5 className="fantasy-text-muted mb-3">Вы не состоите в гильдии</h5>
                    <p className="fantasy-text-muted mb-4">
                        Для управления гарнизоном необходимо быть членом гильдии
                    </p>
                </Card.Body>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Загрузка данных гарнизона...</p>
                </Card.Body>
            </Card>
        );
    }

    if (!settlementData) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h5>Данные поселения не загружены</h5>
                    <p className="text-muted">Попробуйте обновить страницу</p>
                </Card.Body>
            </Card>
        );
    }

    return (
        <div>
            {notification.show && (
                <Alert 
                    variant={notification.type === 'success' ? 'success' : 'danger'} 
                    className="position-fixed top-0 end-0 m-3" 
                    style={{ zIndex: 9999 }}
                    dismissible
                    onClose={() => setNotification({ show: false, type: '', message: '' })}
                >
                    {notification.message}
                </Alert>
            )}

            {/* Блок с информацией об отряде */}
            <Card className="fantasy-card mb-4">
                <Card.Header className="fantasy-card-header fantasy-card-header-info">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="fantasy-text-gold mb-0">
                                <i className="fas fa-users me-2"></i>
                                Спутники
                            </h5>
                            <div className="fantasy-text-gold mt-1">
                                Размер отряда: <Badge bg={remainingSlots > 0 ? "success" : "danger"}>
                                    {currentPartyCount}/{maxPartySize}
                                </Badge>
                                {remainingSlots > 0 && (
                                    <span className="ms-2 text-success">
                                        <small>(Свободно: {remainingSlots})</small>
                                    </span>
                                )}
                                <br />
                                <small className="fantasy-text-gold">
                                    Вес отряда: {currentPartyWeight}
                                </small>
                            </div>
                        </div>
                        <div>
                            <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={refreshAllData}
                                disabled={loadingPlayer}
                                className="me-2"
                            >
                                {loadingPlayer ? (
                                    <Spinner animation="border" size="sm" />
                                ) : (
                                    <>
                                        <i className="fas fa-sync me-1"></i>
                                        Обновить
                                    </>
                                )}
                            </Button>
                            <Button 
                                variant="outline-info" 
                                size="sm"
                                onClick={() => {
                                    console.log('=== DEBUG INFO ===');
                                    console.log('currentPartyCount:', currentPartyCount);
                                    console.log('maxPartySize:', maxPartySize);
                                    console.log('remainingSlots:', remainingSlots);
                                    console.log('partyList:', partyList);
                                    console.log('playerData:', playerData);
                                    console.log('==================');
                                    showNotification('info', 'Отладочная информация в консоли');
                                }}
                                title="Показать отладочную информацию"
                            >
                                <i className="fas fa-bug"></i>
                            </Button>
                        </div>
                    </div>
                </Card.Header>
                
                <Card.Body className="pt-0">                    
                    {/* Список спутников */}
                    {partyList && partyList.length > 0 ? (
                        <div className="party-list">
                            {partyList.map((pet, index) => (
                                <div key={pet.id || index} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                                    <div>
                                        <span className="fantasy-text-dark">{pet.name}: {pet.amount}</span>
                                        <small className="text-muted ms-2">(вес: {pet.weightPerUnit} ед.)</small>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Button 
                                            variant="outline-danger"
                                            onClick={() => handleOpenDischargeModal(pet)}
                                            disabled={loadingPlayer || !playerId}
                                            title="Прогнать из отряда (безвозвратно)"
                                        >
                                            <i className="fas fa-user-minus me-1"></i> Прогнать
                                        </Button>
                                        <Button 
                                            variant="outline-warning"
                                            onClick={() => handleOpenStoreModal(pet)}
                                            disabled={loadingPlayer || !playerId}
                                            title="Сложить в гарнизон поселения"
                                        >
                                            <i className="fas fa-box me-1"></i> Сложить
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Alert variant="info" className="mb-0">
                            <i className="fas fa-info-circle me-2"></i>
                            {playerData ? 'Ваш отряд пуст. Возьмите юнитов из гарнизона во вкладке "Гарнизон".' : 'Данные игрока не загружены.'}
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            {/* Основной блок управления юнитами */}
            <Card className="fantasy-card mb-4">
                <Card.Header className="fantasy-card-header fantasy-card-header-info">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="fantasy-text-gold mb-0">
                                <i className="fas fa-shield-alt me-2"></i>
                                Управление юнитами
                            </h5>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className="mb-4 fantasy-tabs"
                    >
                        <Tab eventKey="garrison" title={
                            <span>
                                <i className="fas fa-users me-1"></i>
                                Гарнизон
                                {totalUnits > 0 && <Badge bg="primary" className="ms-2">{totalUnits}</Badge>}
                            </span>
                        }>
                            <div className="mt-4">
                                <div className="mb-4">
                                    <Row>
                                        <Col md={3}>
                                            <Card className="fantasy-card h-100">
                                                <Card.Body className="text-center">
                                                    <div className="fantasy-text-dark fs-4 fw-bold">{totalUnits}</div>
                                                    <div className="fantasy-text-muted">Всего юнитов</div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="fantasy-card h-100">
                                                <Card.Body className="text-center">
                                                    <div className="fantasy-text-dark fs-4 fw-bold">{unitTypes}</div>
                                                    <div className="fantasy-text-muted">Разных типов</div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="fantasy-card h-100">
                                                <Card.Body className="text-center">
                                                    <div className="fantasy-text-dark fs-4 fw-bold">{availableUnits.length}</div>
                                                    <div className="fantasy-text-muted">Доступно для найма</div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="fantasy-card h-100">
                                                <Card.Body className="text-center">
                                                    <div className="fantasy-text-dark fs-4 fw-bold">{remainingSlots}</div>
                                                    <div className="fantasy-text-muted">Свободно в отряде</div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </div>

                                {unitTypes > 0 ? (
                                    <Row>
                                        {Object.entries(garrisonData).map(([unitId, unitData]) => 
                                            renderGarrisonUnitCard(unitId, unitData)
                                        )}
                                    </Row>
                                ) : (
                                    <Alert variant="info">
                                        <i className="fas fa-info-circle me-2"></i>
                                        Гарнизон пуст. Нанять юнитов можно во вкладке "Наем".
                                    </Alert>
                                )}
                            </div>
                        </Tab>
                        
                        <Tab eventKey="hire" title={
                            <span>
                                <i className="fas fa-user-plus me-1"></i>
                                Наем юнитов
                                {availableUnits.length > 0 && <Badge bg="success" className="ms-2">{availableUnits.length}</Badge>}
                            </span>
                        }>
                            <div className="mt-4">
                                <Alert variant="info" className="mb-4">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Здесь можно нанимать юнитов из построенных зданий. 
                                    <strong> Уровни оснащения (T1-T3) доступны только если уровень кузницы ({smithLevel}) ≥ уровню здания.</strong>
                                    <div className="mt-2">
                                        <i className="fas fa-users me-1"></i>
                                        <strong>Место в отряде:</strong> {currentPartyCount}/{maxPartySize} (свободно: {remainingSlots})
                                    </div>
                                </Alert>

                                <Row className="mb-4">
                                    <Col md={3}>
                                        <Card className="fantasy-card h-100">
                                            <Card.Body className="text-center">
                                                <div className="fantasy-text-dark fs-4 fw-bold">{availableUnits.length}</div>
                                                <div className="fantasy-text-muted">Доступных зданий</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="fantasy-card h-100">
                                            <Card.Body className="text-center">
                                                <div className="fantasy-text-dark fs-4 fw-bold">{smithLevel}</div>
                                                <div className="fantasy-text-muted">Уровень кузницы</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="fantasy-card h-100">
                                            <Card.Body className="text-center">
                                                <div className="fantasy-text-dark fs-4 fw-bold">
                                                    {currentEssence}
                                                    <i className="fas fa-gem ms-1" style={{ fontSize: '0.8em' }}></i>
                                                </div>
                                                <div className="fantasy-text-muted">Ваша эссенция</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="fantasy-card h-100">
                                            <Card.Body className="text-center">
                                                <div className="fantasy-text-dark fs-4 fw-bold">
                                                    {remainingSlots}
                                                </div>
                                                <div className="fantasy-text-muted">Свободных мест</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                {availableUnits.length > 0 ? (
                                    <Row>
                                        {availableUnits.map(unit => renderHireUnitCard(unit))}
                                    </Row>
                                ) : (
                                    <Alert variant="warning">
                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                        Нет доступных зданий для найма юнитов. Постройте соответствующие здания во вкладке "Здания".
                                    </Alert>
                                )}
                            </div>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>

            {/* Модальные окна (без изменений) */}
            <Modal show={showTakeModal} onHide={() => setShowTakeModal(false)} backdrop="static" centered className="fantasy-modal mass-operation-modal">
                <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-primary">
                    <Modal.Title className="d-flex align-items-center fantasy-text-gold">
                        <i className="fas fa-user-plus me-2"></i>
                        Взять юнитов в отряд
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedUnit && (
                        <>
                            <div className="mb-4">
                                <h6 className="fantasy-text-gold">
                                    <i className="fas fa-user me-2"></i>
                                    {selectedUnit.originalName || selectedUnit.name}
                                    {selectedUnit.tier > 0 && <Badge bg="warning" className="ms-2">T{selectedUnit.tier}</Badge>}
                                </h6>
                                <div className="mass-modal-alert alert alert-info">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Юниты будут добавлены в ваш отряд и доступны для использования в боях.
                                    <br /><small>Доступно: {selectedUnit.amount} шт.</small>
                                </div>
                            </div>

                            <div className="item-quantity-row mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="item-name-mass">Количество для взятия</span>
                                    <span className="item-available">доступно: {selectedUnit.amount} шт</span>
                                </div>

                                <div className="d-flex flex-column gap-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="mass-quantity-label">Прямой ввод:</span>
                                        <div className="d-flex align-items-center gap-2">
                                            <Button variant="outline-secondary" size="sm" onClick={() => setQuantity(1)} disabled={quantity <= 1} className="mass-quantity-btn" title="Установить минимум">Мин</Button>
                                            <InputGroup size="sm" style={{ width: '120px' }}>
                                                <Button variant="outline-secondary" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>-</Button>
                                                <Form.Control type="number" min="1" max={selectedUnit.amount} value={quantity} onChange={(e) => { const val = parseInt(e.target.value) || 1; setQuantity(Math.min(Math.max(1, val), selectedUnit.amount)); }} className="text-center" />
                                                <Button variant="outline-secondary" onClick={() => setQuantity(Math.min(selectedUnit.amount, quantity + 1))} disabled={quantity >= selectedUnit.amount}>+</Button>
                                            </InputGroup>
                                            <Button variant="outline-secondary" size="sm" onClick={() => setQuantity(selectedUnit.amount)} disabled={quantity >= selectedUnit.amount} className="mass-quantity-btn" title="Установить максимум">Макс</Button>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-3">
                                        <span className="mass-quantity-label">Быстрый выбор:</span>
                                        <div className="d-flex gap-1">
                                            {[1,5,10,25,50].map(num => (
                                                <Button key={num} variant="outline-success" size="sm" onClick={() => setQuantity(Math.min(num, selectedUnit.amount))} className="mass-quantity-btn" active={quantity === Math.min(num, selectedUnit.amount)}>{num}</Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <div className="d-flex justify-content-between small text-muted">
                                        <span>0</span>
                                        <span>Берется: {quantity} из {selectedUnit.amount}</span>
                                        <span>{selectedUnit.amount}</span>
                                    </div>
                                    <div className="progress" style={{ height: '5px' }}>
                                        <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${(quantity / selectedUnit.amount) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mass-total-info p-3">
                                <div className="row text-center">
                                    <div className="col-6">
                                        <div className="mb-2">
                                            <div className="mass-total-label">Будет занято мест:</div>
                                            <div className="mass-total-value">
                                                {quantity} / {currentPartyCount + quantity}
                                                <span className="ms-2 text-muted">(макс: {maxPartySize})</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="mb-2">
                                            <div className="mass-total-label">Будет взято:</div>
                                            <div className="mass-total-value">{quantity} юнит(ов)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!canTakeSelectedUnits && (
                                <Alert variant="danger" className="mt-3">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    Недостаточно места в отряде! Требуется: {quantity} мест, доступно: {remainingSlots}
                                </Alert>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between">
                    <Button variant="secondary" onClick={() => setShowTakeModal(false)} className="mass-cancel-btn">Отмена</Button>
                    <Button variant="primary" onClick={handleTakeUnit} disabled={!selectedUnit || !canTakeSelectedUnits} className="mass-submit-btn mass-submit-gold">
                        <i className="fas fa-user-plus me-2"></i>
                        Взять {quantity} юнит(ов) в отряд
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showHireModal} onHide={() => setShowHireModal(false)} backdrop="static" centered className="fantasy-modal mass-operation-modal" size="lg">
                <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-success">
                    <Modal.Title className="d-flex align-items-center fantasy-text-gold">
                        <i className="fas fa-user-plus me-2"></i>
                        Наем юнитов
                        {selectedHireUnit && <Badge bg="info" className="ms-2">ID: {selectedHireUnit.unitId}</Badge>}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedHireUnit && (
                        <>
                            <div className="mb-4">
                                <h6 className="fantasy-text-gold">
                                    <i className="fas fa-user me-2"></i>
                                    {selectedHireUnit.name}
                                </h6>
                                <div className="mass-modal-alert alert alert-info">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Юнит будет добавлен в очередь найма после подтверждения.
                                    <div className="mt-2">
                                        <small>
                                            <strong>Вес за штуку:</strong> <Badge bg="info">{getUnitWeight(selectedHireUnit.unitId)}</Badge>
                                            <br/><strong>Уровень кузницы:</strong> {smithLevel}
                                            <br/><strong>Уровень здания:</strong> {selectedHireUnit.buildingTier}
                                            {smithLevel >= selectedHireUnit.buildingTier ? 
                                                <Badge bg="success" className="ms-2">Доступны улучшения T1-T3</Badge> :
                                                <Badge bg="warning" className="ms-2">Только T0 (нужна кузница уровня {selectedHireUnit.buildingTier} для улучшений)</Badge>
                                            }
                                        </small>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h6 className="fantasy-text-dark mb-3">
                                    <i className="fas fa-shield-alt me-2"></i>
                                    Уровень оснащения:
                                </h6>
                                <div className="d-flex flex-wrap gap-2">
                                    {checkAvailableTiers(selectedHireUnit.buildingTier).map(tier => {
                                        const isAvailable = tier === 0 || smithLevel >= selectedHireUnit.buildingTier;
                                        return (
                                            <Button key={tier} variant={selectedTier === tier ? "primary" : "outline-primary"} onClick={() => isAvailable && setSelectedTier(tier)} disabled={!isAvailable || hireLoading} className="tier-btn">
                                                <div className="d-flex flex-column align-items-center">
                                                    <span className="fw-bold">T{tier}</span>
                                                    <small className="opacity-75">{tier === 0 ? 'Базовая' : tier === 1 ? '+ Кожа' : tier === 2 ? '+ Кожа, Руда' : '+ Кожа, Сталь'}</small>
                                                </div>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="item-quantity-row mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="item-name-mass">Количество для найма</span>
                                    <span className="item-available">здание: {selectedHireUnit.buildingName} (ур. {selectedHireUnit.level})</span>
                                </div>

                                <div className="d-flex flex-column gap-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="mass-quantity-label">Прямой ввод:</span>
                                        <div className="d-flex align-items-center gap-2">
                                            <Button variant="outline-secondary" size="sm" onClick={() => setHireQuantity(1)} disabled={hireQuantity <= 1 || hireLoading} className="mass-quantity-btn" title="Установить минимум">Мин</Button>
                                            <InputGroup size="sm" style={{ width: '120px' }}>
                                                <Button variant="outline-secondary" onClick={() => setHireQuantity(Math.max(1, hireQuantity - 1))} disabled={hireQuantity <= 1 || hireLoading}>-</Button>
                                                <Form.Control type="number" min="1" max={100} value={hireQuantity} onChange={(e) => { const val = parseInt(e.target.value) || 1; setHireQuantity(Math.min(Math.max(1, val), 100)); }} className="text-center" disabled={hireLoading} />
                                                <Button variant="outline-secondary" onClick={() => setHireQuantity(Math.min(100, hireQuantity + 1))} disabled={hireQuantity >= 100 || hireLoading}>+</Button>
                                            </InputGroup>
                                            <Button variant="outline-secondary" size="sm" onClick={() => setHireQuantity(100)} disabled={hireQuantity >= 100 || hireLoading} className="mass-quantity-btn" title="Установить максимум">Макс</Button>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-3">
                                        <span className="mass-quantity-label">Быстрый выбор:</span>
                                        <div className="d-flex gap-1">
                                            {[1,5,10,25,50,100].map(num => (
                                                <Button key={num} variant="outline-success" size="sm" onClick={() => setHireQuantity(Math.min(num, 100))} disabled={hireLoading} className="mass-quantity-btn" active={hireQuantity === Math.min(num, 100)}>{num}</Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <div className="d-flex justify-content-between small text-muted">
                                        <span>0</span>
                                        <span>Нанимается: {hireQuantity} из 100</span>
                                        <span>100</span>
                                    </div>
                                    <div className="progress" style={{ height: '5px' }}>
                                        <div className="progress-bar bg-success" role="progressbar" style={{ width: `${(hireQuantity / 100) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mass-total-info p-3">
                                <div className="row text-center">
                                    <div className="col-6">
                                        <div className="mb-2">
                                            <div className="mass-total-label">Общая стоимость:</div>
                                            <div className="mass-total-value">{hireCost.essence}<i className="fas fa-gem ms-1" style={{ fontSize: '0.8em' }}></i></div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="mb-2">
                                            <div className="mass-total-label">Общее время:</div>
                                            <div className="mass-total-value">{selectedHireUnit.hireTime * hireQuantity} мин</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {Object.keys(hireCost.resources).length > 0 && (
                                <Alert variant="warning" className="mt-3">
                                    <i className="fas fa-boxes me-2"></i>
                                    <strong>Дополнительные ресурсы для T{selectedTier}:</strong>
                                    <div className="mt-2">
                                        {Object.entries(hireCost.resources).map(([resourceCode, amount]) => {
                                            const resourceKey = String(resourceCode);
                                            const resourceName = RESOURCE_NAMES[resourceKey] || `Ресурс ${resourceKey}`;
                                            const currentAmount = currentResources[resourceKey] || 0;
                                            const hasEnough = currentAmount >= amount;
                                            return (
                                                <div key={resourceKey} className="d-flex justify-content-between mb-1">
                                                    <span className={hasEnough ? 'text-dark' : 'text-danger'}>{resourceName}:</span>
                                                    <div>
                                                        <Badge bg={hasEnough ? "secondary" : "danger"}>{amount} шт</Badge>
                                                        <small className="ms-2 text-muted">(есть: {currentAmount})</small>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <small className="text-muted d-block mt-2">
                                            <i className="fas fa-info-circle me-1"></i>
                                            Ресурсы умножаются на уровень здания ({selectedHireUnit.buildingTier}) и количество ({hireQuantity})
                                        </small>
                                    </div>
                                </Alert>
                            )}

                            {!resourceCheck.available && (
                                <Alert variant="danger" className="mt-3">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    {resourceCheck.missing === 'essence' ? 
                                        `Недостаточно эссенции. Не хватает: ${resourceCheck.amount}` :
                                        `Недостаточно ресурса ${RESOURCE_NAMES[resourceCheck.resourceCode] || `#${resourceCheck.resourceCode}`}. Не хватает: ${resourceCheck.amount}`
                                    }
                                </Alert>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between">
                    <Button variant="secondary" onClick={() => setShowHireModal(false)} disabled={hireLoading} className="mass-cancel-btn">Отмена</Button>
                    <Button variant="success" onClick={handleHireUnit} disabled={hireLoading || !resourceCheck.available} className="mass-submit-btn mass-submit-gold">
                        {hireLoading ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Наем...</>
                        ) : (
                            <><i className="fas fa-user-plus me-2"></i>Нанять {hireQuantity} юнит(ов) T{selectedTier}</>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDischargeModal} onHide={() => setShowDischargeModal(false)} backdrop="static" centered className="fantasy-modal mass-operation-modal">
                <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-danger">
                    <Modal.Title className="d-flex align-items-center fantasy-text-gold">
                        <i className="fas fa-user-minus me-2"></i>
                        Прогнать юнитов из отряда
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPartyUnit && (
                        <>
                            <div className="mb-4">
                                <h6 className="fantasy-text-gold">
                                    <i className="fas fa-user me-2"></i>
                                    {selectedPartyUnit.name}
                                </h6>
                                <div className="mass-modal-alert alert alert-warning">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    Юниты будут удалены из вашего отряда безвозвратно!
                                    <br /><small>Вес за штуку: <Badge bg="info">{selectedPartyUnit.weightPerUnit}</Badge></small>
                                </div>
                            </div>

                            <div className="item-quantity-row mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="item-name-mass">Количество для прогона</span>
                                    <span className="item-available">доступно: {selectedPartyUnit.amount} шт</span>
                                </div>

                                <div className="d-flex flex-column gap-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="mass-quantity-label">Прямой ввод:</span>
                                        <div className="d-flex align-items-center gap-2">
                                            <Button variant="outline-secondary" size="sm" onClick={() => setDischargeQuantity(1)} disabled={dischargeQuantity <= 1 || dischargeLoading} className="mass-quantity-btn" title="Установить минимум">Мин</Button>
                                            <InputGroup size="sm" style={{ width: '120px' }}>
                                                <Button variant="outline-secondary" onClick={() => setDischargeQuantity(Math.max(1, dischargeQuantity - 1))} disabled={dischargeQuantity <= 1 || dischargeLoading}>-</Button>
                                                <Form.Control type="number" min="1" max={selectedPartyUnit.amount} value={dischargeQuantity} onChange={(e) => { const val = parseInt(e.target.value) || 1; setDischargeQuantity(Math.min(Math.max(1, val), selectedPartyUnit.amount)); }} className="text-center" disabled={dischargeLoading} />
                                                <Button variant="outline-secondary" onClick={() => setDischargeQuantity(Math.min(selectedPartyUnit.amount, dischargeQuantity + 1))} disabled={dischargeQuantity >= selectedPartyUnit.amount || dischargeLoading}>+</Button>
                                            </InputGroup>
                                            <Button variant="outline-secondary" size="sm" onClick={() => setDischargeQuantity(selectedPartyUnit.amount)} disabled={dischargeQuantity >= selectedPartyUnit.amount || dischargeLoading} className="mass-quantity-btn" title="Установить максимум">Макс</Button>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-3">
                                        <span className="mass-quantity-label">Быстрый выбор:</span>
                                        <div className="d-flex gap-1">
                                            {[1,5,10,25,50].map(num => (
                                                <Button key={num} variant="outline-danger" size="sm" onClick={() => setDischargeQuantity(Math.min(num, selectedPartyUnit.amount))} disabled={dischargeLoading} className="mass-quantity-btn" active={dischargeQuantity === Math.min(num, selectedPartyUnit.amount)}>{num}</Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <div className="d-flex justify-content-between small text-muted">
                                        <span>0</span>
                                        <span>Прогоняется: {dischargeQuantity} из {selectedPartyUnit.amount}</span>
                                        <span>{selectedPartyUnit.amount}</span>
                                    </div>
                                    <div className="progress" style={{ height: '5px' }}>
                                        <div className="progress-bar bg-danger" role="progressbar" style={{ width: `${(dischargeQuantity / selectedPartyUnit.amount) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mass-total-info p-3">
                                <div className="row text-center">
                                    <div className="col-6">
                                        <div className="mb-2">
                                            <div className="mass-total-label">Освободится мест:</div>
                                            <div className="mass-total-value">{dischargeQuantity}</div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="mb-2">
                                            <div className="mass-total-label">Будет прогнано:</div>
                                            <div className="mass-total-value">{dischargeQuantity} юнит(ов)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Alert variant="danger" className="mt-3">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                <strong>Внимание!</strong> Это действие нельзя отменить. Юниты будут удалены навсегда.
                            </Alert>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between">
                    <Button variant="secondary" onClick={() => setShowDischargeModal(false)} disabled={dischargeLoading} className="mass-cancel-btn">Отмена</Button>
                    <Button variant="danger" onClick={handleDischargeUnit} disabled={dischargeLoading} className="mass-submit-btn">
                        {dischargeLoading ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Прогон...</>
                        ) : (
                            <><i className="fas fa-user-minus me-2"></i>Прогнать {dischargeQuantity} юнит(ов)</>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showStoreModal} onHide={() => setShowStoreModal(false)} backdrop="static" centered className="fantasy-modal mass-operation-modal">
                <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-warning">
                    <Modal.Title className="d-flex align-items-center fantasy-text-gold">
                        <i className="fas fa-box me-2"></i>
                        Сложить юнитов в гарнизон
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPartyUnit && (
                        <>
                            <div className="mb-4">
                                <h6 className="fantasy-text-gold">
                                    <i className="fas fa-user me-2"></i>
                                    {selectedPartyUnit.name}
                                </h6>
                                <div className="mass-modal-alert alert alert-info">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Юниты будут перемещены из вашего отряда в гарнизон поселения.
                                    <br /><small>Вес за штуку: <Badge bg="info">{selectedPartyUnit.weightPerUnit}</Badge></small>
                                </div>
                            </div>

                            <div className="item-quantity-row mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="item-name-mass">Количество для сложения</span>
                                    <span className="item-available">доступно: {selectedPartyUnit.amount} шт</span>
                                </div>

                                <div className="d-flex flex-column gap-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="mass-quantity-label">Прямой ввод:</span>
                                        <div className="d-flex align-items-center gap-2">
                                            <Button variant="outline-secondary" size="sm" onClick={() => setStoreQuantity(1)} disabled={storeQuantity <= 1 || storeLoading} className="mass-quantity-btn" title="Установить минимум">Мин</Button>
                                            <InputGroup size="sm" style={{ width: '120px' }}>
                                                <Button variant="outline-secondary" onClick={() => setStoreQuantity(Math.max(1, storeQuantity - 1))} disabled={storeQuantity <= 1 || storeLoading}>-</Button>
                                                <Form.Control type="number" min="1" max={selectedPartyUnit.amount} value={storeQuantity} onChange={(e) => { const val = parseInt(e.target.value) || 1; setStoreQuantity(Math.min(Math.max(1, val), selectedPartyUnit.amount)); }} className="text-center" disabled={storeLoading} />
                                                <Button variant="outline-secondary" onClick={() => setStoreQuantity(Math.min(selectedPartyUnit.amount, storeQuantity + 1))} disabled={storeQuantity >= selectedPartyUnit.amount || storeLoading}>+</Button>
                                            </InputGroup>
                                            <Button variant="outline-secondary" size="sm" onClick={() => setStoreQuantity(selectedPartyUnit.amount)} disabled={storeQuantity >= selectedPartyUnit.amount || storeLoading} className="mass-quantity-btn" title="Установить максимум">Макс</Button>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-3">
                                        <span className="mass-quantity-label">Быстрый выбор:</span>
                                        <div className="d-flex gap-1">
                                            {[1,5,10,25,50].map(num => (
                                                <Button key={num} variant="outline-warning" size="sm" onClick={() => setStoreQuantity(Math.min(num, selectedPartyUnit.amount))} disabled={storeLoading} className="mass-quantity-btn" active={storeQuantity === Math.min(num, selectedPartyUnit.amount)}>{num}</Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <div className="d-flex justify-content-between small text-muted">
                                        <span>0</span>
                                        <span>Складывается: {storeQuantity} из {selectedPartyUnit.amount}</span>
                                        <span>{selectedPartyUnit.amount}</span>
                                    </div>
                                    <div className="progress" style={{ height: '5px' }}>
                                        <div className="progress-bar bg-warning" role="progressbar" style={{ width: `${(storeQuantity / selectedPartyUnit.amount) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mass-total-info p-3">
                                <div className="row text-center">
                                    <div className="col-6">
                                        <div className="mb-2">
                                            <div className="mass-total-label">Освободится мест:</div>
                                            <div className="mass-total-value">{storeQuantity}</div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="mb-2">
                                            <div className="mass-total-label">Будет сложено:</div>
                                            <div className="mass-total-value">{storeQuantity} юнит(ов)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Alert variant="info" className="mt-3">
                                <i className="fas fa-info-circle me-2"></i>
                                Юниты будут доступны в гарнизоне поселения для взятия другими игроками или вами позже.
                            </Alert>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between">
                    <Button variant="secondary" onClick={() => setShowStoreModal(false)} disabled={storeLoading} className="mass-cancel-btn">Отмена</Button>
                    <Button variant="warning" onClick={handleStoreUnit} disabled={storeLoading} className="mass-submit-btn">
                        {storeLoading ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Складывание...</>
                        ) : (
                            <><i className="fas fa-box me-2"></i>Сложить {storeQuantity} юнит(ов)</>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
});

export default SettlementGarrison;