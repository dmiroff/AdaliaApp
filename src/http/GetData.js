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
const GetDataById = async () => {
  try {
    const response = await apiClient.get(`/player`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`}
    });
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error fetching player data:", error);
    return false;
  }
};

export const GetRating = async () => {
  try {
    const response = await apiClient.get(`/rating`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`}
    });

    console.log(response.data)
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error fetching rating data:", error);
    return false;
  }
};

export const GetGrandGame = async () => {
  try {
    const response = await apiClient.get(`/grandgame`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`}
    });

    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error fetching grand game data:", error);
    return false;
  }
};

export const GetTournament = async () => {
  try {
    const response = await apiClient.get(`/tournament`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`}
    });

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
