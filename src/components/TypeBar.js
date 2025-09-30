import { observer } from "mobx-react-lite";
import { useContext, forwardRef, useState, useRef, useEffect, useCallback } from "react";
import { Dropdown } from 'react-bootstrap';
import '../index.css';
import { Context } from "../index";

// Translation dictionary
const translations = {
  "head": "Шлем",
  "cloak": "Плащ",
  "breast_armor": "Доспех",
  "arm_armor": "Наручи",
  "gloves": "Перчатки",
  "belt": "Пояс",
  "leg_armor": "Поножи",
  "boots": "Обувь",
  "necklace": "Амулет",
  "ring": "Кольцо",
  "right_hand": "Оружие",
  "left_hand": "Левая рука",
  "secondary_weapon": "Запасное оружие",
  "supplies": "Расходник",
  "food": "Еда",
  "potions": "Зелье",
  "scroll": "Свиток",
  "reagent": "Реагент",
  "goods": "Товары",
};

// Кастомный Toggle с позиционированием
const CustomToggle = forwardRef(({ children, onClick }, ref) => {
  const toggleRef = useRef(null);
  
  const handleRef = (element) => {
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
    toggleRef.current = element;
  };

  return (
    <button
      ref={handleRef}
      className="fantasy-btn fantasy-btn-primary fantasy-btn-sm"
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '200px',
        position: 'relative',
        zIndex: 1001
      }}
    >
      {children}
      <span style={{ marginLeft: '10px' }}>▼</span>
    </button>
  );
});

const TypeBar = observer(() => {
  const { user } = useContext(Context);
  const inventory_new = user.inventory_new || {}; 
  const selected_type = user.selected_type;
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 200 });
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);
  const [displayText, setDisplayText] = useState('Все типы');

  // Extract unique types from inventory_new
  const uniqueTypes = Array.from(new Set(Object.values(inventory_new).map(item => item.type)));

  // Функция для проверки, является ли значение "не выбранным" (NaN, null, undefined)
  const isUnselectedType = (type) => {
    return type === null || type === undefined || (typeof type === 'number' && isNaN(type));
  };

  // Инициализация при первом рендере - устанавливаем "Все типы" по умолчанию
  useEffect(() => {
    // Если selected_type равен NaN (начальное значение), устанавливаем null для "Все типы"
    if (isUnselectedType(selected_type)) {
      user.setSelectedType(null);
    }
  }, [user, selected_type]);

  // Обновление отображаемого текста при изменении selected_type
  useEffect(() => {
    // Проверяем на NaN, null и undefined
    if (isUnselectedType(selected_type)) {
      setDisplayText('Все типы');
    } else {
      setDisplayText(translations[selected_type] || selected_type);
    }
  }, [selected_type]);

  // Функция для обновления позиции dropdown с useCallback для стабильности
  const updateDropdownPosition = useCallback(() => {
    const toggle = containerRef.current?.querySelector('.fantasy-btn');
    if (toggle) {
      const rect = toggle.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, []);

  // Обработчик открытия/закрытия dropdown
  const handleToggle = (isOpen) => {
    if (isOpen) {
      updateDropdownPosition();
    }
    setShowDropdown(isOpen);
  };

  // Проверяем, выбран ли конкретный тип (не NaN, не null, не undefined)
  const isTypeSelected = !isUnselectedType(selected_type);

  useEffect(() => {
    const handleResize = () => {
      if (showDropdown) {
        updateDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showDropdown, updateDropdownPosition]);

  return (
    <div className="typebar-container" ref={containerRef}>
      <Dropdown 
        show={showDropdown} 
        onToggle={handleToggle}
      >
        <Dropdown.Toggle as={CustomToggle}>
          {displayText}
        </Dropdown.Toggle>

        <Dropdown.Menu 
          className="fantasy-dropdown-menu"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 10000,
            display: showDropdown ? 'block' : 'none'
          }}
        >
          {/* Опция "Все типы" */}
          <Dropdown.Item
            key="all"
            active={!isTypeSelected}
            onClick={() => {
              user.setSelectedType(null);
              setShowDropdown(false);
            }}
            className={!isTypeSelected ? "fantasy-text-gold" : "fantasy-text-dark"}
          >
            Все типы
          </Dropdown.Item>

          <Dropdown.Divider />

          {uniqueTypes.length > 0 ? (
            uniqueTypes.map((type) => (
              <Dropdown.Item
                key={type}
                active={type === selected_type}
                onClick={() => {
                  user.setSelectedType(type);
                  setShowDropdown(false);
                }}
                className={type === selected_type ? "fantasy-text-gold" : "fantasy-text-dark"}
              >
                {translations[type] || type}
              </Dropdown.Item>
            ))
          ) : (
            <Dropdown.Item className="fantasy-text-muted text-center">
              Нет предметов
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
});

export default TypeBar;