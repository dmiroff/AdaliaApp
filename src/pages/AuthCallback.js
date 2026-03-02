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
            if (!id || !token) {
                navigate('/notauth'); // было /login
                return;
            }

            try {
                const response = await fetch(`${SERVER_APP_API_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        player_id: parseInt(id),
                        token: token,
                    }),
                });
                
                if (response.status === 200) {
                    const data = await response.json();
                    
                    if (data.access_token) {
                        localStorage.setItem('id', id);
                        localStorage.setItem('token', token);
                        localStorage.setItem('access_token', data.access_token);
                        localStorage.setItem('token_timestamp', Date.now().toString());
                        
                        user.setIsAuth(true);
                        user.setUser(parseInt(id));

                        navigate('/inventory', { replace: true });
                    } else {
                        navigate('/notauth'); // было /login
                    }
                } else {
                    navigate('/notauth'); // было /login
                }
            } catch (error) {
                navigate('/notauth'); // было /login
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