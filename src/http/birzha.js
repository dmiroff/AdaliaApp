import axios from "axios";
import { SERVER_APP_API_URL } from "../utils/constants";

const apiClient = axios.create({
  baseURL: SERVER_APP_API_URL,
  headers: {
    'skip_zrok_interstitial': 'true',
    'Authorization': `Bearer ${localStorage.getItem("access_token")}`
  }
});

export const fetchBirzhaRate = async () => {
  try {
    const response = await apiClient.get(`/birzha/rate`);
    return response.data;
  } catch (error) {
    console.error("Error fetching birzha rate:", error);
    throw error;
  }
};

export const buyDaleons = async () => {
  try {
    const response = await apiClient.post(`/birzha/buy`, { amount: 100 });
    return response.data;
  } catch (error) {
    console.error("Error buying daleons:", error);
    throw error;
  }
};

export const sellDaleons = async () => {
  try {
    const response = await apiClient.post(`/birzha/sell`, { amount: 100 });
    return response.data;
  } catch (error) {
    console.error("Error selling daleons:", error);
    throw error;
  }
};

export const fetchBirzhaHistory = async () => {
  try {
    const response = await apiClient.get(`/birzha/history`);
    return response.data;
  } catch (error) {
    console.error("Error fetching birzha history:", error);
    throw error;
  }
};