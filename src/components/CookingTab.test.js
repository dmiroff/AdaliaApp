import React from 'react';
import {createRoot} from 'react-dom/client';
import {act,Simulate} from 'react-dom/test-utils';
import CookingTab from './CookingTab';
import api from '../http/apiClient';
jest.mock('../http/apiClient',()=>({__esModule:true,default:{get:jest.fn(),post:jest.fn()}}));
const quote={effect:'Урон +5%',food:{1:2},healed:20,partial:false,replaces:false};
const state=()=>({allowed:true,skill:5,recipes:[],dishes:[{id:1401,name:'Мясо с чередой',count:3,effect:'Урон +5%',quote}],group_members:[{id:2,name:'Анна',nearby:true},{id:3,name:'Борис',nearby:false}],feasts:[],food_names:{1:'Хлеб'},player_id:1});
let root,node;
const button=name=>[...document.querySelectorAll('button')].find(b=>b.textContent===name);
const click=async name=>act(async()=>Simulate.click(button(name)));
beforeEach(()=>{jest.clearAllMocks();global.IS_REACT_ACT_ENVIRONMENT=true;Object.defineProperty(global,'crypto',{configurable:true,value:{randomUUID:()=> 'stable-request'}});node=document.createElement('div');document.body.appendChild(node);root=createRoot(node);api.get.mockResolvedValue({data:state()});api.post.mockResolvedValue({data:{message:'Сохранено'}});});
afterEach(async()=>{await act(async()=>root.unmount());node.remove();});
const render=()=>act(async()=>root.render(<CookingTab/>));
test('group invite selects nearby members and sends only after confirmation',async()=>{
 await render();expect(node.textContent).toContain('Анна');expect([...node.querySelectorAll('input')].find(i=>i.disabled)).toBeTruthy();
 await click('Пригласить группу');expect(api.post).not.toHaveBeenCalled();
 await click('Подтвердить');expect(api.post).toHaveBeenCalledWith('/crafting/cooking/invite',expect.objectContaining({item_id:1401,participant_ids:[2],host_accept:true,request_id:'stable-request'}));
});
test('guest explicitly accepts replacement and partial food quote',async()=>{
 api.get.mockResolvedValue({data:{...state(),player_id:2,feasts:[{id:'dinner',host_id:1,host_name:'Повар',quote:{...quote,partial:true,replaces:true},participants:{1:{name:'Повар',answer:'accepted'},2:{name:'Анна',answer:'waiting'}}}]}});
 await render();await click('Принять приглашение');expect(api.post).not.toHaveBeenCalled();await click('Подтвердить');
 expect(api.post).toHaveBeenCalledWith('/crafting/cooking/answer',expect.objectContaining({feast_id:'dinner',accept:true,replace:true,partial:true}));
});
test('host can start with consenting players through the app',async()=>{
 api.get.mockResolvedValue({data:{...state(),feasts:[{id:'dinner',host_id:1,host_name:'Повар',quote,participants:{1:{name:'Повар',answer:'accepted'},2:{name:'Анна',answer:'accepted'}}}]}});
 await render();await click('Начать с согласившимися');await click('Подтвердить');expect(api.post).toHaveBeenCalledWith('/crafting/cooking/start',expect.objectContaining({feast_id:'dinner',ready_only:true}));
});
test('personal meal remains usable and retries keep the request identity',async()=>{
 await render();await click('Использовать на отдыхе');api.post.mockRejectedValueOnce(new Error('offline'));
 await click('Подтвердить');await click('Подтвердить');expect(api.post).toHaveBeenCalledTimes(2);expect(api.post.mock.calls[0]).toEqual(api.post.mock.calls[1]);
});
