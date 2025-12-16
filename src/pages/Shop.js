// src/pages/Shop.js
import React, { useState } from 'react';
import Container from "react-bootstrap/esm/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Tabs, Tab } from "react-bootstrap";
import DonationTab from "../components/DonationTab";
import EventShopTab from "../components/EventShopTab";

const Shop = () => {
  const [activeTab, setActiveTab] = useState("premium");

  return (
    <Container className="mt-5 pt-4">
      <Row className="d-flex justify-content-center align-items-center mb-4">
        <Col xs={12} md={10} lg={8}>
          <div className="fantasy-paper content-overlay mb-4">
            <div className="text-center mb-4">
              <h1 className="fantasy-text-dark mb-3">🏪 Волшебная Лавка Адалии</h1>
              <p className="fantasy-text-muted">
                Приобретайте уникальные предметы, улучшения и эксклюзивные товары событий
              </p>
            </div>

            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="fantasy-tabs mb-4"
              justify
            >
              <Tab 
                eventKey="premium" 
                title={
                  <span>
                    <i className="fas fa-crown me-2"></i>
                    Премиум Магазин
                  </span>
                }
              >
                <div className="mt-3">
                  <DonationTab />
                </div>
              </Tab>
              <Tab 
                eventKey="event" 
                title={
                  <span>
                    <i className="fas fa-snowflake me-2"></i>
                    Зимняя Лавка Чудес
                  </span>
                }
              >
                <div className="mt-3">
                  <EventShopTab />
                </div>
              </Tab>
            </Tabs>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Shop;