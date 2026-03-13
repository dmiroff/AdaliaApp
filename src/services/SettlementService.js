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
        message: response.data.message || "Ресурс не найден на складе",
        data: null
      };
    }
    
    if (error.response?.status === 403) {
      return {
        status: 403,
        message: response.data.message || "У вас недостаточно прав для забора ресурсов",
        data: null
      };
    }
    
    if (error.response?.status === 400) {
      return {
        status: 400,
        message: response.data.message || "Некорректный запрос",
        data: null
      };
    }
    
    if (error.response?.status === 422) {
      return {
        status: 422,
        message: response.data.message || "Ошибка валидации данных",
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

// ЭНДПОЙНТ: Получение активных баффов
export const getActiveBuffs = async (guildId) => {
  try {
    // ПРОВЕРКА ТИПА ДАННЫХ
    if (typeof guildId !== 'number' && typeof guildId !== 'string') {
      console.error('❌ Ошибка: guildId должен быть числом или строкой, получен:', guildId);
      return {
        status: 400,
        message: 'Неверный идентификатор гильдии',
        data: null,
        success: false
      };
    }
    
    const normalizedGuildId = String(guildId);
    console.log(`🔄 Запрос активных баффов: guildId=${normalizedGuildId}`);
    
    const response = await apiClient.get(
      `/guild/${normalizedGuildId}/settlement/buffs/active`,
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Активные баффы получены",
      success: response.status === 200
    };
  } catch (error) {
    console.error("❌ Ошибка получения активных баффов:", error);
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: null,
      success: false
    };
  }
};

// ЭНДПОЙНТ: Получение информации для подношений
export const getOfferingInfo = async (guildId) => {
  try {
    console.log(`🔄 Запрос информации для подношений: guildId=${guildId}`);
    
    const response = await apiClient.get(
      `/guild/${guildId}/settlement/totem/offering-info`,
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Информация для подношений получена",
      success: response.status === 200
    };
  } catch (error) {
    console.error("❌ Ошибка получения информации для подношений:", error);
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: null,
      success: false
    };
  }
};

// ЭНДПОЙНТ: Подношение всех доступных реагентов
export const makeOfferingAll = async (guildId, playerId) => {
  try {
    console.log(`🔄 Запрос подношения всех реагентов: guildId=${guildId}, playerId=${playerId}`);
    
    const response = await apiClient.post(
      `/guild/${guildId}/settlement/totem/offering-all`,
      { 
        player_id: playerId
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Подношение всех реагентов выполнено",
      success: response.status === 200 || response.status === 201
    };
  } catch (error) {
    console.error("❌ Ошибка подношения всех реагентов:", error);
    
    if (error.response?.status === 403) {
      return {
        status: 403,
        message: "У вас недостаточно прав для совершения подношения",
        data: null,
        success: false
      };
    }
    
    if (error.response?.status === 404) {
      return {
        status: 404,
        message: "Тотем не построен или гильдия не найдена",
        data: null,
        success: false
      };
    }
    
    if (error.response?.status === 409) {
      return {
        status: 409,
        message: "Достигнут лимит подношений на сегодня",
        data: null,
        success: false
      };
    }
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null,
      success: false
    };
  }
};

// ЭНДПОЙНТ: Подношение по конкретному рецепту
export const makeRecipeOffering = async (guildId, playerId, recipeLevel, quantity = 1) => {
  try {
    console.log(`🔄 Запрос подношения по рецепту: guildId=${guildId}, recipeLevel=${recipeLevel}, quantity=${quantity}`);
    
    const response = await apiClient.post(
      `/guild/${guildId}/settlement/totem/offering-recipe`,
      { 
        player_id: playerId,
        recipe_level: recipeLevel,
        quantity: quantity
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Подношение по рецепту выполнено",
      success: response.status === 200 || response.status === 201
    };
  } catch (error) {
    console.error("❌ Ошибка подношения по рецепту:", error);
    
    if (error.response?.status === 403) {
      return {
        status: 403,
        message: "У вас недостаточно прав для совершения подношения",
        data: null,
        success: false
      };
    }
    
    if (error.response?.status === 404) {
      return {
        status: 404,
        message: "Тотем не построен или гильдия не найдена",
        data: null,
        success: false
      };
    }
    
    if (error.response?.status === 409) {
      return {
        status: 409,
        message: "Достигнут лимит подношений на сегодня",
        data: null,
        success: false
      };
    }
    
    if (error.response?.status === 400) {
      return {
        status: 400,
        message: "Недостаточно ингредиентов или рецепт недоступен",
        data: null,
        success: false
      };
    }
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null,
      success: false
    };
  }
};

// ЭНДПОЙНТ: Проведение ритуала (ОБНОВЛЕННЫЙ - исправлен URL)
export const performRitual = async (guildId, playerId, ritualName, ritualAttribute, cost) => {
  try {
    // ДОБАВЬТЕ ЭТУ ПРОВЕРКУ
    if (typeof guildId !== 'number' && typeof guildId !== 'string') {
      console.error('❌ Ошибка: guildId должен быть числом или строкой, получен:', guildId);
      return {
        status: 400,
        message: 'Неверный идентификатор гильдии',
        data: null,
        success: false
      };
    }
    
    // Также убедимся, что guildId преобразован в число или строку
    const normalizedGuildId = String(guildId);
    
    console.log(`🔄 Запрос проведения ритуала: guildId=${normalizedGuildId}, ritualName=${ritualName}`);
    
    const response = await apiClient.post(
      `/guild/${normalizedGuildId}/settlement/ritual/perform`,
      { 
        player_id: playerId,
        ritual_name: ritualName,
        ritual_attribute: ritualAttribute,
        cost: cost
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Ритуал успешно проведен",
      success: response.status === 200 || response.status === 201
    };
  } catch (error) {
    console.error("❌ Ошибка проведения ритуала:", error);
    
    // Проверяем специфические ошибки на основе бэкенда
    if (error.response?.status === 403) {
      return {
        status: 403,
        message: "У вас недостаточно прав для проведения ритуала",
        data: null,
        success: false
      };
    }
    
    if (error.response?.status === 400) {
      return {
        status: 400,
        message: "Недостаточно ресурсов для ритуала",
        data: null,
        success: false
      };
    }
    
    if (error.response?.status === 404) {
      return {
        status: 404,
        message: "Ритуальное место не построено или ритуал не найден",
        data: null,
        success: false
      };
    }
    
    if (error.response?.status === 409) {
      return {
        status: 409,
        message: "Активное благословение уже действует",
        data: null,
        success: false
      };
    }
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null,
      success: false
    };
  }
};

// ЭНДПОЙНТ: Удаление активного баффа (ОБНОВЛЕННЫЙ)
export const removeBuff = async (guildId, playerId, buffId = null) => {
  try {
    console.log(`🔄 Запрос удаления баффа: guildId=${guildId}, buffId=${buffId}`);
    
    const response = await apiClient.post(
      `/guild/${guildId}/settlement/buffs/remove`,
      { 
        player_id: playerId,
        buff_id: buffId
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Бафф успешно снят",
      success: response.status === 200 || response.status === 201
    };
  } catch (error) {
    console.error("❌ Ошибка удаления баффа:", error);
    
    if (error.response?.status === 403) {
      return {
        status: 403,
        message: "Только лидер и офицеры могут снимать баффы",
        data: null,
        success: false
      };
    }
    
    if (error.response?.status === 404) {
      return {
        status: 404,
        message: "Активный бафф не найден",
        data: null,
        success: false
      };
    }
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null,
      success: false
    };
  }
};

// ЭНДПОЙНТ: Получение данных ритуалов и подношений (ОБНОВЛЕННЫЙ)
export const getRitualsData = async (guildId) => {
  try {
    console.log(`🔄 Запрос данных ритуалов: guildId=${guildId}`);
    
    const response = await apiClient.get(
      `/guild/${guildId}/settlement/rituals`,
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Данные ритуалов получены",
      success: response.status === 200
    };
  } catch (error) {
    console.error("❌ Ошибка получения данных ритуалов:", error);
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: error.response?.data?.data || null,
      success: false
    };
  }
};
export const hireHero = async (guildId, heroName) => {
  try {
    console.log(`🔄 Запрос найма героя для гильдии ${guildId}: ${heroName}`);
    
    // Убедимся, что отправляем правильную структуру
    const response = await apiClient.post(
      `/guild/${guildId}/settlement/hire-hero`,
      {
        hero_name: heroName  // Изменено с heroName на hero_name для соответствия бекенду
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Герой успешно призван"
    };
  } catch (error) {
    console.error("❌ Ошибка найма героя:", error);
    
    // Обработка специфических ошибок
    if (error.response?.status === 401) {
      return {
        status: 401,
        message: "Требуется авторизация",
        data: null
      };
    }
    
    if (error.response?.status === 403) {
      return {
        status: 403,
        message: "У вас недостаточно прав для призыва героев",
        data: null
      };
    }
    
    if (error.response?.status === 404) {
      return {
        status: 404,
        message: "Герой не найден или недоступен",
        data: null
      };
    }
    
    if (error.response?.status === 400) {
      return {
        status: 400,
        message: "Недостаточно воплощений или отсутствует алтарь",
        data: null
      };
    }
    
    if (error.response?.status === 409) {
      return {
        status: 409,
        message: "Герой уже призван",
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
// ========== МИССИИ: ДАНЖИ (ГЛАВНОЕ) ==========

// 1. Отправить группу в случайный данж (через башню)
export const startDungeonMission = async (settlementId, playerIds, towerLevel) => {
  try {
    console.log(`🔄 Отправка группы в данж: settlementId=${settlementId}, players=${playerIds.length}, towerLevel=${towerLevel}`);
    
    const response = await apiClient.post(
      `/guild/${settlementId}/missions/dungeon/start`,
      {
        player_ids: playerIds,
        tower_level: towerLevel
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Группа отправлена в подземелье",
      success: response.status === 200 || response.status === 201
    };
  } catch (error) {
    console.error("❌ Ошибка отправки группы в данж:", error);
    
    if (error.response?.status === 400) {
      return {
        status: 400,
        message: "Недостаточно игроков или лимит миссий исчерпан",
        data: null,
        success: false
      };
    }
    
    if (error.response?.status === 403) {
      return {
        status: 403,
        message: "Разведывательная вышка не построена или недостаточный уровень",
        data: null,
        success: false
      };
    }
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: null,
      success: false
    };
  }
};

// 2. Получить активные группы (готовящиеся или в данже)
export const getActiveDungeonGroups = async (guildId) => {
  try {
    console.log(`🔄 Запрос активных групп данжей: guildId=${guildId}`);
    
    const response = await apiClient.get(
      `/guild/${guildId}/missions/dungeon/active`,
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Активные группы получены",
      success: response.status === 200
    };
  } catch (error) {
    console.error("❌ Ошибка получения активных групп:", error);
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: [],
      success: false
    };
  }
};

// 3. Получить информацию о доступных миссиях (лимиты)
export const getMissionLimits = async (guildId) => {
  try {
    console.log(`🔄 Запрос лимитов миссий: guildId=${guildId}`);
    
    const response = await apiClient.get(
      `/guild/${guildId}/missions/limits`,
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Лимиты миссий получены",
      success: response.status === 200
    };
  } catch (error) {
    console.error("❌ Ошибка получения лимитов миссий:", error);
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: { used_today: 0, max_per_day: 0, available: 0 },
      success: false
    };
  }
};

// 4. Отправить разведчика в регион
export const sendScout = async (guildId, regionType, scoutType = 'standard') => {
  try {
    console.log(`🔄 Отправка разведчика: guildId=${guildId}, region=${regionType}, type=${scoutType}`);
    
    const response = await apiClient.post(
      `/guild/${guildId}/missions/scout/send`,
      {
        region_type: regionType, // 'forest', 'steppe', 'mountains', 'coast'
        scout_type: scoutType
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Разведчик отправлен",
      success: response.status === 200 || response.status === 201
    };
  } catch (error) {
    console.error("❌ Ошибка отправки разведчика:", error);
    
    if (error.response?.status === 400) {
      return {
        status: 400,
        message: "Нет доступных разведчиков или недопустимый регион",
        data: null,
        success: false
      };
    }
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: null,
      success: false
    };
  }
};

// 5. Отправить диверсанта/убийцу во вражеское поселение
export const sendSpecialMission = async (guildId, targetSettlementId, missionType, units = []) => {
  try {
    console.log(`🔄 Спецмиссия: guildId=${guildId}, target=${targetSettlementId}, type=${missionType}`);
    
    const response = await apiClient.post(
      `/guild/${guildId}/missions/special`,
      {
        target_settlement_id: targetSettlementId,
        mission_type: missionType, // 'assassination', 'sabotage'
        units: units
      },
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Спецмиссия начата",
      success: response.status === 200 || response.status === 201
    };
  } catch (error) {
    console.error("❌ Ошибка отправки спецмиссии:", error);
    
    if (error.response?.status === 404) {
      return {
        status: 404,
        message: "Целевое поселение не найдено",
        data: null,
        success: false
      };
    }
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: null,
      success: false
    };
  }
};

// 6. Получить результаты разведки (обнаруженные поселения)
export const getScoutResults = async (guildId) => {
  try {
    console.log(`🔄 Запрос результатов разведки: guildId=${guildId}`);
    
    const response = await apiClient.get(
      `/guild/${guildId}/missions/scout/results`,
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Результаты разведки получены",
      success: response.status === 200
    };
  } catch (error) {
    console.error("❌ Ошибка получения результатов разведки:", error);
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: [],
      success: false
    };
  }
};

// 7. Получить историю всех миссий
export const getMissionsHistory = async (guildId, limit = 20) => {
  try {
    console.log(`🔄 Запрос истории миссий: guildId=${guildId}, limit=${limit}`);
    
    const response = await apiClient.get(
      `/guild/${guildId}/missions/history`,
      {
        params: { limit },
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "История миссий получена",
      success: response.status === 200
    };
  } catch (error) {
    console.error("❌ Ошибка получения истории миссий:", error);
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: [],
      success: false
    };
  }
};

// 8. Получить членов гильдии (для формирования групп)
export const getGuildMembers = async (guildId) => {
  try {
    console.log(`🔄 Запрос членов гильдии: guildId=${guildId}`);
    
    const response = await apiClient.get(
      `/guild/${guildId}/members`,
      {
        headers: getAuthHeaders()
      }
    );
    
    return {
      status: response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Члены гильдии получены",
      success: response.status === 200
    };
  } catch (error) {
    console.error("❌ Ошибка получения членов гильдии:", error);
    
    return {
      status: error.response?.status || 500,
      message: extractErrorMessage(error),
      data: [],
      success: false
    };
  }
};

// Обновленный объект settlementService
export const settlementService = {
  // НОВЫЕ МЕТОДЫ ДЛЯ МИССИЙ
  startDungeonMission,
  getActiveDungeonGroups,
  getMissionLimits,
  sendScout,
  sendSpecialMission,
  getScoutResults,
  getMissionsHistory,
  getGuildMembers,
  
  // СУЩЕСТВУЮЩИЕ МЕТОДЫ (оставляем все остальные)
  getSettlementData,
  getStorageData,
  getBuildingsData,
  getRitualsData,
  getOfferingInfo,
  makeOfferingAll,
  makeRecipeOffering,
  performRitual,
  getActiveBuffs,
  removeBuff,
  startConstruction,
  contributeToConstruction,
  startBuildingConstruction,
  cancelConstruction,
  hireUnit,
  takeFromGarrison,
  moveToGarrison,
  getGarrisonData,
  dischargeFromParty,
  storeToGarrison,
  addItemsToSettlementStorage,
  takeResource,
  storeAllResources,
  getPlayerResources,
  hireHero
};