// src/http/eventShopApi.js
import axios from "axios";
import { SERVER_APP_API_URL } from "../utils/constants";

const apiClient = axios.create({
  baseURL: SERVER_APP_API_URL,
  headers: {
    'skip_zrok_interstitial': 'true',
    'Authorization': `Bearer ${localStorage.getItem("access_token")}`
  }
});


export const eventShopPurchase = async (productId, productType, quantity = 1, extraData = {}) => {
  try {
    const requestData = {
      product_id: productId,
      product_type: productType,
      ...(quantity && quantity > 1 && { quantity }),
      ...extraData
    };

    const response = await apiClient.post(`/event-shop/purchase`, requestData);
    return response.data;
  } catch (error) {
    console.error("Error processing event shop purchase:", error);
    
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || "Неизвестная ошибка";
      
      switch (status) {
        case 400:
          if (detail.includes("Недостаточно снежков")) {
            throw new Error("Недостаточно снежков для покупки");
          } else if (detail.includes("Не выбран образ")) {
            throw new Error("Пожалуйста, выберите образ");
          } else if (detail.includes("Максимальное количество")) {
            throw new Error(detail);
          } else if (detail.includes("Количество должно быть")) {
            throw new Error(detail);
          }
          throw new Error(detail);
        case 401:
          throw new Error("Ошибка авторизации. Пожалуйста, войдите заново");
        case 404:
          throw new Error("Товар не найден в событийном магазине");
        case 500:
          throw new Error("Ошибка сервера. Попробуйте позже");
        default:
          throw new Error(detail);
      }
    } else if (error.request) {
      throw new Error("Ошибка сети. Проверьте подключение к интернету");
    } else {
      throw new Error("Неизвестная ошибка при выполнении запроса");
    }
  }
};

export const getCurrentEventShop = async () => {
  try {
    const response = await apiClient.get(`/event-shop/current`);
    return response.data;
  } catch (error) {
    console.error("Error getting current event shop:", error);
    // Возвращаем заглушку при ошибке
    return {
      status: 200,
      event_name: "Зимняя Лавка Чудес",
      event_type: "winter",
      end_date: "2024-01-15",
      products: [
        {
          id: 1,
          name: "Мешок с подарками",
          description: "Тайный мешок, содержащий различные сюрпризы и награды",
          price: 200,
          currency_id: 262,
          currency_name: "Снежок",
          type: "consumable",
          max_quantity: 10,
          image: "🎁"
        },
        {
          id: 2,
          name: "Случайный образ",
          description: "Получите случайный уникальный образ для своего персонажа",
          price: 1000,
          currency_id: 262,
          currency_name: "Снежок",
          type: "cosmetic",
          max_quantity: 1,
          image: "🎭"
        },
        {
          id: 3,
          name: "Заказ образа",
          description: "Выберите конкретный образ из доступной коллекции",
          price: 3000,
          currency_id: 262,
          currency_name: "Снежок",
          type: "cosmetic_selectable",
          max_quantity: 1,
          image: "✨",
          requires_selection: true
        },
        {
          id: 4,
          name: "Очко талантов",
          description: "Дополнительное очко для развития талантов персонажа",
          price: 5000,
          currency_id: 262,
          currency_name: "Снежок",
          type: "talent_point",
          max_quantity: 5,
          image: "⭐"
        }
      ],
      available_images: [
        {id: 1, name: "Ледяной рыцарь", description: "Доспехи из вечного льда", rarity: "epic"},
        {id: 2, name: "Снежная фея", description: "Крылья из инея и снега", rarity: "legendary"},
        {id: 3, name: "Полярный волк", description: "Шкура арктического хищника", rarity: "rare"},
        {id: 4, name: "Новогодний маг", description: "Одеяния праздничного волшебства", rarity: "epic"},
        {id: 5, name: "Морозный лучник", description: "Лук из хрустального льда", rarity: "legendary"}
      ],
      currency: {
        id: 262,
        name: "Снежок",
        emoji: "❄️"
      }
    };
  }
};

export const getEventShopHistory = async () => {
  try {
    const response = await apiClient.get(`/event-shop/history`);
    return response.data;
  } catch (error) {
    console.error("Error getting event shop history:", error);
    throw error;
  }
};
