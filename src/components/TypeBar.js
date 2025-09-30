import { observer } from "mobx-react-lite";
import { useContext, forwardRef, useState, useRef, useEffect } from "react";
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
  
  // Объединяем refs
  const handleRef = (element) => {
    // Передаем ref в React Bootstrap
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
    // Сохраняем в наш ref
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
  const selected_type = user.selected_type || NaN;
  const [dropdownPosition, setDropdownPosition] = useState({});

  // Extract unique types from inventory_new
  const uniqueTypes = Array.from(new Set(Object.values(inventory_new).map(item => item.type)));

  // Функция для обновления позиции dropdown
  const updateDropdownPosition = () => {
    const toggle = document.querySelector('.typebar-container .fantasy-btn');
    if (toggle) {
      const rect = toggle.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    // Обновляем позицию при изменении размера окна
    window.addEventListener('resize', updateDropdownPosition);
    return () => window.removeEventListener('resize', updateDropdownPosition);
  }, []);

  return (
    <div className="typebar-container" onClick={updateDropdownPosition}>
      <Dropdown onToggle={updateDropdownPosition}>
        <Dropdown.Toggle as={CustomToggle}>
          {selected_type ? translations[selected_type] : 'Выберите тип'}
        </Dropdown.Toggle>

        <Dropdown.Menu 
          className="fantasy-dropdown-menu"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 10000
          }}
        >
          {uniqueTypes.length > 0 ? (
            uniqueTypes.map((type) => (
              <Dropdown.Item
                key={type}
                active={type === selected_type}
                onClick={() => user.setSelectedType(type)}
                className={type === selected_type ? "fantasy-text-gold" : "fantasy-text-dark"}
              >
                {translations[type]}
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