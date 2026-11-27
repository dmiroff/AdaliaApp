import React from 'react';
import {fireEvent, render, screen, within} from '@testing-library/react';
import {Context} from '../index';
import GetDataById from '../http/GetData';
import {GetCastleStorage} from '../http/guildService';
import CastleStorage from './CastleStorage';

jest.mock('../index', () => ({Context: require('react').createContext({})}));
jest.mock('../http/GetData', () => jest.fn());
jest.mock('../http/guildService', () => ({GetCastleStorage: jest.fn()}));
jest.mock('./CastleStorageModal', () => ({
  MassTransferToCastleModal: () => null,
  MassTransferFromCastleModal: () => null,
}));
jest.mock('../utils/Helpers', () => ({dict_translator: {}}));

async function openWithdrawal(items) {
  GetDataById.mockResolvedValue({data: {active_event: 'Castle', inventory_new: {}}});
  GetCastleStorage.mockResolvedValue({status: 200, data: {has_access: true, items}});
  const guild = {hasGuild: true, guildData: {castles: [{id: 1, name: 'Башня'}], player_role: 'leader'}};
  render(<Context.Provider value={{guild}}><CastleStorage /></Context.Provider>);
  fireEvent.click(await screen.findByRole('tab', {name: /Из замка/}));
  return within(await screen.findByRole('form', {name: 'Фильтры склада замка'}));
}

test('shows the shared filter fields for a legacy castle storage response', async () => {
  const panel = await openWithdrawal([{id: 1, name: 'Шлем', type: 'head', count: 1, weight: 1}]);
  for (const label of ['Префикс', 'Птица', 'Тип предмета', 'Редкость', 'Уровень от']) {
    expect(panel.getByLabelText(label)).toBeInTheDocument();
  }
  fireEvent.change(panel.getByLabelText('Тип предмета'), {target: {value: 'head'}});
  expect(panel.getByRole('status')).toHaveTextContent('Найдено: 1 из 1');
});

test('combines filters against the metadata supplied by the castle API', async () => {
  const item = {count: 1, weight: 1};
  const panel = await openWithdrawal([
    {...item, id: 1, name: 'Шлем Сокола', type: 'head', level: 12, rarity: 2, prefix: 'ice', suffix: 'perception'},
    {...item, id: 2, name: 'Шлем Ворона', type: 'head', level: 5, rarity: 1, prefix: 'fire', suffix: 'intelligence'},
    {...item, id: 3, name: 'Сапоги', type: 'boots', level: 12, rarity: 2, prefix: 'ice', suffix: 'perception'},
  ]);
  for (const [label, value] of [['Тип предмета', 'head'], ['Префикс', 'ice'], ['Птица', 'perception'], ['Редкость', '2']]) {
    fireEvent.change(panel.getByLabelText(label), {target: {value}});
  }
  expect(panel.getByRole('status')).toHaveTextContent('Найдено: 1 из 3');
  fireEvent.click(panel.getByRole('button', {name: 'Сбросить фильтры'}));
  expect(panel.getByRole('status')).toHaveTextContent('Найдено: 3 из 3');
});
