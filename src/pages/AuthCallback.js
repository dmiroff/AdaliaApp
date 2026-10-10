import React, { useEffect, useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner } from 'react-bootstrap';
import { Context } from "../index";
import { SERVER_APP_API_URL } from "../utils/constants";

const AuthCallback = () => {
    const { id, token } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(Context);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        const timeout = setTimeout(() => controller.abort(), 15000);
        setError(null);
        const authenticate = async () => {
            if (!/^\d+$/.test(id || '') || !token) {
                setError('invalid');
                clearTimeout(timeout);
                return;
            }
            try {
                const response = await fetch(`${SERVER_APP_API_URL}/login`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', 'skip_zrok_interstitial': 'true'},
                    body: JSON.stringify({player_id: Number(id), token}),
                    signal: controller.signal,
                });
                if (!active) return;
                if ([401, 403].includes(response.status)) {
                    setError('invalid');
                    return;
                }
                if (!response.ok) throw new Error('Login unavailable');
                const data = await response.json();
                if (!active) return;
                // The API also reports rejected credentials inside an HTTP 200 response.
                if ([401, 403].includes(data.status)) {
                    setError('invalid');
                    return;
                }
                if (!data.access_token) throw new Error('Missing access token');
                localStorage.setItem('id', id);
                localStorage.setItem('token', token);
                localStorage.setItem('access_token', data.access_token);
                if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
                else localStorage.removeItem('refresh_token');
                localStorage.setItem('token_timestamp', Date.now().toString());
                user.setUser(Number(id));
                user.setIsAuth(true);
                navigate('/inventory', {replace: true});
            } catch (failure) {
                if (active) setError('connection');
            } finally {
                clearTimeout(timeout);
            }
        };
        authenticate();
        return () => { active = false; clearTimeout(timeout); controller.abort(); };
    }, [id, token, navigate, user, attempt]);

    if (error) return <div className="fantasy-paper p-4 text-center" role="alert">
        <h2>{error === 'invalid' ? 'Ссылка больше не действует' : 'Не удалось подключиться'}</h2>
        <p>{error === 'invalid' ? 'Запросите новую ссылку на приложение в боте.' : 'Проверьте связь и повторите вход по этой ссылке.'}</p>
        {error === 'connection' && <button className="fantasy-btn fantasy-btn-lg" onClick={() => setAttempt(value => value + 1)}>Повторить</button>}
    </div>;

    return <div className="app-loading" role="status" aria-live="polite">
        <div className="app-loading__emblem" aria-hidden="true">A</div>
        <Spinner animation="border" className="app-loading__spinner" />
        <p>Проверяем ссылку из бота…</p>
    </div>;
};
export default AuthCallback;
