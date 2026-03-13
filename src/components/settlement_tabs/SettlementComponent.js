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

    // Функция загрузки данных поселения
    const loadSettlementData = async () => {
        // Явная проверка на отсутствие id (undefined или null), 0 считается валидным
        if (!guild.guildData || guild.guildData.id === undefined || guild.guildData.id === null) {
            setError('ID гильдии не найден');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            console.log('🔄 Загружаем данные поселения для гильдии ID:', guild.guildData.id);
            await settlement.fetchSettlementData(guild.guildData.id);
            
            if (settlement.settlementData) {
                console.log('✅ Данные поселения загружены:', settlement.settlementData);
                setSettlementData(settlement.settlementData);
            } else {
                console.log('⚠️ Данные поселения пустые');
                const baseSettlementData = {
                    level: 1,
                    type: 'new_settlement',
                    name: 'Новое поселение',
                    happiness: 50,
                    buildings: {},
                    garrison: {},
                    heroes: {},
                    operations: {},
                    storage: {},
                    buffs: {}
                };
                setSettlementData(baseSettlementData);
            }
            setIsInitialLoad(false);
        } catch (err) {
            console.error('❌ Ошибка загрузки данных поселения:', err);
            setError('Не удалось загрузить данные поселения. Пожалуйста, попробуйте обновить страницу.');
        } finally {
            setIsLoading(false);
        }
    };

    // Автоматическая загрузка данных при монтировании компонента
    useEffect(() => {
        console.log('🔍 Effect: Проверяем условия для загрузки данных поселения');
        console.log('  - guild.hasGuild:', guild.hasGuild);
        console.log('  - guild.guildData?.id:', guild.guildData?.id);
        console.log('  - isInitialLoad:', isInitialLoad);
        console.log('  - isLoading:', isLoading);
        
        // Явная проверка на существование id (даже если он равен 0)
        if (guild.hasGuild && 
            guild.guildData?.id !== undefined && 
            guild.guildData?.id !== null && 
            isInitialLoad) {
            console.log('🚀 Начинаем загрузку данных поселения...');
            loadSettlementData();
        }
    }, [guild.hasGuild, guild.guildData?.id, isInitialLoad]);

    // Также слушаем изменения в сторе поселения
    useEffect(() => {
        if (settlement.settlementData && settlement.settlementData !== settlementData) {
            console.log('📥 Данные изменились в сторе:', settlement.settlementData);
            setSettlementData(settlement.settlementData);
        }
    }, [settlement.settlementData]);

    // Обработчик для кнопки обновления
    const handleRefresh = () => {
        console.log('🔄 Ручное обновление данных поселения');
        loadSettlementData();
    };

    // Для отладки
    useEffect(() => {
        console.log('🔍 SettlementComponent состояние обновлено:');
        console.log('  - guild.hasGuild:', guild.hasGuild);
        console.log('  - guild.guildData?.id:', guild.guildData?.id);
        console.log('  - isLoading:', isLoading);
        console.log('  - settlementData:', settlementData);
        console.log('  - error:', error);
        console.log('  - settlement.settlementData:', settlement.settlementData);
    }, [guild.hasGuild, guild.guildData?.id, isLoading, settlementData, error, settlement.settlementData]);

    // Если данные гильдии еще загружаются
    if (!guild.hasGuild && !guild.guildData?.id) {
        console.log(guild.guildData.id)
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 fantasy-text-muted">Проверка наличия гильдии...</p>
                </Card.Body>
            </Card>
        );
    }

    // Если у пользователя нет гильдии
    if (!guild.hasGuild || !guild.guildData) {
        return (
            <Alert variant="warning" className="mt-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                У вас нет гильдии. Для управления поселением необходимо состоять в гильдии.
            </Alert>
        );
    }

    // Если это первоначальная загрузка
    if (isLoading && isInitialLoad && !settlementData) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 fantasy-text-muted">Загрузка данных поселения...</p>
                </Card.Body>
            </Card>
        );
    }

    // Если произошла ошибка
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

    // Используем данные из локального состояния или из стора
    const currentSettlementData = settlementData || settlement.settlementData || {
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

const getSettlementTypeName = (type) => {
    const typeMap = {
        'new_settlement': 'Новое поселение',
        'village': 'Деревня',
        'town': 'Городок',
        'city': 'Город',
        'fortress': 'Крепость',
        'capital': 'Столица',
        'outpost': 'Аванпост',
        'castle': 'Замок'
    };
    return typeMap[type] || type || 'Не указан';
};

export default SettlementComponent;