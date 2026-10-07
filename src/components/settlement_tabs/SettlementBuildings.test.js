import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { Context } from '../../index';
import SettlementBuildings from './SettlementBuildings';
import { settlementService } from '../../services/SettlementService';
import { getBuildingExperience } from '../../utils/buildingExperience';

jest.mock('../../index', () => ({ Context: require('react').createContext(null) }));
jest.mock('../../services/SettlementService', () => ({
    settlementService: { getBuildingsData: jest.fn() }
}));

let container, root;
beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
});
afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    delete global.IS_REACT_ACT_ENVIRONMENT;
});

test('unbuilt settlement building renders without crashing the guild screen', async () => {
    settlementService.getBuildingsData.mockResolvedValue({ status: 200, data: {
        tower: { name: 'Башня', 0: { resources: {}, essence: 0, exp_for_levelup: 100 } }
    } });
    const stores = {
        settlement: { _settlementData: { id: 3, type: 'human', buildings: { tower: null },
            heroes: { active_heroes: {} }, construction: {}, storage: {}, current_essence: 0 } },
        user: { guildRole: 'member' }, guild: { guildData: { player_role: 'member' } }
    };
    await act(async () => {
        root.render(<Context.Provider value={stores}><SettlementBuildings /></Context.Provider>);
    });
    expect(settlementService.getBuildingsData).toHaveBeenCalledWith(3);
    expect(container.textContent).toContain('Башня');
    expect(container.textContent).toContain('0/100');
});

test('experience calculation treats explicit null as an absent building', () => {
    expect(getBuildingExperience(null, {})).toBeNull();
    expect(getBuildingExperience(null, { exp_for_levelup: 100 })).toEqual({
        current: 0, required: 100, enough: false, missing: 100
    });
    expect(getBuildingExperience({ exp: 150 }, null)).toEqual({
        current: 150, required: 0, enough: true, missing: 0
    });
    expect(getBuildingExperience(null, null)).toBeNull();
});
