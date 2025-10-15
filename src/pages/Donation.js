// src/pages/Donation.js
import React from 'react';
import Container from "react-bootstrap/esm/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import DonationTab from "../components/DonationTab";

const Donation = () => {
  return (
    <Container className="mt-5 pt-4">
      <Row className="d-flex justify-content-center align-items-center mb-4">
        <Col xs={12} md={10} lg={8}>
          <DonationTab />
        </Col>
      </Row>
    </Container>
  );
};

export default Donation;