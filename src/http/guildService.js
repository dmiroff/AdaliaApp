import apiClient from "./apiClient";

// Флаг для предотвращения множественных одновременных обновлений токена
let isRefreshing = false;
let failedQueue = [];

// Очередь для запросов, которые нужно повторить после обновления токена
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Функция для обновления токена
const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    
    const response = await apiClient.post(`/refresh`, {}, {
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (response.status === 200 && response.data.access_token) {
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("token_timestamp", Date.now().toString());
      return response.data.access_token;
    }
  } catch (error) {
    console.error("❌ Ошибка обновления токена:", error);
    // Очищаем localStorage при ошибке обновления
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_timestamp");
    throw error;
  }
};

// Добавляем интерцептор запросов для автоматической подстановки токена
apiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("access_token");
    const tokenTimestamp = localStorage.getItem("token_timestamp");
    
    // Проверяем, не устарел ли токен (больше 5 минут)
    if (token && tokenTimestamp) {
      const now = Date.now();
      const tokenAge = now - parseInt(tokenTimestamp);
      
      // Если токен старше 5 минут, обновляем его
      if (tokenAge > 5 * 60 * 60 * 1000) {
        console.log("🔄 Токен устарел, обновляем перед запросом...");
        try {
          const newToken = await refreshToken();
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (error) {
          console.error("Не удалось обновить токен перед запросом");
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем интерцептор ответов для обработки 401 ошибок
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Если получили 401 и это не запрос на обновление токена
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      
      // Если уже обновляем токен, добавляем запрос в очередь
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Пытаемся обновить токен
        const newToken = await refreshToken();
        
        // Обновляем заголовок исходного запроса
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Обрабатываем очередь запросов
        processQueue(null, newToken);
        
        // Повторяем исходный запрос с новым токеном
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Если не удалось обновить токен, очищаем очередь с ошибкой
        processQueue(refreshError, null);
        
        // Если у нас есть fallback логин с оригинальным токеном
        const playerId = localStorage.getItem("id");
        const token = localStorage.getItem("token");
        
        if (playerId && token) {
          console.log("🔄 Пробуем повторный логин с оригинальным токеном...");
          try {
            const loginResponse = await apiClient.post(`/login`, {
              player_id: parseInt(playerId),
              token: token
            }, {
              headers: {
                'Content-Type': 'application/json',
                'skip_zrok_interstitial': 'true'
              }
            });
            
            if (loginResponse.status === 200 && loginResponse.data.access_token) {
              localStorage.setItem("access_token", loginResponse.data.access_token);
              localStorage.setItem("token_timestamp", Date.now().toString());
              
              // Обновляем заголовок и повторяем запрос
              originalRequest.headers.Authorization = `Bearer ${loginResponse.data.access_token}`;
              return apiClient(originalRequest);
            }
          } catch (loginError) {
            console.error("❌ Не удалось выполнить повторный логин:", loginError);
          }
        }
        
        // Все попытки не удались, выбрасываем ошибку
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// Вспомогательная функция для проверки валидности токена
export const verifyToken = async () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return false;
    
    const response = await apiClient.get(`/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.status === 200;
  } catch (error) {
    console.error("❌ Ошибка проверки токена:", error);
    return false;
  }
};

export const GetGuildData = async () => {
  try {
    // Проверим наличие токена перед запросом
    const token = localStorage.getItem("access_token");
    if (!token) {
      return {
        status: 401,
        message: "Токен отсутствует. Пожалуйста, войдите снова.",
        data: { has_guild: false }
      };
    }
    
    const response = await apiClient.get(`/guild`);
    
    if (response.status === 200) {
      return {
        status: response.data.status || 200,
        data: response.data.data,
        message: response.data.message || "Данные гильдии успешно загружены"
      };
    }
    
    return {
      status: response.status || 500,
      data: response.data?.data || {},
      message: response.data?.message || "Ошибка при получении данных гильдии"
    };
  } catch (error) {
    console.error("Error fetching guild data:", error);
    
    // Более детальная обработка ошибок
    if (error.response) {
      switch (error.response.status) {
        case 401:
          return {
            status: 401,
            message: "Сессия истекла. Пожалуйста, войдите снова.",
            data: { has_guild: false }
          };
        case 422:
          return {
            status: 422,
            message: "Неверный токен. Пожалуйста, войдите снова.",
            data: { has_guild: false }
          };
        default:
          return {
            status: error.response.status,
            message: error.response.data?.message || "Ошибка сервера при загрузке данных гильдии",
            data: error.response.data?.data || {}
          };
      }
    }
    
    return {
      status: 500,
      message: "Сетевая ошибка при загрузке данных гильдии",
      data: {}
    };
  }
};

// Остальные функции остаются БЕЗ ИЗМЕНЕНИЙ, так как они используют тот же apiClient
// Получить данные таблицы лидеров гильдии
export const GetGuildLeaderboard = async () => {
  try {
    const response = await apiClient.get(`/guild/leaderboard`);
    
    if (response.status === 200) {
      return {
        status: response.data.status || 200,
        data: response.data.data,
        message: response.data.message || "Данные таблицы лидеров получены"
      };
    }
    
    return {
      status: response.status || 500,
      data: response.data?.data || {},
      message: response.data?.message || "Ошибка при получении таблицы лидеров"
    };
  } catch (error) {
    console.error("Error fetching guild leaderboard:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Ошибка сервера",
      data: error.response?.data?.data || {}
    };
  }
};

// Создать гильдию
export const CreateGuild = async (guildName, description = "") => {
  try {
    const response = await apiClient.post(`/guild/actions/create`, {
      name: guildName,
      description: description
    });
    
    return {
      status: response.data.status || response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Гильдия создана"
    };
  } catch (error) {
    console.error("Error creating guild:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Неизвестная ошибка при создании гильдии",
      data: error.response?.data?.data || {}
    };
  }
};

// Выйти из гильдии
export const LeaveGuild = async () => {
  try {
    const response = await apiClient.post(`/guild/actions/leave`, {});
    
    return {
      status: response.data.status || response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Выход из гильдии выполнен"
    };
  } catch (error) {
    console.error("Error leaving guild:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Неизвестная ошибка",
      data: error.response?.data?.data || {}
    };
  }
};

// Действия с участниками гильдии
export const GuildMemberAction = async (action, playerName) => {
  try {
    const response = await apiClient.post(`/guild/member/action`, {
      action: action,
      player_name: playerName
    });
    
    return {
      status: response.data.status || response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Действие выполнено"
    };
  } catch (error) {
    console.error(`Error performing ${action} on member:`, error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Не удалось выполнить действие",
      data: error.response?.data?.data || {}
    };
  }
};

// Остальные функции остаются без изменений...

// Действия с заявками
export const GuildRequestAction = async (action, applicantName) => {
  try {
    const response = await apiClient.post(`/guild/request/action`, {
      action: action,
      applicant_name: applicantName
    });
    
    return {
      status: response.data.status || response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Действие с заявкой выполнено"
    };
  } catch (error) {
    console.error(`Error performing ${action} on request:`, error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Неизвестная ошибка",
      data: error.response?.data?.data || {}
    };
  }
};

// ФИКС: Убрать дублирование /api в URL
export const GetCastleStorage = async (castleId) => {
  try {
    const response = await apiClient.get(`/guild/castles/${castleId}/storage`);
    
    return {
      status: response.data.status || 200,
      data: response.data,
      message: response.data.message || "Данные хранилища получены"
    };
  } catch (error) {
    console.error('Error fetching castle storage:', error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || 'Ошибка загрузки хранилища замка',
      data: error.response?.data?.data || {}
    };
  }
};

export const TransferToCastleStorage = async (castleId, items) => {
  try {
    const response = await apiClient.post(`/guild/castles/${castleId}/storage/transfer-to`, {
      items
    });
    
    return {
      status: response.data.status || 200,
      data: response.data,
      message: response.data.message || "Предметы перенесены"
    };
  } catch (error) {
    console.error('Error transferring to castle storage:', error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || 'Ошибка переноса предметов в замок',
      data: error.response?.data?.data || {}
    };
  }
};

export const TransferFromCastleStorage = async (castleId, items) => {
  try {
    const response = await apiClient.post(`/guild/castles/${castleId}/storage/transfer-from`, {
      items
    });
    
    return {
      status: response.data.status || 200,
      data: response.data,
      message: response.data.message || "Предметы изъяты"
    };
  } catch (error) {
    console.error('Error transferring from castle storage:', error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || 'Ошибка изъятия предметов из замка',
      data: error.response?.data?.data || {}
    };
  }
};

// Остальные функции остаются без изменений...
// Обновить описание гильдии
export const UpdateGuildDescription = async (description) => {
  try {
    const response = await apiClient.put(`/guild/description`, {
      description: description
    });
    
    return {
      status: response.data.status || response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Описание гильдии обновлено"
    };
  } catch (error) {
    console.error("Error updating guild description:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Ошибка обновления описания гильдии",
      data: error.response?.data?.data || {}
    };
  }
};

// Распустить гильдию (только для лидера)
export const DisbandGuild = async () => {
  try {
    const response = await apiClient.delete(`/guild/disband`);
    
    return {
      status: response.data.status || response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Гильдия распущена"
    };
  } catch (error) {
    console.error("Error disbanding guild:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Ошибка при роспуске гильдии",
      data: error.response?.data?.data || {}
    };
  }
};

// Резервная функция получения деталей участника
export const GetGuildMemberDetails = async (memberId) => {
  try {
    const response = await apiClient.get(`/guild/member/${memberId}`);
    
    return {
      status: response.data.status || response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Данные участника получены"
    };
  } catch (error) {
    console.error("Ошибка получения деталей участника:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Ошибка сервера",
      data: error.response?.data?.data || {}
    };
  }
};

// Обновить настройки гильдии
export const UpdateGuildSettings = async (settings) => {
  try {
    const response = await apiClient.put(`/guild/settings`, settings);
    
    return {
      status: response.data.status || response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Настройки обновлены"
    };
  } catch (error) {
    console.error("Error updating guild settings:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Ошибка обновления настроек",
      data: error.response?.data?.data || {}
    };
  }
};

// Пригласить игрока в гильдию
export const InviteToGuild = async (playerName) => {
  try {
    const response = await apiClient.post(`/guild/invite`, {
      player_name: playerName.trim()
    });
    
    return {
      status: response.data.status || response.status,
      data: response.data.data || response.data,
      message: response.data.message || "Приглашение отправлено"
    };
  } catch (error) {
    console.error("Error inviting player to guild:", error);
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.detail || error.response?.data?.message || "Ошибка отправки приглашения",
      data: error.response?.data?.data || {}
    };
  }
};