import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import UserStore from '../store/UserStore';
import { Context } from '../index';
import InventoryList from './InventoryList';
import InventoryItem from './InventoryItem';
import AppRouter from './AppRouter';
import ActionNotice from './ActionNotice';
import ItemPage from '../pages/ItemPage';
import Equipment from './Equipment';
import GetDataById, {GetItemById} from '../http/GetData';
import apiClient from '../http/apiClient';
import { WearDataById, UnwearDataById } from '../http/SupportFunctions';
import { comparisonStats, comparisonSlots } from '../utils/equipmentComparison';

jest.mock('../pages/NotAuth', () => () => null);
jest.mock('../pages/AuthCallback', () => () => null);
jest.mock('../index', () => ({Context: require('react').createContext(null)}));
jest.mock('../http/GetData', () => ({__esModule:true, default:jest.fn(), GetItemById:jest.fn()}));
jest.mock('../http/apiClient', () => ({__esModule:true, default:{get:jest.fn()}}));
jest.mock('../http/SupportFunctions', () => ({WearDataById:jest.fn(), UnwearDataById:jest.fn(), SellItemById:jest.fn(), ThrowItemById:jest.fn()}));
jest.mock('./MassTransferModal', () => ({MassTransferModal:()=>null, MassSellModal:()=>null, MassDropModal:()=>null}));
let container, root, user;
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  window.matchMedia = () => ({matches:false, addListener:()=>{}, removeListener:()=>{}, addEventListener:()=>{}, removeEventListener:()=>{}});
  user = new UserStore();
  container = document.createElement('div'); document.body.appendChild(container); root=createRoot(container);
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();jest.useRealTimers();});
const render = async (component, path = '/inventory') => act(async()=>root.render(<Context.Provider value={{user}}><MemoryRouter initialEntries={[path]}>{component}</MemoryRouter></Context.Provider>));
const click = async button => act(async()=>Simulate.click(button));
const button = text => [...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);

test('network failure keeps login credentials and provides a retry', async()=>{
 localStorage.setItem('access_token','test-session');localStorage.setItem('id','1');
 apiClient.get.mockRejectedValue(new Error('offline'));
 await render(<AppRouter />);
 expect(localStorage.getItem('access_token')).toBe('test-session');
 expect(container.textContent).toContain('Вход сохранён');
 expect(button('Повторить')).toBeTruthy();
});

test('inventory failure is not shown as an empty bag and can recover',async()=>{
 GetDataById.mockResolvedValueOnce(false).mockResolvedValueOnce({data:{inventory_new:{1:{name:'Меч', type:'right_hand', is_equippable:true}}}});
 await render(<InventoryList />);
 expect(container.textContent).toContain('Не удалось загрузить инвентарь');
 expect(container.textContent).not.toContain('инвентарь пустой');
 await click(button('Повторить'));
 expect(container.textContent).toContain('Меч');
 expect(container.querySelector('details').open).toBe(false);
 expect(container.querySelector('input').compareDocumentPosition(container.querySelector('details')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('quick categories filter items without opening the advanced form',async()=>{
 GetDataById.mockResolvedValue({data:{inventory_new:{
  1:{name:'Меч тестовый',type:'right_hand',is_equippable:true},
  2:{name:'Шлем тестовый',type:'head',is_equippable:true},
  3:{name:'Зелье тестовое',type:'potion',is_equippable:false}
 }}});
 await render(<InventoryList />);
 await click(button('Броня'));
 expect(container.textContent).toContain('Шлем тестовый');
 expect(container.textContent).not.toContain('Меч тестовый');
 await click(button('Прочее'));
 expect(container.textContent).toContain('Зелье тестовое');
 expect(container.textContent).not.toContain('Шлем тестовый');
});

test('explicit item actions open a sheet and rapid double wear sends one request',async()=>{
 const item={name:'Меч тестовый',type:'right_hand',is_equippable:true,count:1,weapon_damage:8};
 user.setPlayer({inventory_new:{1:item},right_hand:{id:2,name:'Старый меч',weapon_damage:5}});
 user.setPlayerInventory({1:item});
 let resolve;WearDataById.mockImplementation(()=>new Promise(done=>{resolve=done;}));
 const notice=jest.fn();
 await render(<InventoryItem devicekey="1" device={item} onShowModal={notice}/>);
 await click(container.querySelector('[aria-haspopup="dialog"]'));
 expect(document.body.textContent).toContain('Старый меч');
 expect(document.body.textContent).toContain('(+3)');
 const wear=button('Надеть');
 await act(async()=>{Simulate.click(wear);Simulate.click(wear);});
 expect(WearDataById).toHaveBeenCalledTimes(1);
 expect(button('Надеваем…').disabled).toBe(true);
 await act(async()=>resolve({status:200,data:{inventory_new:{1:item},right_hand:{...item,id:1}},message:'Готово'}));
 expect(user.player_data.right_hand.id).toBe(1);
 expect(user.user.id).toBe(0);
 expect(notice).not.toHaveBeenCalled();
 expect(document.body.querySelector('[role="status"]').textContent).toContain('Готово');
});

test('comparison does not invent dice arithmetic and exposes all ring slots',()=>{
 expect(comparisonSlots({type:'ring'})).toHaveLength(5);
 expect(comparisonStats({weapon_damage:'2d6'},{weapon_damage:'1d8'})[0].delta).toBeNull();
 expect(comparisonStats({weight:2},{weight:3})[0].delta).toBe(-1);
});

test('confirmed expired session clears credentials', async()=>{
 localStorage.setItem('access_token','expired');localStorage.setItem('id','1');
 apiClient.get.mockRejectedValue({response:{status:401}});
 await render(<AppRouter />);
 expect(localStorage.getItem('access_token')).toBeNull();
 expect(user.IsAuth).toBe(false);
});

test('failed wear releases the action button for another attempt',async()=>{
 const item={name:'Шлем',type:'head',is_equippable:true,count:1};
 user.setPlayer({inventory_new:{1:item}});user.setPlayerInventory({1:item});
 WearDataById.mockResolvedValue(false);
 await render(<InventoryItem devicekey="1" device={item} onShowModal={jest.fn()}/>);
 await click(container.querySelector('[aria-haspopup="dialog"]'));
 await click(button('Надеть'));
 expect(button('Надеть').disabled).toBe(false);
 await click(button('Надеть'));
 expect(WearDataById).toHaveBeenCalledTimes(2);
});

test('success notice announces the action without a dialog and expires',async()=>{
 jest.useFakeTimers();
 const dismiss=jest.fn();
 await render(<ActionNotice notice={{message:'Надето',variant:'success'}} onDismiss={dismiss}/>);
 expect(document.body.querySelector('[role="status"]').textContent).toContain('Надето');
 expect(document.body.querySelector('[role="dialog"]')).toBeNull();
 expect(document.body.querySelector('.action-notice').parentElement).toBe(document.body);
 await act(async()=>jest.advanceTimersByTime(4500));
 expect(dismiss).toHaveBeenCalledTimes(1);
});

test('error notice stays readable until dismissed',async()=>{
 jest.useFakeTimers();
 const dismiss=jest.fn();
 await render(<ActionNotice notice={{message:'Нет связи',variant:'error'}} onDismiss={dismiss}/>);
 await act(async()=>jest.advanceTimersByTime(15000));
 expect(dismiss).not.toHaveBeenCalled();
 expect(document.body.querySelector('[role="alert"]').textContent).toContain('Нет связи');
 await click(document.body.querySelector('[aria-label="Закрыть уведомление"]'));
 expect(dismiss).toHaveBeenCalledTimes(1);
});

test('wear on the item detail page updates equipment and uses a status notice',async()=>{
 const item={id:101,name:'Шлем',type:'head',is_equippable:true,count:1};
 user.setPlayer({inventory_new:{101:item}});user.setPlayerInventory({101:item});
 GetItemById.mockResolvedValue({data:item});
 WearDataById.mockResolvedValue({status:200,data:{inventory_new:{101:item},head:item},message:'Шлем надет'});
 await render(<ItemPage/>, '/inventory/101');
 await click(button('Надеть предмет'));
 expect(user.player_data.head.id).toBe(101);
 expect(document.body.querySelector('[role="status"]').textContent).toContain('Шлем надет');
 expect(document.body.querySelector('.modal')).toBeNull();
});

test('unwear updates equipment without a result modal',async()=>{
 const item={id:101,name:'Шлем',type:'head',count:1};
 const player={id:1,inventory_new:{101:item},head:item};
 user.setUser(1);user.setPlayer(player);user.setPlayerInventory(player.inventory_new);
 GetDataById.mockResolvedValue({data:player});
 UnwearDataById.mockResolvedValue({status:200,data:{...player,head:null},message:'Шлем снят'});
 await render(<Equipment/>);
 await click(container.querySelector('[aria-label="Шлем — открыть действия"]'));
 await click(button('Снять предмет'));
 expect(user.player_data.head).toBeNull();
 expect(document.body.querySelector('[role="status"]').textContent).toContain('Шлем снят');
 expect(document.body.querySelector('.modal')).toBeNull();
});

test('selection checkbox has a label and toggles once',async()=>{
 const select=jest.fn();
 const item={name:'Меч',count:1};
 await render(<InventoryItem devicekey="1" device={item} onToggleSelect={select} onShowModal={jest.fn()}/>);
 const checkbox=container.querySelector('input[type="checkbox"]');
 expect(checkbox.closest('label')).not.toBeNull();
 expect(checkbox.getAttribute('aria-label')).toBe('Выбрать: Меч');
 await act(async()=>Simulate.change(checkbox,{target:{checked:true}}));
 expect(select).toHaveBeenCalledTimes(1);
});
