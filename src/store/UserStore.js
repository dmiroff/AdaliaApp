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
        // Принимаем либо объект {id: ...}, либо число
        if (typeof user === 'object' && user.id) {
            this._user_id = user.id;
        } else if (typeof user === 'number') {
            this._user_id = user;
        } else {
            this._user_id = user; // для обратной совместимости
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

    // Метод проверки авторизации
    async checkAuth() {
        this.setLoading(true);
        
        try {
            const token = localStorage.getItem("access_token");
            const id = localStorage.getItem("id");
            
            if (!token || !id) {
                console.log("ℹ️ Токен или ID не найдены");
                this.setIsAuth(false);
                this.setLoading(false);
                return false;
            }
            
            // Если есть токен и ID, считаем пользователя авторизованным
            this.setIsAuth(true);
            this.setUser(parseInt(id));
            
            console.log("✅ Пользователь авторизован (токен найден)");
            return true;
            
        } catch (error) {
            console.error("❌ Ошибка проверки авторизации:", error);
            this.setIsAuth(false);
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    // Метод для выхода
    logout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("id");
        localStorage.removeItem("token");
        this.setIsAuth(false);
        this.setUser(0);
        this.setPlayer({});
        this.setPlayerInventory({});
        this.setFilters([]);
        this.setSelectedType(null);
    }

    // Методы для работы с фильтрами
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
}