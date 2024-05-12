import React from "react";
import { Col, Container, Image, Row, Button } from "react-bootstrap";
import exampleImage from "../assets/Images/Weapon/Кинжал/Громовой Кинжал.png";

const Item = () => {
  const device = {
    id: 1,
    name: "Кинжал",
    price: 5000,
    rating: 5,
    img: "Weapon/Кинжал/Живительный Кинжал.png",
  };
  
  const imageSrc = device.img ? `/assets/Images/${device.img}` : exampleImage;

  return (
    <Container className="mt-4">
      <Row>
        {/* Display the image */}
        <Col md={6}>
          <Image src={imageSrc} fluid />
        </Col>

        {/* Organize buttons in a column with spacing */}
        <Col md={6} className="d-flex flex-column justify-content-center">
          <Button variant="primary" className="mb-2">Надеть</Button>
          <Button variant="success" className="mb-2">Продать</Button>
          <Button variant="danger">Выбросить</Button>
        </Col>
      </Row>

      {/* Display device details below */}
      <Row className="mt-4">
        <Col>
          <div>Имя: {device.name}</div>
          <div>Цена: {device.price}</div>
          <div>Рейтинг: {device.rating}</div>
        </Col>
      </Row>
    </Container>
  );
};

export default Item;
