import React, { Suspense, useEffect, useState } from 'react';
import Container from "react-bootstrap/esm/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import TypeBar from "../components/TypeBar";
import InventoryList from "../components/InventoryList";

const Inventory = () => {
    const [showEquipment, setShowEquipment] = useState(false);
    //console.log(location)
    return (
      <Container>
        <Row className="d-flex justify-content-between align-items-center"> {/* Use the justify-content-between class to evenly distribute the space between the two components */}
          <Col>
            <TypeBar></TypeBar>
          </Col>
          <Col className="text-right"> {/* Add the text-right class to align the button text to the right */}
            <button onClick={() => setShowEquipment(!showEquipment)}>
              {showEquipment ? "Спрятать снаряжение" : "Показать снаряжение"}
            </button>
          </Col>
        </Row>
        <Row
          className="d-flex justify-content-center align-items-center"
          style={{ marginTop: "1rem" }}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <InventoryList />
          </Suspense>
        </Row>
      </Container>
    );
};

export default Inventory;
