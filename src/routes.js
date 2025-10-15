// src/routes.js
import Character from "./pages/Character";
import Inventory from "./pages/Inventory";
import Admin from "./pages/Admin";
import ItemPage from "./pages/ItemPage";
import { 
  ADMIN_ROUTE, 
  CHARACTER_ROUTE, 
  INVENTORY_ROUTE, 
  RATING_ROUTE, 
  AUTH_ROUTE, 
  PREPARE_ROUTE, 
  NOT_AUTH_ROUTE, 
  TRADE_ROUTE,
  MAP_ROUTE,
  DONATION_ROUTE 
} from "./utils/constants";
import Rating from "./pages/Rating";
import Auth from "./pages/Auth";
import Trade from "./pages/Trade";
import NotAuth from "./pages/NotAuth";
import Prepare from "./pages/Prepare";
import Map from "./pages/Map"; // Добавьте этот импорт
import Donation from "./pages/Donation"; // Добавьте этот импорт

export const authRoutes = [
    {
        path: ADMIN_ROUTE,
        Component: Admin,
    },
    {
        path: PREPARE_ROUTE,
        Component: Prepare,
    },
    {
        path: CHARACTER_ROUTE,
        Component: Character,
    },
    {
        path: INVENTORY_ROUTE,
        Component: Inventory,
    },
    {
        path: INVENTORY_ROUTE + '/:id',
        Component: ItemPage,
    },
    {
        path: RATING_ROUTE,
        Component: Rating,
    },
    {
        path: TRADE_ROUTE,
        Component: Trade,
    },
    {
        path: MAP_ROUTE, // Добавьте этот маршрут
        Component: Map,
    },
    {
        path: DONATION_ROUTE, // Добавьте этот маршрут
        Component: Donation,
    },
]

export const publicRoutes = [
    {
        path: AUTH_ROUTE + '/:id/:token',
        Component: Auth,    
    },
    {
        path: NOT_AUTH_ROUTE,
        Component: NotAuth,    
    },
]