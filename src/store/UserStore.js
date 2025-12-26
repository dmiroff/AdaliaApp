import { makeAutoObservable } from "mobx";

export default class UserStore {
    constructor() {
        this._isAuth = false;
        this._user_id = 0;
        this._player_data = {};
        this._inventory_new = {};
        this._filters = []; // Массив активных фильтров
        this._selected_type = null;
        makeAutoObservable(this);
    }

    setIsAuth(bool) {
        this._isAuth = bool
    }
    setUser(user_id) {
        this._user_id = user_id
    }
    setPlayer(player_data) {
        this._player_data = player_data
    }
    setPlayerInventory(inventory_new) {
        this._inventory_new = inventory_new || {} // Защита от undefined/null
    }

    setSelectedType(selected_type) {
        this._selected_type = selected_type;
    }

    // Методы для работы с фильтрами
    setFilters(filters) {
        this._filters = filters || [];
    }

    addFilter(filter) {
        if (this._filters.length < 3) { // Максимум 3 фильтра (тип + 2 кастомных)
            this._filters.push(filter);
        }
    }

    removeFilter(index) {
        if (index >= 0 && index < this._filters.length) {
            this._filters.splice(index, 1);
        }
    }

    clearFilters() {
        this._filters = [];
    }

    updateFilter(index, updates) {
        if (index >= 0 && index < this._filters.length) {
            this._filters[index] = { ...this._filters[index], ...updates };
        }
    }

    get IsAuth() {
        return this._isAuth
    }

    get user() {
        return this._user_id;
    }
    
    get player_data() {
        return this._player_data;
    }
    
    get inventory_new() {
        return this._inventory_new || {};
    }
    
    get selected_type() {
        return this._selected_type;
    }
    
    // Геттер для фильтров
    get filters() {
        return this._filters;
    }
}