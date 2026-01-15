// GuildStore.js
import { makeAutoObservable } from "mobx";

export default class GuildStore {
    constructor() {
        this._guildData = null;
        this._members = [];
        this._selectedMember = null;
        this._leaderboard = null;
        this._loading = false;
        this._error = null;
        this._lastUpdated = null;
        makeAutoObservable(this);
    }

    setGuildData(guildData) {
        this._guildData = guildData;
        this._lastUpdated = new Date().toISOString();
    }

    setMembers(members) {
        this._members = members;
    }

    setSelectedMember(member) {
        this._selectedMember = member;
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

    // Проверить, есть ли данные гильдии
    get hasGuild() {
        return !!this._guildData?.has_guild;
    }

    // Получить члена по ID
    getMemberById(memberId) {
        return this._members.find(member => member.id === memberId);
    }

    // Получить члена по имени
    getMemberByName(name) {
        return this._members.find(member => member.name === name);
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
        return {
            totalMembers: this._members.length,
            onlineMembers: this.onlineMembers.length,
            offlineMembers: this._members.length - this.onlineMembers.length,
            averageLevel: this._members.length > 0 
                ? Math.round(this._members.reduce((sum, m) => sum + m.level, 0) / this._members.length) 
                : 0,
            totalStrength: this._members.reduce((sum, m) => sum + (m.strength || 0), 0),
            totalAgility: this._members.reduce((sum, m) => sum + (m.agility || 0), 0)
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
        this._leaderboard = null;
        this._error = null;
        this._lastUpdated = null;
    }
}