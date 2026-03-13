import React, { useContext, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Tab, Nav } from 'react-bootstrap';
import { observer } from "mobx-react-lite";
import { Context } from "../../index";
import SettlementOverview from './SettlementOverview';
import SettlementBuildings from './SettlementBuildings';
import SettlementGarrison from './SettlementGarrison';
import SettlementHeroes from './SettlementHeroes';
import SettlementMissions from './SettlementMissions';
import SettlementStorage from './SettlementStorage';
import SettlementRituals from './SettlementRituals';
import SettlementConstructionModal from '../modals/SettlementConstructionModal';
import SettlementHireModal from '../modals/SettlementHireModal';
import './SettlementComponent.css';

const SettlementComponent = observer(() => {
    const { guild, settlement } = useContext(Context);
    const [isLoading, setIsLoading] = useState(true);
    const [settlementData, setSettlementData] = useState(null);
    const [error, setError] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [requestAttempted, setRequestAttempted] = useState(false);

    // Функция загрузки данных поселения
    const loadSettlementData = async () => {
        // Проверяем, что данные гильдии загружены и есть id (даже 0)
        if (!guild.guildData) {
            console.log('⏳ loadSettlementData: guild.guildData отсутствует, ждём...');
            return; // не вызываем ошибку, просто выходим
        }
        
        // Проверяем, что id присутствует (может быть 0)
        if (guild.guildData.id === undefined || guild.guildData.id === null) {
            console.error('❌ loadSettlementData: guild.guildData.id отсутствует');
            setError('ID гильдии не найден');
            setIsLoading(false);
            return;
        }

        console.log(`🚀 loadSettlementData: начинаем загрузку для guildId = ${guild.guildData.id} (тип: ${typeof guild.guildData.id})`);
        setIsLoading(true);
        setError(null);
        setRequestAttempted(true);
        
        try {
            console.log('🔄 Вызов settlement.fetchSettlementData...');
            await settlement.fetchSettlementData(guild.guildData.id);
            
            console.log('✅ После fetch, settlement.settlementData =', settlement.settlementData);
            
            if (settlement.settlementData) {
                console.log('📊 Данные поселения получены:', settlement.settlementData);
                setSettlementData(settlement.settlementData);
            } else {
                console.log('⚠️ Данные поселения отсутствуют (null или undefined)');
                setSettlementData(null);
            }
            setIsInitialLoad(false);
        } catch (err) {
            console.error('❌ Ошибка при загрузке поселения:', err);
            setError('Не удалось загрузить данные поселения. Пожалуйста, попробуйте обновить страницу.');
        } finally {
            setIsLoading(false);
        }
    };

    // Автоматическая загрузка при изменении данных гильдии
    useEffect(() => {
        console.log('🔍 useEffect: проверка условий для загрузки');
        console.log('  - guild.hasGuild:', guild.hasGuild);
        console.log('  - guild.guildData?.id:', guild.guildData?.id);
        console.log('  - isInitialLoad:', isInitialLoad);
        console.log('  - isLoading:', isLoading);
        console.log('  - requestAttempted:', requestAttempted);

        // Если гильдия есть, ID существует (даже 0), и ещё не было попытки загрузить
        if (guild.hasGuild && 
            guild.guildData?.id !== undefined && 
            guild.guildData?.id !== null && 
            !requestAttempted) {
            console.log('🚀 Условия выполнены, запускаем loadSettlementData()');
            loadSettlementData();
        } else if (!guild.hasGuild && !guild.loading && guild.isInitialized) {
            console.log('ℹ️ Гильдии нет, не загружаем поселение');
            setIsLoading(false);
            setIsInitialLoad(false);
        }
    }, [guild.hasGuild, guild.guildData?.id, guild.loading, guild.isInitialized, requestAttempted]);

    // Слушаем изменения в сторе поселения
    useEffect(() => {
        if (settlement.settlementData !== settlementData) {
            console.log('📥 Обновление settlementData из стора:', settlement.settlementData);
            setSettlementData(settlement.settlementData);
        }
    }, [settlement.settlementData]);

    // Обработчик ручного обновления
    const handleRefresh = () => {
        console.log('🔄 Ручное обновление данных поселения');
        setRequestAttempted(false); // сбрасываем флаг, чтобы разрешить повторную загрузку
        setIsInitialLoad(true);
        loadSettlementData();
    };

    // Отладка: выводим состояние при каждом изменении
    useEffect(() => {
        console.log('🔍 Состояние компонента:', {
            guildHasGuild: guild.hasGuild,
            guildId: guild.guildData?.id,
            guildLoading: guild.loading,
            guildInitialized: guild.isInitialized,
            isLoading,
            settlementData,
            error,
            isInitialLoad,
            requestAttempted,
            storeSettlementData: settlement.settlementData
        });
    }, [guild.hasGuild, guild.guildData?.id, guild.loading, guild.isInitialized, isLoading, settlementData, error, isInitialLoad, requestAttempted, settlement.settlementData]);

    // Если гильдия ещё загружается
    if (guild.loading) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 fantasy-text-muted">Загрузка данных гильдии...</p>
                </Card.Body>
            </Card>
        );
    }

    // Если загрузка гильдии завершена, но данных нет (игрок не в гильдии)
    if (!guild.hasGuild || !guild.guildData) {
        return (
            <Alert variant="warning" className="mt-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                У вас нет гильдии. Для управления поселением необходимо состоять в гильдии.
            </Alert>
        );
    }

    // Если данные гильдии есть, но id отсутствует (аварийная ситуация)
    if (guild.guildData.id === undefined || guild.guildData.id === null) {
        return (
            <Alert variant="danger" className="mt-3">
                <i className="fas fa-exclamation-circle me-2"></i>
                Ошибка: ID гильдии не определён.
            </Alert>
        );
    }

    // Показываем спиннер, если идёт первичная загрузка поселения
    if (isLoading && isInitialLoad) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 fantasy-text-muted">Загрузка данных поселения...</p>
                </Card.Body>
            </Card>
        );
    }

    // Если произошла ошибка и данных нет
    if (error && !settlementData) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <i className="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
                    <h5 className="fantasy-text-danger mb-3">Ошибка загрузки</h5>
                    <p className="fantasy-text-muted mb-4">{error}</p>
                    <button 
                        className="btn btn-primary fantasy-btn"
                        onClick={handleRefresh}
                    >
                        <i className="fas fa-sync me-2"></i>
                        Попробовать снова
                    </button>
                </Card.Body>
            </Card>
        );
    }

    // Если запрос был сделан, но данных нет (сервер вернул 404 или null)
    if (requestAttempted && !settlementData && !isLoading) {
        return (
            <Alert variant="info" className="mt-3">
                <i className="fas fa-info-circle me-2"></i>
                У вашей гильдии нет поселения. Вы можете создать его в разделе "Постройки".
            </Alert>
        );
    }

    // Если данные есть – отображаем их
    const currentSettlementData = settlementData || {
        level: 1,
        type: 'new_settlement',
        name: 'Новое поселение',
        buildings: {},
        garrison: {},
        storage: {}
    };

    return (
        <div className="settlement-container">
            <Tab.Container activeKey={settlement.activeTab} onSelect={(k) => settlement.setActiveTab(k)}>
                <Card className="fantasy-card">
                    <Card.Header className="fantasy-card-header">
                        <Nav variant="tabs" className="settlement-main-tabs">
                            <Nav.Item>
                                <Nav.Link eventKey="overview">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Обзор
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="storage">
                                    <i className="fas fa-warehouse me-2"></i>
                                    Склад
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="buildings">
                                    <i className="fas fa-building me-2"></i>
                                    Здания
                                    {currentSettlementData.buildings && Object.keys(currentSettlementData.buildings).length > 0 && (
                                        <span className="badge bg-warning ms-2">
                                            {Object.keys(currentSettlementData.buildings).length}
                                        </span>
                                    )}
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="garrison">
                                    <i className="fas fa-shield-alt me-2"></i>
                                    Гарнизон
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="heroes">
                                    <i className="fas fa-crown me-2"></i>
                                    Герои
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="missions">
                                    <i className="fas fa-scroll me-2"></i>
                                    Миссии
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="rituals">
                                    <i className="fas fa-magic me-2"></i>
                                    Ритуалы
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Tab.Content className="p-3">
                            <Tab.Pane eventKey="overview">
                                <SettlementOverview 
                                    settlementData={currentSettlementData}
                                    guildId={guild.guildData.id}
                                    onRefresh={handleRefresh}
                                    isLoading={isLoading}
                                />
                            </Tab.Pane>
                            <Tab.Pane eventKey="buildings">
                                <SettlementBuildings 
                                    buildings={currentSettlementData.buildings || {}}
                                    construction={currentSettlementData.construction || {}}
                                    settlementType={currentSettlementData.type}
                                    guildId={guild.guildData.id}
                                />
                            </Tab.Pane>
                            <Tab.Pane eventKey="garrison">
                                <SettlementGarrison 
                                    garrison={currentSettlementData.garrison || {}}
                                    guildId={guild.guildData.id}
                                />
                            </Tab.Pane>
                            <Tab.Pane eventKey="heroes">
                                <SettlementHeroes 
                                    heroes={currentSettlementData.heroes || {}}
                                    guildId={guild.guildData.id}
                                />
                            </Tab.Pane>
                            <Tab.Pane eventKey="missions">
                                <SettlementMissions 
                                    operations={currentSettlementData.operations || {}}
                                    guildId={guild.guildData.id}
                                />
                            </Tab.Pane>
                            <Tab.Pane eventKey="storage">
                                <SettlementStorage 
                                    storage={currentSettlementData.storage || {}}
                                    guildId={guild.guildData.id}
                                />
                            </Tab.Pane>
                            <Tab.Pane eventKey="rituals">
                                <SettlementRituals 
                                    buffs={currentSettlementData.buffs || {}}
                                    guildId={guild.guildData.id}
                                />
                            </Tab.Pane>
                        </Tab.Content>
                    </Card.Body>
                </Card>
            </Tab.Container>

            {settlement.modal.type === 'construction' && (
                <SettlementConstructionModal />
            )}
            {settlement.modal.type === 'hire' && (
                <SettlementHireModal />
            )}
        </div>
    );
});

export default SettlementComponent;