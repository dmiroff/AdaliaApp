import apiClient from "./apiClient";


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
  const response = await apiClient.get('/event-shop/current');
  return response.data;
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
