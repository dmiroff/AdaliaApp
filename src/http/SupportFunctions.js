
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
      const response = await apiClient.get(`${SERVER_APP_API_URL}/wear/${itemId}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`}
    });
      return response.status === 200 ? response.data : false;
    } catch (error) {
      console.error("Error wearing item:", error);
      return false;
    }
  };

// Define and export the function
export const ThrowItemById = async (itemId, amount) => {
  try {
    const response = await apiClient.get(`${SERVER_APP_API_URL}/throw/${itemId}/${amount}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`}
    });
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error throwing item:", error);
    return false;
  }
};

// Define and export the function
export const SellItemById = async (itemId, amount) => {
  try {
    const response = await apiClient.get(`${SERVER_APP_API_URL}/sell/${itemId}/${amount}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`}
    });
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error selling item:", error);
    return false;
  }
};


// Define and export the function
export const UnwearDataById = async (itemId) => {
  try {
    const response = await apiClient.get(`${SERVER_APP_API_URL}/unwear/${itemId}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`}
    });
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error wearing item:", error);
    return false;
  }
};

// Массовая передача предметов - ГОТОВАЯ ФУНКЦИЯ
export const MassTransferItems = async (recipientName, items) => {
  try {
    console.log('MassTransferItems called with:', { recipientName, items });
    
    const requestData = {
      recipient_name: recipientName,
      items: items.map(item => ({
        item_id: parseInt(item.itemId),
        amount: parseInt(item.quantity)
      }))
    };
    
    console.log('Request data:', requestData);
    
    const response = await apiClient.post(`${SERVER_APP_API_URL}/inventory/mass-transfer`, requestData);
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Mass transfer error details:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

// Массовая продажа предметов - ГОТОВАЯ ФУНКЦИЯ
export const MassSellItems = async (items) => {
  try {
    console.log('MassSellItems called with items:', items);
    
    const requestData = {
      items: items.map(item => ({
        item_id: parseInt(item.itemId),
        amount: parseInt(item.quantity)
      }))
    };
    
    console.log('Request data:', requestData);
    
    const response = await apiClient.post(`${SERVER_APP_API_URL}/inventory/mass-sell`, requestData);
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Mass sell error details:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

// Массовое выбрасывание предметов - ГОТОВАЯ ФУНКЦИЯ
export const MassDropItems = async (items) => {
  try {
    console.log('MassDropItems called with items:', items);
    
    const requestData = {
      items: items.map(item => ({
        item_id: parseInt(item.itemId),
        amount: parseInt(item.quantity)
      }))
    };
    
    console.log('Request data:', requestData);
    
    const response = await apiClient.post(`${SERVER_APP_API_URL}/inventory/mass-drop`, requestData);
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Mass drop error details:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

// Проверка доступности торговли
export const CheckTradeAvailability = async () => {
  try {
    const response = await apiClient.get('/player');
    const playerData = response.data.data;
    
    // Проверяем условия торговли
    const hasLocationAccess = playerData.global_location && 
                             playerData.global_location.includes('Fargos');
    const upgrades = playerData.upgrades || [];
    const hasTrader = upgrades.includes('Торговец');
    
    return hasLocationAccess || hasTrader;
  } catch (error) {
    console.error('Check trade availability error:', error);
    return false;
  }
};

// Вспомогательная функция для поиска игроков по имени (нужно реализовать на бэкенде)
export const SearchPlayers = async (query) => {
  try {
    // Заглушка - нужно будет реализовать на бэкенде
    // const response = await apiClient.get(`/api/players/search?name=${query}`);
    // return response.data;
    
    // Временная заглушка с тестовыми данными
    return [
      { id: 1, name: "Арагорн", level: 45 },
      { id: 2, name: "Леголас", level: 42 },
      { id: 3, name: "Гимли", level: 38 },
      { id: 4, name: "Гэндальф", level: 99 },
      { id: 5, name: "Фродо", level: 12 }
    ].filter(player => 
      player.name.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    console.error('Search players error:', error);
    return [];
  }
};