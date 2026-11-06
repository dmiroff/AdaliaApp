import React from 'react';
import {createRoot} from 'react-dom/client';
import {act, Simulate} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import {Context} from '../index';
import UserStore from '../store/UserStore';
import InventoryItem from './InventoryItem';
import InventoryList from './InventoryList';
import {MassSellModal} from './MassTransferModal';
import GetDataById from '../http/GetData';
import api from '../http/apiClient';
import {isFavoriteItem, favoriteInventory} from '../utils/favorites';

jest.mock('../index', () => ({Context: require('react').createContext(null)}));
jest.mock('../http/GetData', () => ({__esModule:true, default:jest.fn()}));
jest.mock('../http/apiClient', () => ({__esModule:true, default:{get:jest.fn(),post:jest.fn(),put:jest.fn()}}));
jest.mock('../http/SupportFunctions', () => ({WearDataById:jest.fn(), SellItemById:jest.fn(), ThrowItemById:jest.fn(), MassSellItems:jest.fn(), MassTransferItems:jest.fn(), MassDropItems:jest.fn()}));
let root, container, user;
const items = {
  '123': {name:'Поглощающая кольчуга +21', count:2, type:'breast_armor', is_equippable:true, weight:1, value:50},
  '456': {name:'Обычный камень', count:3, type:'reagent', weight:1, value:1}
};
const player = favorite => ({id:7, name:'Проверка', upgrades:['Избранное'], favorite_items:favorite,
  inventory_new:items, current_weight:5, max_weight:100});
const render = async component => act(async()=>root.render(<Context.Provider value={{user}}><MemoryRouter>{component}</MemoryRouter></Context.Provider>));
const click = async button => act(async()=>Simulate.click(button));
beforeEach(()=>{
 jest.clearAllMocks();global.IS_REACT_ACT_ENVIRONMENT=true;
 window.matchMedia=()=>({matches:false,addListener:()=>{},removeListener:()=>{},addEventListener:()=>{},removeEventListener:()=>{}});
 user=new UserStore();user.setPlayer(player([]));user.setPlayerInventory(items);
 container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
 GetDataById.mockResolvedValue({data:player(['123'])});
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});

test('favorite selection uses exact item IDs and does not mutate inventory',()=>{
 expect(isFavoriteItem({favorite_items:['123']},123)).toBe(true);
 expect(isFavoriteItem({favorite_items:['123']},12)).toBe(false);
 const view=favoriteInventory(items,player(['123']));
 expect(view['123'].favorite).toBe(true);expect(view['456'].favorite).toBe(false);
 expect(items['123'].favorite).toBeUndefined();
 expect(favoriteInventory({broken:null},player([])).broken).toBeNull();
});

test('star persists the owner setting and protected items disable sale and transfer',async()=>{
 api.put.mockResolvedValue({data:{data:player(['123']),message:'Предмет добавлен в избранное.'}});
 await render(<InventoryItem devicekey="123" device={items['123']} onShowModal={()=>{}}/>);
 await click(container.querySelector('[aria-pressed="false"]'));
 expect(api.put).toHaveBeenCalledWith('/inventory/123/favorite',{favorite:true});
 expect(user.player_data.favorite_items).toEqual(['123']);
 expect(container.querySelector('[aria-pressed="true"]').getAttribute('aria-pressed')).toBe('true');
 await click(container.querySelector('.item-actions-trigger'));
 const buttons=[...document.querySelectorAll('button')];
 expect(buttons.find(b=>b.textContent==='Передать').disabled).toBe(true);
 expect(buttons.find(b=>b.textContent==='Продать').disabled).toBe(true);
});

test('a failed save leaves the item unmarked and shows the error',async()=>{
 api.put.mockRejectedValue({response:{data:{detail:'Предмет уже продан'}}});
 await render(<InventoryItem devicekey="123" device={items['123']} onShowModal={()=>{}}/>);
 await click(container.querySelector('[aria-pressed="false"]'));
 expect(user.player_data.favorite_items).toEqual([]);
 expect(document.body.textContent).toContain('Предмет уже продан');
});

test('favorites filter supports both yes and no',async()=>{
 await render(<InventoryList/>);
 const field=[...container.querySelectorAll('select')].find(s=>s.querySelector('option[value="favorite"]'));
 expect(field).toBeTruthy();
 await act(async()=>Simulate.change(field,{target:{value:'favorite'}}));
 const value=[...field.closest('.filter-card, .col-md-6, .col').querySelectorAll('select')].find(s=>s!==field && s.querySelector('option[value="true"]'));
 expect(value).toBeTruthy();
 await act(async()=>Simulate.change(value,{target:{value:'true'}}));
 expect(container.textContent).toContain(items['123'].name);
 expect(container.textContent).not.toContain(items['456'].name);
 await act(async()=>Simulate.change(value,{target:{value:'false'}}));
 expect(container.textContent).not.toContain(items['123'].name);
 expect(container.textContent).toContain(items['456'].name);
});

test('bulk sale excludes a favorite stack and cannot submit an empty selection',async()=>{
 user.setPlayer(player(['123']));
 await render(<MassSellModal show selectedItems={new Set(['123'])} inventory={items} onClose={()=>{}} onSuccess={()=>{}}/>);
 expect(document.body.textContent).toContain('Избранные предметы исключены');
 expect(document.querySelector('.mass-submit-btn').disabled).toBe(true);
});
