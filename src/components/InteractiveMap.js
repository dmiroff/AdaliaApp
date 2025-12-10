// src/components/InteractiveMap.js /auth/174418785/b4h3kUTHfZjMf9uJa5RwSlBQPzX1jb0_Oqx3exTQFvk
import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { observer } from "mobx-react-lite";
import { Card, Button, ProgressBar, Badge, Modal, OverlayTrigger, Tooltip, Spinner, Alert } from "react-bootstrap";
import { Context } from "../index";
import GetDataById from "../http/GetData";

const InteractiveMap = observer(() => {
  const { user } = useContext(Context);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [svgContent, setSvgContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [delay, setDelay] = useState(false);
  const [svgError, setSvgError] = useState(null);
  
  const svgContainerRef = useRef();
  const svgElementRef = useRef();
  const scaleIndicatorRef = useRef();
  const isDragging = useRef(false);
  const isTouchDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const transform = useRef({ x: 0, y: 0, scale: 1 });
  const [playerData, setPlayerData] = useState(null);

  // Ref для отслеживания статуса загрузки
  const hasLoadedData = useRef(false);
  const hasInitializedSvg = useRef(false);

  // Упрощенный fallback SVG
  const createFallbackSvg = useCallback(() => {
    return `
      <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
        <rect width="100%" height="100%" fill="#2c5e2a"/>
        <text x="600" y="400" text-anchor="middle" fill="#ffd700" font-family="Arial" font-size="24" font-weight="bold">
          Карта мира Аэриндар
        </text>
        <text x="600" y="430" text-anchor="middle" fill="#ffd700" font-family="Arial" font-size="14">
          (Упрощенная версия)
        </text>
      </svg>
    `;
  }, []);

  // ОДНОРАЗОВАЯ загрузка данных
  useEffect(() => {
    // Если уже загружали данные - выходим
    if (hasLoadedData.current) {
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      try {
        setLoading(true);
        setSvgError(null);
        hasLoadedData.current = true;
        
        const baseUrl = process.env.PUBLIC_URL || '';
        const svgUrl = `${baseUrl}/maps/fantasy-map.svg`;
        
        // Параллельная загрузка
        const [playerResponse, svgResponse] = await Promise.all([
          GetDataById(),
          fetch(svgUrl)
        ]);

        // Обработка данных игрока
        if (playerResponse && playerResponse.data) {
          user.setPlayer(playerResponse.data);
          setPlayerData(playerResponse.data);
        } else {
          console.warn('❌ No player data received');
          // Устанавливаем пустые данные, чтобы избежать null
          setPlayerData({ dungeons: {} });
        }

        // Обработка SVG
        if (svgResponse.ok) {
          const svgText = await svgResponse.text();
          setSvgContent(svgText);
        } else {
          throw new Error(`SVG not found: ${svgResponse.status}`);
        }

      } catch (error) {
        console.error('❌ Error loading data:', error);
        setSvgError(error.message);
        setSvgContent(createFallbackSvg());
        // Устанавливаем пустые данные при ошибке
        setPlayerData({ dungeons: {} });
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [createFallbackSvg, user]);

  // Задержка для плавной загрузки
  useEffect(() => {
    if (!loading && !delay) {
      const timer = setTimeout(() => {
        setDelay(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, delay]);

  // ОДНОРАЗОВАЯ инициализация SVG
  useEffect(() => {
    if (svgContent && svgContainerRef.current && delay && !hasInitializedSvg.current) {
      try {
        hasInitializedSvg.current = true;
        
        const enhancedSvg = enhanceSvgWithInteractivity(svgContent);
        svgContainerRef.current.innerHTML = enhancedSvg;
        svgElementRef.current = svgContainerRef.current.querySelector('svg');
        
        if (svgElementRef.current) {
          svgElementRef.current.style.transformOrigin = '0 0';
          applyTransform();
          updateScaleIndicator();
        }
      } catch (error) {
        console.error('Error initializing SVG:', error);
        svgContainerRef.current.innerHTML = svgContent;
      }
    }
  }, [svgContent, delay]);

  // Получение данных подземелья с проверкой на null
  const getDungeonData = useCallback((dungeonName) => {
    // Проверяем, что playerData и dungeons существуют
    if (!playerData || !playerData.dungeons) {
      console.warn('Player data or dungeons not available');
      return {
        current: 0,
        max: 0,
        progress: 0
      };
    }
    
    const currentKey = `${dungeonName}-current`;
    const maxKey = dungeonName;
    
    const current = playerData.dungeons[currentKey] + 1 || 0;
    const max = playerData.dungeons[maxKey] + 1 || 0;
    
    return {
      current,
      max,
      progress: max > 0 ? Math.round((current / max) * 100) : 0
    };
  }, [playerData]); // Добавляем playerData в зависимости

  // Получение подземелий для локации с проверкой на null
  const getLocationDungeons = useCallback((location) => {
    if (!location || !location.dungeons) return [];
    
    const dungeons = location.dungeons.map(dungeonName => ({
      name: dungeonName,
      ...getDungeonData(dungeonName)
    })).filter(dungeon => dungeon.max > 0 || dungeon.current > 0);
    
    return dungeons;
  }, [getDungeonData]);

  // Функции для управления картой (без изменений)
  const applyTransform = useCallback(() => {
    if (svgElementRef.current) {
      svgElementRef.current.style.transform = `translate(${transform.current.x}px, ${transform.current.y}px) scale(${transform.current.scale})`;
      updateScaleIndicator();
    }
  }, []);

  const updateScaleIndicator = () => {
    if (scaleIndicatorRef.current) {
      scaleIndicatorRef.current.textContent = `Масштаб: ${Math.round(transform.current.scale * 100)}%`;
    }
  };

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.location-point')) return;
    
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - transform.current.x,
      y: e.clientY - transform.current.y
    };
    
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!svgContainerRef.current) return;
    if (!isDragging.current) return;

    transform.current.x = e.clientX - dragStart.current.x;
    transform.current.y = e.clientY - dragStart.current.y;

    applyTransform();
  }, [applyTransform]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.target.closest('.location-point')) return;
    
    isTouchDragging.current = true;
    const touch = e.touches[0];
    
    dragStart.current = {
      x: touch.clientX - transform.current.x,
      y: touch.clientY - transform.current.y
    };
    
    if (e.cancelable) e.preventDefault();
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!svgContainerRef.current) return;
    const touch = e.touches[0];

    if (!isTouchDragging.current) return;

    transform.current.x = touch.clientX - dragStart.current.x;
    transform.current.y = touch.clientY - dragStart.current.y;

    applyTransform();
    
    if (e.cancelable) e.preventDefault();
  }, [applyTransform]);

  const handleTouchEnd = useCallback(() => {
    isTouchDragging.current = false;
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    const zoomIntensity = 0.1;
    const wheel = e.deltaY < 0 ? 1 : -1;
    const zoom = Math.exp(wheel * zoomIntensity);
    
    const rect = svgContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newScale = Math.max(0.1, Math.min(5, transform.current.scale * zoom));
    
    transform.current.x = mouseX - (mouseX - transform.current.x) * (newScale / transform.current.scale);
    transform.current.y = mouseY - (mouseY - transform.current.y) * (newScale / transform.current.scale);
    transform.current.scale = newScale;

    applyTransform();
  }, [applyTransform]);

  const zoomIn = useCallback(() => {
    transform.current.scale = Math.min(5, transform.current.scale * 1.2);
    applyTransform();
  }, [applyTransform]);

  const zoomOut = useCallback(() => {
    transform.current.scale = Math.max(0.1, transform.current.scale * 0.8);
    applyTransform();
  }, [applyTransform]);

  const resetView = useCallback(() => {
    transform.current = { x: 0, y: 0, scale: 1 };
    applyTransform();
  }, [applyTransform]);

  const handleSvgClick = useCallback((e) => {
    const target = e.target;
    
    if (target.classList.contains('location-point')) {
      const locationId = target.getAttribute('data-location-id');
      const location = getLocationsData().find(loc => loc.id === locationId);
      if (location) {
        handleLocationClick(location);
      }
    }
  }, []);

  const getLocationsData = useCallback(() => {
    return [
      {
        id: 'fargos',
        name: "🏰 Фаргос",
        description: "Мирный торговый город, центр цивилизации и ремесел",
        type: 'city',
        position: [280, 510],
        dungeons: ["Canalisation"]
      },
      {
        id: 'coast',
        name: "🌊 Побережье", 
        description: "Береговая линия с заброшенными рыбацкими деревнями и портами",
        type: 'coast',
        position: [250, 483],
        dungeons: ["Dungeon_Wind", "Dungeon_Sound", "Dungeon_Power"]
      },
      {
        id: 'steppe',
        name: "🏞️ Степь",
        description: "Бескрайние степные просторы, дом кочевников",
        type: 'wild',
        position: [164, 508],
        dungeons: ["Dungeon_Light", "Dungeon_Fire", "Dungeon_Death"]
      },
      {
        id: 'forest',
        name: "🌲 Лес",
        description: "Древний лес, полный тайн и опасностей", 
        type: 'forest',
        position: [197, 556],
        dungeons: ["Dungeon_Life", "Dungeon_Dark"]
      },
      {
        id: 'mountains',
        name: "⛰️ Горы",
        description: "Высокие горные хребты, богатые полезными ископаемыми",
        type: 'mountains',
        position: [237, 556],
        dungeons: ["Dungeon_Ice", "Dungeon_Electricity", "Dungeon_Stone"]
      }
    ];
  }, []);

  const enhanceSvgWithInteractivity = useCallback((svgText) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        throw new Error('SVG parsing error');
      }
      
      const svg = doc.documentElement;

      const style = doc.createElement('style');
      style.textContent = `
        .location-point {
          cursor: pointer;
          transition: all 0.2s ease;
          touch-action: manipulation;
        }
        .location-point:hover {
          stroke: #ff8c00;
          stroke-width: 3px;
          filter: drop-shadow(0 0 4px rgba(255, 140, 0, 0.7));
        }
        .location-label {
          pointer-events: none;
          user-select: none;
        }
        .interactive-locations * {
          pointer-events: none;
        }
        .interactive-locations .location-point {
          pointer-events: all;
        }
      `;
      svg.insertBefore(style, svg.firstChild);

      const locations = getLocationsData();
      const group = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'interactive-locations');

      locations.forEach(location => {
        const [x, y] = location.position;
        
        const circle = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '8');
        circle.setAttribute('fill', getLocationColor(location.type));
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('class', 'location-point');
        circle.setAttribute('data-location-id', location.id);
        
        const text = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y - 12);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#8B4513');
        text.setAttribute('font-size', '10px');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('class', 'location-label');
        text.textContent = location.name;
        
        group.appendChild(circle);
        group.appendChild(text);
      });

      svg.appendChild(group);
      return new XMLSerializer().serializeToString(svg);
    } catch (error) {
      console.error('Error enhancing SVG:', error);
      return svgText;
    }
  }, [getLocationsData]);

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    setShowLocationModal(true);
  };

  const getLocationColor = (type) => {
    const colors = {
      city: '#ffd700',
      coast: '#1E90FF', 
      wild: '#DEB887',
      mountains: '#708090',
      forest: '#228B22'
    };
    return colors[type] || '#8B4513';
  };

  // Компонент подземелья с тултипом
  const DungeonWithTooltip = React.memo(({ dungeon }) => {
    const dungeonNames = {
      "Canalisation": "Канализация Фаргоса",
      "Dungeon_Stone": "🏔Алмазные хребты",
      "Dungeon_Ice": "❄Студёный престол",
      "Dungeon_Electricity": "⚡Грозовой перевал",
      "Dungeon_Light": "☀️Цитадель Света",
      "Dungeon_Death": "💀Некрополь",
      "Dungeon_Fire": "🔥Озёра пламени",
      "Dungeon_Dark": "🌑Бастион Тьмы",
      "Dungeon_Life": "🌿Сердце цветения",
      "Dungeon_Wind": "💨Штормовой грот",
      "Dungeon_Sound": "🌀Пещеры эха",
      "Dungeon_Power": "👑Чертог власти",
    };

    const renderTooltip = (props) => (
      <Tooltip {...props}>
        <div className="fantasy-tooltip-content">
          <strong>{dungeonNames[dungeon.name] || dungeon.name}</strong>
          <br />
          <small>Прогресс: {dungeon.current}/{dungeon.max}</small>
        </div>
      </Tooltip>
    );

    return (
      <OverlayTrigger placement="top" overlay={renderTooltip}>
        <div className="dungeon-item mb-2 p-2 fantasy-card">
          <div className="d-flex justify-content-between align-items-center">
            <span className="fantasy-text-dark">
              {dungeonNames[dungeon.name] || dungeon.name}
            </span>
            <Badge bg={dungeon.progress === 100 ? "success" : dungeon.current > 0 ? "warning" : "secondary"}>
              {dungeon.current}/{dungeon.max}
            </Badge>
          </div>
          {dungeon.max > 0 && (
            <ProgressBar 
              now={dungeon.progress} 
              className="fantasy-progress-bar mt-1"
              style={{ height: '8px' }}
              variant={dungeon.progress === 100 ? "success" : "warning"}
            />
          )}
        </div>
      </OverlayTrigger>
    );
  });

  // Элементы управления
  const NavigationControls = React.memo(() => (
    <Card className="fantasy-card mb-3">
      <Card.Body>
        <h6 className="fantasy-text-primary">Навигация по карте:</h6>
        <div className="d-grid gap-2">
          <Button 
            size="sm" 
            className="fantasy-btn fantasy-btn-secondary"
            onClick={zoomIn}
          >
            ➕ 
          </Button>
          <Button 
            size="sm" 
            className="fantasy-btn fantasy-btn-secondary"
            onClick={zoomOut}
          >
            ➖ 
                      </Button>
          <Button 
            size="sm" 
            className="fantasy-btn fantasy-btn-primary"
            onClick={resetView}
          >
            🏠 Сбросить вид
          </Button>
        </div>
      </Card.Body>
    </Card>
  ));

  const LocationLegend = React.memo(() => (
    <Card className="fantasy-card">
      <Card.Body>
        <h6 className="fantasy-text-primary">📍 Легенда:</h6>
        <div className="d-flex align-items-center mb-1">
          <div style={{ width: 12, height: 12, background: '#ffd700', borderRadius: '50%', marginRight: 8 }}></div>
          <small className="fantasy-text-dark">Города</small>
        </div>
        <div className="d-flex align-items-center mb-1">
          <div style={{ width: 12, height: 12, background: '#1E90FF', borderRadius: '50%', marginRight: 8 }}></div>
          <small className="fantasy-text-dark">Побережье</small>
        </div>
        <div className="d-flex align-items-center mb-1">
          <div style={{ width: 12, height: 12, background: '#DEB887', borderRadius: '50%', marginRight: 8 }}></div>
          <small className="fantasy-text-dark">Степь</small>
        </div>
        <div className="d-flex align-items-center mb-1">
          <div style={{ width: 12, height: 12, background: '#708090', borderRadius: '50%', marginRight: 8 }}></div>
          <small className="fantasy-text-dark">Горы</small>
        </div>
        <div className="d-flex align-items-center">
          <div style={{ width: 12, height: 12, background: '#228B22', borderRadius: '50%', marginRight: 8 }}></div>
          <small className="fantasy-text-dark">Лес</small>
        </div>
      </Card.Body>
    </Card>
  ));

  // Модальное окно с информацией о локации
  const LocationModal = React.memo(({ selectedLocation, showLocationModal, onClose }) => {
    if (!selectedLocation) return null;

    const dungeons = getLocationDungeons(selectedLocation);

    return (
      <Modal show={showLocationModal} onHide={onClose} centered size="lg">
        <Modal.Header closeButton className="fantasy-card">
          <Modal.Title className="fantasy-text-dark">
            {selectedLocation.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="fantasy-card">
          <p className="fantasy-text-dark">{selectedLocation.description}</p>
          
          {dungeons.length > 0 ? (
            <div className="mt-3">
              <h6 className="fantasy-text-primary mb-3">🏰 Подземелья:</h6>
              {dungeons.map((dungeon, index) => (
                <DungeonWithTooltip key={index} dungeon={dungeon} />
              ))}
            </div>
          ) : (
            <div className="text-center fantasy-text-muted mt-3">
              <small>В этой локации нет активных подземелий</small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="fantasy-card">
          <Button 
            variant="secondary" 
            className="fantasy-btn fantasy-btn-secondary"
            onClick={onClose}
          >
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>
    );
  });

  if (loading || !delay) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="secondary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="fantasy-text-gold mt-2">
            {loading ? 'Загрузка карты...' : 'Подготовка интерфейса...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fantasy-paper content-overlay">
      {svgError && (
        <Alert variant="warning" className="mb-3">
          <strong>Внимание:</strong> Основная карта не загружена. Используется упрощённая версия. ({svgError})
        </Alert>
      )}
      
      <div className="row">
        <div className="col-md-9">
          <Card className="fantasy-card">
            <Card.Body className="p-0 position-relative">
              <div 
                ref={svgContainerRef}
                className="fantasy-map-container"
                style={{ 
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '10px',
                  background: '#2c5e2a',
                  cursor: isDragging.current ? 'grabbing' : 'grab',
                  height: '500px',
                  touchAction: 'none'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onClick={handleSvgClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              />

              <div 
                ref={scaleIndicatorRef}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  background: 'rgba(245, 245, 220, 0.9)',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  border: '1px solid #8B4513',
                  fontSize: '12px',
                  color: '#8B4513',
                  zIndex: 10
                }}
              >
                Масштаб: 100%
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-3">
          <NavigationControls />
          <LocationLegend />
        </div>
      </div>

      <LocationModal 
        selectedLocation={selectedLocation}
        showLocationModal={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
});

export default InteractiveMap;