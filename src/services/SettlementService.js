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

// Функция для найма юнитов
export const hireUnit = async (guildId, buildingKey, quantity, tier, unitName, unitId = null) => {
  try {
    console.log(`🔄 Запрос найма юнитов для гильдии ${guildId}`);
    
    const requestData = {
      buildingKey: buildingKey,
      quantity: quantity,
      tier: tier,
      unitName: unitName
    };
    
    // Добавляем unitId, если указан
    if (unitId !== null) {
      requestData.unitId = unitId;
    }
    
    const response = await apiClient.post(
      `/guild/${guildId}/settlement/hire-unit`,
      requestData,
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Наем юнитов начат"
    };
  } catch (error) {
    console.error("❌ Ошибка найма юнитов:", error);
    
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
        message: "Эндпоинт не найден. Проверьте URL и параметры запроса",
        data: null
      };
    }
    
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.response?.data?.detail || "Ошибка найма юнитов",
      data: error.response?.data?.data || null
    };
  }
};

// Функция для взятия юнитов из гарнизона
export const takeFromGarrison = async (guildId, unitNameWithTier, amount = 1) => {
  try {
    console.log(`🔄 Запрос взять юнитов из гарнизона: ${unitNameWithTier} x${amount}`);
    
    const response = await apiClient.post(
      `/guild/${guildId}/settlement/take-from-garrison`,
      { 
        unit_name_with_tier: unitNameWithTier,
        amount: amount
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Юниты взяты из гарнизона"
    };
  } catch (error) {
    console.error("❌ Ошибка взятия юнитов из гарнизона:", error);
    
    if (error.response?.status === 404) {
      return {
        status: 404,
        message: "Эндпоинт не найден. Проверьте URL и параметры запроса",
        data: null
      };
    }
    
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.response?.data?.detail || "Ошибка взятия юнитов",
      data: error.response?.data?.data || null
    };
  }
};

// Функция для перемещения юнита в гарнизон
export const moveToGarrison = async (guildId, unitId, amount = 1) => {
  try {
    console.log(`🔄 Запрос перемещения юнита в гарнизон: ${unitId} x${amount}`);
    
    const response = await apiClient.post(
      `/guild/${guildId}/settlement/move-to-garrison`,
      { 
        unit_id: unitId,
        amount: amount
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Юнит перемещен в гарнизон"
    };
  } catch (error) {
    console.error("❌ Ошибка перемещения юнита в гарнизон:", error);
    
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.response?.data?.detail || "Ошибка перемещения юнита",
      data: error.response?.data?.data || null
    };
  }
};

// Добавить предметы в хранилище поселения
export const addItemsToSettlementStorage = async (guildId, items) => {
  try {
    console.log(`🔄 Добавление предметов в хранилище гильдии ${guildId}`);
    
    const response = await apiClient.post(
      `/guild/${guildId}/settlements/storage/add-items`,
      { items: items },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Предметы добавлены в хранилище"
    };
  } catch (error) {
    console.error("❌ Ошибка добавления предметов в хранилище:", error);
    
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.response?.data?.detail || "Ошибка добавления предметов",
      data: error.response?.data?.data || null
    };
  }
};

// Функция для получения данных гарнизона
export const getGarrisonData = async (guildId) => {
  try {
    console.log(`🔄 Запрос данных гарнизона для гильдии ${guildId}`);
    
    const response = await apiClient.get(
      `/guild/${guildId}/settlement/garrison`,
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Данные гарнизона получены"
    };
  } catch (error) {
    console.error("❌ Ошибка получения данных гарнизона:", error);
    
    if (error.response?.status === 404) {
      return {
        status: 404,
        message: "Гарнизон не найден",
        data: null
      };
    }
    
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.response?.data?.detail || "Ошибка загрузки гарнизона",
      data: error.response?.data?.data || null
    };
  }
};

// НОВЫЕ МЕТОДЫ ДЛЯ УПРАВЛЕНИЯ ЮНИТАМИ

// Прогнать юнитов из отряда (удалить навсегда)
export const dischargeFromParty = async (playerId, unitId, amount = 1) => {
  try {
    console.log(`🔄 Запрос прогона юнитов: playerId=${playerId}, unitId=${unitId}, amount=${amount}`);
    
    const response = await apiClient.post(
      `/player/discharge-units`,
      { 
        player_id: playerId,
        unit_id: unitId,
        amount: amount
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Юниты успешно прогнаны"
    };
  } catch (error) {
    console.error("❌ Ошибка прогона юнитов:", error);
    
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.response?.data?.detail || "Ошибка прогона юнитов",
      data: error.response?.data?.data || null
    };
  }
};

// Поместить юнитов в гарнизон поселения
export const storeToGarrison = async (guildId, playerId, unitId, amount = 1) => {
  try {
    console.log(`🔄 Запрос помещения юнитов в гарнизон: guildId=${guildId}, playerId=${playerId}, unitId=${unitId}, amount=${amount}`);
    
    const response = await apiClient.post(
      `/guild/${guildId}/settlement/store-to-garrison`,
      { 
        player_id: playerId,
        unit_id: unitId,
        amount: amount
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Юниты успешно помещены в гарнизон"
    };
  } catch (error) {
    console.error("❌ Ошибка помещения юнитов в гарнизон:", error);
    
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.response?.data?.detail || "Ошибка помещения юнитов в гарнизон",
      data: error.response?.data?.data || null
    };
  }
};

// Обновите объект settlementService
export const settlementService = {
  getSettlementData,
  getBuildingsData,
  constructBuilding,
  addConstructionResources,
  cancelConstruction,
  getBuildingRequirements,
  hireUnit,
  addItemsToSettlementStorage,
  takeFromGarrison,
  moveToGarrison,
  getGarrisonData,
  dischargeFromParty,  // Добавлен новый метод
  storeToGarrison      // Добавлен новый метод
};