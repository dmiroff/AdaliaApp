import Character from "./pages/Character";
import Inventory from "./pages/Inventory";
import Admin from "./pages/Admin";
import ItemPage from "./pages/ItemPage";
import { ADMIN_ROUTE, CHARACTER_ROUTE, INVENTORY_ROUTE, RATING_ROUTE, AUTH_ROUTE, PREPARE_ROUTE, NOT_AUTH_ROUTE } from "./utils/constants";
import Rating from "./pages/Rating";
import Auth from "./pages/Auth";
import NotAuth from "./pages/NotAuth";
import Prepare from "./pages/Prepare";

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

