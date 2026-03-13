import { makeAutoObservable } from "mobx";
import { settlementService } from "../services/SettlementService";

export default class SettlementStore {
    constructor() {
        this._settlementData = null;
        this._buildingsData = null;
        this._loading = false;
        this._error = null;
        this._activeTab = "overview";
        this._modal = {
            type: null,
            data: null,
            show: false
        };
        makeAutoObservable(this);
    }

    // Геттеры
    get settlementData() {
        return this._settlementData;
    }

    get buildingsData() {
        return this._buildingsData;
    }

    get loading() {
        return this._loading;
    }

    get error() {
        return this._error;
    }

    get activeTab() {
        return this._activeTab;
    }

    get modal() {
        return this._modal;
    }

    // Сеттеры
    setSettlementData(data) {
        this._settlementData = data;
    }

    setBuildingsData(data) {
        this._buildingsData = data;
    }

    setLoading(loading) {
        this._loading = loading;
    }

    setError(error) {
        this._error = error;
    }

    setActiveTab(tab) {
        this._activeTab = tab;
    }

    setModal(modal) {
        this._modal = modal;
    }

    // Основные методы
    async fetchSettlementData(guildId) {
        // Стало (правильно, 0 пропускается)
        if (guildId === undefined || guildId === null) {
            console.error('❌ ID гильдии не указан');
            this.setError('ID гильдии не указан');
            return;
        }

        console.log(`🔄 Начало загрузки поселения для гильдии ${guildId}`);
        this.setLoading(true);
        this.setError(null);

        try {
            const response = await settlementService.getSettlementData(guildId);
            
            if (response.status === 200) {
                console.log(`✅ Поселение загружено успешно`);
                this.setSettlementData(response.data);
                
                // Загружаем данные о зданиях
                await this.fetchBuildingsData(guildId);
            } else if (response.status === 404) {
                console.log(`ℹ️ Поселение не найдено для гильдии ${guildId}`);
                this.setSettlementData(null);
            } else {
                console.error(`❌ Ошибка при загрузке поселения: ${response.message}`);
                this.setError(response.message || 'Ошибка загрузки данных поселения');
            }
        } catch (error) {
            console.error('❌ Исключение при загрузке поселения:', error);
            this.setError(error.message || 'Произошла ошибка при загрузке данных');
        } finally {
            this.setLoading(false);
        }
    }

    async fetchBuildingsData(guildId) {
        if (!guildId || !this._settlementData) {
            return;
        }

        try {
            const response = await settlementService.getBuildingsData(guildId);
            
            if (response.status === 200) {
                this.setBuildingsData(response.data);
            } else {
                console.warn('Не удалось загрузить данные о зданиях:', response.message);
            }
        } catch (error) {
            console.error('Error fetching buildings data:', error);
        }
    }

    // Методы для работы с модальными окнами
    openConstructionModal(buildingData = null) {
        this._modal = {
            type: 'construction',
            data: buildingData,
            show: true
        };
    }

    openHireModal(unitData = null) {
        this._modal = {
            type: 'hire',
            data: unitData,
            show: true
        };
    }

    closeModal() {
        this._modal = {
            type: null,
            data: null,
            show: false
        };
    }

    // Метод для проверки наличия поселения
    hasSettlement() {
        return !!this._settlementData;
    }

    // Метод для очистки данных
    clear() {
        this._settlementData = null;
        this._buildingsData = null;
        this._error = null;
        this._activeTab = "overview";
        this._modal = {
            type: null,
            data: null,
            show: false
        };
    }

    // Метод для обновления данных
    async refresh(guildId) {
        return this.fetchSettlementData(guildId);
    }

    getAvailableBuildings() {
        if (!this._settlementData || !this._settlementData.buildings) {
            return [];
        }
        
        const buildings = this._settlementData.buildings;
        const construction = this._settlementData.construction || {};
        
        // Фильтруем здания, которые можно строить или улучшать
        return Object.keys(buildings)
            .filter(key => {
                const building = buildings[key];
                // Проверяем, есть ли у здания действия "Строить"
                const hasConstructionAction = building.actions?.some(action => 
                    typeof action === 'string' && action.includes('Строить')
                );
                return hasConstructionAction;
            })
            .map(key => {
                const building = buildings[key];
                const isUnderConstruction = construction.hasOwnProperty(key);
                const constructionData = isUnderConstruction ? construction[key] : null;
                
                return {
                    key,
                    ...building,
                    isUnderConstruction,
                    constructionData
                };
            });
    }
}