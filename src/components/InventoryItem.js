// src/components/InventoryItem.js
import React, { useState, useContext } from "react";
import { Card, Col, Image, Dropdown, DropdownButton, Modal, ModalHeader, ModalBody, ModalFooter, Button } from "react-bootstrap";
import exampleImage from "../assets/Images/WIP.png";
import coinIcon from "../assets/Images/coin.jpeg";
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ROUTE } from "../utils/constants";
import { modifyParameter } from "../http/playerUtils"; // Import the utility function
import { Context } from "../index";
import {GetItemById} from "../http/GetData"; // Correct relative path
import classDataToDict from "../utils/Helpers";
import GetDataById from "../http/GetData";

const InventoryItem = ({ devicekey, device }) => {
  const { user } = useContext(Context);
  const player_data = user.player_data;
  const imageSrc = device.image ? `/assets/Images/${device.image.split("Images/")[1]}` : exampleImage;
  const [showModal, setShowModal] = useState(false);
const [modalMessage, setModalMessage] = useState("");
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleMouseEnter = () => {
    setShowDetails(true);
  };

  const handleMouseLeave = () => {
    setShowDetails(false);
  };

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleInspect = () => {
    navigate(INVENTORY_ROUTE + "/" + devicekey);
  };
  const handleSell = () => {
    console.log("sell");
  };
  const handleThrowAway = () => {
    console.log("throw");
  };
  const handleModalClose = () => setShowModal(false);

  const UpdatePlayerData = async (user_id) => {
    const player_data = await GetDataById(user_id); // Fetch player data by ID
    //localStorage.setItem("inventory_new", player_data.inventory_new)
    user.setPlayerInventory(player_data.inventory_new); // Update the state with fetched data
    user.setPlayer(player_data); // Set player data
  };

  const unwearItem = async (itemData, userId, playerData, mode = "unwear", ringSlot = "ring_1", printMessage = true) => {
    const itemName = itemData.name;
    const itemDict = classDataToDict(itemData);
    let message;
    UpdatePlayerData(userId);

    if (!Object.keys(playerData.inventory_new).includes(devicekey)) {
      setModalMessage(`В вашем инвентаре нет выбранного предмета`);
      setShowModal(true);
      return;
    }

    if (mode === "unwear") {
      if (printMessage) {
        message = `Вы снимаете предмет ${itemName}`;
        console.log(message);
      }

      if (itemData.type === "implant") {
        await modifyParameter(userId, itemData.type, {});
      } else if (itemData.type !== "ring") {
        await modifyParameter(userId, itemData.type, {});
      } else {
        await modifyParameter(userId, ringSlot, {});
      }
    } else {
      if (itemData.type !== "ring") {
        console.log(userId, itemData.type, itemDict);
        await modifyParameter(userId, itemData.type, itemDict, true);
      }

      if (printMessage) {
        setModalMessage(message);
        setShowModal(true);
      }
    }

    let multiplicator = 1;
    if (itemData.level_scale) {
      multiplicator += Math.floor(playerData.level / 5);
      if (itemData.level !== undefined) {
        itemData.level = 2 * multiplicator;
      }
    }

    const modificator = mode === "unwear" ? -1 * multiplicator : 1 * multiplicator;
    if (itemData.skill === "shield") {
      const skillMultiplier = await getSkillMultiplier(playerData.shield);
      modificator *= skillMultiplier;
    }

    const itemModificationsList = [
      "defence", "piercing_deduction", "bludge_deduction", "slashing_deduction", 
      "fire_deduction", "electric_deduction", "sound_deduction", "wind_deduction", 
      "sneak_check", "consumable_items", "ice_deduction", "life_deduction", 
      "death_deduction", "power_deduction", "dark_deduction", "light_deduction", 
      "agility", "strength", "constitution", "perception", "intelligence", 
      "wisdom", "charisma", "luck", "initiative", "bloodlust", "rage", 
      "move_cost", "regeneration", "ressurect", "sign_ice", "sign_fire", 
      "sign_electric", "sign_stone", "sign_wind", "sign_sound", "sign_power", 
      "sign_life", "sign_death", "sign_light", "sign_dark"
    ];

    for (const itemModifier of Object.keys(itemData)) {
      if (itemModificationsList.includes(itemModifier)) {
        const modifierValue = itemData[itemModifier];
        if (modifierValue !== "NaN" && modifierValue !== null && modifierValue !== 0 && !Number.isNaN(modifierValue)) {
          console.log(modifierValue);
          const roundedValue = Math.round(modifierValue * modificator);
          console.log(userId, itemModifier, roundedValue);
          if (itemModifier === "defence") {
            await modifyParameter(userId, "current_defence", roundedValue, true);
            await modifyParameter(userId, "equipment_defence_change", roundedValue, true);
          }
          await modifyParameter(userId, itemModifier, roundedValue, true);
        }
      }
    }        

    await calculateParams(playerData);
  };

  const getSkillMultiplier = async (shieldSkill) => {
    // Define this function based on your logic
    return 1; // Placeholder, replace with actual logic
  };

  const calculateParams = async (playerData) => {
    // Define this function to update player parameters accordingly
    console.log("Calculating params for player:", playerData);
  };

  const handleWear = async () => {
    if (!device.is_equippable) {
      setModalMessage("Этот предмет нельзя надеть");
      setShowModal(true);
      return;
    }
    if (device.level && device.level > player_data.level) {
      setModalMessage(`Вы не можете надеть предмет такого уровня (${device.level}).`);
      setShowModal(true);
      return;
    }

    if (device.required_class && device.required_class !== player_data.Character_class) {
      setModalMessage(`Этот предмет не подходит для вашего класса.`);
      setShowModal(true);
      return;
    }    

    const item_type = device.type;

    const fetchItem = async (item_id) => {
      return await GetItemById(item_id); // Fetch item data by ID
    };

    const itemData = await fetchItem(Number(devicekey));
    console.log("itemData", itemData);

    if (item_type === "right_hand" && player_data.right_hand && player_data.right_hand.id === devicekey) {
      console.log("Этот предмет уже на вас надет.");
      return;
    }

    if (item_type === "right_hand") {
      if (player_data.right_hand) {
        await unwearItem(player_data[item_type], player_data.id, player_data, "unwear");
      }
      await unwearItem(itemData, player_data.id, player_data, "wear");
      player_data.right_hand = itemData;
    } else {
      if (player_data[item_type]) {
        await unwearItem(player_data[item_type], player_data.id, player_data, "unwear");
      }
      await unwearItem(itemData, player_data.id, player_data, "wear");
      player_data[item_type] = itemData;
    } // Continue for other item types...

    setModalMessage(`Вы надели предмет: ${device.name}`);
    setShowModal(true);
  };

  return (
    <Col xs={3} md={2} className="mb-3">
      <Card
        style={{ cursor: "pointer", position: "relative" }}
        border="dark"
        className="h-100"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{ position: "relative" }}>
          <Image src={imageSrc} fluid className="mb-2" onClick={handleMenuClick} />
          {showDetails && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "0.5rem",
                background: "rgba(0, 0, 0, 0.5)",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>{device.count}</div>
              <div>
                {device.value}
                <Image src={coinIcon} width={20} height={20} style={{ marginLeft: "0.05rem" }} />
              </div>
            </div>
          )}
        </div>
        {showDetails && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              padding: "0.5rem",
              background: "rgba(0, 0, 0, 0.5)",
              color: "#fff",
            }}
          >
            {device.name}
          </div>
        )}
        {showMenu && (
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
            <Dropdown.Item onClick={handleInspect}>осмотреть</Dropdown.Item>
            <Dropdown.Item onClick={handleWear}>надеть</Dropdown.Item>
            <Dropdown.Item onClick={handleSell}>продать</Dropdown.Item>
            <Dropdown.Item onClick={handleThrowAway}>выкинуть</Dropdown.Item>
          </DropdownButton>
        )}
      </Card>
      <Modal show={showModal} onHide={handleModalClose}>
        <ModalHeader closeButton>
          <Modal.Title>Оповещение</Modal.Title>
        </ModalHeader>
        <ModalBody>{modalMessage}</ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={handleModalClose}>
            Закрыть
          </Button>
        </ModalFooter>
      </Modal>
    </Col>
  );
};

export default InventoryItem;