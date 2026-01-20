import { SERVER_APP_API_URL } from "../utils/constants";

const PlayerAuthCheck = async (playerId, token) => {
  try {
    console.log(`🔐 Запрос аутентификации для игрока ID: ${playerId}`);
    
    // Создаем базовый URL для запроса
    const apiUrl = SERVER_APP_API_URL;
    
    const response = await fetch(`${apiUrl}/login`, {
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

    if (response.status === 200) {
      const data = await response.json();
      
      if (data.access_token) {
        // Сохраняем данные в localStorage
        localStorage.setItem("id", playerId);
        localStorage.setItem("token", token);
        localStorage.setItem("access_token", data.access_token);
        
        console.log("✅ Токен сохранен в localStorage");
        return true;
      }
    } else {
      console.error(`❌ Ошибка сервера: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Ошибка проверки авторизации:", error);
    return false;
  }
};

export default PlayerAuthCheck;