import React, { useContext, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Context } from "../index";
import { authRoutes, publicRoutes } from "../routes";
import { observer } from "mobx-react-lite";
import LoadingSpinner from "./LoadingSpinner";

// Ленивые импорты ВСЕХ страниц
const Auth = React.lazy(() => import('../pages/Auth'));
const Admin = React.lazy(() => import('../pages/Admin'));
const Inventory = React.lazy(() => import('../pages/Inventory'));
const Character = React.lazy(() => import('../pages/Character'));
const Rating = React.lazy(() => import('../pages/Rating'));
const Prepare = React.lazy(() => import('../pages/Prepare'));
const Trade = React.lazy(() => import('../pages/Trade'));
const Map = React.lazy(() => import('../pages/Map'));
const Donation = React.lazy(() => import('../pages/Shop'));
const NotAuth = React.lazy(() => import('../pages/NotAuth'));
const ItemPage = React.lazy(() => import('../pages/ItemPage'));
const AuthChecker = React.lazy(() => import('../pages/AuthChecker'));
const TermsAndPrivacyPage = React.lazy(() => import('../pages/TermsAndPrivacyPage')); // Добавляем импорт

const AppRouter = () => {
    const { user } = useContext(Context);
    
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                {/* Защищенные роуты */}
                {user.IsAuth && authRoutes.map(({ path, name }) => {
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
                        default: return null;
                    }
                    
                    return <Route key={path} path={path} element={<Component />} />;
                })}
                
                {/* Публичные роуты */}
                {publicRoutes.map(({ path, name }) => {
                    let Component;
                    
                    switch (name) {
                        case 'Auth': Component = Auth; break;
                        case 'NotAuth': Component = NotAuth; break;
                        case 'TermsAndPrivacy': Component = TermsAndPrivacyPage; break; // Добавляем case
                        default: return null;
                    }
                    
                    return <Route key={path} path={path} element={<Component />} />;
                })}
                
                {/* Дефолтный роут */}
                <Route path="*" element={<AuthChecker />} />
            </Routes>
        </Suspense>
    );
};

export default observer(AppRouter);