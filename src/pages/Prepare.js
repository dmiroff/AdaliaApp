import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import GetDataById from "../http/GetData"; // Correct relative path
import { Context } from "../index";

const Prepare = () => {
    const { user } = useContext(Context);
    const navigate = useNavigate(); // For programmatic navigation
    const user_id = user.user.id

    useEffect(() => {
        const fetchPlayer = async (user_id) => {
          const player_data = await GetDataById(user_id); // Fetch player data by ID
          //localStorage.setItem("inventory_new", player_data.inventory_new)
          user.setPlayerInventory(player_data.inventory_new); // Update the state with fetched data
          navigate("/inventory"); // Redirect to inventory
        };
    
        fetchPlayer(user_id); // Call the function to fetch the player data when the component is mounted
      }); // Dependency array ensures it runs when `id` changes

  return (
    <div>
      Auth Page - Authenticating...
    </div>
  );
};

export default Prepare;
