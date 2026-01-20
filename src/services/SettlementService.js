import axios from "axios";
import { SERVER_APP_API_URL } from "../utils/constants";

const apiClient = axios.create({
  baseURL: SERVER_APP_API_URL,
  headers: {
    'skip_zrok_interstitial': 'true'
  }
});

// Функция для получения заголовков с авторизацией
const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

// Получить данные поселения
export const getSettlementData = async (guildId) => {
  try {
    console.log(`🔄 Запрос данных поселения для гильдии ${guildId}`);
    
    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      console.error('❌ Токен не найден');
      return {
        status: 401,
        message: "Требуется авторизация",
        data: null
      };
    }

    const response = await apiClient.get(`/guild/${guildId}/settlement`, {
      headers
    });
    
    console.log(`✅ Данные поселения получены:`, response.data);
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Данные поселения получены"
    };
  } catch (error) {
    console.error("❌ Ошибка получения данных поселения:", error);
    
    if (error.response?.status === 401) {
      return {
        status: 401,
        message: "Требуется авторизация",
        data: null
      };
    }
    
    if (error.response?.status === 404) {
      return {
        status: 404,
        message: "Поселение не найдено",
        data: null
      };
    }
    
    if (error.response?.status === 422) {
      return {
        status: 422,
        message: "Некорректные параметры запроса",
        data: null
      };
    }
    
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.response?.data?.detail || "Ошибка загрузки данных поселения",
      data: error.response?.data?.data || null
    };
  }
};

// Получить справочные данные о зданиях
export const getBuildingsData = async (guildId) => {
  try {
    console.log(`🔄 Запрос данных о зданиях для гильдии ${guildId}`);
    
    const headers = getAuthHeaders();
    const response = await apiClient.get(`/guild/${guildId}/settlement/buildings`, {
      headers
    });
    
    return {
      status: response.status,
      data: response.data.data,
      message: response.data.message || "Данные о зданиях получены"
    };
  } catch (error) {
    console.error("Ошибка получения данных о зданиях:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Ошибка загрузки данных о зданиях",
      data: {}
    };
  }
};

// Начать строительство/улучшение здания
export const constructBuilding = async (guildId, buildingKey, targetLevel, resourcesSource = 'storage') => {
  try {
    const response = await apiClient.post(`/guild/${guildId}/settlement/construct`, {
      building: buildingKey,
      level: targetLevel,
      resource_source: resourcesSource
    }, {
      headers: getAuthHeaders()
    });
    
    return {
      status: response.status,
      data: response.data.data,
      message: response.data.message || "Строительство начато"
    };
  } catch (error) {
    console.error("Error constructing building:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Ошибка начала строительства",
      data: error.response?.data?.data || {}
    };
  }
};

// Добавить ресурсы к существующей стройке
export const addConstructionResources = async (guildId, buildingKey, resources, source = 'storage') => {
  try {
    const response = await apiClient.post(`/guild/${guildId}/settlement/construction/add-resources`, {
      building: buildingKey,
      resources: resources,
      source: source
    }, {
      headers: getAuthHeaders()
    });
    
    return {
      status: response.status,
      data: response.data.data,
      message: response.data.message || "Ресурсы добавлены"
    };
  } catch (error) {
    console.error("Error adding construction resources:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Ошибка добавления ресурсов",
      data: error.response?.data?.data || {}
    };
  }
};

// Отменить строительство
export const cancelConstruction = async (guildId, buildingKey) => {
  try {
    const response = await apiClient.post(`/guild/${guildId}/settlement/construction/cancel`, {
      building: buildingKey
    }, {
      headers: getAuthHeaders()
    });
    
    return {
      status: response.status,
      data: response.data.data,
      message: response.data.message || "Строительство отменено"
    };
  } catch (error) {
    console.error("Error canceling construction:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Ошибка отмены строительства",
      data: error.response?.data?.data || {}
    };
  }
};

// Получить требования для постройки здания
export const getBuildingRequirements = async (guildId, buildingKey, targetLevel) => {
  try {
    const response = await apiClient.get(`/guild/${guildId}/settlement/building-requirements`, {
      params: {
        building: buildingKey,
        level: targetLevel
      },
      headers: getAuthHeaders()
    });
    
    return {
      status: response.status,
      data: response.data.data,
      message: response.data.message || "Требования получены"
    };
  } catch (error) {
    console.error("Error getting building requirements:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Ошибка получения требований",
      data: error.response?.data?.data || {}
    };
  }
};

export const settlementService = {
  getSettlementData,
  getBuildingsData,
  constructBuilding,
  addConstructionResources,
  cancelConstruction,
  getBuildingRequirements
};