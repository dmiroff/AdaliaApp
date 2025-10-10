// src/http/auction.js
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

export const fetchAuctionLots = async () => {
  try {
    const response = await apiClient.get(`/auction/lots`);
    return response.data; // Теперь возвращаем data напрямую, так как бэкенд возвращает массив
  } catch (error) {
    console.error("Error fetching auction lots:", error);
    throw error;
  }
};

export const createAuctionLot = async (lotData) => {
  try {
    const response = await apiClient.post(`/auction/lots`, lotData);
    return response.data;
  } catch (error) {
    console.error("Error creating auction lot:", error);
    throw error;
  }
};

export const placeBid = async (lotId, bidData) => {
  try {
    const response = await apiClient.post(`/auction/lots/${lotId}/bid`, bidData);
    return response.data;
  } catch (error) {
    console.error("Error placing bid:", error);
    throw error;
  }
};

export const buyoutLot = async (lotId) => {
  try {
    const response = await apiClient.post(`/auction/lots/${lotId}/buyout`);
    return response.data;
  } catch (error) {
    console.error("Error buying out lot:", error);
    throw error;
  }
};

export const getBidHistory = async (lotId) => {
  try {
    const response = await apiClient.get(`/auction/lots/${lotId}/bids`);
    return response.data;
  } catch (error) {
    console.error("Error fetching bid history:", error);
    throw error;
  }
};