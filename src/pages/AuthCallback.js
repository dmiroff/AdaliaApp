import React, { useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner } from 'react-bootstrap';
import { Context } from "../index";
import { SERVER_APP_API_URL } from "../utils/constants";

const AuthCallback = () => {
    const { id, token } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(Context);

    useEffect(() => {
        const authenticate = async () => {
            console.log(`🔐 Авторизация через путь: id=${id}, token=${token}`);
            console.log(`🌐 Бэкенд URL: ${SERVER_APP_API_URL}`);
            
            if (!id || !token) {
                console.error('❌ Неверные параметры авторизации');
                navigate('/auth');
                return;
            }

            try {
                // Используем SERVER_APP_API_URL для запроса
                const response = await fetch(`${SERVER_APP_API_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'skip_zrok_interstitial': 'true'
                    },
                    body: JSON.stringify({
                        player_id: parseInt(id),
                        token: token,
                    }),
                });

                console.log(`📡 Статус ответа: ${response.status}`);
                const data = await response.json();
                console.log('📊 Ответ от бэкенда:', data);

                if (response.status === 200 && data.access_token) {
                    // Сохраняем токены
                    localStorage.setItem('id', id);
                    localStorage.setItem('token', token);
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('token_timestamp', Date.now().toString());
                    
                    // Сохраняем refresh_token, если он есть в ответе
                    if (data.refresh_token) {
                        localStorage.setItem('refresh_token', data.refresh_token);
                    }
                    
                    // Обновляем состояние пользователя
                    user.setIsAuth(true);
                    user.setUser(parseInt(id));
                    
                    console.log('✅ Авторизация успешна, перенаправляем на /inventory');
                    navigate('/inventory', { replace: true });
                } else {
                    console.error('❌ Ошибка авторизации:', data.message || data.detail);
                    navigate('/login', { 
                        state: { 
                            error: data.message || data.detail || 'Ошибка авторизации' 
                        } 
                    });
                }
            } catch (error) {
                console.error('❌ Ошибка сети:', error);
                navigate('/login', { 
                    state: { 
                        error: 'Ошибка сети. Проверьте подключение.' 
                    } 
                });
            }
        };

        authenticate();
    }, [id, token, navigate, user]);

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            padding: '20px',
            flexDirection: 'column',
            textAlign: 'center'
        }}>
            <Spinner animation="border" variant="primary" />
            <h4 className="mt-3">Авторизация...</h4>
            <p className="text-muted">
                Идентификатор: {id}<br/>
                Проверка токена...
            </p>
        </div>
    );
};

export default AuthCallback;