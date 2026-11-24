import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { Context } from '../../index';
import { settlementService } from '../../services/SettlementService';
import SettlementStorage from './SettlementStorage';

jest.mock('../../index', () => ({ Context: require('react').createContext(null) }));
jest.mock('../../services/SettlementService', () => ({
  settlementService: { getPlayerResources: jest.fn(), storeAllResources: jest.fn() }
}));

let root;
let container;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  jest.useFakeTimers();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

const renderStorage = async () => {
  const stores = {
    settlement: { settlementData: { storage: { 114: 4699 }, buildings: { storage: { max_capacity: 6000 } } } },
    guild: { guildData: { id: 8, has_guild: true, player_role: 'member' } },
    user: { user: { id: 42 } }
  };
  await act(async () => root.render(<Context.Provider value={stores}><SettlementStorage /></Context.Provider>));
};

const depositButton = () => [...container.querySelectorAll('button')]
  .find(button => button.textContent.includes('Сложить все ресурсы'));

test('an envoy sees ore and both plates and can deposit the construction materials', async () => {
  settlementService.getPlayerResources
    .mockResolvedValueOnce({ status: 200, data: { has_messenger: true, resources: {
      112: { count: 8 }, 413: { count: 1 }, 414: { count: 6 }
    } } })
    .mockResolvedValueOnce({ status: 200, data: { has_messenger: true, resources: {} } });
  settlementService.storeAllResources.mockResolvedValue({ status: 200 });

  await renderStorage();

  expect(settlementService.getPlayerResources).toHaveBeenCalledWith(42, 'settlement');
  expect(container.textContent).toContain('У вас: 3 видов');
  expect(container.textContent).toContain('Всего: 15 шт');
  expect(depositButton().disabled).toBe(false);

  await act(async () => depositButton().click());

  expect(settlementService.storeAllResources).toHaveBeenCalledWith(8, 42, 'construction');
  expect(depositButton().disabled).toBe(true);
});

test('a failed resource request shows a load error', async () => {
  settlementService.getPlayerResources.mockResolvedValue({ status: 503 });
  await renderStorage();

  expect(container.textContent).toContain('Не удалось загрузить ресурсы');
  expect(container.textContent).not.toContain('У вас: 0 видов');
  expect(depositButton().disabled).toBe(true);
  const refresh = [...container.querySelectorAll('button')].find(button => button.textContent.includes('Обновить'));
  expect(refresh.disabled).toBe(false);
  settlementService.getPlayerResources.mockResolvedValue({ status: 200, data: { resources: { 112: { count: 8 } } } });
  await act(async () => refresh.click());
  expect(depositButton().disabled).toBe(false);
});
