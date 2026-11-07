// src/pages/Map.js
import React, {useState} from 'react';
import {Button} from 'react-bootstrap';
import FrontierMap from '../components/frontier/FrontierMap';
import FrontierEconomy from '../components/frontier/FrontierEconomy';
import {isFrontierObservationHost} from '../components/frontier/observation';
import Container from "react-bootstrap/esm/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import InteractiveMap from "../components/InteractiveMap";

const Map = () => {
  const [region,setRegion]=useState('westlands');
  return (
    <Container className="map-page mt-3">
      <Row className="d-flex justify-content-center align-items-center mb-4">
        <Col xs={12} md={12} lg={12}>
          <h1 className="fantasy-text-gold text-center mb-4">🗺️ Карта Мира</h1>
          <div className="d-flex gap-2 mb-3 flex-wrap"><Button aria-pressed={region==='westlands'} onClick={()=>setRegion('westlands')}>Дикие Земли · секторы</Button><Button aria-pressed={region==='world'} onClick={()=>setRegion('world')}>Карта мира</Button>{isFrontierObservationHost()&&<Button aria-pressed={region==='observation'} onClick={()=>setRegion('observation')}>Армии и казна · Б</Button>}</div>
          {region==='westlands' ? <FrontierMap/> : region==='observation'&&isFrontierObservationHost() ? <FrontierEconomy/> : <InteractiveMap/>}
        </Col>
      </Row>
    </Container>
  );
};

export default Map;