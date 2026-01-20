import React, { useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PlayerAuthCheck from "../http/PlayerAuthCheck";
import { Context } from "../index";
import { Spinner } from 'react-bootstrap';

const Auth = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(Context);

  useEffect(() => {
    // Если пользователь уже авторизован, перенаправляем в инвентарь
    if (user.IsAuth) {
      navigate("/inventory");
      return;
    }

    // Если нет ID или токена, показываем спиннер
    if (!id || !token) {
      console.log("ℹ️ ID или токен отсутствуют в URL");
      return;
    }

    const authenticateUser = async () => {
      try {
        console.log(`🔐 Попытка аутентификации для ID: ${id}`);
        const auth = await PlayerAuthCheck(id, token);
        
        if (auth) {
          console.log("✅ Аутентификация успешна");
          user.setIsAuth(true);
          user.setUser({ id: id });
          navigate("/inventory");
        } else {
          console.log("❌ Аутентификация не удалась");
          navigate("/notauth");
        }
      } catch (error) {
        console.error("❌ Ошибка во время аутентификации:", error);
        navigate("/notauth");
      }
    };

    authenticateUser();
  }, [id, token, user.IsAuth, navigate, user]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <Spinner animation="border" variant="primary" />
      <span style={{ marginLeft: '10px' }}>Аутентификация...</span>
    </div>
  );
};

export default Auth;