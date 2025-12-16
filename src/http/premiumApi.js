// src/http/premiumApi.js
import axios from "axios";
import { SERVER_APP_API_URL } from "../utils/constants";

const apiClient = axios.create({
  baseURL: SERVER_APP_API_URL,
  headers: {
    'skip_zrok_interstitial': 'true',
    'Authorization': `Bearer ${localStorage.getItem("access_token")}`
  }
});

export const premiumPurchase = async (productId, durationDays = null, quantity = 1) => {
  try {
    const requestData = {
      product_id: productId,
      ...(durationDays && { duration_days: durationDays }),
      ...(quantity && quantity > 1 && { quantity: quantity }) // Добавляем количество только если больше 1
    };

    const response = await apiClient.post(`/premium-purchase`, requestData);
    return response.data;
  } catch (error) {
    console.error("Error processing premium purchase:", error);
    
    // Более детальная обработка ошибок
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || "Неизвестная ошибка";
      
      switch (status) {
        case 400:
          if (detail.includes("Недостаточно")) {
            throw new Error("Недостаточно далеонов для покупки");
          } else if (detail.includes("уже приобретен")) {
            throw new Error("Этот товар уже приобретен");
          } else if (detail.includes("Максимальное количество")) {
            throw new Error(detail);
          } else if (detail.includes("Количество должно быть")) {
            throw new Error(detail);
          }
          throw new Error(detail);
        case 401:
          throw new Error("Ошибка авторизации. Пожалуйста, войдите заново");
        case 404:
          throw new Error("Товар не найден");
        case 500:
          throw new Error("Ошибка сервера. Попробуйте позже");
        default:
          throw new Error(detail);
      }
    } else if (error.request) {
      throw new Error("Ошибка сети. Проверьте подключение к интернету");
    } else {
      throw new Error("Неизвестная ошибка при выполнении запроса");
    }
  }
};

export const fetchPlayerData = async () => {
  try {
    const response = await apiClient.get(`/player/data`);
    return response.data;
  } catch (error) {
    console.error("Error fetching player data:", error);
    throw error;
  }
};

// Дополнительные методы для работы с премиумом
export const checkPremiumStatus = async () => {
  try {
    const response = await apiClient.get(`/premium/status`);
    return response.data;
  } catch (error) {
    console.error("Error checking premium status:", error);
    throw error;
  }
};

export const getPremiumProducts = async () => {
  try {
    const response = await apiClient.get(`/premium/products`);
    return response.data;
  } catch (error) {
    console.error("Error fetching premium products:", error);
    throw error;
  }
};