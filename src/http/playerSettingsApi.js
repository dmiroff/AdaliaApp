import axios from "axios";
import { SERVER_APP_API_URL } from "../utils/constants";

const apiClient = axios.create({
  baseURL: SERVER_APP_API_URL,
  headers: {
    'skip_zrok_interstitial': 'true',
    'Authorization': `Bearer ${localStorage.getItem("access_token")}`
  }
});

export const getPlayerSettings = async () => {
  try {
    const response = await apiClient.get(`/player/settings`);
    return response.data;
  } catch (error) {
    console.error("Error getting player settings:", error);
    throw error;
  }
};

export const updatePlayerSettings = async (settings) => {
  try {
    const response = await apiClient.post(`/player/settings`, settings);
    return response.data;
  } catch (error) {
    console.error("Error updating player settings:", error);
    throw error;
  }
};

export const setCurrentImage = async (imageName) => {
  try {
    const response = await apiClient.post(`/player/settings/image`, { image_name: imageName });
    return response.data;
  } catch (error) {
    console.error("Error setting current image:", error);
    throw error;
  }
};

export const getAvailableImages = async () => {
  try {
    const response = await apiClient.get(`/player/images`);
    return response.data;
  } catch (error) {
    console.error("Error getting available images:", error);
    throw error;
  }
};