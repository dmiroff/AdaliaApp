import React from 'react';
import {render, screen, fireEvent, waitFor, cleanup} from '@testing-library/react';
import GuildTreasury from './GuildTreasury';
import api from '../http/apiClient';
jest.mock('../http/apiClient', () => ({get:jest.fn(), post:jest.fn()}));
const state = (leader=true) => ({guild_id:0, guild_name:'Рыцари', can_manage:leader, account:{gold:1000,daleons:300}, wallet:{gold:100,daleons:500}, avatar_orders:[]});
beforeEach(() => {
  localStorage.clear();jest.clearAllMocks();
  Object.defineProperty(global, 'crypto', {configurable:true,value:{randomUUID:()=>'11111111-1111-4111-8111-111111111111'}});
  api.get.mockResolvedValue({data:state()});
});
afterEach(cleanup);

test('treasury is available on base and member cannot withdraw or order', async () => {
  api.get.mockResolvedValue({data:state(false)});
  render(<GuildTreasury/>);
  await screen.findByText('Рыцари');
  expect(api.get).toHaveBeenCalledWith('/frontier-economy/guild-state');
  expect(screen.getByRole('button',{name:'Внести в казну'})).toBeEnabled();
  expect(screen.queryByRole('button',{name:'Получить из казны'})).not.toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Заказать аватарку за 1000 далеонов'})).not.toBeInTheDocument();
});

test('avatar is charged only after confirmation, retry retains paid order id', async () => {
  const request_id='22222222-2222-4222-8222-222222222222';
  api.post.mockImplementation((url) => url.endsWith('/draft') ? Promise.resolve({data:{id:request_id,guild_id:0,brief:'Рыцарь'}}) : Promise.reject(new Error('offline')));
  render(<GuildTreasury/>);await screen.findByText('Рыцари');
  fireEvent.change(screen.getByLabelText('Какую аватарку нарисовать?'),{target:{value:'Рыцарь'}});
  fireEvent.click(screen.getByRole('button',{name:'Заказать аватарку за 1000 далеонов'}));
  await screen.findByText('Списать 1000 далеонов из казны и отправить заказ администраторам?');
  expect(api.post).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button',{name:'Подтвердить'}));
  await screen.findByText(/Ответ не получен. Повторное подтверждение/);
  expect(screen.getByRole('button',{name:'Отмена'})).toBeDisabled();
  cleanup();render(<GuildTreasury/>);
  await screen.findByText('Рыцари');
  api.post.mockResolvedValue({data:{status:'pending'}});
  fireEvent.click(screen.getByRole('button',{name:'Подтвердить'}));
  await screen.findByText('Заявка на аватарку оплачена из казны и добавлена в очередь администраторам.');
  const calls=api.post.mock.calls.filter(([url])=>url.endsWith('/confirm'));
  expect(calls).toHaveLength(2);
  expect(calls[0][1]).toEqual({request_id});expect(calls[1][1]).toEqual({request_id});
});

test('deposit cancellation does not spend, network retry uses same request id',async()=>{
  render(<GuildTreasury/>);await screen.findByText('Рыцари');
  fireEvent.change(screen.getByLabelText('Количество'),{target:{value:'200'}});
  fireEvent.click(screen.getByRole('button',{name:'Внести в казну'}));
  fireEvent.click(screen.getByRole('button',{name:'Отмена'}));
  expect(api.post).not.toHaveBeenCalled();
  await waitFor(()=>expect(screen.queryByRole('button',{name:'Подтвердить'})).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button',{name:'Внести в казну'}));
  api.post.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({data:{ok:true}});
  fireEvent.click(screen.getByRole('button',{name:'Подтвердить'}));
  await screen.findByText(/Ответ не получен. Повторное подтверждение/);
  fireEvent.click(screen.getByRole('button',{name:'Подтвердить'}));
  await screen.findByText('Операция сохранена.');
  expect(api.post.mock.calls[0][1]).toEqual(api.post.mock.calls[1][1]);
  expect(api.post.mock.calls[0][0]).toBe('/frontier-economy/treasury-action');
});


test('old uncertain operation can be closed after changing guild, without a new write', async () => {
  localStorage.setItem('guild-treasury-confirmation:session', JSON.stringify({kind:'deposit', currency:'daleons', amount:200, guild_id:99, request_id:'old', uncertain:true}));
  render(<GuildTreasury/>);await screen.findByText('Рыцари');
  expect(screen.getByRole('button',{name:'Подтвердить'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Отмена'})).toBeEnabled();
  fireEvent.click(screen.getByRole('button',{name:'Отмена'}));
  expect(api.post).not.toHaveBeenCalled();
});

test('treasury ledger shows contributor identity, amount and time',async()=>{
  api.get.mockResolvedValue({data:{...state(),ledger:[{id:1,kind:'deposit',actor_id:8,actor_name:'Михаил',created_at:'2026-11-15T10:39:00+03:00',payload:{amount:800,currency:'daleons'}}]}});
  render(<GuildTreasury/>);
  await screen.findByText('Михаил (ID 8)');
  expect(screen.getByText('800 далеонов')).toBeInTheDocument();
  expect(screen.getByText('Кто')).toBeInTheDocument();
  expect(screen.getByText(new Date('2026-11-15T10:39:00+03:00').toLocaleString('ru-RU'))).toBeInTheDocument();
});
