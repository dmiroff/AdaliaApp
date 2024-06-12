import { observer } from "mobx-react-lite";
import { useContext, useEffect, useState } from "react";
import InventoryItem from "./InventoryItem";
import Row from "react-bootstrap/Row";
import { Context } from "../index";
import GetDataById from "../http/GetData";
import { Spinner } from "react-bootstrap";

const InventoryList = observer(() => {
  const { user } = useContext(Context);
  const { selected_type } = user;
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delay, setDelay] = useState(false);
  const user_id = user.user.id;

  useEffect(() => {
    const fetchPlayer = async (user_id) => {
      const playerData = await GetDataById(user_id);
      setPlayerData(playerData.data);
      user.setPlayerInventory(playerData.data.inventory_new);
      user.setPlayer(playerData.data);
      setLoading(false);
    };

    fetchPlayer(user_id);
  }, [user_id, user]);

  useEffect(() => {
    if (playerData) {
      setTimeout(() => {
        setDelay(true);
      }, 1000); // Delay time of 2 seconds
    }
  }, [playerData]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!playerData) {
    return <div>Error: Player data not found</div>;
  }

  const { inventory_new } = playerData;

  const filteredItemsWithKeys = Object.entries(inventory_new).filter(
    ([key, item]) => item.type === selected_type
  );

  if (!Object.keys(inventory_new).length) {
    return <div>Вот инвентарь пустой, он предмет простой</div>;
  }

  if (!delay) {
    return (
      <div className="d-flex justify-content-center align-items-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Row className="d-flex">
      {filteredItemsWithKeys.map(([key, device]) => (
        <InventoryItem key={key} devicekey={key} device={device} />
      ))}
    </Row>
  );
});

export default InventoryList;
