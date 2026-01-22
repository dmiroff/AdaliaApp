import React, { useContext, useState } from 'react';
import { Row, Col, Card, Badge, Button, Alert, Modal, Form } from 'react-bootstrap';
import { observer } from "mobx-react-lite";
import { Context } from "../../index";

const SettlementHeroes = observer(() => {
    const { settlement, guild } = useContext(Context);
    const [selectedHero, setSelectedHero] = useState(null);
    const [showHireModal, setShowHireModal] = useState(false);
    
    const heroes = settlement.heroes?.active_heroes || {};
    const buildings = settlement.buildings || {};
    const currentEssence = settlement.currentEssence;
    
    const userPermissions = guild.guildData?.leader === guild.user?.id || 
                          (guild.guildData?.officers || []).includes(guild.user?.id);
    
    const hasAltar = buildings.altar && buildings.altar.level > 0;
    const mainBuildingLevel = buildings.main_building?.level || 0;
    
    // Герои доступные для найма (заглушка - нужно из бэкенда)
    const availableHeroes = {
        "Герой 1": { essence: 100, level_required: 1, skills: ["Воин", "Лидер"] },
        "Герой 2": { essence: 200, level_required: 2, skills: ["Маг", "Исцеление"] },
        "Герой 3": { essence: 300, level_required: 3, skills: ["Лучник", "Скрытность"] }
    };
    
    const handleHireHero = (heroName) => {
        if (!userPermissions) {
            alert('Только лидер и офицеры могут призывать героев');
            return;
        }
        
        if (!hasAltar) {
            alert('Для призыва героев необходим алтарь');
            return;
        }
        
        const hero = availableHeroes[heroName];
        if (!hero) {
            alert('Герой не найден');
            return;
        }
        
        if (hero.level_required > mainBuildingLevel) {
            alert(`Для призыва этого героя необходим уровень главного здания ${hero.level_required}`);
            return;
        }
        
        if (hero.essence > currentEssence) {
            alert('Недостаточно эссенции в Сердце поселения');
            return;
        }
        
        // settlement.hireHero({ heroName, guildId: guild.guildData?.id, userId: guild.user?.id });
        setShowHireModal(false);
        setSelectedHero(null);
    };
    
    const renderHeroCard = (heroName, heroData) => {
        return (
            <Col md={6} lg={4} key={heroName}>
                <Card className="fantasy-card mb-3">
                    <Card.Header className="fantasy-card-header fantasy-card-header-primary">
                        <div className="d-flex justify-content-between align-items-center">
                            <h6 className="fantasy-text-gold mb-0">{heroName}</h6>
                            <Badge bg="warning">Ур. {heroData.level_required}</Badge>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <div className="mb-3">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="fantasy-text-dark">Стоимость:</span>
                                <Badge bg="danger">{heroData.essence} воплощений</Badge>
                            </div>
                            
                            {heroData.skills && (
                                <div className="mb-3">
                                    <span className="fantasy-text-dark">Навыки:</span>
                                    <div className="d-flex flex-wrap gap-1 mt-1">
                                        {heroData.skills.map((skill, index) => (
                                            <Badge key={index} bg="info" className="me-1 mb-1">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <Button 
                                variant="outline-primary" 
                                size="sm"
                                className="fantasy-btn w-100"
                                onClick={() => {
                                    setSelectedHero(heroName);
                                    handleHireHero(heroName);
                                }}
                                disabled={!userPermissions || !hasAltar || heroData.essence > currentEssence || heroData.level_required > mainBuildingLevel}
                            >
                                <i className="fas fa-crown me-2"></i>
                                Призвать героя
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        );
    };
    
    return (
        <div>
            <Card className="fantasy-card mb-4">
                <Card.Header className="fantasy-card-header fantasy-card-header-primary">
                    <h5 className="fantasy-text-gold mb-0">
                        <i className="fas fa-crown me-2"></i>
                        Герои поселения
                    </h5>
                </Card.Header>
                <Card.Body>
                    {!hasAltar && (
                        <Alert variant="warning" className="mb-4">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            Для призыва героев необходимо построить алтарь.
                        </Alert>
                    )}
                    
                    {!userPermissions && (
                        <Alert variant="info" className="mb-4">
                            <i className="fas fa-info-circle me-2"></i>
                            Призывать героев могут только лидер и офицеры гильдии.
                        </Alert>
                    )}
                    
                    {/* Текущие герои */}
                    <h6 className="fantasy-text-dark mb-3">Активные герои:</h6>
                    {Object.keys(heroes).length > 0 ? (
                        <Row className="mb-4">
                            {Object.entries(heroes).map(([heroName, heroData]) => (
                                <Col md={6} lg={4} key={heroName}>
                                    <Card className="fantasy-card mb-3">
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h6 className="fantasy-text-gold mb-0">{heroName}</h6>
                                                <Badge bg="success">Активен</Badge>
                                            </div>
                                            
                                            {heroData.skills && (
                                                <div className="mb-3">
                                                    <span className="fantasy-text-dark">Навыки:</span>
                                                    <div className="mt-2">
                                                        {Object.entries(heroData.skills).map(([skill, value]) => (
                                                            <div key={skill} className="d-flex justify-content-between mb-1">
                                                                <span>{skill}</span>
                                                                <Badge bg="info">{value}</Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Alert variant="info" className="mb-4">
                            <i className="fas fa-info-circle me-2"></i>
                            У вас пока нет призванных героев.
                        </Alert>
                    )}
                    
                    {/* Доступные для призыва герои */}
                    <h6 className="fantasy-text-dark mb-3">Доступные для призыва:</h6>
                    {Object.keys(availableHeroes).length > 0 ? (
                        <Row>
                            {Object.entries(availableHeroes).map(([heroName, heroData]) => 
                                renderHeroCard(heroName, heroData)
                            )}
                        </Row>
                    ) : (
                        <Alert variant="info">
                            <i className="fas fa-info-circle me-2"></i>
                            Нет доступных героев для призыва. Улучшите главное здание.
                        </Alert>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
});

export default SettlementHeroes;