import axios from "axios";
import { SERVER_APP_API_URL } from "../utils/constants";

// Create a custom axios instance with default headers
const apiClient = axios.create({
  baseURL: SERVER_APP_API_URL,
  headers: {
    'skip_zrok_interstitial': 'true'
  }
});

// Define and export the function
export const WearDataById = async (playerId, itemId) => {
    try {
      const response = await apiClient.get(`${SERVER_APP_API_URL}/wear/${playerId}/${itemId}`);
      return response.status === 200 ? response.data : false;
    } catch (error) {
      console.error("Error wearing item:", error);
      return false;
    }
  };

// Define and export the function
export const ThrowItemById = async (playerId, itemId, amount) => {
  try {
    const response = await apiClient.get(`${SERVER_APP_API_URL}/throw/${playerId}/${itemId}/${amount}`);
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error throwing item:", error);
    return false;
  }
};

// Define and export the function
export const SellItemById = async (playerId, itemId, amount) => {
  try {
    const response = await apiClient.get(`${SERVER_APP_API_URL}/sell/${playerId}/${itemId}/${amount}`);
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error selling item:", error);
    return false;
  }
};


// Define and export the function
export const UnwearDataById = async (playerId, itemId) => {
  try {
    const response = await apiClient.get(`${SERVER_APP_API_URL}/unwear/${playerId}/${itemId}`);
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error wearing item:", error);
    return false;
  }
};