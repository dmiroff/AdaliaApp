import { observer } from "mobx-react-lite";
import { useContext } from "react";
import { Dropdown, DropdownButton } from 'react-bootstrap'; // Import Dropdown components
import '../index.css'; // Importing custom styles from index.css
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
  "left_hand": "Снаряжение в левой руке",
  "secondary_weapon": "Запасное оружие",
  "supplies": "Расходник",
  "food": "Еда",
  "potions": "Зелье",
  "scroll": "Свиток",
  "reagent": "Реагент",
};

const TypeBar = observer(() => {
  const { user } = useContext(Context);
  const inventory_new = user.inventory_new || {}; 
  const selected_type = user.selected_type || NaN;

  // Extract unique types from inventory_new
  const uniqueTypes = Array.from(new Set(Object.values(inventory_new).map(item => item.type)));

  return (
    <DropdownButton
      id="type-dropdown"
      title={selected_type ? translations[selected_type] : 'Выберите тип'}
      variant="dark" // Apply dark variant for dropdown
    >
      {uniqueTypes.map((type) => (
        <Dropdown.Item
          key={type}
          style={{cursor:"pointer"}}
          active={type === selected_type} // Apply active styling
          onClick={() => user.setSelectedType(type)} // Handle click to set selected type
        >
          {translations[type]}
        </Dropdown.Item>
      ))}
    </DropdownButton>
  );
});

export default TypeBar;
