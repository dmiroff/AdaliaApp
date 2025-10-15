// src/components/InteractiveMap.js
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { observer } from "mobx-react-lite";
import { Card, Button, ProgressBar, Badge, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Context } from "../index";

const InteractiveMap = observer(() => {
  const { user } = useContext(Context);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [svgContent, setSvgContent] = useState('');
  
  const svgContainerRef = useRef();
  const svgElementRef = useRef();
  const scaleIndicatorRef = useRef();
  const coordinatesDisplayRef = useRef();
  const isDragging = useRef(false);
  const isTouchDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const transform = useRef({ x: 0, y: 0, scale: 1 });
  const coordinatesRef = useRef({ x: 0, y: 0 });

  const playerData = user.player || {};

  // Загрузка SVG файла
  useEffect(() => {
    const loadSvgMap = async () => {
      try {
        const response = await fetch('/maps/fantasy-map.svg');
        if (!response.ok) throw new Error('Failed to load SVG map');
        const svgText = await response.text();
        setSvgContent(svgText);
      } catch (error) {
        console.error('Error loading SVG map:', error);
        setSvgContent(createFallbackSvg());
      }
    };

    loadSvgMap();
  }, []);

  // Инициализация SVG после загрузки
  useEffect(() => {
    if (svgContent && svgContainerRef.current) {
      const enhancedSvg = enhanceSvgWithInteractivity(svgContent);
      svgContainerRef.current.innerHTML = enhancedSvg;
      svgElementRef.current = svgContainerRef.current.querySelector('svg');
      
      if (svgElementRef.current) {
        svgElementRef.current.style.transformOrigin = '0 0';
        applyTransform();
        updateScaleIndicator();
      }
    }
  }, [svgContent]);

  // Создание fallback SVG
  const createFallbackSvg = () => {
    return `
      <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#466eab"/>
        <polygon points="100,100 400,50 450,200 350,400 150,350" fill="#d2d082" stroke="#8B4513" stroke-width="2"/>
        <text x="200" y="250" fill="#8B4513" font-weight="bold" font-size="16">Западные дикие земли</text>
      </svg>
    `;
  };

  // Получение реальных координат SVG из экранных координат
  const getSvgCoordinates = (screenX, screenY) => {
    if (!svgElementRef.current) return { x: 0, y: 0 };
    
    const svgRect = svgElementRef.current.getBoundingClientRect();
    const point = svgElementRef.current.createSVGPoint();
    
    point.x = screenX - svgRect.left;
    point.y = screenY - svgRect.top;
    
    const screenCTM = svgElementRef.current.getScreenCTM();
    if (screenCTM) {
      const invertedCTM = screenCTM.inverse();
      const svgPoint = point.matrixTransform(invertedCTM);
      return { x: Math.round(svgPoint.x), y: Math.round(svgPoint.y) };
    }
    
    return { x: Math.round(point.x), y: Math.round(point.y) };
  };

  // Получение координат касания
  const getTouchCoordinates = (touchEvent) => {
    const touch = touchEvent.touches[0];
    return { clientX: touch.clientX, clientY: touch.clientY };
  };

  // Обновление индикатора масштаба
  const updateScaleIndicator = () => {
    if (scaleIndicatorRef.current) {
      scaleIndicatorRef.current.textContent = `Масштаб: ${Math.round(transform.current.scale * 100)}%`;
    }
  };

  // Применение трансформаций
  const applyTransform = () => {
    if (svgElementRef.current) {
      svgElementRef.current.style.transform = `translate(${transform.current.x}px, ${transform.current.y}px) scale(${transform.current.scale})`;
      updateScaleIndicator();
    }
  };

  // Обработчики для мыши
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.location-point')) return;
    
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - transform.current.x,
      y: e.clientY - transform.current.y
    };
    
    // Обновляем координаты при клике
    const svgCoords = getSvgCoordinates(e.clientX, e.clientY);
    coordinatesRef.current = svgCoords;
    
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!svgContainerRef.current) return;

    // Всегда обновляем координаты
    const svgCoords = getSvgCoordinates(e.clientX, e.clientY);
    coordinatesRef.current = svgCoords;

    // Обработка перетаскивания
    if (!isDragging.current) return;

    transform.current.x = e.clientX - dragStart.current.x;
    transform.current.y = e.clientY - dragStart.current.y;

    applyTransform();
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Обработчики для сенсорных устройств
  const handleTouchStart = useCallback((e) => {
    if (e.target.closest('.location-point')) return;
    
    isTouchDragging.current = true;
    const { clientX, clientY } = getTouchCoordinates(e);
    
    dragStart.current = {
      x: clientX - transform.current.x,
      y: clientY - transform.current.y
    };
    
    // Обновляем координаты при касании
    const svgCoords = getSvgCoordinates(clientX, clientY);
    coordinatesRef.current = svgCoords;
    
    e.preventDefault();
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!svgContainerRef.current) return;

    const { clientX, clientY } = getTouchCoordinates(e);
    
    // Всегда обновляем координаты
    const svgCoords = getSvgCoordinates(clientX, clientY);
    coordinatesRef.current = svgCoords;

    // Обработка перетаскивания
    if (!isTouchDragging.current) return;

    transform.current.x = clientX - dragStart.current.x;
    transform.current.y = clientY - dragStart.current.y;

    applyTransform();
    
    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback(() => {
    isTouchDragging.current = false;
  }, []);

  // Обработчик жестов масштабирования
  const handleTouchGesture = useCallback((e) => {
    if (e.touches.length !== 2) return;
    
    e.preventDefault();
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    
    // Вычисляем расстояние между двумя касаниями
    const currentDistance = Math.hypot(
      touch1.clientX - touch2.clientX,
      touch1.clientY - touch2.clientY
    );
    
    // Сохраняем начальное расстояние для расчета изменения масштаба
    if (!e.scale) {
      e.scale = currentDistance / 100; // Базовое расстояние
    }
    
    const newScale = Math.max(0.1, Math.min(5, transform.current.scale * (currentDistance / (e.scale * 100))));
    transform.current.scale = newScale;
    
    applyTransform();
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
    
    // Корректируем позицию чтобы зум был к курсору
    transform.current.x = mouseX - (mouseX - transform.current.x) * (newScale / transform.current.scale);
    transform.current.y = mouseY - (mouseY - transform.current.y) * (newScale / transform.current.scale);
    transform.current.scale = newScale;

    applyTransform();
    
    // Обновляем координаты после зума
    const svgCoords = getSvgCoordinates(e.clientX, e.clientY);
    coordinatesRef.current = svgCoords;
  }, []);

  // Управление зумом
  const zoomIn = useCallback(() => {
    transform.current.scale = Math.min(5, transform.current.scale * 1.2);
    applyTransform();
  }, []);

  const zoomOut = useCallback(() => {
    transform.current.scale = Math.max(0.1, transform.current.scale * 0.8);
    applyTransform();
  }, []);

  const resetView = useCallback(() => {
    transform.current = { x: 0, y: 0, scale: 1 };
    applyTransform();
  }, []);

  // Обработчик клика по локациям
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

  // Данные локаций с постоянными координатами
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
        description: "Береговая линия с рыбацкими деревнями и портами",
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

  // Добавляем интерактивные точки к SVG
  const enhanceSvgWithInteractivity = useCallback((svgText) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;

    // Добавляем CSS для интерактивности
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

    // Добавляем интерактивные точки локаций
    const locations = getLocationsData();
    const group = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'interactive-locations');

    locations.forEach(location => {
      const [x, y] = location.position;
      
      // Точка локации
      const circle = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '8');
      circle.setAttribute('fill', getLocationColor(location.type));
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('class', 'location-point');
      circle.setAttribute('data-location-id', location.id);
      
      // Название локации
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

  // Получение данных подземелья
  const getDungeonData = (dungeonName) => {
    const dungeons = playerData.dungeons || {};
    const currentKey = `${dungeonName}-current`;
    const maxKey = dungeonName;
    
    const current = dungeons[currentKey] || 0;
    const max = dungeons[maxKey] || 0;
    
    return {
      current,
      max,
      progress: max > 0 ? Math.round((current / max) * 100) : 0
    };
  };

  // Получение подземелий для локации
  const getLocationDungeons = (location) => {
    return location.dungeons.map(dungeonName => ({
      name: dungeonName,
      ...getDungeonData(dungeonName)
    })).filter(dungeon => dungeon.max > 0 || dungeon.current > 0);
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
            ➕ Приблизить
          </Button>
          <Button 
            size="sm" 
            className="fantasy-btn fantasy-btn-secondary"
            onClick={zoomOut}
          >
            ➖ Отдалить
          </Button>
          <Button 
            size="sm" 
            className="fantasy-btn fantasy-btn-primary"
            onClick={resetView}
          >
            🏠 Сбросить вид
          </Button>
        </div>
        <div className="mt-2 small fantasy-text-muted">
          • Колесо мыши / Двойное касание - зум
          <br />
          • Перетаскивание - перемещение
          <br />
          • Два пальца - масштабирование
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
      <Modal show={showLocationModal} onHide={onClose} centered>
        <Modal.Header closeButton className="fantasy-card">
          <Modal.Title className="fantasy-text-dark">
            {selectedLocation.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="fantasy-card">
          <p className="fantasy-text-dark">{selectedLocation.description}</p>
          
          {dungeons.length > 0 && (
            <div className="mt-3">
              <h6 className="fantasy-text-primary mb-3">🏰 Подземелья:</h6>
              {dungeons.map((dungeon, index) => (
                <DungeonWithTooltip key={index} dungeon={dungeon} />
              ))}
            </div>
          )}
          
          {dungeons.length === 0 && (
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

  return (
    <div className="fantasy-paper content-overlay">
      <div className="row">
        <div className="col-md-9">
          <Card className="fantasy-card">
            <Card.Body className="p-0">
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
                  touchAction: 'none' // Важно для мобильных устройств
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onClick={handleSvgClick}
                // Сенсорные события для мобильных устройств
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              />

              {/* Индикатор масштаба */}
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
                  margin: '10px'
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
          
          <Card className="fantasy-card mt-3">
            <Card.Body>
              <h6 className="fantasy-text-primary">🗺️ Управление:</h6>
              <p className="fantasy-text-dark small">
                • Клик/Касание точек - информация
                <br/>
                • Колесо мыши/Двойное касание - зум
                <br/>
                • ЛКМ/Касание + перемещение - панорамирование
                <br/>
                • Два пальца - масштабирование
              </p>
            </Card.Body>
          </Card>
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