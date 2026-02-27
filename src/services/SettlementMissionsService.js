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
const extractErrorMessage = (error, defaultMessage = "Произошла ошибка") => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error.response?.data) {
    const data = error.response.data;
    
    // Обработка Pydantic ошибок валидации
    if (Array.isArray(data.detail)) {
      return data.detail.map(err => err.msg || JSON.stringify(err)).join(', ');
    }
    
    // Обработка вложенных ошибок
    if (data.detail?.msg) {
      return data.detail.msg;
    }
    
    if (data.detail?.message) {
      return data.detail.message;
    }
    
    if (data.detail) {
      return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    }
    
    if (data.message) {
      return data.message;
    }
    
    if (data.msg) {
      return data.msg;
    }
    
    try {
      return JSON.stringify(data);
    } catch {
      return defaultMessage;
    }
  }
  
  if (error.message) {
    return error.message;
  }
  
  if (error.msg) {
    return error.msg;
  }
  
  return defaultMessage;
};

// Сервис для работы с миссиями поселения
class SettlementMissionsService {
  
  /**
   * Получить активные группы в данжах
   * @param {number} guildId - ID гильдии
   */
  async getActiveDungeonGroups(guildId) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: [],
          message: "Требуется авторизация",
          status: 401
        };
      }

      const response = await apiClient.get(
        `/guild/${guildId}/missions/active-groups`,
        { headers }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        message: "Активные группы получены"
      };
    } catch (error) {
      console.error("❌ Ошибка получения активных групп:", error);
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: [],
        message: extractErrorMessage(error, "Не удалось получить активные группы"),
        error: error.response?.data
      };
    }
  }
  
  /**
   * Получить все активные миссии гильдии (данжи + агенты)
   * @param {number} guildId - ID гильдии
   */
  async getActiveMissions(guildId) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: null,
          message: "Требуется авторизация",
          status: 401
        };
      }

      const response = await apiClient.get(
        `/guild/${guildId}/missions/active-missions`,
        { headers }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        message: "Активные миссии получены"
      };
    } catch (error) {
      console.error("❌ Ошибка получения активных миссий:", error);
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: null,
        message: extractErrorMessage(error, "Не удалось получить активные миссии"),
        error: error.response?.data
      };
    }
  }
  
  /**
   * Получить статистику миссий
   * @param {number} guildId - ID гильдии
   * @param {number} days - Количество дней для статистики
   */
  async getMissionStatistics(guildId, days = 7) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: null,
          message: "Требуется авторизация",
          status: 401
        };
      }

      const response = await apiClient.get(
        `/guild/${guildId}/missions/mission-stats`,
        {
          params: { days },
          headers
        }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        message: "Статистика миссий получена"
      };
    } catch (error) {
      console.error("❌ Ошибка получения статистики миссий:", error);
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: null,
        message: extractErrorMessage(error, "Не удалось получить статистику миссий"),
        error: error.response?.data
      };
    }
  }
  
  /**
   * Отправить группу в подземелье
   * @param {number} guildId - ID гильдии
   * @param {number} leaderId - ID лидера группы
   * @param {Array<number>} playerIds - ID игроков в группе
   * @param {number} towerLevel - Уровень башни
   */
  async startDungeonMission(guildId, leaderId, playerIds, towerLevel) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: null,
          message: "Требуется авторизация",
          status: 401
        };
      }

      console.log('🔍 Отправка группы в подземелье:', {
        leader_id: leaderId,
        player_ids: playerIds,
        tower_level: towerLevel
      });

      const response = await apiClient.post(
        `/guild/${guildId}/missions/start-dungeon`,
        {
          leader_id: leaderId,
          player_ids: playerIds,
          tower_level: towerLevel || 1
        },
        { headers }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data.data || response.data,
        message: response.data.message || "Группа отправлена в подземелье"
      };
    } catch (error) {
      console.error("❌ Ошибка отправки группы в данж:", error);
      console.error("📊 Детали ошибки:", error.response?.data);
      
      let message = extractErrorMessage(error, "Не удалось отправить группу в подземелье");
      
      if (error.response?.status === 400) {
        if (error.response.data?.detail?.includes('уже находится в подземелье')) {
          message = 'Один из игроков уже находится в другом подземелье';
        } else if (error.response.data?.detail?.includes('Максимум 5 игроков')) {
          message = 'Максимум 5 игроков в группе';
        }
      }
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: null,
        message,
        error: error.response?.data
      };
    }
  }
  
  /**
   * Получить доступные подземелья для гильдии
   * @param {number} guildId - ID гильдии
   * @param {number} towerLevel - Уровень башни
   */
  async getAvailableDungeons(guildId, towerLevel) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: [],
          message: "Требуется авторизация",
          status: 401
        };
      }

      const response = await apiClient.get(
        `/guild/${guildId}/missions/available-dungeons`,
        {
          params: { tower_level: towerLevel },
          headers
        }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        message: "Доступные подземелья получены"
      };
    } catch (error) {
      console.error("❌ Ошибка получения доступных данжей:", error);
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: [],
        message: extractErrorMessage(error, "Не удалось получить доступные подземелья"),
        error: error.response?.data
      };
    }
  }
  
  /**
   * Отправить героя на миссию - ИСПРАВЛЕННАЯ ВЕРСИЯ
   * @param {number} guildId - ID гильдии
   * @param {Object} missionData - Данные миссии
   */
  async sendHeroMission(guildId, missionData) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: null,
          message: "Требуется авторизация",
          status: 401
        };
      }

      // ВАЖНО: Используем camelCase для полей с алиасами в бекенде
      const requestData = {
        target_type: missionData.target_type || 'region',
        target_id: missionData.target_id,
        mission_type: missionData.mission_type || 'scout',
        heroName: missionData.hero_name,  // camelCase!
        heroSkills: missionData.hero_skills || {},
        heroLevel: missionData.hero_level || 1,
        heroEssenceCost: missionData.hero_essence_cost || 0,
        scoutType: missionData.scout_type || 'standard',
        sabotageTarget: missionData.sabotage_target || null,
        assassinationTarget: missionData.assassination_target || null,
        estimatedDuration: missionData.estimated_duration || 6
      };

      console.log('🔍 Отправка героя, данные:', JSON.stringify(requestData, null, 2));

      const response = await apiClient.post(
        `/guild/${guildId}/missions/send-hero`,
        requestData,
        { headers }
      );
      
      console.log('✅ Герой отправлен успешно:', response.data);
      
      return {
        success: true,
        status: response.status,
        data: response.data.data || response.data,
        message: response.data.message || "Герой отправлен на миссию"
      };
    } catch (error) {
      console.error("❌ Ошибка отправки героя:", error);
      
      // Детальное логирование ошибки
      if (error.response) {
        console.error('📊 Ответ сервера:', error.response.data);
        console.error('📊 Статус:', error.response.status);
        console.error('📊 Заголовки:', error.response.headers);
      }
      
      let message = extractErrorMessage(error, "Не удалось отправить героя");
      
      // Специфические ошибки для пользователя
      if (error.response?.status === 400) {
        if (error.response.data?.detail?.includes('Поселение не известно гильдии')) {
          message = 'Сначала нужно разведать это поселение';
        } else if (error.response.data?.detail?.includes('Неверный регион')) {
          message = 'Выберите корректный регион';
        } else if (error.response.data?.detail?.includes('Герой уже на миссии')) {
          message = 'Этот герой уже находится на другой миссии';
        } else if (error.response.data?.detail?.includes('Герой ранен')) {
          message = 'Этот герой ранен и не может быть отправлен';
        } else if (error.response.data?.detail?.includes('Не хватает воплощений')) {
          message = 'Недостаточно воплощений для призыва героя';
        } else if (error.response.data?.detail?.includes('Не найден герой')) {
          message = 'Герой не найден в поселении';
        } else if (error.response.data?.detail?.includes('Герой не доступен')) {
          message = 'Этот герой в данный момент не доступен';
        } else if (error.response.data?.detail) {
          // Прямой вывод ошибки от сервера
          message = error.response.data.detail;
        }
      }
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: null,
        message,
        error: error.response?.data
      };
    }
  }
  
  /**
   * Получить результаты миссий героев
   * @param {number} guildId - ID гильдии
   * @param {Object} options - Опции запроса
   */
  async getHeroMissionsResults(guildId, options = {}) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: [],
          message: "Требуется авторизация",
          status: 401
        };
      }

      const params = {
        include_hero_data: true,
        ...options
      };
      
      const response = await apiClient.get(
        `/guild/${guildId}/missions/hero-results`,
        {
          params,
          headers
        }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        message: "Результаты миссий героев получены"
      };
    } catch (error) {
      console.error("❌ Ошибка получения результатов миссий героев:", error);
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: [],
        message: extractErrorMessage(error, "Не удалось получить результаты миссий"),
        error: error.response?.data
      };
    }
  }
  
  /**
   * Получить активные миссии героев
   * @param {number} guildId - ID гильдии
   */
  async getActiveHeroMissions(guildId) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: [],
          message: "Требуется авторизация",
          status: 401
        };
      }

      const response = await apiClient.get(
        `/guild/${guildId}/missions/active-hero-missions`,
        { headers }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        message: "Активные миссии героев получены"
      };
    } catch (error) {
      console.error("❌ Ошибка получения активных миссий героев:", error);
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: [],
        message: extractErrorMessage(error, "Не удалось получить активные миссии героев"),
        error: error.response?.data
      };
    }
  }
  
  /**
   * Получить известные поселения гильдии
   * @param {number} guildId - ID гильдии
   */
  async getKnownSettlements(guildId) {
    try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
            success: false,
            data: [],
            message: "Требуется авторизация",
            status: 401
        };
        }

        const response = await apiClient.get(
        `/guild/${guildId}/missions/known-settlements`,
        { headers }
        );

        // response.data – это объект { success, data } от бэкенда
        if (response.data && response.data.success) {
        return {
            success: true,
            status: response.status,
            data: response.data.data,   // <- извлекаем массив поселений
            message: response.data.message || "Известные поселения получены"
        };
        } else {
        return {
            success: false,
            status: response.status,
            data: [],
            message: response.data?.message || "Ошибка получения поселений"
        };
        }
    } catch (error) {
        console.error("❌ Ошибка получения известных поселений:", error);
        return {
        success: false,
        status: error.response?.status || 500,
        data: [],
        message: extractErrorMessage(error, "Не удалось получить известные поселения"),
        error: error.response?.data
        };
    }
    }
  
  /**
   * Получить детальную информацию о поселении
   * @param {number} guildId - ID гильдии
   * @param {number} settlementId - ID поселения
   */
  async getSettlementInfo(guildId, settlementId) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: null,
          message: "Требуется авторизация",
          status: 401
        };
      }

      const response = await apiClient.get(
        `/guild/${guildId}/missions/settlement/${settlementId}/info`,
        { headers }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        message: "Информация о поселении получена"
      };
    } catch (error) {
      console.error("❌ Ошибка получения информации о поселении:", error);
      
      let message = extractErrorMessage(error, "Не удалось получить информацию о поселении");
      
      if (error.response?.status === 404) {
        message = 'Поселение не найдено или не известно гильдии';
      }
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: null,
        message,
        error: error.response?.data
      };
    }
  }
  
  /**
   * Получить список членов гильдии
   * @param {number} guildId - ID гильдии
   */
  async getGuildMembers(guildId) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: [],
          message: "Требуется авторизация",
          status: 401
        };
      }

      const response = await apiClient.get(
        `/guild/${guildId}/missions/guild-members`,
        { headers }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        message: "Члены гильдии получены"
      };
    } catch (error) {
      console.error("❌ Ошибка получения членов гильдии:", error);
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: [],
        message: extractErrorMessage(error, "Не удалось получить членов гильдии"),
        error: error.response?.data
      };
    }
  }
  
  /**
   * Получить информацию о регионах
   */
  async getRegionsInfo() {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: [],
          message: "Требуется авторизация",
          status: 401
        };
      }

      const response = await apiClient.get(
        `/guild/0/missions/regions`,
        { headers }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        message: "Информация о регионах получена"
      };
    } catch (error) {
      console.error("❌ Ошибка получения информации о регионах:", error);
      
      const defaultRegions = [
        {
          id: "coast",
          name: "Побережье",
          description: "Побережье регион",
          typical_resources: { Песок: 30 }
        },
        {
          id: "forest",
          name: "Лес",
          description: "Лес регион",
          typical_resources: { Брёвна: 30 }
        },
        {
          id: "mountains",
          name: "Горы",
          description: "Горы регион",
          typical_resources: { Песчаник: 50, Руда: 80}
        },
        {
          id: "steppe",
          name: "Степь",
          description: "Степь регион",
          typical_resources: { Уголь: 50 }
        }
      ];
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: defaultRegions,
        message: "Используется базовая информация о регионах",
        error: error.response?.data
      };
    }
  }
  
  /**
   * Получить информацию о героях гильдии
   * @param {number} guildId - ID гильдии
   */
  async getGuildHeroes(guildId) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: {},
          message: "Требуется авторизация",
          status: 401
        };
      }

      const response = await apiClient.get(
        `/guild/${guildId}/missions/heroes`,
        { headers }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        message: "Герои гильдии получены"
      };
    } catch (error) {
      console.error("❌ Ошибка получения героев гильдии:", error);
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: {},
        message: extractErrorMessage(error, "Не удалось получить героев гильдии"),
        error: error.response?.data
      };
    }
  }
  
  /**
   * Получить информацию о конкретном герое
   * @param {number} guildId - ID гильдии
   * @param {string} heroName - Имя героя
   */
  async getHeroInfo(guildId, heroName) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: null,
          message: "Требуется авторизация",
          status: 401
        };
      }

      const response = await apiClient.get(
        `/guild/${guildId}/missions/hero/${heroName}`,
        { headers }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        message: "Информация о герое получена"
      };
    } catch (error) {
      console.error("❌ Ошибка получения информации о герое:", error);
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: null,
        message: extractErrorMessage(error, "Не удалось получить информацию о герое"),
        error: error.response?.data
      };
    }
  }
  
  /**
   * Завершить миссию героя
   * @param {number} guildId - ID гильдии
   * @param {number} missionId - ID миссии
   */
  async completeHeroMission(guildId, missionId) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: null,
          message: "Требуется авторизация",
          status: 401
        };
      }

      console.log(`🔍 Завершение миссии ${missionId} для гильдии ${guildId}`);

      const response = await apiClient.post(
        `/guild/${guildId}/missions/complete-hero/${missionId}`,
        {},
        { headers }
      );
      
      console.log('✅ Миссия завершена успешно:', response.data);
      
      return {
        success: true,
        status: response.status,
        data: response.data.data || response.data,
        message: response.data.message || "Миссия героя завершена"
      };
    } catch (error) {
      console.error("❌ Ошибка завершения миссии героя:", error);
      console.error("📊 Детали ошибки:", error.response?.data);
      
      let message = extractErrorMessage(error, "Не удалось завершить миссию героя");
      
      if (error.response?.status === 400) {
        if (error.response.data?.detail?.includes('Миссия еще не завершена')) {
          const completionTime = error.response.data.detail.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
          if (completionTime) {
            message = `Миссия будет завершена в ${completionTime[0]}`;
          }
        } else if (error.response.data?.detail?.includes('Миссия уже завершена')) {
          message = 'Миссия уже завершена';
        } else if (error.response.data?.detail) {
          message = error.response.data.detail;
        }
      }
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: null,
        message,
        error: error.response?.data
      };
    }
  }
  
  /**
   * Отменить миссию героя
   * @param {number} guildId - ID гильдии
   * @param {number} missionId - ID миссии
   */
  async cancelHeroMission(guildId, missionId) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: null,
          message: "Требуется авторизация",
          status: 401
        };
      }

      const response = await apiClient.post(
        `/guild/${guildId}/missions/cancel-hero/${missionId}`,
        {},
        { headers }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data.data || response.data,
        message: response.data.message || "Миссия героя отменена"
      };
    } catch (error) {
      console.error("❌ Ошибка отмены миссии героя:", error);
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: null,
        message: extractErrorMessage(error, "Не удалось отменить миссию героя"),
        error: error.response?.data
      };
    }
  }
  
  /**
   * Отменить прохождение подземелья
   * @param {number} guildId - ID гильдии
   * @param {number} dungeonRunId - ID прохождения данжа
   */
  async abandonDungeon(guildId, dungeonRunId) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: null,
          message: "Требуется авторизация",
          status: 401
        };
      }

      const response = await apiClient.post(
        `/guild/${guildId}/missions/abandon-dungeon/${dungeonRunId}`,
        {},
        { headers }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data.data || response.data,
        message: response.data.message || "Подземелье отменено"
      };
    } catch (error) {
      console.error("❌ Ошибка отмены подземелья:", error);
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: null,
        message: extractErrorMessage(error, "Не удалось отменить подземелье"),
        error: error.response?.data
      };
    }
  }
  
  /**
   * Получить лимиты миссий на сегодня
   * @param {number} guildId - ID гильдии
   * @param {number} towerLevel - Уровень башни
   */
  async getMissionLimits(guildId, towerLevel) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: null,
          message: "Требуется авторизация",
          status: 401
        };
      }

      const response = await apiClient.get(
        `/guild/${guildId}/missions/mission-limits`,
        {
          params: { tower_level: towerLevel },
          headers
        }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        message: "Лимиты миссий получены"
      };
    } catch (error) {
      console.error("❌ Ошибка получения лимитов:", error);
      
      const now = new Date();
      const resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: {
          max_per_day: towerLevel * 2 + 5,
          used_today: 0,
          available: towerLevel * 2 + 5,
          reset_time: resetTime.toISOString()
        },
        message: extractErrorMessage(error, "Используются базовые лимиты"),
        error: error.response?.data
      };
    }
  }
  
  /**
   * Принудительно завершить миссию (для тестирования)
   * @param {number} guildId - ID гильдии
   * @param {number} missionId - ID миссии
   */
  async forceCompleteMission(guildId, missionId) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('❌ Токен не найден');
        return {
          success: false,
          data: null,
          message: "Требуется авторизация",
          status: 401
        };
      }

      console.log(`🔧 Принудительное завершение миссии ${missionId}`);

      const response = await apiClient.post(
        `/guild/${guildId}/missions/force-complete-hero/${missionId}`,
        {},
        { headers }
      );
      
      return {
        success: true,
        status: response.status,
        data: response.data.data || response.data,
        message: response.data.message || "Миссия принудительно завершена"
      };
    } catch (error) {
      console.error("❌ Ошибка принудительного завершения миссии:", error);
      
      let message = extractErrorMessage(error, "Не удалось принудительно завершить миссию");
      
      if (error.response?.status === 404) {
        message = 'Эндпоинт принудительного завершения не найден. Используйте обычное завершение.';
      }
      
      return {
        success: false,
        status: error.response?.status || 500,
        data: null,
        message,
        error: error.response?.data
      };
    }
  }
  
  /**
   * Проверить статус миссий
   * @param {number} guildId - ID гильдии
   */
  async checkMissionStatus(guildId) {
    try {
      const [dungeonsResponse, heroesResponse] = await Promise.allSettled([
        this.getActiveDungeonGroups(guildId),
        this.getActiveHeroMissions(guildId)
      ]);
      
      const activeDungeons = dungeonsResponse.status === 'fulfilled' && dungeonsResponse.value.success
        ? dungeonsResponse.value.data.length
        : 0;
      
      const activeHeroMissions = heroesResponse.status === 'fulfilled' && heroesResponse.value.success
        ? heroesResponse.value.data.length
        : 0;
      
      return {
        activeDungeons,
        activeHeroMissions,
        totalActiveMissions: activeDungeons + activeHeroMissions
      };
    } catch (error) {
      console.error('[Missions] Ошибка проверки статуса:', error);
      return { activeDungeons: 0, activeHeroMissions: 0, totalActiveMissions: 0 };
    }
  }
  
  /**
   * Форматирование времени для отображения
   * @param {string} isoDate - Дата в формате ISO
   * @returns {string} Отформатированное время
   */
  formatMissionTime(isoDate) {
    if (!isoDate) return 'Неизвестно';
    
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = date - now;
    
    if (diffMs <= 0) {
      return 'Завершено';
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}ч ${diffMinutes}м`;
    } else {
      return `${diffMinutes}м`;
    }
  }
  
  /**
   * Получить название типа миссии на русском
   * @param {string} missionType - Тип миссии
   * @returns {string} Название на русском
   */
  getMissionTypeName(missionType) {
    const names = {
      'scout': 'Разведка',
      'assassin': 'Убийство',
      'saboteur': 'Диверсия',
      'spy': 'Шпионаж',
      'trade': 'Торговля',
      'diplomacy': 'Дипломатия'
    };
    return names[missionType] || missionType;
  }
  
  /**
   * Получить название типа разведки на русском
   * @param {string} scoutType - Тип разведки
   * @returns {string} Название на русском
   */
  getScoutTypeName(scoutType) {
    const names = {
      'standard': 'Стандартная',
      'deep': 'Глубокая',
      'stealth': 'Скрытная',
      'resource': 'Поиск ресурсов',
      'settlement': 'Поиск поселений'
    };
    return names[scoutType] || scoutType;
  }
  
  /**
   * Получить название региона на русском
   * @param {string} regionId - ID региона
   * @returns {string} Название на русском
   */
  getRegionName(regionId) {
    const names = {
      'coast': 'Побережье',
      'forest': 'Лес',
      'mountains': 'Горы',
      'steppe': 'Степь',
      'desert': 'Пустыня',
      'swamp': 'Болото',
      'arctic': 'Арктика'
    };
    return names[regionId] || regionId;
  }
  
  /**
   * Получить иконку для типа миссии
   * @param {string} missionType - Тип миссии
   * @returns {string} Emoji иконка
   */
  getMissionTypeIcon(missionType) {
    const icons = {
      'scout': '🕵️',
      'assassin': '🗡️',
      'saboteur': '💣',
      'spy': '👁️',
      'trade': '💰',
      'diplomacy': '🤝'
    };
    return icons[missionType] || '🎯';
  }
  
  /**
   * Получить цвет для статуса миссии
   * @param {string} status - Статус миссии
   * @returns {string} Цвет для Bootstrap
   */
  getMissionStatusColor(status) {
    const colors = {
      'pending': 'secondary',
      'active': 'primary',
      'completed': 'success',
      'failed': 'danger',
      'cancelled': 'warning',
      'returning': 'info'
    };
    return colors[status] || 'light';
  }
  
  /**
   * Получить человеко-читаемое описание статуса миссии
   * @param {string} status - Статус миссии
   * @returns {string} Описание на русском
   */
  getMissionStatusText(status) {
    const texts = {
      'pending': 'Ожидает отправки',
      'active': 'В процессе',
      'completed': 'Завершена',
      'failed': 'Провалена',
      'cancelled': 'Отменена',
      'returning': 'Возвращается'
    };
    return texts[status] || status;
  }
  
  /**
   * Получить иконку для статуса миссии
   * @param {string} status - Статус миссии
   * @returns {string} Класс FontAwesome иконки
   */
  getMissionStatusIcon(status) {
    const icons = {
      'pending': 'fa-clock',
      'active': 'fa-running',
      'completed': 'fa-check-circle',
      'failed': 'fa-times-circle',
      'cancelled': 'fa-ban',
      'returning': 'fa-arrow-left'
    };
    return icons[status] || 'fa-question-circle';
  }
  
  /**
   * Рассчитать шанс успеха миссии на основе навыков героя
   * @param {Object} heroSkills - Навыки героя
   * @param {string} missionType - Тип миссии
   * @returns {number} Шанс успеха в процентах
   */
  calculateSuccessChance(heroSkills, missionType) {
    if (!heroSkills) return 50;
    
    let baseChance = 50;
    
    switch (missionType) {
      case 'scout':
        if (heroSkills.scouting) baseChance += heroSkills.scouting * 10;
        if (heroSkills.stealth) baseChance += heroSkills.stealth * 5;
        break;
      case 'assassin':
        if (heroSkills.assassination) baseChance += heroSkills.assassination * 10;
        if (heroSkills.stealth) baseChance += heroSkills.stealth * 5;
        break;
      case 'saboteur':
        if (heroSkills.sabotage) baseChance += heroSkills.sabotage * 10;
        if (heroSkills.engineering) baseChance += heroSkills.engineering * 5;
        break;
      default:
        if (heroSkills.diplomacy) baseChance += heroSkills.diplomacy * 5;
    }
    
    return Math.min(baseChance, 95);
  }
  
  /**
   * Рассчитать длительность миссии на основе навыков героя
   * @param {Object} heroSkills - Навыки героя
   * @param {string} missionType - Тип миссии
   * @param {number} baseDuration - Базовая длительность в часах
   * @returns {number} Длительность в часах
   */
  calculateMissionDuration(heroSkills, missionType, baseDuration = 6) {
    if (!heroSkills) return baseDuration;
    
    let duration = baseDuration;
    let reduction = 0;
    
    switch (missionType) {
      case 'scout':
        if (heroSkills.scouting) reduction += heroSkills.scouting * 0.5;
        if (heroSkills.speed) reduction += heroSkills.speed * 0.3;
        break;
      case 'assassin':
        if (heroSkills.assassination) reduction += heroSkills.assassination * 0.5;
        if (heroSkills.stealth) reduction += heroSkills.stealth * 0.3;
        break;
      case 'saboteur':
        if (heroSkills.sabotage) reduction += heroSkills.sabotage * 0.5;
        if (heroSkills.engineering) reduction += heroSkills.engineering * 0.3;
        break;
      default:
        if (heroSkills.diplomacy) reduction += heroSkills.diplomacy * 0.3;
    }
    
    duration = Math.max(duration - reduction, 1);
    return Math.round(duration);
  }
}

// Экспортируем singleton
export default new SettlementMissionsService();