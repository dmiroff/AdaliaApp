import React, { useContext, useEffect, useState } from 'react';
import { Card, Spinner, Alert, Tab, Nav } from 'react-bootstrap';
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
    const [localSettlementData, setLocalSettlementData] = useState(null);
    const [localError, setLocalError] = useState(null);
    const [isLoadingSettlement, setIsLoadingSettlement] = useState(false);
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

    // Функция загрузки данных поселения
    const loadSettlementData = async () => {
        // Проверяем, что guildData существует и имеет id (даже 0)
        if (!guild.guildData || guild.guildData.id === undefined || guild.guildData.id === null) {
            setLocalError('ID гильдии не найден');
            setIsLoadingSettlement(false);
            return;
        }

        setIsLoadingSettlement(true);
        setLocalError(null);
        
        try {
            console.log('🔄 Загружаем данные поселения для гильдии ID:', guild.guildData.id);
            await settlement.fetchSettlementData(guild.guildData.id);
            
            // После вызова fetch смотрим, что в сторе
            if (settlement.settlementData) {
                console.log('✅ Данные поселения загружены в стор:', settlement.settlementData);
                setLocalSettlementData(settlement.settlementData);
            } else {
                console.log('⚠️ Данные поселения пустые (возможно, поселения нет)');
                // Если данных нет, оставляем null, чтобы показать заглушку или кнопку создания
                setLocalSettlementData(null);
            }
        } catch (err) {
            console.error('❌ Ошибка загрузки данных поселения:', err);
            setLocalError('Не удалось загрузить данные поселения. Пожалуйста, попробуйте обновить страницу.');
        } finally {
            setIsLoadingSettlement(false);
            setHasAttemptedLoad(true);
        }
    };

    // Эффект для запуска загрузки после того, как данные гильдии готовы
    useEffect(() => {
        console.log('🔍 Эффект проверки условий для загрузки поселения:');
        console.log('  - guild.loading:', guild.loading);
        console.log('  - guild.hasGuild:', guild.hasGuild);
        console.log('  - guild.guildData?.id:', guild.guildData?.id);
        console.log('  - hasAttemptedLoad:', hasAttemptedLoad);
        console.log('  - isLoadingSettlement:', isLoadingSettlement);

        // Ждём, пока закончится загрузка гильдии
        if (guild.loading) {
            return;
        }

        // Если гильдии нет, ничего не загружаем
        if (!guild.hasGuild) {
            setHasAttemptedLoad(true);
            return;
        }

        // Если гильдия есть, но ID отсутствует – ошибка
        if (guild.guildData?.id === undefined || guild.guildData?.id === null) {
            console.error('❌ guild.hasGuild = true, но guild.guildData.id отсутствует');
            setLocalError('Некорректные данные гильдии');
            setHasAttemptedLoad(true);
            return;
        }

        // Если ещё не пытались загрузить и не грузим сейчас – запускаем
        if (!hasAttemptedLoad && !isLoadingSettlement) {
            console.log('🚀 Запуск загрузки поселения');
            loadSettlementData();
        }
    }, [guild.loading, guild.hasGuild, guild.guildData?.id, hasAttemptedLoad, isLoadingSettlement]);

    // Синхронизация с изменениями в сторе (например, после ручного обновления)
    useEffect(() => {
        if (settlement.settlementData && settlement.settlementData !== localSettlementData) {
            console.log('📥 Данные изменились в сторе, обновляем локальное состояние');
            setLocalSettlementData(settlement.settlementData);
        }
    }, [settlement.settlementData]);

    // Обработчик ручного обновления
    const handleRefresh = () => {
        console.log('🔄 Ручное обновление данных поселения');
        setHasAttemptedLoad(false); // сбросим флаг, чтобы useEffect снова запустил загрузку
    };

    // Отладочный лог при любых изменениях
    useEffect(() => {
        console.log('📊 Состояние компонента:', {
            guildLoading: guild.loading,
            guildHasGuild: guild.hasGuild,
            guildId: guild.guildData?.id,
            hasAttemptedLoad,
            isLoadingSettlement,
            localSettlementData,
            localError,
            storeSettlementData: settlement.settlementData,
        });
    });

    // 1. Если гильдия ещё загружается – показываем спиннер
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

    // 2. Если после загрузки выяснилось, что у пользователя нет гильдии
    if (!guild.hasGuild) {
        return (
            <Alert variant="warning" className="mt-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                У вас нет гильдии. Для управления поселением необходимо состоять в гильдии.
            </Alert>
        );
    }

    // 3. Если гильдия есть, но нет ID (аварийный случай)
    if (guild.guildData?.id === undefined || guild.guildData?.id === null) {
        return (
            <Alert variant="danger" className="mt-3">
                <i className="fas fa-exclamation-circle me-2"></i>
                Ошибка: идентификатор гильдии не определён.
            </Alert>
        );
    }

    // 4. Если идёт загрузка поселения – показываем спиннер
    if (isLoadingSettlement) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 fantasy-text-muted">Загрузка данных поселения...</p>
                </Card.Body>
            </Card>
        );
    }

    // 5. Если произошла ошибка при загрузке поселения
    if (localError) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <i className="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
                    <h5 className="fantasy-text-danger mb-3">Ошибка загрузки</h5>
                    <p className="fantasy-text-muted mb-4">{localError}</p>
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

    // 6. Если поселение не найдено (settlementData === null) – показываем заглушку с кнопкой создания
    if (!localSettlementData && !settlement.settlementData) {
        return (
            <Card className="fantasy-card">
                <Card.Body className="text-center py-5">
                    <i className="fas fa-campground fa-3x text-muted mb-3"></i>
                    <h5 className="fantasy-text-muted mb-3">Поселение не создано</h5>
                    <p className="mb-4">У вашей гильдии пока нет поселения. Создайте его, чтобы начать развитие.</p>
                    <button 
                        className="btn btn-primary fantasy-btn"
                        onClick={() => {
                            // Здесь логика создания поселения
                            console.log('Создание поселения...');
                        }}
                    >
                        <i className="fas fa-plus me-2"></i>
                        Создать поселение
                    </button>
                </Card.Body>
            </Card>
        );
    }

    // 7. Данные есть – отображаем интерфейс
    const currentData = localSettlementData || settlement.settlementData;

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
                                    {currentData.buildings && Object.keys(currentData.buildings).length > 0 && (
                                        <span className="badge bg-warning ms-2">
                                            {Object.keys(currentData.buildings).length}
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
                                    settlementData={currentData}
                                    guildId={guild.guildData.id}
                                    onRefresh={handleRefresh}
                                    isLoading={isLoadingSettlement}
                                />
                            </Tab.Pane>
                            <Tab.Pane eventKey="buildings">
                                <SettlementBuildings 
                                    buildings={currentData.buildings || {}}
                                    construction={currentData.construction || {}}
                                    settlementType={currentData.type}
                                    guildId={guild.guildData.id}
                                />
                            </Tab.Pane>
                            <Tab.Pane eventKey="garrison">
                                <SettlementGarrison 
                                    garrison={currentData.garrison || {}}
                                    guildId={guild.guildData.id}
                                />
                            </Tab.Pane>
                            <Tab.Pane eventKey="heroes">
                                <SettlementHeroes 
                                    heroes={currentData.heroes || {}}
                                    guildId={guild.guildData.id}
                                />
                            </Tab.Pane>
                            <Tab.Pane eventKey="missions">
                                <SettlementMissions 
                                    operations={currentData.operations || {}}
                                    guildId={guild.guildData.id}
                                />
                            </Tab.Pane>
                            <Tab.Pane eventKey="storage">
                                <SettlementStorage 
                                    storage={currentData.storage || {}}
                                    guildId={guild.guildData.id}
                                />
                            </Tab.Pane>
                            <Tab.Pane eventKey="rituals">
                                <SettlementRituals 
                                    buffs={currentData.buffs || {}}
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