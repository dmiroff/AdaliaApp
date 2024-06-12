import axios from "axios";
import { SERVER_APP_API_URL } from "../utils/constants";



// Define and export the function
export const WearDataById = async (playerId, itemId) => {
    console.log(playerId,itemId);
    try {
      const response = await axios.get(`${SERVER_APP_API_URL}/wear/${playerId}/${itemId}`);
      return response.status === 200 ? response.data : false;
    } catch (error) {
      console.error("Error wearing item:", error);
      return false;
    }
  };

// Define and export the function
export const ThrowItemById = async (playerId, itemId, amount) => {
  console.log(playerId,itemId);
  try {
    const response = await axios.get(`${SERVER_APP_API_URL}/throw/${playerId}/${itemId}/${amount}`);
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error throwing item:", error);
    return false;
  }
};


// Define and export the function
export const UnwearDataById = async (playerId, itemId) => {
  console.log(playerId,itemId);
  try {
    const response = await axios.get(`${SERVER_APP_API_URL}/unwear/${playerId}/${itemId}`);
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error wearing item:", error);
    return false;
  }
};