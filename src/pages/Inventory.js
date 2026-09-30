import { Suspense, useState } from 'react';
import Container from "react-bootstrap/esm/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import InventoryList from "../components/InventoryList";
import Equipment from "../components/Equipment";
import Wardrobe from "../components/Wardrobe";

const Inventory = () => {
    const [activePanel, setActivePanel] = useState(null);
    const [equipmentRevision, setEquipmentRevision] = useState(0);

    const togglePanel = (panel) => {
      setActivePanel((current) => current === panel ? null : panel);
    };
    
    return (
      <Container className="mt-3 pt-3"> {/* Уменьшили отступы */}
        <Row className="inventory-panel-switcher justify-content-center g-2 mb-3">
          <Col xs={12} sm={6} lg={4}>
            <Button 
              onClick={() => togglePanel('equipment')}
              className={`fantasy-btn fantasy-btn-lg w-100 ${activePanel === 'equipment' ? 'is-active' : ''}`}
              aria-expanded={activePanel === 'equipment'}
            >
              🛡️ {activePanel === 'equipment' ? "Скрыть снаряжение" : "Снаряжение"}
            </Button>
          </Col>
          <Col xs={12} sm={6} lg={4}>
            <Button
              onClick={() => togglePanel('wardrobe')}
              className={`fantasy-btn fantasy-btn-lg w-100 ${activePanel === 'wardrobe' ? 'is-active' : ''}`}
              aria-expanded={activePanel === 'wardrobe'}
            >
              🏛️ {activePanel === 'wardrobe' ? "Скрыть Зал" : "Зал облачений"}
            </Button>
          </Col>
        </Row>
        
        {activePanel === 'equipment' && (
          <Row className="mb-3">
            <Col>
              <Equipment key={equipmentRevision} />
            </Col>
          </Row>
        )}

        {activePanel === 'wardrobe' && (
          <Row className="mb-3">
            <Col>
              <Wardrobe
                onEquipmentChanged={() => setEquipmentRevision((revision) => revision + 1)}
              />
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
