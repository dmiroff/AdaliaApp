import { Suspense, useState } from 'react';
import Container from "react-bootstrap/esm/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import InventoryList from "../components/InventoryList";
import Equipment from "../components/Equipment";

const Inventory = () => {
    const [showEquipment, setShowEquipment] = useState(false);
    
    return (
      <Container>
        <Row className="d-flex justify-content-between align-items-center"> {/* Use the justify-content-between class to evenly distribute the space between the two components */}
          <Col className="text-center p-2"> {/* Add the text-right class to align the button text to the right */}

            <Button 
              onClick={() => setShowEquipment(!showEquipment)}
              className={`fantasy-btn ${showEquipment ? 'fantasy-btn-warning' : 'fantasy-btn-success'} fantasy-btn-lg`}
            >
              {showEquipment ? "✖ Спрятать снаряжение" : "Показать снаряжение"}
            </Button>
          </Col>
        </Row>
        
        {showEquipment && (
          <Row className="mb-4">
            <Col>
              <Equipment />
            </Col>
          </Row>
        )}
        
        <Row>
          <Col>
            <Suspense fallback={
              <div className="fantasy-paper p-4 text-center">
                <div className="fantasy-text-muted">Загрузка инвентаря...</div>
              </div>
            }>
              <InventoryList />
            </Suspense>
          </Col>
        </Row>
      </Container>
    );
};

export default Inventory;