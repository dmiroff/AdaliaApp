import apiClient from "./apiClient";

const PlayerAuthCheck = async (playerId, token) => {
  try {
    console.log(`🔐 Отправка запроса на сервер: ${SERVER_APP_API_URL}/login`);
    console.log(`📝 Данные: player_id=${playerId}, token=${token}`);
    
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

    console.log(`📡 Ответ сервера: ${response.status}`);
    const data = await response.json();
    console.log('📊 Данные ответа:', data);
    
    if (response.status === 200) {
      if (data.access_token) {
        // Сохраняем токены в localStorage
        localStorage.setItem("id", playerId);
        localStorage.setItem("token", token);
        localStorage.setItem("access_token", data.access_token);
        
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        
        console.log("✅ Токены сохранены в localStorage");
        console.log("📦 localStorage после сохранения:");
        console.log("- id:", localStorage.getItem('id'));
        console.log("- token:", localStorage.getItem('token'));
        console.log("- access_token:", localStorage.getItem('access_token'));
        
        return { success: true, data };
      }
    } else {
      console.error(`❌ Ошибка сервера ${response.status}:`, data);
      return { 
        success: false, 
        error: "SERVER_ERROR",
        message: data.detail || `Ошибка ${response.status}`
      };
    }
  } catch (error) {
    console.error("❌ Ошибка сети:", error);
    return { 
      success: false, 
      error: "NETWORK_ERROR",
      message: "Проблемы с соединением"
    };
  }
};

export default PlayerAuthCheck;