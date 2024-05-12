import React from "react";
import Container from "react-bootstrap/esm/Container";
import Row from "react-bootstrap/Row";
import { useLocation } from "react-router-dom";
import TypeBar from "../components/TypeBar";
import InventoryList from "../components/InventoryList";

const Inventory = () => {
    const location = useLocation()
    //console.log(location)
    return (
      <Container>
        <Row className="d-flex justify-content-start align-items-start">
          <TypeBar></TypeBar>
        </Row>
        <Row
          className="d-flex justify-content-center align-items-center">
          <InventoryList></InventoryList>
        </Row>
        
      </Container>
    );
};

export default Inventory;