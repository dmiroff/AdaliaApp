// src/components/PlayerImages.js
import React, { useState, useEffect, useContext } from 'react';
import { Card, Row, Col, Button, Alert, Spinner, Badge, Accordion } from "react-bootstrap";
import { Context } from "../index";
import GetDataById from "../http/GetData";
import { getPlayerSettings, setCurrentImage } from "../http/playerSettingsApi";

const PlayerImages = () => {
  const { user } = useContext(Context);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [playerData, setPlayerData] = useState(null);

  // Маппинг путей к изображениям для читаемых имен и эмодзи
  const IMAGE_CONFIG = {
    // Базовые расовые образы
    "Images/Profiles/HumanM.png": { 
      name: "Человек (мужской)", 
      emoji: "👤",
      type: "base"
    },
    "Images/Profiles/HumanW.png": { 
      name: "Человек (женский)", 
      emoji: "👤",
      type: "base"
    },
    "Images/Profiles/HighElfM.png": { 
      name: "Высший эльф (мужской)", 
      emoji: "🧝",
      type: "base"
    },
    "Images/Profiles/HighElfW.png": { 
      name: "Высший эльф (женский)", 
      emoji: "🧝",
      type: "base"
    },
    "Images/Profiles/DwarfM.png": { 
      name: "Дварф (мужской)", 
      emoji: "🧔",
      type: "base"
    },
    "Images/Profiles/DwarfW.png": { 
      name: "Дварф (женский)", 
      emoji: "🧔",
      type: "base"
    },
    "Images/Profiles/GoblinM.png": { 
      name: "Гоблин (мужской)", 
      emoji: "👺",
      type: "base"
    },
    "Images/Profiles/GoblinW.png": { 
      name: "Гоблин (женский)", 
      emoji: "👺",
      type: "base"
    },
    "Images/Profiles/DrowM.png": { 
      name: "Тёмный эльф (мужской)", 
      emoji: "🧝‍♂️",
      type: "base"
    },
    "Images/Profiles/DrowW.png": { 
      name: "Тёмный эльф (женский)", 
      emoji: "🧝‍♂️",
      type: "base"
    },
    "Images/Profiles/HalfOrcM.png": { 
      name: "Полуорк (мужской)", 
      emoji: "🧌",
      type: "base"
    },
    "Images/Profiles/HalfOrcW.png": { 
      name: "Полуорк (женский)", 
      emoji: "🧌",
      type: "base"
    },
    "Images/Profiles/WoodElfM.png": { 
      name: "Лесной эльф (мужской)", 
      emoji: "🧝",
      type: "base"
    },
    "Images/Profiles/WoodElfW.png": { 
      name: "Лесной эльф (женский)", 
      emoji: "🧝",
      type: "base"
    },
    "Images/Profiles/HobbitM.png": { 
      name: "Хоббит (мужской)", 
      emoji: "🧙",
      type: "base"
    },
    "Images/Profiles/HobbitW.png": { 
      name: "Хоббит (женский)", 
      emoji: "🧙",
      type: "base"
    },
    
    // Событийные образы (зимние)
    "Images/Profiles/IceKnight.png": { 
      name: "Ледяной рыцарь", 
      emoji: "⚔️",
      type: "event",
      rarity: "epic"
    },
    "Images/Profiles/SnowFairy.png": { 
      name: "Снежная фея", 
      emoji: "🧚",
      type: "event",
      rarity: "legendary"
    },
    "Images/Profiles/PolarWolf.png": { 
      name: "Полярный волк", 
      emoji: "🐺",
      type: "event",
      rarity: "rare"
    },
    "Images/Profiles/NewYearMage.png": { 
      name: "Новогодний маг", 
      emoji: "🧙",
      type: "event",
      rarity: "epic"
    },
    "Images/Profiles/FrostArcher.png": { 
      name: "Морозный лучник", 
      emoji: "🏹",
      type: "event",
      rarity: "legendary"
    }
  };

  const getImageConfig = (imagePath) => {
    if (!imagePath) {
      return { name: "Стандартный образ", emoji: "👤", type: "default" };
    }
    
    const config = IMAGE_CONFIG[imagePath];
    if (config) {
      return config;
    }
    
    // Если путь не найден в конфиге, пытаемся извлечь информацию из пути
    const fileName = imagePath.split('/').pop().replace('.png', '');
    const displayName = fileName.replace(/([A-Z])/g, ' $1').trim();
    
    return {
      name: displayName,
      emoji: "👤", // эмодзи по умолчанию
      type: "unknown"
    };
  };

  const getEmojiForImage = (imagePath) => {
    return getImageConfig(imagePath).emoji;
  };

  const getDisplayName = (imagePath) => {
    return getImageConfig(imagePath).name;
  };

  const getRarityBadge = (imagePath) => {
    const config = IMAGE_CONFIG[imagePath];
    if (!config || !config.rarity) return null;
    
    const rarityColors = {
      "common": "secondary",
      "rare": "info",
      "epic": "purple",
      "legendary": "warning"
    };
    
    const rarityNames = {
      "common": "Обычный",
      "rare": "Редкий",
      "epic": "Эпический",
      "legendary": "Легендарный"
    };
    
    return (
      <Badge 
        bg={rarityColors[config.rarity] || "secondary"} 
        className="ms-2"
      >
        {rarityNames[config.rarity] || config.rarity}
      </Badge>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const playerDataResponse = await GetDataById();
        setPlayerData(playerDataResponse.data);
        
        const settingsResponse = await getPlayerSettings();
        setSettings(settingsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setError("Не удалось загрузить коллекцию образов");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSetCurrentImage = async (imagePath) => {
    try {
      setError("");
      const response = await setCurrentImage(imagePath);
      if (response.status === 200) {
        const displayName = getDisplayName(imagePath);
        setSuccess(`Образ "${displayName}" установлен как текущий!`);
        
        // Обновляем данные
        const playerDataResponse = await GetDataById();
        setPlayerData(playerDataResponse.data);
        
        const settingsResponse = await getPlayerSettings();
        setSettings(settingsResponse.data);
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.detail || "Ошибка при смене образа");
      }
    } catch (err) {
      setError(err.message || "Ошибка при смене образа");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="info" />
        <p className="mt-2">Загрузка коллекции образов...</p>
      </div>
    );
  }

  const availableImages = settings?.available_images || [];
  const currentImage = settings?.current_image || playerData?.character_art;
  const currentImageConfig = getImageConfig(currentImage);

  // Разделяем образы по типам для лучшей организации
  const baseImages = availableImages.filter(img => {
    const config = IMAGE_CONFIG[img];
    return config && config.type === "base";
  });
  
  const eventImages = availableImages.filter(img => {
    const config = IMAGE_CONFIG[img];
    return config && config.type === "event";
  });
  
  const otherImages = availableImages.filter(img => {
    const config = IMAGE_CONFIG[img];
    return !config || (config.type !== "base" && config.type !== "event");
  });

  return (
    <div className="images-container">
      {success && <Alert variant="success" className="mb-3">{success}</Alert>}
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

      <Accordion defaultActiveKey="0" className="mb-4">
        {/* Текущий активный образ */}
        <Accordion.Item eventKey="0" className="fantasy-card border-success">
          <Accordion.Header className="fantasy-card-header-success">
            <div className="d-flex align-items-center">
              <div className="me-2">{currentImageConfig.emoji}</div>
              <h5 className="mb-0">Активный образ</h5>
              {currentImage && (
                <Badge bg="success" className="ms-2">Активен</Badge>
              )}
            </div>
          </Accordion.Header>
          <Accordion.Body className="text-center">
            <div className="fs-1 mb-3">
              {currentImageConfig.emoji}
            </div>
            <h4 className="fantasy-text-success mb-2">
              {currentImageConfig.name}
            </h4>
            {IMAGE_CONFIG[currentImage]?.rarity && getRarityBadge(currentImage)}
            {!currentImage && (
              <p className="fantasy-text-muted mt-3">
                Вы ещё не выбрали образ. Приобретите образ в событийном магазине!
              </p>
            )}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      {/* Доступные образы */}
      <div className="mb-4">
        <h5 className="fantasy-text-dark mb-3">
          📚 Доступные образы ({availableImages.length})
        </h5>
        
        {availableImages.length > 0 ? (
          <>
            {/* Базовые образы (рас) */}
            {baseImages.length > 0 && (
              <div className="mb-4">
                <h6 className="fantasy-text-muted mb-3">🎯 Базовые образы рас</h6>
                <Row className="g-3">
                  {baseImages.map((image, index) => (
                    <Col key={index} md={6} lg={4}>
                      <Card className={`fantasy-card h-100 ${currentImage === image ? 'border-success border-2' : ''}`}>
                        <Card.Body className="text-center d-flex flex-column">
                          <div className="fs-2 mb-2">
                            {getEmojiForImage(image)}
                          </div>
                          <h6 className="fantasy-text-dark flex-grow-1 mb-3">
                            {getDisplayName(image)}
                          </h6>
                          <div className="mt-auto">
                            {currentImage === image ? (
                              <Button variant="success" disabled className="w-100">
                                ✅ Активен
                              </Button>
                            ) : (
                              <Button 
                                variant="outline-success" 
                                onClick={() => handleSetCurrentImage(image)}
                                className="w-100 fantasy-btn fantasy-btn-outline"
                              >
                                Выбрать этот образ
                              </Button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
            
            {/* Событийные образы */}
            {eventImages.length > 0 && (
              <div className="mb-4">
                <h6 className="fantasy-text-muted mb-3">🎄 Зимние образы</h6>
                <Row className="g-3">
                  {eventImages.map((image, index) => {
                    const config = IMAGE_CONFIG[image];
                    return (
                      <Col key={index} md={6} lg={4}>
                        <Card className={`fantasy-card h-100 ${currentImage === image ? 'border-warning border-2' : ''}`}>
                          <Card.Body className="text-center d-flex flex-column">
                            <div className="fs-2 mb-2">
                              {config.emoji}
                            </div>
                            <h6 className="fantasy-text-dark flex-grow-1 mb-2">
                              {config.name}
                            </h6>
                            {config.rarity && (
                              <div className="mb-3">
                                <Badge 
                                  bg={
                                    config.rarity === 'legendary' ? 'warning' :
                                    config.rarity === 'epic' ? 'purple' : 'info'
                                  }
                                  className="fs-7"
                                >
                                  {config.rarity === 'legendary' ? 'Легендарный' :
                                   config.rarity === 'epic' ? 'Эпический' : 'Редкий'}
                                </Badge>
                              </div>
                            )}
                            <div className="mt-auto">
                              {currentImage === image ? (
                                <Button variant="warning" disabled className="w-100">
                                  ✅ Активен
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline-warning" 
                                  onClick={() => handleSetCurrentImage(image)}
                                  className="w-100 fantasy-btn fantasy-btn-outline"
                                >
                                  Выбрать этот образ
                                </Button>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            )}
            
            {/* Другие образы */}
            {otherImages.length > 0 && (
              <div className="mb-4">
                <h6 className="fantasy-text-muted mb-3">✨ Другие образы</h6>
                <Row className="g-3">
                  {otherImages.map((image, index) => (
                    <Col key={index} md={6} lg={4}>
                      <Card className={`fantasy-card h-100 ${currentImage === image ? 'border-info border-2' : ''}`}>
                        <Card.Body className="text-center d-flex flex-column">
                          <div className="fs-2 mb-2">
                            {getEmojiForImage(image)}
                          </div>
                          <h6 className="fantasy-text-dark flex-grow-1 mb-3">
                            {getDisplayName(image)}
                          </h6>
                          <div className="mt-auto">
                            {currentImage === image ? (
                              <Button variant="info" disabled className="w-100">
                                ✅ Активен
                              </Button>
                            ) : (
                              <Button 
                                variant="outline-info" 
                                onClick={() => handleSetCurrentImage(image)}
                                className="w-100 fantasy-btn fantasy-btn-outline"
                              >
                                Выбрать этот образ
                              </Button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="fs-1 mb-3">📭</div>
            <h5 className="fantasy-text-muted">Коллекция образов пуста</h5>
            <p className="fantasy-text-muted">
              Приобретайте образы в событийном магазине, чтобы пополнить коллекцию!
            </p>
          </div>
        )}
      </div>

      {/* Информация */}
      <Card className="fantasy-card">
        <Card.Header className="fantasy-card-header-info">
          <h5 className="mb-0">ℹ️ Информация об образах</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3">
              <div className="text-center">
                <div className="fs-2 mb-2">🎯</div>
                <h6>Базовые образы</h6>
                <small className="fantasy-text-muted">
                  Доступны при выборе расы. Каждая раса предоставляет мужской и женский варианты образов.
                </small>
              </div>
            </Col>
            <Col md={4} className="mb-3">
              <div className="text-center">
                <div className="fs-2 mb-2">🎲</div>
                <h6>Случайный образ</h6>
                <small className="fantasy-text-muted">
                  Покупается за 1000 снежков. Вы получаете случайный образ из доступной коллекции.
                </small>
              </div>
            </Col>
            <Col md={4} className="mb-3">
              <div className="text-center">
                <div className="fs-2 mb-2">🎨</div>
                <h6>Заказ образа</h6>
                <small className="fantasy-text-muted">
                  Покупается за 3000 снежков. Вы заказываете индивидуальный образ у администрации игры.
                </small>
              </div>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md={4} className="mb-3">
              <div className="text-center">
                <div className="fs-2 mb-2">🔄</div>
                <h6>Смена образа</h6>
                <small className="fantasy-text-muted">
                  Меняйте активный образ в любое время бесплатно. Все купленные образы остаются в коллекции.
                </small>
              </div>
            </Col>
            <Col md={4} className="mb-3">
              <div className="text-center">
                <div className="fs-2 mb-2">⚔️</div>
                <h6>Редкость образов</h6>
                <small className="fantasy-text-muted">
                  Образы имеют разную редкость: Обычные, Редкие, Эпические и Легендарные.
                </small>
              </div>
            </Col>
            <Col md={4} className="mb-3">
              <div className="text-center">
                <div className="fs-2 mb-2">📚</div>
                <h6>Коллекция</h6>
                <small className="fantasy-text-muted">
                  Все полученные образы хранятся в вашей коллекции и доступны для выбора в любое время.
                </small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PlayerImages;