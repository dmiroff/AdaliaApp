import GuildStore from './GuildStore';
import SettlementStore from './SettlementStore';
import { GetGuildData } from '../http/guildService';
import { settlementService } from '../services/SettlementService';

jest.mock('../http/guildService', () => ({ GetGuildData: jest.fn() }));
jest.mock('../services/SettlementService', () => ({
    settlementService: { getSettlementData: jest.fn(), getBuildingsData: jest.fn() }
}));

test.each([0, '0', 12])('normalizes guild ID %s without discarding zero', (guildId) => {
    const store = new GuildStore();
    store.setGuildData({ has_guild: true, guild_id: guildId });
    expect(store.guildData.id).toBe(guildId);
    expect(store.hasGuild).toBe(true);
});

test('fetches guild zero from API as an existing guild', async () => {
    GetGuildData.mockResolvedValue({ status: 200, data: { has_guild: true, guild_id: 0, members: [] } });
    const store = new GuildStore();
    await store.fetchGuildData();
    expect(store.guildData.id).toBe(0);
    expect(store.hasGuild).toBe(true);
});

test('fetches buildings for settlement zero', async () => {
    const store = new SettlementStore();
    store.setSettlementData({ id: 0, buildings: {} });
    settlementService.getBuildingsData.mockResolvedValue({ status: 200, data: { buildings: {} } });
    await store.fetchBuildingsData(0);
    expect(settlementService.getBuildingsData).toHaveBeenCalledWith(0);
});


test('missing guild remains absent and does not fetch settlement buildings', async () => {
    const guild = new GuildStore();
    guild.setGuildData(null);
    expect(guild.hasGuild).toBe(false);
    settlementService.getBuildingsData.mockClear();
    const settlement = new SettlementStore();
    settlement.setSettlementData({ id: 0, buildings: {} });
    await settlement.fetchBuildingsData(null);
    expect(settlementService.getBuildingsData).not.toHaveBeenCalled();
});
