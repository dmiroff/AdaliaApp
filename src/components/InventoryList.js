import { observer } from "mobx-react-lite";
import { Context } from "../index";
import React, { useContext, useEffect } from "react";
import InventoryItem from "./InventoryItem";
import Row from "react-bootstrap/Row";


const InventoryList = observer(() => {
    const { user } = useContext(Context);
    //const inventory_new = localStorage.getItem("inventory_new")|| {};// Provide a fallback to prevent undefined errors
    const inventory_new = user.inventory_new || {}; 
    console.log(inventory_new)

    if (!Object.keys(inventory_new).length) {
        return <div>No inventory data available</div>; // Display a message if inventory is empty
      }

    return (
        <Row className="d-flex">
            {Object.keys(inventory_new).map((key) => {
                const device = inventory_new[key]; // Access the device using the key
                return <InventoryItem key={device.id} device={device} />; // Render InventoryItem for each key
            })}
        </Row>

    );

});

export default InventoryList;