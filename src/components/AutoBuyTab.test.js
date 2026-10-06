import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import AutoBuyTab from './AutoBuyTab';
import apiClient from '../http/apiClient';

jest.mock('../http/apiClient', () => ({ get: jest.fn(), put: jest.fn() }));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('../utils/constants', () => ({ DONATION_ROUTE: '/donation' }));

let container, root;
beforeEach(() => {
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
  apiClient.get.mockImplementation(url => Promise.resolve({ data: url === '/player'
    ? { upgrades: ['Торговый приказчик'] }
    : url === '/autobuy/items' ? Array.from({length: 30}, (_, i) => ({id: i + 112, name: `Предмет ${i}`}))
    : { owned: true, money: 1000, rules: [{item_id: 112, name: 'Предмет 0', price: 25, enabled: true}] } }));
  apiClient.put.mockResolvedValue({data: {}});
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); jest.clearAllMocks(); });
const click = async button => act(async () => Simulate.click(button));

test('select opens price dialog above a long result list, prefills and saves price', async () => {
  await act(async () => root.render(<AutoBuyTab />));
  const input = container.querySelector('input');
  await act(async () => Simulate.change(input, {target: {value: 'Предмет'}}));
  await act(async () => Simulate.submit(container.querySelector('form')));
  const buttons = [...container.querySelectorAll('button')].filter(b => b.textContent === 'Выбрать');
  expect(buttons).toHaveLength(30);
  await click(buttons[0]);
  const dialog = document.body.querySelector('[role="dialog"]');
  expect(dialog).not.toBeNull();
  expect(dialog.textContent).toContain('Предмет 0 · ID 112');
  const price = dialog.querySelector('#autobuy-price');
  expect(price.value).toBe('25');
  await act(async () => Simulate.change(price, {target: {value: '40'}}));
  await act(async () => Simulate.submit(dialog.querySelector('form')));
  expect(apiClient.put).toHaveBeenCalledWith('/autobuy/112', {price: 40, enabled: true});
});

test('cancelling price editing does not send a purchase rule', async () => {
  await act(async () => root.render(<AutoBuyTab />));
  await click([...container.querySelectorAll('button')].find(b => b.textContent === 'Цена'));
  const dialog = document.body.querySelector('[role="dialog"]');
  await click([...dialog.querySelectorAll('button')].find(b => b.textContent === 'Отмена'));
  expect(apiClient.put).not.toHaveBeenCalled();
});
