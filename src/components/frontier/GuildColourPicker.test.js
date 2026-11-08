import React from 'react';
import {createRoot} from 'react-dom/client';
import {act,Simulate} from 'react-dom/test-utils';
import GuildColourPicker from './GuildColourPicker';
import api from '../../http/apiClient';
jest.mock('../../http/apiClient',()=>({__esModule:true,default:{post:jest.fn()}}));
const data={guild_id:0,guild_name:'Свои',guild_colour:'#d95b43',leader:true,colour_palette:['#d95b43','#3688d9','#44ad69'],guilds:[{id:1,name:'Соседи',colour:'#3688d9'}]};
let container,root,onSaved;
beforeEach(()=>{jest.clearAllMocks();global.IS_REACT_ACT_ENVIRONMENT=true;Object.defineProperty(global,'crypto',{value:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},configurable:true});container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);onSaved=jest.fn().mockResolvedValue();api.post.mockResolvedValue({data:{message:'Цвет сохранён.'}});});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
const render=async value=>act(async()=>root.render(<GuildColourPicker data={value||data} onSaved={onSaved}/>));
const save=()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='Сохранить цвет гильдии');
const choose=async value=>act(async()=>Simulate.change(container.querySelector('input[type=color]'),{target:{value}}));
test('occupied colours are disabled; free colour is saved by authenticated order',async()=>{
 await render();expect(container.querySelector('[aria-label="#3688d9 — занят: Соседи"]').disabled).toBe(true);
 await act(async()=>container.querySelector('[aria-label="#44ad69"]').click());await act(async()=>save().click());
 expect(api.post).toHaveBeenCalledWith('/frontier-strategy/order',{kind:'set_colour',guild_id:0,request_id:'11111111-1111-4111-8111-111111111111',args:{colour:'#44ad69'}});
 expect(onSaved).toHaveBeenCalledTimes(1);
});
test('custom occupied or grey colours cannot be submitted',async()=>{
 await render();await choose('#3688d9');expect(save().disabled).toBe(true);expect(container.textContent).toContain('Этот цвет уже занят');
 await choose('#808080');expect(save().disabled).toBe(true);expect(container.textContent).toContain('Серый цвет оставлен');expect(api.post).not.toHaveBeenCalled();
});
test('server conflict leaves existing ownership colours unchanged',async()=>{
 api.post.mockRejectedValue({response:{data:{detail:'Этот цвет уже занят другой гильдией.'}}});await render();await choose('#dc008a');await act(async()=>save().click());
 expect(container.querySelector('[role=alert]').textContent).toContain('уже занят');expect(onSaved).not.toHaveBeenCalled();expect(data.guild_colour).toBe('#d95b43');
});
test('only guild leader gets colour controls',async()=>{
 await render({...data,leader:false});expect(container.querySelector('input')).toBeNull();expect(container.textContent).toContain('Цвет может изменить глава гильдии.');
});
