import { Suspense, useState } from 'react';
import Container from "react-bootstrap/esm/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import InventoryList from "../components/InventoryList";
import Equipment from "../components/Equipment"; // Import the EquipmentPanel component

const Inventory = () => {
    const [showEquipment, setShowEquipment] = useState(false);
    //console.log(location)
    return (
      <Container>
        <Row className="d-flex justify-content-between align-items-center"> {/* Use the justify-content-between class to evenly distribute the space between the two components */}
          <Col className="text-center p-2"> {/* Add the text-right class to align the button text to the right */}
            <Button 
              onClick={() => setShowEquipment(!showEquipment)}
              variant="secondary"
            >
              {showEquipment ? "Спрятать снаряжение" : "Показать снаряжение"}
            </Button>
          </Col>
        </Row>
        {showEquipment && <Equipment />} {/* Conditionally render the EquipmentPanel component */}
        <Row
          className="d-flex justify-content-center align-items-center"
        >
          <Suspense fallback={<div>Loading...</div>}>
            <InventoryList />
          </Suspense>
        </Row>
      </Container>
    );
};

export default Inventory;
