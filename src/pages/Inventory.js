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
      <Container className="mt-3 pt-3"> {/* Уменьшили отступы */}
        <Row className="d-flex justify-content-center align-items-center mb-3"> {/* Уменьшили margin-bottom */}
          <Col xs={12} md={8} lg={6} className="text-center p-3">
            <Button 
              onClick={() => setShowEquipment(!showEquipment)}
              className={`fantasy-btn ${showEquipment ? 'fantasy-btn-warning' : 'fantasy-btn-success'} fantasy-btn-lg w-100`}
              style={{ minHeight: '50px' }}
            >
              {showEquipment ? "✖ Спрятать снаряжение" : "Показать снаряжение"}
            </Button>
          </Col>
        </Row>
        
        {showEquipment && (
          <Row className="mb-3"> {/* Уменьшили margin-bottom */}
            <Col>
              <Equipment />
            </Col>
          </Row>
        )}
        
        <Row>
          <Col>
            <Suspense fallback={
              <div className="fantasy-paper p-3 text-center mt-2">
                <div className="fantasy-text-muted fs-5">Загрузка инвентаря...</div>
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