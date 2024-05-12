import { observer } from "mobx-react-lite";
import { Context } from "../index";
import { useContext } from "react";
import { Dropdown, DropdownButton } from 'react-bootstrap'; // Import Dropdown components
import '../index.css'; // Importing custom styles from index.css

const TypeBar = observer(() => {
  const { rating } = useContext(Context);

  const selectedType = rating.Types.find(
    (type) => type.id === rating.SelectedType
  );

  return (
    <DropdownButton
      id="type-dropdown"
      title={selectedType ? selectedType.name : 'Выберите тип'}
      variant="dark" // Apply dark variant for dropdown
    >
      {rating.Types.map((type) => (
        <Dropdown.Item
          key={type.id}
          style={{cursor:"pointer"}}
          active={type.id === rating.SelectedType} // Apply active styling
          onClick={() => rating.setSelectedType(type)} // Handle click to set selected type
        >
          {type.name}
        </Dropdown.Item>
      ))}
    </DropdownButton>
  );
});

export default TypeBar;
