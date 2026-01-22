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

export default apiClient;