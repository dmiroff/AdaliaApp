import React, { useContext, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Context } from "../index";
import { authRoutes, publicRoutes } from "../routes";
import { observer } from "mobx-react-lite";
import { Spinner } from "react-bootstrap";
import { SERVER_APP_API_URL } from "../utils/constants";

// Ленивые импорты
const Auth = React.lazy(() => import('../pages/Auth'));
const Admin = React.lazy(() => import('../pages/Admin'));
const Inventory = React.lazy(() => import('../pages/Inventory'));
const Character = React.lazy(() => import('../pages/Character'));
const Rating = React.lazy(() => import('../pages/Rating'));
const Prepare = React.lazy(() => import('../pages/Prepare'));
const Trade = React.lazy(() => import('../pages/Trade'));
const Map = React.lazy(() => import('../pages/Map'));
const Donation = React.lazy(() => import('../pages/Shop'));
const Login = React.lazy(() => import('../pages/NotAuth'));
const ItemPage = React.lazy(() => import('../pages/ItemPage'));
const Guild = React.lazy(() => import('../pages/Guild'));
const TermsAndPrivacyPage = React.lazy(() => import('../pages/TermsAndPrivacyPage'));
const AuthCallback = React.lazy(() => import('../pages/AuthCallback'));

const AppRouter = observer(() => {
    const { user } = useContext(Context);
    const location = useLocation();
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(true);
    const [authError, setAuthError] = useState(null);

    // Функция для проверки валидности access token
    const verifyToken = async (accessToken) => {
        try {
            console.log('🔄 Проверка токена на сервере...');
            const response = await fetch(`${SERVER_APP_API_URL}/api/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'skip_zrok_interstitial': 'true'
                },
            });
            
            console.log(`📡 Статус ответа /api/verify: ${response.status}`);
            
            if (response.status === 200) {
                const data = await response.json();
                console.log('✅ Токен валиден:', data);
                return { valid: true, data };
            } else {
                console.log('❌ Токен невалиден');
                return { valid: false, error: 'Токен невалиден' };
            }
        } catch (error) {
            console.error('❌ Ошибка при проверке токена:', error);
            return { valid: false, error: 'Ошибка проверки токена' };
        }
    };

    // Функция для обновления токена через refresh token
    const refreshToken = async (refreshTokenValue) => {
        try {
            console.log('🔄 Пробуем обновить токен...');
            const response = await fetch(`${SERVER_APP_API_URL}/api/refresh`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${refreshTokenValue}`,
                    'Content-Type': 'application/json',
                    'skip_zrok_interstitial': 'true'
                },
            });
            
            console.log(`📡 Статус ответа /api/refresh: ${response.status}`);
            
            if (response.status === 200) {
                const data = await response.json();
                console.log('✅ Токен успешно обновлен:', data);
                
                // Сохраняем новый access token
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('token_timestamp', Date.now().toString());
                
                // Если сервер возвращает новый refresh token (опционально)
                if (data.refresh_token) {
                    localStorage.setItem('refresh_token', data.refresh_token);
                }
                
                return { success: true, accessToken: data.access_token, data };
            } else {
                console.log('❌ Не удалось обновить токен');
                return { success: false, error: 'Не удалось обновить токен' };
            }
        } catch (error) {
            console.error('❌ Ошибка при обновлении токена:', error);
            return { success: false, error: 'Ошибка обновления токена' };
        }
    };

    // Проверка и восстановление авторизации
    const checkExistingAuth = async () => {
        const accessToken = localStorage.getItem('access_token');
        const refreshTokenValue = localStorage.getItem('refresh_token');
        const userId = localStorage.getItem('id');
        
        if (!accessToken || !userId) {
            console.log('❌ Нет access_token или user_id в localStorage');
            return false;
        }
        
        console.log('📦 Найдены данные в localStorage, проверяем...');
        
        // 1. Проверяем текущий access token
        const verifyResult = await verifyToken(accessToken);
        
        if (verifyResult.valid) {
            console.log('✅ Access token валиден');
            user.setIsAuth(true);
            user.setUser(parseInt(userId));
            return true;
        } else {
            console.log('🔄 Access token невалиден, пробуем обновить...');
            
            // 2. Пытаемся обновить токен, если есть refresh token
            if (refreshTokenValue) {
                const refreshResult = await refreshToken(refreshTokenValue);
                
                if (refreshResult.success) {
                    // Повторно проверяем новый токен
                    const newVerifyResult = await verifyToken(refreshResult.accessToken);
                    
                    if (newVerifyResult.valid) {
                        console.log('✅ Токен успешно обновлен и валиден');
                        user.setIsAuth(true);
                        user.setUser(parseInt(userId));
                        return true;
                    }
                }
            }
            
            // 3. Все попытки не удались - очищаем localStorage
            console.log('❌ Не удалось восстановить авторизацию, очищаем localStorage');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('id');
            localStorage.removeItem('token');
            localStorage.removeItem('token_timestamp');
            localStorage.removeItem('token_expires');
            user.setIsAuth(false);
            return false;
        }
    };

    // Основная функция проверки авторизации
    const checkAuth = async () => {
        setIsChecking(true);
        setAuthError(null);
        
        try {
            console.log('🚀 Начинаем проверку авторизации...');
            console.log('📍 Текущий путь:', location.pathname);
            console.log('📦 localStorage:', {
                id: localStorage.getItem('id'),
                access_token: localStorage.getItem('access_token') ? 'есть' : 'нет',
                refresh_token: localStorage.getItem('refresh_token') ? 'есть' : 'нет'
            });

            // Проверяем существующую авторизацию
            const hasAuth = await checkExistingAuth();
            
            if (!hasAuth) {
                console.log('❌ Нет валидной авторизации');
                user.setIsAuth(false);
                
                // Если пользователь на защищенной странице, перенаправляем на логин
                // Но не перенаправляем если уже на публичной странице
                const isPublicRoute = publicRoutes.some(route => 
                    location.pathname === route.path || 
                    location.pathname.startsWith('/api/auth/')
                );
                
                if (!isPublicRoute && location.pathname !== '/login') {
                    console.log('🔄 Перенаправляем на /login');
                    navigate('/login');
                }
            } else {
                console.log('✅ Авторизация восстановлена');
            }
        } catch (error) {
            console.error('❌ Ошибка при проверке авторизации:', error);
            user.setIsAuth(false);
            setAuthError('Ошибка проверки авторизации');
            
            // При ошибке перенаправляем на логин
            if (location.pathname !== '/login' && !location.pathname.startsWith('/api/auth/')) {
                navigate('/login');
            }
        } finally {
            setIsChecking(false);
        }
    };

    // Проверяем авторизацию при монтировании
    useEffect(() => {
        checkAuth();
    }, []);

    // Также проверяем при изменении пути, если не авторизованы
    useEffect(() => {
        if (!user.IsAuth && !location.pathname.startsWith('/api/auth/')) {
            checkAuth();
        }
    }, [location.pathname]);

    // Компонент для защиты маршрутов
    const ProtectedRoute = ({ children }) => {
        if (!user.IsAuth) {
            console.log('🚫 ProtectedRoute: пользователь не авторизован');
            return <Navigate to="/login" replace />;
        }
        console.log('✅ ProtectedRoute: пользователь авторизован');
        return children;
    };

    // Компонент для Suspense fallback
    const LoadingFallback = () => (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
            <div className="text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Загрузка...</p>
            </div>
        </div>
    );

    // Если идет проверка, показываем лоадер
    if (isChecking) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Проверка авторизации...</p>
                    {authError && (
                        <div className="alert alert-danger mt-3" role="alert">
                            {authError}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                {/* Публичные роуты - доступны всегда */}
                {publicRoutes.map(({ path, name }) => {
                    let Component;
                    
                    switch (name) {
                        case 'Auth': Component = Auth; break;
                        case 'Login': Component = Login; break;
                        case 'TermsAndPrivacy': Component = TermsAndPrivacyPage; break;
                        default: return null;
                    }
                    
                    return <Route key={path} path={path} element={<Component />} />;
                })}
                
                {/* Маршрут для авторизации через путь /api/auth/:id/:token */}
                <Route path="/api/auth/:id/:token" element={<AuthCallback />} />
                
                {/* Роут для старых ссылок */}
                <Route path="/notauth" element={<Navigate to="/login" replace />} />
                
                {/* Защищенные роуты - только для авторизованных */}
                {authRoutes.map(({ path, name }) => {
                    let Component;
                    
                    switch (name) {
                        case 'Admin': Component = Admin; break;
                        case 'Prepare': Component = Prepare; break;
                        case 'Character': Component = Character; break;
                        case 'Inventory': Component = Inventory; break;
                        case 'ItemPage': Component = ItemPage; break;
                        case 'Rating': Component = Rating; break;
                        case 'Trade': Component = Trade; break;
                        case 'Map': Component = Map; break;
                        case 'Donation': Component = Donation; break;
                        case 'Guild': Component = Guild; break;
                        default: return null;
                    }
                    
                    return (
                        <Route 
                            key={path} 
                            path={path} 
                            element={
                                <ProtectedRoute>
                                    <Component />
                                </ProtectedRoute>
                            } 
                        />
                    );
                })}
                
                {/* Дефолтный роут */}
                <Route path="*" element={
                    user.IsAuth ? 
                        <Navigate to="/inventory" replace /> : 
                        <Navigate to="/login" replace />
                } />
            </Routes>
        </Suspense>
    );
});

export default AppRouter;