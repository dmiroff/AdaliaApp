import React from 'react';
import {createRoot} from 'react-dom/client';
import {act,Simulate} from 'react-dom/test-utils';
import FrontierObservation,{WarScore} from './FrontierObservation';
import {buildObservation,playerCapacity,heroCapacity,findRoute,isFrontierObservationHost,loadObservation} from './observation';
import api from '../../http/apiClient';
import grid from '../../../public/maps/westlands-grid.json';
jest.mock('../../http/apiClient',()=>({__esModule:true,default:{get:jest.fn()}}));
const catalog={'39':{name:'Боец',max_health:100,melee_attack:10,melee_damage:4,defence:6,action_points:4,command_weight:1,ration_day:1,essence_day:0,wage_day:10},'214':{name:'Герой',max_health:25,melee_attack:5,melee_damage:2,defence:2,action_points:2,command_weight:2,ration_day:0,essence_day:.5,wage_day:20}};
const player={name:'Командир',level:100,charisma:20,charisma_increase:-5,persuasion:100};
const settlement={garrison:{39:{amount:2,name:'Боец'},214:{amount:3,name:'Герой'}},heroes:{}};
let root,container;
beforeEach(()=>{jest.clearAllMocks();global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);global.fetch=jest.fn().mockResolvedValue({ok:true,json:async()=>grid});});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
test('same hand-calculated contract as the server and no mutation',()=>{
 const before=JSON.stringify(settlement),o=buildObservation(settlement,player,catalog);
 expect(o.power).toBe(88);expect(o.roster_count).toBe(5);expect(o.command_load).toBe(8);
 expect(o.maintenance_preview).toEqual({food_day:1.5,essence_day:1.125,gold_day:80,provisional:true});
 expect(o.bootstrap_preview).toEqual({days:5,food:8,essence:6,credited:false});expect(JSON.stringify(settlement)).toBe(before);
 expect(playerCapacity(player).capacity).toBe(93);expect(heroCapacity({skills:{overseer:3,trainer:2,pragmatic:4}}).capacity).toBe(96);
});
test('busy and wounded hero identities are deducted once',()=>{
 const h={id:214},o=buildObservation({garrison:{214:{amount:2}},heroes:{active_heroes:{Hero:h},heroes_on_mission:{Hero:h},wounded_heroes:{Hero:h}}},player,catalog);
 expect(o.power).toBe(12);expect(o.roster_count).toBe(1);expect(o.commanders).toHaveLength(1);
});
test('production host is excluded and C111 has a one-minute-per-edge route',()=>{
 expect(isFrontierObservationHost('adaliagame.ru')).toBe(false);expect(isFrontierObservationHost('www.adaliagame.ru')).toBe(false);expect(isFrontierObservationHost('test.adaliagame.ru')).toBe(true);
 expect(grid.sectors.find(s=>s.id==='С111').label[0]).toBeLessThan(700);
 const route=findRoute(grid,'С111','С082');expect(route).toEqual(['С111','С082']);expect(findRoute(grid,'bad','С082')).toBeNull();
});
test('legacy fallback reads only own guild, including guild zero',async()=>{
 api.get.mockImplementation(async path=>{
  if(path==='/frontier-observation/state')throw {response:{status:404}};
  if(path==='/player')return {data:{data:player}};
  if(path==='/guild')return {data:{data:{guild_id:0,name:'Гильдия'}}};
  if(path==='/guild/0/settlement')return {data:{data:settlement}};
  throw new Error('Unexpected route');
 });
 global.fetch.mockResolvedValue({ok:true,json:async()=>({units:catalog})});
 const o=await loadObservation();expect(o.power).toBe(88);expect(o.source).toBe('live-roster-static-catalog');
 expect(api.get).toHaveBeenCalledWith('/guild/0/settlement');
});
test('403 never falls back to another access route',async()=>{
 api.get.mockRejectedValue({response:{status:403}});await expect(loadObservation()).rejects.toEqual({response:{status:403}});expect(api.get).toHaveBeenCalledTimes(1);
});
test('read-only interface uses real snapshot and previews a project without mutations',async()=>{
 api.get.mockResolvedValue({data:buildObservation(settlement,player,catalog)});
 await act(async()=>root.render(<FrontierObservation/>));
 expect(container.textContent).toContain('88');expect(container.querySelector('button[type="submit"]')).toBeNull();
 const input=container.querySelector('[aria-label="В проект: Боец"]');
 await act(async()=>Simulate.change(input,{target:{value:'2'}}));
 expect(container.textContent).toContain('Проект: 2 бойцов');expect(api.get).toHaveBeenCalledTimes(1);
 expect(container.textContent).not.toContain('Not Found');
});
test('war gauge clamps both sides of the signed score',async()=>{
 await act(async()=>root.render(<WarScore score={150}/>));expect(container.querySelector('[aria-label="Счёт войны: 100"]')).toBeTruthy();
 await act(async()=>root.render(<WarScore score={-200}/>));expect(container.querySelector('[aria-label="Счёт войны: -100"]')).toBeTruthy();
});
test('war objective switches between sector and castle without sending an order',async()=>{
 api.get.mockResolvedValue({data:buildObservation(settlement,player,catalog)});
 await act(async()=>root.render(<FrontierObservation/>));
 await act(async()=>Simulate.click(Array.from(container.querySelectorAll('[role="tab"]')).find(t=>t.textContent==='Войны и договоры')));
 await act(async()=>Simulate.change(container.querySelector('#frontier-objective-sector'),{target:{value:'С111'}}));
 expect(container.textContent).toContain('удержание сектора С111');
 await act(async()=>Simulate.change(container.querySelector('#frontier-objective-type'),{target:{value:'castle'}}));
 await act(async()=>Simulate.change(container.querySelector('#frontier-objective-castle'),{target:{value:'Замок Ветра'}}));
 expect(container.textContent).toContain('захват замка «Замок Ветра»');
 expect(container.textContent).toContain('Мир закрепляет фактически занятые владения');
 expect(api.get).toHaveBeenCalledTimes(1);
});
