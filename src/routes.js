import {isPlayerShopsEnabled} from './utils/playerShops';
import {isT3BuilderEnabled} from './utils/t3Builder';
import { isPlayerEventsEnabled } from './utils/playerEvents';
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
  DONATION_ROUTE,
  TERMS_ROUTE,
  GUILD_ROUTE // Добавляем новую константу
} from "./utils/constants";

export const authRoutes = [
    ...(isT3BuilderEnabled() ? [{path:'/t3',name:'T3Builder'}] : []),
    ...(isPlayerShopsEnabled() ? [{path:'/player-shops',name:'PlayerShops'}] : []),
    ...(isPlayerEventsEnabled() ? [{path: '/player-events', name: 'PlayerEvents'}, {path: '/sign-techniques', name: 'SignTechniques'}] : []),
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
    {
        path: GUILD_ROUTE, // Добавляем гильдию
        name: 'Guild',
    },
]

export const publicRoutes = [
    { path: '/help', name: 'Help' },
    {
        path: AUTH_ROUTE + '/:id/:token',
        name: 'Auth',    
    },
    {
        path: NOT_AUTH_ROUTE,
        name: 'NotAuth',    
    },
    {
        path: TERMS_ROUTE,
        name: 'TermsAndPrivacy',    
    },
]
