import React, { useState, useContext } from "react";
import { Card, Col, Image, Dropdown, DropdownButton } from "react-bootstrap";
import exampleImage from "../assets/Images/WIP.png";
import { Context } from "../index";
import { useNavigate } from "react-router-dom";
import { WearDataById, UnwearDataById } from "../http/SupportFunctions";



const Equipment = ({show}) => {
  const { user } = useContext(Context);
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(null);

  const handleMenuClick = (event, devicekey) => {
    event.stopPropagation();
    setShowMenu(showMenu === devicekey ? null : devicekey);
  };

  const handleInspect = (devicekey) => {
    navigate(`/inventory/${devicekey}`);
  };

  const handleWear = async (devicekey) => {
    const user_id = user.user.id;
    const response = await WearDataById(user_id, devicekey);
    const player_data = response.data;
    user.setPlayerInventory(player_data.inventory_new); // Update the state with fetched data
    user.setPlayer(player_data); // Set player data
  };

  const handleUnWear = async (devicekey) => {
    const user_id = user.user.id;
    const response = await UnwearDataById(user_id, devicekey);
    const player_data = response.data;
    user.setPlayerInventory(player_data.inventory_new); // Update the state with fetched data
    user.setPlayer(player_data); // Set player data
  };

  return (
    <>
      (show && ({user.player.player_equipment.map((device) => (
        <Col xs={3} md={2} className="mb-3" key={device.devicekey}>
          <Card
            style={{ cursor: "pointer" }}
            border="dark"
            className="h-100"
            onClick={() => handleMenuClick(event, device.devicekey)}
          >
            <Image src={exampleImage} fluid className="mb-2" />
            <div style={{ padding: "0.5rem" }}>
              <div>{device.name}</div>
              <div>{device.value}</div>
            </div>
          </Card>
          {showMenu === device.devicekey && (
            <DropdownButton
              show={showMenu}
              onClick={(e) => e.stopPropagation()}
              variant="dark"
              id="inventory-item-dropdown"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1,
              }}
            >
              <Dropdown.Item onClick={() => handleInspect(device.devicekey)}>
                осмотреть
              </Dropdown.Item>
              {device.wearing ? (
                <Dropdown.Item onClick={() => handleUnWear(device.devicekey)}>
                  снять
                </Dropdown.Item>
              ) : (
                <Dropdown.Item onClick={() => handleWear(device.devicekey)}>
                  надеть
                </Dropdown.Item>
              )}
            </DropdownButton>
          )}
        </Col>
      ))}))
    </>
  );
};



export default Equipment;