import { Suspense, useState } from 'react';
import Container from "react-bootstrap/esm/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import AuctionTab from "../components/AuctionTab";
import BirzhaTab from "../components/BirzhaTab";
import BulkPurchaseTab from "../components/BulkPurchaseTab"

const Trade = () => {
    const [activeTab, setActiveTab] = useState('auction');
    
    return (
      <Container className="mt-5 pt-4">
        <Row className="d-flex justify-content-center align-items-center mb-4">
          <Col xs={12} md={10} lg={8}>
            <Tabs
              activeKey={activeTab}
              onSelect={(tab) => setActiveTab(tab)}
              className="mb-4 fantasy-tabs"
              justify
            >
              <Tab eventKey="auction" title="🏷️ Аукцион" className="fantasy-tab-content">
                <Suspense fallback={
                  <div className="fantasy-paper p-4 text-center mt-3">
                    <div className="fantasy-text-muted fs-5">Загрузка аукциона...</div>
                  </div>
                }>
                  <AuctionTab />
                </Suspense>
              </Tab>
              
              <Tab eventKey="buyout" title="💰 Скупка" className="fantasy-tab-content">
                <Suspense fallback={
                  <div className="fantasy-paper p-4 text-center mt-3">
                    <div className="fantasy-text-muted fs-5">Загрузка скупки...</div>
                  </div>
                }>
                  <BulkPurchaseTab />
                </Suspense>
              </Tab>
              
              <Tab eventKey="exchange" title="📊 Биржа" className="fantasy-tab-content">
                <Suspense fallback={
                  <div className="fantasy-paper p-4 text-center mt-3">
                    <div className="fantasy-text-muted fs-5">Загрузка биржи...</div>
                  </div>
                }>
                  <BirzhaTab />
                </Suspense>
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>
    );
};

export default Trade;