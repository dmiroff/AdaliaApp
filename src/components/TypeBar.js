import { observer } from "mobx-react-lite";
import { useContext, useEffect, useState } from "react";
import { Dropdown } from 'react-bootstrap';
import { Context } from "../index";

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

const TypeBar = observer(() => {
  const { user } = useContext(Context);
  const inventory_new = user.inventory_new || {}; 
  const selected_type = user.selected_type;
  const [displayText, setDisplayText] = useState('Все типы');

  // Extract unique types from inventory_new
  const uniqueTypes = Array.from(new Set(Object.values(inventory_new).map(item => item.type)));

  const isUnselectedType = (type) => {
    return type === null || type === undefined || (typeof type === 'number' && isNaN(type));
  };

  // Обновление отображаемого текста при изменении selected_type
  useEffect(() => {
    if (isUnselectedType(selected_type)) {
      setDisplayText('Все типы');
    } else {
      setDisplayText(translations[selected_type] || selected_type);
    }
  }, [selected_type]);

  const handleTypeSelect = (type) => {
    user.setSelectedType(type);
  };

  return (
    <div className="typebar-container">
      <Dropdown>
        <Dropdown.Toggle 
          variant="primary" 
          size="sm"
          className="fantasy-btn"
        >
          <span className="d-flex align-items-center justify-content-between w-100">
            {displayText}
            <span style={{ marginLeft: '10px', fontSize: '0.8em' }}>▼</span>
          </span>
        </Dropdown.Toggle>

        <Dropdown.Menu 
          className="fantasy-dropdown-menu"
        >
          {/* Опция "Все типы" */}
          <Dropdown.Item
            key="all"
            active={isUnselectedType(selected_type)}
            onClick={() => handleTypeSelect(null)}
            className={isUnselectedType(selected_type) ? "fantasy-text-gold" : "fantasy-text-dark"}
          >
            Все типы
          </Dropdown.Item>

          <Dropdown.Divider />

          {uniqueTypes.length > 0 ? (
            uniqueTypes.map((type) => (
              <Dropdown.Item
                key={type}
                active={type === selected_type}
                onClick={() => handleTypeSelect(type)}
                className={type === selected_type ? "fantasy-text-gold" : "fantasy-text-dark"}
              >
                {translations[type] || type}
              </Dropdown.Item>
            ))
          ) : (
            <Dropdown.Item disabled className="fantasy-text-muted text-center">
              Нет предметов
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
});

export default TypeBar;