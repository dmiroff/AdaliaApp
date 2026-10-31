import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { Context } from '../index';
import DonationTab from './DonationTab';
import GetDataById from '../http/GetData';
import { premiumPurchase, getAbodeTransferOptions } from '../http/premiumApi';

jest.mock('../index', () => ({ Context: require('react').createContext(null) }));
jest.mock('../http/GetData', () => jest.fn());
jest.mock('../http/premiumApi', () => ({
  premiumPurchase: jest.fn(), getAbodeTransferOptions: jest.fn(),
  createPaymentOrder: jest.fn(), checkPaymentStatus: jest.fn(), performAbodeTransfer: jest.fn(),
}));
jest.mock('./HeadContractPanel', () => () => null);

let container, root, user;
const current = { name: 'Весперос', daleons: 500, upgrades: [] };
const dialog = () => document.body.querySelector('[role="dialog"]');
const confirm = () => [...dialog().querySelectorAll('button')].find(button => /Сменить ник|Меняем ник/.test(button.textContent));
const nameInput = () => dialog().querySelector('#rename-character-name');
const click = async button => act(async () => Simulate.click(button));
const enter = async value => act(async () => Simulate.change(nameInput(), { target: { value } }));

async function renderShop() {
  // ReactDOM root.render needs act; it does not provide Testing Library's wrapper.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => root.render(<Context.Provider value={{ user }}><DonationTab /></Context.Provider>));
  await act(async () => jest.advanceTimersByTime(1000));
}

async function openRename() {
  const card = [...container.querySelectorAll('.fantasy-card')].find(node => node.textContent.includes('✍️ Смена ника'));
  await click(card.querySelector('button'));
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  global.IS_REACT_ACT_ENVIRONMENT = true;
  user = { setPlayer: jest.fn(), updatePlayerData: jest.fn() };
  GetDataById.mockResolvedValue({ data: current });
  getAbodeTransferOptions.mockResolvedValue({ data: { options: [] } });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('200 daleon rename asks for a new name and refreshes name and balance after purchase', async () => {
  await renderShop();
  await openRename();
  expect(dialog().textContent).toContain('200');
  expect(dialog().textContent).toContain('Текущий ник: Весперос');
  expect(nameInput().maxLength).toBe(29);
  expect(confirm().disabled).toBe(true);
  await enter('Весперос');
  expect(confirm().disabled).toBe(true);
  await enter('Снежный Кот');
  const updated = { ...current, name: 'Снежный Кот', daleons: 300 };
  GetDataById.mockResolvedValue({ data: updated });
  premiumPurchase.mockResolvedValue({ status: 200, message: 'Ваш новый ник: Снежный Кот', data: updated });
  await click(confirm());
  expect(premiumPurchase).toHaveBeenCalledWith(29, null, 1, { new_name: 'Снежный Кот' });
  expect(user.setPlayer).toHaveBeenLastCalledWith(updated);
  expect(container.textContent).toContain('Ваш новый ник: Снежный Кот');
  expect(container.textContent).toContain('300');
});

test('server validation keeps the entered name and shows the reason inside the open dialog', async () => {
  await renderShop();
  await openRename();
  await enter('Лунный Лис');
  premiumPurchase.mockRejectedValue(new Error('Данное имя уже занято, пожалуйста, выберите другое'));
  await click(confirm());
  expect(nameInput().value).toBe('Лунный Лис');
  expect(dialog().querySelector('[role="alert"]').textContent).toContain('имя уже занято');
  expect(confirm().disabled).toBe(false);
  expect(user.setPlayer).toHaveBeenCalledTimes(1);
});

test('pending purchase blocks repeat clicks and cancellation', async () => {
  await renderShop();
  await openRename();
  await enter('Снежный Кот');
  let finish;
  premiumPurchase.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const button = confirm();
  await act(async () => { Simulate.click(button); Simulate.click(button); });
  expect(premiumPurchase).toHaveBeenCalledTimes(1);
  expect(confirm().disabled).toBe(true);
  expect([...dialog().querySelectorAll('button')].find(node => node.textContent === 'Отмена').disabled).toBe(true);
  await act(async () => finish({ status: 200, message: 'Ваш новый ник: Снежный Кот', data: {} }));
});

test('insufficient daleons disable the rename card', async () => {
  GetDataById.mockResolvedValue({ data: { ...current, daleons: 199 } });
  await renderShop();
  const card = [...container.querySelectorAll('.fantasy-card')].find(node => node.textContent.includes('✍️ Смена ника'));
  expect(card.querySelector('button').disabled).toBe(true);
  expect(premiumPurchase).not.toHaveBeenCalled();
});
