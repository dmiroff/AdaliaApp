import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { Context } from '../index';
import GetDataById from '../http/GetData';
import InventoryList from './InventoryList';

jest.mock('../index', () => ({ Context: require('react').createContext(null) }));
jest.mock('../http/GetData', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../http/apiClient', () => ({}));
jest.mock('./InventoryItem', () => ({ __esModule: true, default: ({ device, isSelected, onToggleSelect }) =>
  <button aria-pressed={isSelected} onClick={() => onToggleSelect(device.id)}>{device.name}</button>
}));
jest.mock('./ItemFilters', () => ({ __esModule: true, default: ({ initialValue, onApply }) => <>
  <button onClick={() => onApply({ ...initialValue, q: 'Железная руда' })}>Найти руду</button>
  <button onClick={() => onApply({ ...initialValue, q: 'Каменная пластина' })}>Найти пластину</button>
  <button onClick={() => onApply({ ...initialValue, category: 'weapons' })}>Показать оружие</button>
  <button onClick={() => onApply({ ...initialValue, category: 'all', q: '' })}>Сбросить поиск</button>
</> }));
jest.mock('./MassTransferModal', () => ({
  MassTransferModal: ({ show, selectedItems }) => show ? <output>{[...selectedItems].join(',')}</output> : null,
  MassSellModal: () => null,
  MassDropModal: () => null
}));

test('selection survives search changes and mass transfer receives hidden and visible selections', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const click = label => act(() => {
    [...host.querySelectorAll('button')].find(button => button.textContent.trim() === label).click();
  });
  GetDataById.mockResolvedValue({ data: { inventory_new: {
    '112': { name: 'Железная руда', count: 8, type: 'goods' },
    '414': { name: 'Каменная пластина', count: 6, type: 'goods' }
  } } });
  const user = { setPlayer: jest.fn(), setPlayerInventory: jest.fn() };
  try {
    await act(async () => root.render(<Context.Provider value={{ user }}><InventoryList /></Context.Provider>));
    click('Найти руду');
    click('Железная руда');
    click('Найти пластину');
    expect(host.textContent).not.toContain('Железная руда');
    expect(host.querySelector('.selected-count-badge strong').textContent).toBe('1');
    click('Выбрать найденные (1)');
    click('Передать');
    expect(host.querySelector('output').textContent).toBe('112,414');
    click('Показать оружие');
    expect(host.textContent).toContain('Предметы не найдены');
    expect(host.querySelector('.selected-count-badge strong').textContent).toBe('2');
    click('Сбросить поиск');
    expect([...host.querySelectorAll('[aria-pressed="true"]')].map(button => button.textContent))
      .toEqual(['Железная руда', 'Каменная пластина']);
    click('Очистить');
    expect(host.querySelector('.selected-count-badge')).toBeNull();
  } finally {
    act(() => root.unmount());
    host.remove();
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
