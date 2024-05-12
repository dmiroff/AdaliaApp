import { makeAutoObservable } from "mobx";

export default class UserStore {
    constructor() {
        this._isAuth = false
        this._user_id = 0
        this._player_data = {}
        this._inventory_new = {}
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
        this._inventory_new = inventory_new
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
        return this._inventory_new
    }
}