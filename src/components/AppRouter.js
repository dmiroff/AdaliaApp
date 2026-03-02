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
const Login = React.lazy(() => import('../pages/NotAuth')); // Компонент для ручного входа
const ItemPage = React.lazy(() => import('../pages/ItemPage'));
const Guild = React.lazy(() => import('../pages/Guild'));
const TermsAndPrivacyPage = React.lazy(() => import('../pages/TermsAndPrivacyPage'));
const AuthCallback = React.lazy(() => import('../pages/AuthCallback'));

const AppRouter = observer(() => {
    const { user } = useContext(Context);
    const location = useLocation();
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    const checkAuth = async () => {
        setIsChecking(true);
        
        try {
            const isAuthPath = location.pathname.startsWith('/auth/');
            
            if (isAuthPath) {
                setIsChecking(false);
                setIsInitialized(true);
                return;
            }
            
            const accessToken = localStorage.getItem('access_token');
            const userId = localStorage.getItem('id');
            
            if (!accessToken || !userId) {
                user.setIsAuth(false);
                
                // Публичные маршруты: теперь включаем /notauth вместо /login
                const isPublicRoute = location.pathname === '/notauth' ||
                                     location.pathname === '/auth' ||
                                     location.pathname === '/terms-and-privacy' ||
                                     location.pathname === '/';
                
                if (!isPublicRoute) {
                    navigate('/notauth');
                }
                
                setIsChecking(false);
                setIsInitialized(true);
                return;
            }
            
            const verifyResult = await verifyToken(accessToken);
            
            if (verifyResult.valid) {
                user.setIsAuth(true);
                user.setUser(parseInt(userId));
            } else {
                clearAuthData();
                user.setIsAuth(false);
                navigate('/notauth'); // было /login
            }
        } catch (error) {
            user.setIsAuth(false);
            
            if (location.pathname !== '/notauth' && 
                !location.pathname.startsWith('/auth/')) {
                navigate('/notauth');
            }
        } finally {
            setIsChecking(false);
            setIsInitialized(true);
        }
    };

    const verifyToken = async (accessToken) => {
        try {
            const response = await fetch(`${SERVER_APP_API_URL}/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                const data = await response.json();
                return { valid: true, data };
            } else {
                return { valid: false, error: 'Токен невалиден' };
            }
        } catch (error) {
            return { valid: false, error: 'Ошибка проверки токена' };
        }
    };

    const clearAuthData = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('id');
        localStorage.removeItem('token');
        localStorage.removeItem('token_timestamp');
    };

    useEffect(() => {
        if (!isInitialized) {
            checkAuth();
        }
    }, [location.pathname]);

    const ProtectedRoute = ({ children }) => {
        if (isChecking && !isInitialized) {
            return (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            );
        }
        
        if (!user.IsAuth) {
            return <Navigate to="/notauth" replace />;
        }

        return children;
    };

    // Если идёт проверка и мы не на публичном маршруте, показываем лоадер
    if (isChecking && !location.pathname.startsWith('/auth/') && location.pathname !== '/notauth') {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Проверка авторизации...</p>
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        }>
            <Routes>
                {/* Публичные роуты */}
                {publicRoutes.map(({ path, name }) => {                    
                    let Component;
                    switch (name) {
                        case 'Auth': 
                            Component = AuthCallback;
                            break;
                        case 'NotAuth': 
                            Component = Login; 
                            break;
                        case 'TermsAndPrivacy': 
                            Component = TermsAndPrivacyPage; 
                            break;
                        default: 
                            return null;
                    }
                    
                    return <Route key={path} path={path} element={<Component />} />;
                })}
                
                {/* Роут для редиректа старых /api/auth ссылок */}
                <Route path="/api/auth/:id/:token" element={<Navigate to={`/auth/:id/:token`} replace />} />
                
                {/* Защищенные роуты */}
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
                        default: 
                            return null;
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
                        <Navigate to="/notauth" replace /> // было /login
                } />
            </Routes>
        </Suspense>
    );
});

export default AppRouter;