import { SERVER_APP_API_URL } from "../utils/constants";
import {$authHost} from '../http/index';

const PlayerLoginWithCredentials = async (username, password) => {
  try {
    const response = await $authHost.post(SERVER_APP_API_URL + '/login-credentials', {
      "username": username,
      "password": password,
    });

    if (response.status === 200 && response.data.access_token) {
      const { access_token, player_id, username: responseUsername, token } = response.data;
      
      // Сохраняем все данные в localStorage
      localStorage.setItem("id", player_id);
      localStorage.setItem("username", responseUsername || username);
      localStorage.setItem("access_token", access_token);
      
      // Сохраняем постоянный токен, если он есть (для будущих авторизаций по ссылке)
      if (token) {
        localStorage.setItem("token", token);
      }
      
      return { 
        success: true, 
        playerId: player_id,
        username: responseUsername || username,
        token: token 
      };
    } else {
      return { 
        success: false, 
        message: response.data?.message || "Authorization failed" 
      };
    }
  } catch (error) {
    console.error("Error during login with credentials:", error);
    
    if (error.response) {
      return { 
        success: false, 
        message: error.response.data?.detail || "Invalid username or password" 
      };
    }
    
    return { 
      success: false, 
      message: "Network error. Please try again." 
    };
  }
};

export default PlayerLoginWithCredentials;