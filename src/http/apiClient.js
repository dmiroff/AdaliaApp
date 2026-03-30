import axios from "axios";
import { SERVER_APP_API_URL } from "../utils/constants";

// Создаем единый экземпляр axios
const apiClient = axios.create({
  baseURL: SERVER_APP_API_URL,
  headers: {
    'skip_zrok_interstitial': 'true',
  }
});

// Интерцептор для добавления токена к каждому запросу
apiClient.interceptors.request.use(
  (config) => {
    // Получаем токен из localStorage
    const token = localStorage.getItem('access_token');
    
    // Если токен есть, добавляем его в заголовки
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ответов и обновления токена при 401 ошибке
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Если ошибка 401 и это не повторная попытка
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
          // Пытаемся обновить токен
          const refreshResponse = await axios.post(
            `${SERVER_APP_API_URL}/api/refresh`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${refreshToken}`,
                'skip_zrok_interstitial': 'true'
              }
            }
          );
          
          if (refreshResponse.status === 200) {
            // Сохраняем новый токен
            localStorage.setItem('access_token', refreshResponse.data.access_token);
            
            // Обновляем заголовок запроса
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
            
            // Повторяем оригинальный запрос
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Не удалось обновить токен:', refreshError);
        
        // Если не удалось обновить, делаем logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('id');
        localStorage.removeItem('token');
        
        // Перенаправляем на страницу логина
        if (window.location.pathname !== '/login' && window.location.pathname !== '/auth') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// api.js — дополняем существующий код

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Если в ответе есть поле detail, копируем его в message
    if (error.response?.data?.detail) {
      error.response.data.message = error.response.data.detail;
    }
    return Promise.reject(error);
  }
);

export default apiClient;


/**
 * Применить улучшения персонажа (атрибуты, навыки, таланты)
 * @param {Object} upgrades - Объект с улучшениями
 * @param {Array} upgrades.attributes - Список улучшений атрибутов: [{ attribute: "strength", amount: 2 }]
 * @param {Array} upgrades.skills - Список улучшений навыков: [{ skill: "swords", amount: 1, currency: "points" }]
 * @param {Array} upgrades.talents - Список изученных талантов: [{ talent: "MasterOfBlades" }]
 * @returns {Promise<Object>} Результат операции
 */
 export const CommitUpgrades = async (upgrades) => {
  try {
    const response = await apiClient.post(`/character/upgrade/commit`, upgrades);
    
    return {
      status: response.data.status || response.status,
      data: response.data.data,
      message: response.data.message || "Улучшения успешно применены"
    };
  } catch (error) {
    console.error("Error committing upgrades:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Ошибка применения улучшений",
      data: error.response?.data?.data || {}
    };
  }
};

/**
 * Выполнить тестовую атаку с временными характеристиками
 * @param {Object} tempStats - Объект с изменёнными характеристиками персонажа (полная копия playerData)
 * @returns {Promise<Object>} Результат атаки (диапазон урона, попадание и т.д.)
 */
export const TestAttack = async (tempStats) => {
  try {
    const response = await apiClient.post(`/character/test/attack`, {
      character_data: tempStats
    });
    
    return {
      status: response.data.status || response.status,
      data: response.data.data,
      message: response.data.message || "Тестовая атака выполнена"
    };
  } catch (error) {
    console.error("Error testing attack:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Ошибка тестирования атаки",
      data: error.response?.data?.data || {}
    };
  }
};

/**
 * Выполнить тестовое заклинание с временными характеристиками
 * @param {string|number} spellId - Идентификатор заклинания (название или id)
 * @param {Object} tempStats - Объект с изменёнными характеристиками персонажа (полная копия playerData)
 * @returns {Promise<Object>} Результат заклинания (диапазон урона, эффекты)
 */
export const TestSpell = async (spellId, tempStats) => {
  try {
    const response = await apiClient.post(`/character/test/spell`, {
      spell_id: spellId,
      character_data: tempStats
    });
    
    return {
      status: response.data.status || response.status,
      data: response.data.data,
      message: response.data.message || "Тестовое заклинание выполнено"
    };
  } catch (error) {
    console.error("Error testing spell:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Ошибка тестирования заклинания",
      data: error.response?.data?.data || {}
    };
  }
};

/**
 * Получить предварительный расчёт стоимости улучшений (без применения)
 * @param {Object} upgrades - Те же улучшения, что и в CommitUpgrades
 * @returns {Promise<Object>} Информация о стоимости и возможностях
 */
export const PreviewUpgrades = async (upgrades) => {
  try {
    const response = await apiClient.post(`/character/upgrade/preview`, upgrades);
    
    return {
      status: response.data.status || response.status,
      data: response.data.data,
      message: response.data.message || "Расчёт выполнен"
    };
  } catch (error) {
    console.error("Error previewing upgrades:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Ошибка расчёта улучшений",
      data: error.response?.data?.data || {}
    };
  }
};