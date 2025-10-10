import axios from "axios";
import { SERVER_APP_API_URL } from "../utils/constants";

const apiClient = axios.create({
  baseURL: SERVER_APP_API_URL,
  headers: {
    'skip_zrok_interstitial': 'true',
    'Authorization': `Bearer ${localStorage.getItem("access_token")}`
  }
});

export const fetchBuyRequests = async () => {
  try {
    const response = await apiClient.get(`/bulk-purchase/requests`);
    console.log("Buy requests API response:", response.data);
    
    // Обрабатываем разные форматы ответа
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && response.data.data) {
      return [response.data.data]; // Если это объект, оборачиваем в массив
    } else {
      console.warn("Unexpected response format:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching buy requests:", error);
    // Возвращаем пустой массив вместо выброса ошибки
    return [];
  }
};

export const createBuyRequest = async (buyRequestData) => {
  try {
    const response = await apiClient.post(`/bulk-purchase/requests`, buyRequestData);
    return response.data;
  } catch (error) {
    console.error("Error creating buy request:", error);
    // Возвращаем объект с ошибкой вместо выброса
    return {
      status: false,
      message: error.response?.data?.detail || "Ошибка при создании заявки"
    };
  }
};

export const sellToBuyRequest = async (requestId, sellData) => {
  try {
    const response = await apiClient.post(`/bulk-purchase/requests/${requestId}/sell`, sellData);
    return response.data;
  } catch (error) {
    console.error("Error selling to buy request:", error);
    return {
      status: false,
      message: error.response?.data?.detail || "Ошибка при продаже предметов"
    };
  }
};

export const cancelBuyRequest = async (requestId) => {
  try {
    const response = await apiClient.delete(`/bulk-purchase/requests/${requestId}`);
    return response.data;
  } catch (error) {
    console.error("Error cancelling buy request:", error);
    return {
      status: false,
      message: error.response?.data?.detail || "Ошибка при отмене заявки"
    };
  }
};

export const getPlayerStorage = async () => {
  try {
    const response = await apiClient.get(`/bulk-purchase/storage`);
    return response.data;
  } catch (error) {
    console.error("Error fetching player storage:", error);
    return {
      status: false,
      message: error.response?.data?.detail || "Ошибка при загрузке склада",
      data: { items: [] }
    };
  }
};

// Обновите функцию collectPurchasedItems для работы со складом
export const collectPurchasedItems = async (itemId, amount = 1) => {
  try {
    const response = await apiClient.post(`/bulk-purchase/storage/collect/${itemId}?amount=${amount}`);
    return response.data;
  } catch (error) {
    console.error("Error collecting items:", error);
    return {
      status: false,
      message: error.response?.data?.detail || "Ошибка при получении предметов"
    };
  }
};