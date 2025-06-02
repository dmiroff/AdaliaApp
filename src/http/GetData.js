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
const GetDataById = async (playerId) => {
  try {
    const response = await apiClient.get(`/player/${playerId}`);
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error fetching player data:", error);
    return false;
  }
};

export const GetRating = async (playerId) => {
  try {
    const response = await apiClient.get(`/rating/${playerId}`);
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error fetching rating data:", error);
    return false;
  }
};

export const GetGrandGame = async () => {
  try {
    const response = await apiClient.get(`/grandgame`);
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error fetching grand game data:", error);
    return false;
  }
};

export const GetTournament = async (playerId) => {
  try {
    const response = await apiClient.get(`/tournament/${playerId}`);
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error fetching tournament data:", error);
    return false;
  }
};


export const GetItemById = async (itemId) => {
  try {
    const response = await apiClient.get(`/item/${itemId}`);
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error fetching item data:", error);
    return false;
  }
};

export default GetDataById;
