import React from "react";
import { Card, Col, Image } from "react-bootstrap";
import exampleImage from "../assets/Images/Weapon/Кинжал/Громовой Кинжал.png";
import star from "../assets/Images/coin.jpeg";
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ROUTE } from "../utils/constants"

const InventoryItem = ({ device }) => {
  const imageSrc = device.image ? `/assets/Images/${device.image.split("Images/")[1]}` : exampleImage;
  const navigate = useNavigate();

  return (
    <Col xs={2} md={2}>
      <Card style={{ cursor: "pointer" }} border="dark" className="mt-2" onClick={() => navigate(INVENTORY_ROUTE + "/" + device.id)}>
        <Image src={imageSrc} fluid/>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">{device.value}</div>
          <Image src={star} fluid width={20} height={20}/>
        </div>
        <div className="d-flex align-items-center">{device.name}</div>
        <div className="d-flex align-items-center">{device.count}</div>
      </Card>
    </Col>
  );
};

export default InventoryItem;
