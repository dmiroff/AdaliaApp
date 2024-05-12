import { makeAutoObservable } from "mobx";

export default class RatingStore {
    constructor() {
        this._types = [
            {id: 1, name: "Raz"},
            {id: 2, name: "Dva"}
        ]
        this._brands = [
            {id: 1, name: "Raz1"},
            {id: 2, name: "Dva1"}
        ]
        this._devices = [
            {id: 1, name: "Raz2", rating: 1, img: "Weapon/Кинжал/Кинжал.png"},
            {id: 2, name: "Dva2", rating: 2, img: "Weapon/Кинжал/Грозовой Кинжал.png"},
            {id: 3, name: "Raz3", rating: 3, img: "Weapon/Кинжал/Громовой Кинжал.png"},
            {id: 4, name: "Dva4", rating: 1, img: "Weapon/Кинжал/Ледяной Кинжал.png"},
            {id: 5, name: "Raz5", rating: 3, img: "Weapon/Кинжал/Пылающий Кинжал.png"},
            {id: 6, name: "Dva6", rating: 100, img: "Weapon/Кинжал/Живительный Кинжал.png"},
        ]
        this._selectedType = {}
        makeAutoObservable(this)
    }

    setTypes(types) {
        this._types = types
    }
    setBrands(brands) {
        this._brands = brands
    }
    setDevices(devices) {
        this._devices = devices
    }
    setSelectedType(type){
        this._selectedType = type.id
    }

    get Types() {
        return this._types
    }
    get Brands() {
        return this._brands
    }
    get Devices() {
        return this._devices
    }
    get SelectedType() {
        return this._selectedType
    }
}