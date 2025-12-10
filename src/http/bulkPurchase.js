import axios from "axios";
import { SERVER_APP_API_URL } from "../utils/constants";

const apiClient = axios.create({
  baseURL: SERVER_APP_API_URL,
  headers: {
    'skip_zrok_interstitial': 'true',
    'Authorization': `Bearer ${localStorage.getItem("access_token")}`
  }
});

// Дебаунс для поиска (если нужно на фронтенде)
let searchTimeout;

// Функция для поиска предмета по названию
export const searchItemByName = async (itemName) => {
  try {
    // Очищаем предыдущий таймаут
    if (searchTimeout) clearTimeout(searchTimeout);
    
    const response = await apiClient.get(`/items/search?name=${encodeURIComponent(itemName)}`);
    return response.data;
  } catch (error) {
    console.error("Error searching item by name:", error);
    return {
      status: false,
      message: error.response?.data?.detail || "Ошибка при поиске предмета",
      data: []
    };
  }
};

// Дебаунсированная версия поиска (для автоматического поиска при вводе)
export const debouncedSearchItemByName = (itemName, delay = 500) => {
  return new Promise((resolve) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(async () => {
      const result = await searchItemByName(itemName);
      resolve(result);
    }, delay);
  });
};

export const fetchBuyRequests = async () => {
  try {
    const response = await apiClient.get(`/bulk-purchase/requests`);
    console.log("Buy requests API response:", response.data);
    
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && response.data.data) {
      return [response.data.data];
    } else {
      console.warn("Unexpected response format:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching buy requests:", error);
    return [];
  }
};

export const createBuyRequest = async (buyRequestData) => {
  try {
    // Если item_id не передан (ручной ввод), отправляем только item_name
    const requestData = buyRequestData.item_id 
      ? buyRequestData
      : {
          item_name: buyRequestData.item_name,
          buy_price: buyRequestData.buy_price,
          buy_amount: buyRequestData.buy_amount
        };

    const response = await apiClient.post(`/bulk-purchase/requests`, requestData);
    return response.data;
  } catch (error) {
    console.error("Error creating buy request:", error);
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