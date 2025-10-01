import { makeAutoObservable } from "mobx";

export default class UserStore {
    constructor() {
        this._isAuth = false
        this._user_id = 0
        this._player_data = {}
        this._inventory_new = {}
        this._selected_type = null // Заменяем NaN на null
        makeAutoObservable(this)
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
        this._selected_type = selected_type
    }

    get IsAuth() {
        return this._isAuth
    }

    get user() {
        return this._user_id
    }
    get player_data() {
        return this._player_data
    }
    get inventory_new() {
        return this._inventory_new || {} // Защита от undefined
    }
    get selected_type() {
        return this._selected_type
    }
}