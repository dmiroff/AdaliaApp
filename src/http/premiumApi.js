import apiClient from "./apiClient";

export const premiumPurchase = async (productId, durationDays = null, quantity = 1) => {
  try {
    const requestData = {
      product_id: productId,
      ...(durationDays && { duration_days: durationDays }),
      ...(quantity && quantity > 1 && { quantity: quantity })
    };

    const response = await apiClient.post(`/premium-purchase`, requestData);
    return response.data;
  } catch (error) {
    console.error("Error processing premium purchase:", error);

    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || "Неизвестная ошибка";

      switch (status) {
        case 400:
          if (detail.includes("Недостаточно")) {
            throw new Error("Недостаточно далеонов для покупки");
          } else if (detail.includes("уже приобретен")) {
            throw new Error("Этот товар уже приобретен");
          } else if (detail.includes("Максимальное количество")) {
            throw new Error(detail);
          } else if (detail.includes("Количество должно быть")) {
            throw new Error(detail);
          }
          throw new Error(detail);
        case 401:
          throw new Error("Ошибка авторизации. Пожалуйста, войдите заново");
        case 404:
          throw new Error("Товар не найден");
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

export const fetchPlayerData = async () => {
  try {
    const response = await apiClient.get(`/player/data`);
    return response.data;
  } catch (error) {
    console.error("Error fetching player data:", error);
    throw error;
  }
};

// Дополнительные методы для работы с премиумом
export const checkPremiumStatus = async () => {
  try {
    const response = await apiClient.get(`/premium/status`);
    return response.data;
  } catch (error) {
    console.error("Error checking premium status:", error);
    throw error;
  }
};

export const getPremiumProducts = async () => {
  try {
    const response = await apiClient.get(`/premium/products`);
    return response.data;
  } catch (error) {
    console.error("Error fetching premium products:", error);
    throw error;
  }
};

// ==============================================
// МЕТОДЫ ДЛЯ РАБОТЫ С ПЛАТЕЖАМИ (Т-Банк, форма)
// ==============================================

/**
 * Создание заказа перед оплатой через форму Т-Банка
 * @param {number} amount - сумма пополнения в далеонах (рублях)
 * @param {string} returnUrl - URL для возврата после оплаты (страница магазина)
 * @returns {Promise<{order_id: string, terminal_key: string, amount: number, description: string}>}
 */
export const createPaymentOrder = async (amount, returnUrl) => {
  const { data } = await apiClient.post('/payment/create', {
    amount,
    return_url: returnUrl,
  });
  return data;
};

/**
 * Проверка статуса платежа по его идентификатору (order_id)
 * @param {string} paymentId - идентификатор платежа (order_id)
 * @returns {Promise<{status: string, amount?: number}>}
 */
export const checkPaymentStatus = async (paymentId) => {
  try {
    const response = await apiClient.get(`/payment/status/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error("Error checking payment status:", error);
    throw error;
  }
};