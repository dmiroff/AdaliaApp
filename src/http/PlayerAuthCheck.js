import { SERVER_APP_API_URL } from "../utils/constants";

const PlayerAuthCheck = async (playerId, token) => {
  try {
    const response = await fetch(`${SERVER_APP_API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'skip_zrok_interstitial': 'true'
      },
      body: JSON.stringify({
        "player_id": parseInt(playerId),
        "token": token,
      })
    });

    const data = await response.json();
    
    if (response.status === 200) {
      if (data.access_token) {
        // Сохраняем токены в localStorage
        localStorage.setItem("id", playerId);
        localStorage.setItem("token", token);
        localStorage.setItem("access_token", data.access_token);
        
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        
        return { success: true, data };
      }
    } else {
      return { 
        success: false, 
        error: "SERVER_ERROR",
        message: data.detail || `Ошибка ${response.status}`
      };
    }
  } catch (error) {
    console.error("Ошибка проверки авторизации:", error);
    return { 
      success: false, 
      error: "NETWORK_ERROR",
      message: "Проблемы с соединением"
    };
  }
};

export default PlayerAuthCheck;
