import axios from "axios";
import { SERVER_APP_API_URL } from "../utils/constants";

// Create a custom axios instance with default headers
const apiClient = axios.create({
  baseURL: SERVER_APP_API_URL,
  headers: {
    'skip_zrok_interstitial': 'true',
    'Authorization': `Bearer ${localStorage.getItem("access_token")}`
  }
});

// Define and export the function
export const WearDataById = async (itemId) => {
    try {
      const response = await apiClient.get(`${SERVER_APP_API_URL}/wear/${itemId}`);
      return response.status === 200 ? response.data : false;
    } catch (error) {
      console.error("Error wearing item:", error);
      return false;
    }
  };

// Define and export the function
export const ThrowItemById = async (itemId, amount) => {
  try {
    const response = await apiClient.get(`${SERVER_APP_API_URL}/throw/${itemId}/${amount}`);
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error throwing item:", error);
    return false;
  }
};

// Define and export the function
export const SellItemById = async (itemId, amount) => {
  try {
    const response = await apiClient.get(`${SERVER_APP_API_URL}/sell/${itemId}/${amount}`);
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error selling item:", error);
    return false;
  }
};


// Define and export the function
export const UnwearDataById = async (itemId) => {
  try {
    const response = await apiClient.get(`${SERVER_APP_API_URL}/unwear/${itemId}`);
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error wearing item:", error);
    return false;
  }
};
