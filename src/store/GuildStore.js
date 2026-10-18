import { makeAutoObservable } from "mobx";
import { GetGuildData } from "../http/guildService";

export default class GuildStore {
    constructor() {
        this._guildData = null;
        this._members = [];
        this._selectedMember = null;
        this._selectedCastle = null;
        this._leaderboard = null;
        this._loading = false;
        this._error = null;
        this._lastUpdated = null;
        this._isInitialized = false;
        makeAutoObservable(this);
    }

    setGuildData(guildData) {
        // Нормализуем данные: если есть guild_id, добавляем его как id
        if (guildData && guildData.guild_id != null) {
            guildData.id = guildData.guild_id;
        }
        this._guildData = guildData;
        this._lastUpdated = new Date().toISOString();
    }

    setMembers(members) {
        this._members = members;
    }

    setSelectedMember(member) {
        this._selectedMember = member;
    }

    setSelectedCastle(castle) {
        this._selectedCastle = castle;
    }

    setLeaderboard(leaderboard) {
        this._leaderboard = leaderboard;
    }

    setLoading(loading) {
        this._loading = loading;
    }

    setError(error) {
        this._error = error;
    }

    setIsInitialized(initialized) {
        this._isInitialized = initialized;
    }

    // Геттеры
    get guildData() {
        return this._guildData;
    }

    get members() {
        return this._members;
    }

    get selectedMember() {
        return this._selectedMember;
    }

    get selectedCastle() {
        return this._selectedCastle;
    }

    get leaderboard() {
        return this._leaderboard;
    }

    get loading() {
        return this._loading;
    }

    get error() {
        return this._error;
    }

    get lastUpdated() {
        return this._lastUpdated;
    }

    get isInitialized() {
        return this._isInitialized;
    }

    // Проверить, есть ли данные гильдии
    get hasGuild() {
        return !!this._guildData && this._guildData.has_guild !== false;
    }

    // Получить члена по ID
    getMemberById(memberId) {
        return this._members.find(member => member.id === memberId);
    }

    // Получить члена по имени
    getMemberByName(name) {
        return this._members.find(member => member.name === name);
    }

    // Получить замок по ID
    getCastleById(castleId) {
        if (!this._guildData?.castles) return null;
        return this._guildData.castles.find(castle => castle.id === castleId);
    }

    // Получить онлайн членов
    get onlineMembers() {
        return this._members.filter(member => member.is_online);
    }

    // Получить офицеров
    get officers() {
        return this._members.filter(member => member.role === "officer");
    }

    // Получить лидера
    get leader() {
        return this._members.find(member => member.role === "leader");
    }

    // Получить статистику гильдии
    get statistics() {
        const members = this._members || [];
        return {
            totalMembers: members.length,
            onlineMembers: this.onlineMembers.length,
            offlineMembers: members.length - this.onlineMembers.length,
            averageLevel: members.length > 0 
                ? Math.round(members.reduce((sum, m) => sum + (m.level || 0), 0) / members.length) 
                : 0,
            totalStrength: members.reduce((sum, m) => sum + (m.strength || 0), 0),
            totalAgility: members.reduce((sum, m) => sum + (m.agility || 0), 0)
        };
    }

    // Получить статистику по замкам
    get castlesStatistics() {
        if (!this._guildData?.castles) return null;
        
        const castles = this._guildData.castles;
        return {
            totalCastles: castles.length,
            totalStorageCapacity: castles.reduce((sum, c) => sum + (c.storage_capacity || 0), 0),
            totalStorageUsed: castles.reduce((sum, c) => sum + (c.current_weight || 0), 0),
            totalStorageItems: castles.reduce((sum, c) => sum + (c.storage_items_count || 0), 0),
            totalWorkers: castles.reduce((sum, c) => {
                const workers = (c.workers_wood?.length || 0) + 
                              (c.workers_stone?.length || 0) + 
                              (c.workers_steel?.length || 0) + 
                              (c.workers_glass?.length || 0);
                return sum + workers;
            }, 0),
            castles: castles.map(castle => ({
                id: castle.id,
                name: castle.name,
                location: castle.location,
                storagePercentage: castle.current_weight && castle.storage_capacity 
                    ? (castle.current_weight / castle.storage_capacity) * 100 
                    : 0
            }))
        };
    }

    // Обновить данные члена
    updateMember(memberId, updates) {
        const index = this._members.findIndex(m => m.id === memberId);
        if (index !== -1) {
            this._members[index] = { ...this._members[index], ...updates };
        }
    }

    // Добавить нового члена
    addMember(member) {
        if (!this._members.find(m => m.id === member.id)) {
            this._members.push(member);
            this._members.sort((a, b) => {
                const roleOrder = { leader: 0, officer: 1, member: 2 };
                return roleOrder[a.role] - roleOrder[b.role] || b.level - a.level;
            });
        }
    }

    // Удалить члена
    removeMember(memberId) {
        this._members = this._members.filter(m => m.id !== memberId);
    }

    // Обновить онлайн статус члена
    updateMemberOnlineStatus(memberId, isOnline) {
        const member = this.getMemberById(memberId);
        if (member) {
            member.is_online = isOnline;
            member.online_status = isOnline ? "Онлайн" : "Оффлайн";
            member.status_block_time = new Date().toISOString();
        }
    }

    // Очистить ошибку
    clearError() {
        this._error = null;
    }

    // Очистить все данные
    clear() {
        this._guildData = null;
        this._members = [];
        this._selectedMember = null;
        this._selectedCastle = null;
        this._leaderboard = null;
        this._error = null;
        this._lastUpdated = null;
        this._isInitialized = false;
    }

    async fetchGuildData() {
        if (this._loading) {
            console.log('⚠️ Загрузка уже выполняется');
            return false;
        }

        this.setLoading(true);
        this.setError(null);
        
        try {
            console.log('🔄 Загрузка данных гильдии...');
            const response = await GetGuildData();
            console.log('📊 Ответ от сервера (гильдия):', response);
            
            if (response.status === 200) {
                const guildData = response.data;
                console.log('📋 Данные гильдии:', guildData);
                
                if (guildData) {
                    // Нормализуем данные перед сохранением
                    const normalizedData = { ...guildData };
                    if (guildData.guild_id != null && guildData.id == null) {
                        normalizedData.id = guildData.guild_id;
                    }
                    
                    this.setGuildData(normalizedData);
                    
                    // Если есть члены гильдии, устанавливаем их
                    if (guildData.members && Array.isArray(guildData.members)) {
                        this.setMembers(guildData.members);
                    }
                    
                    this.setIsInitialized(true);
                    
                    // Возвращаем true только если есть гильдия
                    return !!guildData.has_guild;
                } else {
                    console.warn('⚠️ Данные гильдии неполные или отсутствуют');
                    this.setGuildData(null);
                    this.setMembers([]);
                    this.setIsInitialized(true);
                    return false;
                }
            } else if (response.status === 404) {
                this.setGuildData(null);
                this.setMembers([]);
                this.setIsInitialized(true);
                return false;
            } else {
                console.error('❌ Ошибка при загрузке гильдии:', response.message);
                this.setError(response.message || 'Ошибка загрузки данных гильдии');
                this.setIsInitialized(true);
                return false;
            }
        } catch (error) {
            console.error('❌ Исключение при загрузке гильдии:', error);
            this.setError(error.message || 'Произошла ошибка при загрузке данных гильдии');
            this.setIsInitialized(true);
            return false;
        } finally {
            this.setLoading(false);
        }
    }
}