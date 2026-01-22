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