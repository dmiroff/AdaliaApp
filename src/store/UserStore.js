import { makeAutoObservable } from "mobx";

export default class UserStore {
    constructor() {
        this._isAuth = false;
        this._user_id = 0;
        this._player_data = {};
        this._inventory_new = {};
        this._filters = [];
        this._selected_type = null;
        this._loading = false;
        makeAutoObservable(this);
    }

    setIsAuth(bool) {
        this._isAuth = bool;
    }

    setUser(user) {
        if (typeof user === 'object' && user.id) {
            this._user_id = user.id;
        } else if (typeof user === 'number') {
            this._user_id = user;
        } else {
            this._user_id = parseInt(user) || 0;
        }
    }

    setPlayer(player_data) {
        this._player_data = player_data;
    }

    setPlayerInventory(inventory_new) {
        this._inventory_new = inventory_new || {};
    }

    setSelectedType(selected_type) {
        this._selected_type = selected_type;
    }

    setFilters(filters) {
        this._filters = filters || [];
    }

    setLoading(loading) {
        this._loading = loading;
    }

    addFilter(filter) {
        if (this._filters.length < 3) {
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

    // Геттеры
    get IsAuth() {
        return this._isAuth;
    }

    get isAuth() {
        return this._isAuth;
    }

    get user() {
        return { id: this._user_id };
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
    
    get filters() {
        return this._filters;
    }

    get loading() {
        return this._loading;
    }

    logout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("id");
        localStorage.removeItem("token");
        localStorage.removeItem("token_timestamp");
        localStorage.removeItem("token_expires");
        localStorage.removeItem("username");
        this.setIsAuth(false);
        this.setUser(0);
        this.setPlayer({});
        this.setPlayerInventory({});
        this.setFilters([]);
        this.setSelectedType(null);
        
        // Также можно перенаправить на страницу логина
        window.location.href = '/login';
    }
}