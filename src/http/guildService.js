// guildService.js - обновленная версия
import axios from "axios";
import { SERVER_APP_API_URL } from "../utils/constants";

const apiClient = axios.create({
  baseURL: SERVER_APP_API_URL,
  headers: {
    'skip_zrok_interstitial': 'true'
  }
});

// Получить полные данные гильдии (с деталями всех участников)
export const GetGuildData = async () => {
  try {
    const response = await apiClient.get(`/guild`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
    });
    
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
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Ошибка сервера при загрузке данных гильдии",
      data: error.response?.data?.data || {}
    };
  }
};

// Получить данные таблицы лидеров гильдии
export const GetGuildLeaderboard = async () => {
  try {
    const response = await apiClient.get(`/guild/leaderboard`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
    });
    
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
    }, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
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
    const response = await apiClient.post(`/guild/actions/leave`, {}, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
    });
    
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
    }, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
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

// Действия с заявками
export const GuildRequestAction = async (action, applicantName) => {
  try {
    const response = await apiClient.post(`/guild/request/action`, {
      action: action,
      applicant_name: applicantName
    }, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
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

// Резервная функция получения деталей участника
export const GetGuildMemberDetails = async (memberId) => {
  try {
    const response = await apiClient.get(`/guild/member/${memberId}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
    });
    
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
    const response = await apiClient.put(`/guild/settings`, settings, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
    });
    
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
      player_name: playerName
    }, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
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
      message: error.response?.data?.message || "Ошибка отправки приглашения",
      data: error.response?.data?.data || {}
    };
  }
};

// ФИКС: Убрать дублирование /api в URL
export const GetCastleStorage = async (castleId) => {
  try {
    const response = await apiClient.get(`/guild/castles/${castleId}/storage`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
    });
    
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
    }, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
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
    }, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
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

// Обновить описание гильдии
export const UpdateGuildDescription = async (description) => {
  try {
    const response = await apiClient.put(`/guild/description`, {
      description: description
    }, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
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
    const response = await apiClient.delete(`/guild/disband`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
    });
    
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