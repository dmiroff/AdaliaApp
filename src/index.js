import React, { createContext } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import UserStore from './store/UserStore';
import GuildStore from "./store/GuildStore";
import SettlementStore from "./store/SettlementStore"; 
import './utils/forceSplit';

export const Context = createContext(null);

const root = ReactDOM.createRoot(document.getElementById('root'));

// Создаем экземпляры stores
const userStore = new UserStore();
const guildStore = new GuildStore();
const settlementStore = new SettlementStore();

// Функция для инициализации приложения
const initializeApp = async () => {
  try {
    console.log('🚀 Начало инициализации приложения...');
    
    // Проверяем авторизацию пользователя
    console.log('🔐 Проверка авторизации...');
    const isAuthenticated = await userStore.checkAuth();
    
    if (!isAuthenticated) {
      console.log('❌ Пользователь не авторизован');
      return;
    }
    
    console.log('✅ Пользователь авторизован, ID:', userStore.user?.id);
    
    // Загружаем данные гильдии
    console.log('🏰 Загрузка данных гильдии...');
    const guildLoaded = await guildStore.fetchGuildData();
    
    console.log('📌 Результат загрузки гильдии:', guildLoaded);
    console.log('📌 Данные гильдии:', guildStore.guildData);
    console.log('📌 ID гильдии:', guildStore.guildData?.id);
    console.log('📌 hasGuild:', guildStore.hasGuild);
    
    if (guildLoaded && guildStore.hasGuild && guildStore.guildData?.id) {
      console.log(`✅ Гильдия загружена (ID: ${guildStore.guildData.id})`);
      console.log('🏠 Данные поселения уже есть:', guildStore.guildData.settlement);
    } else {
      console.log('ℹ️ У пользователя нет гильдии');
    }
    
    console.log('🎉 Инициализация приложения завершена');
  } catch (error) {
    console.error('❌ Ошибка при инициализации приложения:', error);
  }
};

// Запускаем инициализацию
initializeApp();

root.render(
  <Context.Provider value={{
    user: userStore,
    guild: guildStore,
    settlement: settlementStore,
  }}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Context.Provider>,
);

reportWebVitals();