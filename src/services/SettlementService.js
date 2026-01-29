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

// Вспомогательная функция для безопасного извлечения сообщения об ошибке
const extractErrorMessage = (error) => {
  // Если error уже строка
  if (typeof error === 'string') {
    return error;
  }
  
  // Если error - это объект response от axios
  if (error.response?.data) {
    const data = error.response.data;
    
    // Обработка Pydantic ошибок валидации
    if (Array.isArray(data.detail)) {
      return data.detail.map(err => err.msg || JSON.stringify(err)).join(', ');
    }
    
    // Обработка вложенных ошибок с полем msg
    if (data.detail?.msg) {
      return data.detail.msg;
    }
    
    // Обработка вложенных ошибок с полем message
    if (data.detail?.message) {
      return data.detail.message;
    }
    
    // Обработка detail как строки
    if (data.detail) {
      return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    }
    
    // Обработка поля message
    if (data.message) {
      return data.message;
    }
    
    // Если есть поле msg
    if (data.msg) {
      return data.msg;
    }
    
    // В крайнем случае, преобразуем весь объект в строку
    try {
      return JSON.stringify(data);
    } catch {
      return "Неизвестная ошибка сервера";
    }
  }
  
  // Если error - это объект Error
  if (error.message) {
    return error.message;
  }
  
  // Если error - это объект с полем msg
  if (error.msg) {
    return error.msg;
  }
  
  // По умолчанию
  return "Неизвестная ошибка";
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
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null
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
      message: extractErrorMessage(error),
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
      message: extractErrorMessage(error),
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
      message: extractErrorMessage(error),
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
      message: extractErrorMessage(error),
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
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null
    };
  }
};

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
      message: extractErrorMessage(error),
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
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null
    };
  }
};

// Забрать ресурс со склада
export const takeResource = async (guildId, playerId, resourceId, quantity) => {
  try {
    console.log(`🔄 Запрос забора ресурса: guildId=${guildId}, playerId=${playerId}, resourceId=${resourceId}, quantity=${quantity}`);
    
    const response = await apiClient.post(
      `/guild/${guildId}/settlement/storage/take`,
      { 
        player_id: playerId,
        resource_id: resourceId,
        quantity: quantity
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Ресурс успешно забран"
    };
  } catch (error) {
    console.error("❌ Ошибка забора ресурса:", error);
    
    // Обработка специфических ошибок
    if (error.response?.status === 404) {
      return {
        status: 404,
        message: "Ресурс не найден на складе",
        data: null
      };
    }
    
    if (error.response?.status === 403) {
      return {
        status: 403,
        message: "У вас недостаточно прав для забора ресурсов",
        data: null
      };
    }
    
    if (error.response?.status === 400) {
      return {
        status: 400,
        message: "Некорректный запрос",
        data: null
      };
    }
    
    if (error.response?.status === 422) {
      return {
        status: 422,
        message: "Ошибка валидации данных",
        data: null
      };
    }
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null
    };
  }
};

// Сложить все ресурсы определенного типа
export const storeAllResources = async (guildId, playerId, resourceType) => {
  try {
    console.log(`🔄 Запрос складывания ресурсов: guildId=${guildId}, playerId=${playerId}, resourceType=${resourceType}`);
    
    const response = await apiClient.post(
      `/guild/${guildId}/settlement/storage/store-all`,
      { 
        player_id: playerId,
        resource_type: resourceType
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Ресурсы успешно сложены"
    };
  } catch (error) {
    console.error("❌ Ошибка складывания ресурсов:", error);
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null
    };
  }
};

// Получить данные склада
export const getStorageData = async (guildId) => {
  try {
    console.log(`🔄 Запрос данных склада для гильдии ${guildId}`);
    
    const response = await apiClient.get(
      `/guild/${guildId}/settlement/storage`,
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Данные склада получены"
    };
  } catch (error) {
    console.error("❌ Ошибка получения данных склада:", error);
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null
    };
  }
};

// Получить ресурсы игрока для складывания
export const getPlayerResources = async (playerId, resourceType = null) => {
  try {
    console.log(`🔄 Запрос ресурсов игрока: playerId=${playerId}, resourceType=${resourceType}`);
    
    const params = {};
    if (resourceType) {
      params.resource_type = resourceType;
    }
    
    const response = await apiClient.get(
      `/player/${playerId}/resources`,
      {
        params,
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Ресурсы игрока получены"
    };
  } catch (error) {
    console.error("❌ Ошибка получения ресурсов игрока:", error);
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null
    };
  }
};

// ПОЛУЧИТЬ ДАННЫЕ О ЗДАНИЯХ (справочные)
export const getBuildingsData = async (guildId) => {
  try {
    const headers = getAuthHeaders();
    const response = await apiClient.get(`/guild/${guildId}/settlement/buildings`, {
      headers
    });
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Данные о зданиях получены"
    };
  } catch (error) {
    console.error("Ошибка получения данных о зданиях:", error);
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: {}
    };
  }
};

// Начать строительство (добавить в очередь без проверки ресурсов)
export const startConstruction = async (guildId, buildingKey, targetLevel) => {
  try {
    console.log(`🏗️ Начало строительства: ${buildingKey} до уровня ${targetLevel}`);
    
    const response = await apiClient.post(
      `/guild/${guildId}/settlement/construct`,
      {
        building: buildingKey,
        level: targetLevel
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Строительство добавлено в очередь"
    };
  } catch (error) {
    console.error("❌ Ошибка начала строительства:", error);
    
    if (error.response) {
      console.error("Детали ошибки:", {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null
    };
  }
};

// Добавить ресурсы к строительству
export const contributeToConstruction = async (guildId, buildingKey, resources = {}, essence = 0) => {
  try {
    console.log(`➕ Добавление ресурсов к стройке ${buildingKey}:`, resources, essence);
    
    const response = await apiClient.post(
      `/guild/${guildId}/settlement/construct/contribute`,
      {
        building: buildingKey,
        resources: resources,
        essence: essence
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Ресурсы добавлены"
    };
  } catch (error) {
    console.error("❌ Ошибка добавления ресурсов:", error);
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null
    };
  }
};

// Начать непосредственное строительство (после сбора всех ресурсов)
export const startBuildingConstruction = async (guildId, buildingKey) => {
  try {
    console.log(`🚀 Запуск строительства: ${buildingKey}`);
    
    const response = await apiClient.post(
      `/guild/${guildId}/settlement/construct/start`,
      {
        building: buildingKey
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Строительство запущено"
    };
  } catch (error) {
    console.error("❌ Ошибка запуска строительства:", error);
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null
    };
  }
};

// Отменить строительство (только для офицеров и главы)
export const cancelConstruction = async (guildId, buildingKey) => {
  try {
    console.log(`❌ Отмена строительства: ${buildingKey}`);
    
    const response = await apiClient.post(
      `/guild/${guildId}/settlement/construct/cancel`,
      {
        building: buildingKey
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Строительство отменено"
    };
  } catch (error) {
    console.error("❌ Ошибка отмены строительства:", error);
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null
    };
  }
};

// Обновляем объект settlementService
export const settlementService = {
  // Основные методы
  getSettlementData,
  getStorageData,
  getBuildingsData,

  // Строительство - новые методы
  startConstruction,
  contributeToConstruction,
  startBuildingConstruction,
  cancelConstruction,

  // Методы для юнитов
  hireUnit,
  takeFromGarrison,
  moveToGarrison,
  getGarrisonData,
  dischargeFromParty,
  storeToGarrison,
  
  // Методы для работы со складом
  addItemsToSettlementStorage,
  takeResource,
  storeAllResources,
  
  // Методы для ресурсов
  getPlayerResources
};