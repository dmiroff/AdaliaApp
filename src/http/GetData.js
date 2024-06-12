import axios from "axios";
import { SERVER_APP_API_URL } from "../utils/constants";

// Define and export the function
const GetDataById = async (playerId) => {
  try {
    const response = await axios.get(`${SERVER_APP_API_URL}/player/${playerId}`);
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error fetching player data:", error);
    return false;
  }
};

export const GetItemById = async (itemId) => {
  try {
    const response = await axios.get(`${SERVER_APP_API_URL}/item/${itemId}`);
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error fetching player data:", error);
    return false;
  }
};

export default GetDataById;
