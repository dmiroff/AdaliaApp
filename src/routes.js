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

// УБИРАЕМ все импорты страниц! Они теперь ленивые в AppRouter

export const authRoutes = [
    {
        path: ADMIN_ROUTE,
        name: 'Admin',
    },
    {
        path: PREPARE_ROUTE,
        name: 'Prepare',
    },
    {
        path: CHARACTER_ROUTE,
        name: 'Character',
    },
    {
        path: INVENTORY_ROUTE,
        name: 'Inventory',
    },
    {
        path: INVENTORY_ROUTE + '/:id',
        name: 'ItemPage',
    },
    {
        path: RATING_ROUTE,
        name: 'Rating',
    },
    {
        path: TRADE_ROUTE,
        name: 'Trade',
    },
    {
        path: MAP_ROUTE,
        name: 'Map',
    },
    {
        path: DONATION_ROUTE,
        name: 'Donation',
    },
]

export const publicRoutes = [
    {
        path: AUTH_ROUTE + '/:id/:token',
        name: 'Auth',    
    },
    {
        path: NOT_AUTH_ROUTE,
        name: 'NotAuth',    
    },
]