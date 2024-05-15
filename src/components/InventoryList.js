import { observer } from "mobx-react-lite";
import { useContext } from "react";
import InventoryItem from "./InventoryItem";
import Row from "react-bootstrap/Row";
import { Context } from "../index";

const InventoryList = observer(() => {
    const { user } = useContext(Context);
    const { inventory_new, selected_type } = user;

    // Filter items based on the selected type
    const filteredItems = Object.values(inventory_new).filter(item => item.type === selected_type);

    if (!Object.keys(inventory_new).length) {
        return <div>No inventory data available</div>; // Display a message if inventory is empty
    }

    return (
        <Row className="d-flex">
            {filteredItems.map((device) => (
                <InventoryItem key={device.id} device={device} />
            ))}
        </Row>
    );
});

export default InventoryList;
