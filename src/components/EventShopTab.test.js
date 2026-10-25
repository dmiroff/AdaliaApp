import React from 'react';
import {createRoot} from 'react-dom/client';
import {act, Simulate} from 'react-dom/test-utils';
import EventShopTab from './EventShopTab';
import {eventShopPurchase,getCurrentEventShop} from '../http/eventShopApi';
jest.mock('../http/eventShopApi',()=>({eventShopPurchase:jest.fn(),getCurrentEventShop:jest.fn()}));
jest.mock('./EventShopHistory',()=>()=> <div>История покупок</div>);
const products=[
 {id:201,name:'Мешок с наградами Некрополя',price:300,type:'consumable',max_quantity:1000},
 {id:202,name:'Случайный арт',price:500,type:'cosmetic',max_quantity:1},
 {id:203,name:'Кастомный арт',price:1500,type:'cosmetic_selectable',max_quantity:1,description:'Без анимации.'},
 {id:204,name:'Малая бездонная сумка',price:10000,type:'consumable',max_quantity:100},
];
let root,container;
global.IS_REACT_ACT_ENVIRONMENT=true;
beforeEach(()=>{
 jest.clearAllMocks();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
 getCurrentEventShop.mockResolvedValue({event_name:'Осенняя лавка Некрополя',balance:12000,products});
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
const render=async()=>act(async()=>root.render(<EventShopTab/>));
const button=label=>Array.from(document.body.querySelectorAll('button')).find(el=>el.textContent===label);
const choose=async name=>act(async()=>{
 const card=Array.from(container.querySelectorAll('.card')).find(el=>el.textContent.includes(name));
 Simulate.click(card.querySelector('button'));
});

test('shows the four products for event currency and no animated product',async()=>{
 await render();
 products.forEach(p=>expect(container.textContent).toContain(p.name));
 expect(container.textContent).toContain('Осколки Некрополя: 12000');
 expect(container.textContent).not.toMatch(/Снежок|Алтарь Пепла|Анимированный арт/);
});

test('custom art requires description and is submitted once while awaiting payment',async()=>{
 await render();await choose('Кастомный арт');
 expect(button('Подтвердить покупку').disabled).toBe(true);
 const field=document.body.querySelector('textarea');
 await act(async()=>Simulate.change(field,{target:{value:'Дварф с фонарём'}}));
 let finish;eventShopPurchase.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
 await act(async()=>Simulate.click(button('Подтвердить покупку')));
 expect(button('Покупка…').disabled).toBe(true);
 expect(eventShopPurchase).toHaveBeenCalledTimes(1);
 expect(eventShopPurchase).toHaveBeenCalledWith(203,'cosmetic_selectable',1,expect.objectContaining({custom_image_request:'Дварф с фонарём',request_id:expect.any(String)}));
 await act(async()=>finish({message:'Заказ принят',data:{remaining_currency:10500}}));
 expect(container.textContent).toContain('Осколки Некрополя: 10500');
});

test('quantity total is correct and a network retry keeps the same receipt key',async()=>{
 await render();await choose('Мешок с наградами Некрополя');
 await act(async()=>Simulate.change(document.body.querySelector('input[type="number"]'),{target:{value:'2'}}));
 expect(document.body.textContent).toContain('Итого: 600 осколков Некрополя');
 eventShopPurchase.mockRejectedValue(new Error('Ошибка сети'));
 await act(async()=>Simulate.click(button('Подтвердить покупку')));
 await act(async()=>Simulate.click(button('Подтвердить покупку')));
 expect(eventShopPurchase.mock.calls[0]).toEqual(eventShopPurchase.mock.calls[1]);
 expect(eventShopPurchase.mock.calls[0][2]).toBe(2);
});
