import React from 'react';
import {createRoot} from 'react-dom/client';
import {act,Simulate} from 'react-dom/test-utils';
import FrontierEconomy from './FrontierEconomy';
import api from '../../http/apiClient';
jest.mock('../../http/apiClient',()=>({__esModule:true,default:{get:jest.fn(),post:jest.fn()}}));
const fixture={phase:'B',available:true,guild_id:0,guild_name:'Тестовая гильдия',can_manage:true,wallet:{gold:10000,daleons:5},
 account:{status:'active',food:8,essence:0,gold:100,daleons:0,wage_debt:0,food_ratio:1,essence_ratio:1,readiness:1,last_settled:1794000000,
  daily:{food_need:1.5,essence_need:0,gold_need:20},bootstrap:{days:5,food:8,essence:0,credited:true},prices:{food:100,essence:300}},
 production:{name:'Хижина гоблинов',food_day:40,essence_day:0},observation:{roster_count:2,power:52,rows:[{id:'39',name:'Боец'}]},
 batches:[{id:'0:garrison:39',unit_id:'39',amount:2,state:'available'}],ledger:[{id:1,kind:'bootstrap',payload:{days:5},created_at:'2026-11-07T00:00:00Z'}]};
let root,container;
const button=name=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent===name);
beforeEach(()=>{jest.clearAllMocks();localStorage.clear();global.IS_REACT_ACT_ENVIRONMENT=true;Object.defineProperty(global,'crypto',{value:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},configurable:true});
 container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);api.get.mockResolvedValue({data:fixture});api.post.mockResolvedValue({data:{ok:true}});});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
test('renders real Stage B balances, bootstrap and registry without writing',async()=>{
 await act(async()=>root.render(<FrontierEconomy/>));
 expect(container.textContent).toContain('выдан однократно');expect(container.textContent).toContain('0:garrison:39');
 expect(container.textContent).toContain('40 провианта');expect(api.post).not.toHaveBeenCalled();
});
test('requires explicit confirmation and sends an own-guild idempotent deposit',async()=>{
 await act(async()=>root.render(<FrontierEconomy/>));
 await act(async()=>Simulate.change(container.querySelector('#frontier-amount'),{target:{value:'100'}}));
 await act(async()=>button('Внести в казну').click());expect(api.post).not.toHaveBeenCalled();
 expect(document.body.textContent).toContain('Подтвердить операцию');
 await act(async()=>button('Подтвердить').click());
 expect(api.post).toHaveBeenCalledWith('/frontier-economy/action',{kind:'deposit',currency:'gold',amount:100,guild_id:0,request_id:'11111111-1111-4111-8111-111111111111'});
 expect(localStorage.getItem('frontier-b-pending:session')).toBeNull();
});
test('lost response retains the same request across remount and retry',async()=>{
 api.post.mockRejectedValueOnce(new Error('connection lost'));
 await act(async()=>root.render(<FrontierEconomy/>));
 await act(async()=>Simulate.change(container.querySelector('#frontier-amount'),{target:{value:'100'}}));
 await act(async()=>button('Внести в казну').click());await act(async()=>button('Подтвердить').click());
 const first=api.post.mock.calls[0][1];expect(button('Отмена').disabled).toBe(true);
 await act(async()=>root.unmount());root=createRoot(container);await act(async()=>root.render(<FrontierEconomy/>));
 expect(button('Отмена').disabled).toBe(true);
 await act(async()=>button('Подтвердить').click());expect(api.post.mock.calls[1][1]).toEqual(first);
});
test('ordinary member may deposit but does not see treasury spending',async()=>{
 api.get.mockResolvedValue({data:{...fixture,can_manage:false}});await act(async()=>root.render(<FrontierEconomy/>));
 expect(button('Внести в казну')).toBeTruthy();expect(button('Получить из казны')).toBeUndefined();expect(button('Купить обеспечение')).toBeUndefined();
});
test('missing backend stays explicit and never manufactures balances',async()=>{
 api.get.mockRejectedValue({response:{status:404}});await act(async()=>root.render(<FrontierEconomy/>));
 expect(container.textContent).toContain('Нужен deploy_bot mirror');expect(container.textContent).not.toContain('выдан однократно');expect(api.post).not.toHaveBeenCalled();
});
