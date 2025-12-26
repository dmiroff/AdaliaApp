import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { TERMS_ROUTE } from '../utils/constants';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-3 mt-5">
      <Container>
        <Row className="justify-content-center">
          <Col xs="auto">
            <Link 
              to={TERMS_ROUTE} 
              className="text-light text-decoration-none border-bottom border-secondary"
            >
              Пользовательское соглашение и политика конфиденциальности
            </Link>
          </Col>
        </Row>
        <Row className="justify-content-center mt-2">
          <Col xs="auto">
            <small className="text-muted">
              © Адалия. Западный Фронтир, {new Date().getFullYear()}
            </small>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};
export default Footer;