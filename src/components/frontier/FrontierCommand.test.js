import React from 'react';
import {createRoot} from 'react-dom/client';
import {act,Simulate} from 'react-dom/test-utils';
import FrontierCommand from './FrontierCommand';
import api from '../../http/apiClient';
jest.mock('../../http/apiClient',()=>({__esModule:true,default:{get:jest.fn(),post:jest.fn()}}));
jest.mock('./FrontierMap',()=>()=> <div>Публичная сетка</div>);
jest.mock('./FrontierEconomy',()=>()=> <div>Казна</div>);
const fixture={available:true,guild_id:0,guild_name:'Тестовая гильдия',can_manage:true,leader:true,clock:1794000000,syncing:false,sectors:[],armies:[],caravans:[],trades:[],orders:[],wounded:[],treaties:[],wars:[],peace_offers:[],events:[],guilds:[{id:1,name:'Соседи'}],players:[{id:7,name:'Командир'}],home_units:{39:20},unit_names:{39:'Боец'},commanders:[{id:'player',name:'Командир',capacity:94}],prices:{food:100,essence:300}};
let root,container;
const button=name=>[...document.querySelectorAll('button')].find(x=>x.textContent===name);
const field=label=>[...container.querySelectorAll('label')].find(x=>x.firstChild.textContent===label)?.querySelector('input,select');
const click=async name=>act(async()=>button(name).click());
const waitForDialogExit=async()=>{for(let i=0;i<50&&document.querySelector('[role="dialog"]');i++)await act(async()=>new Promise(resolve=>setTimeout(resolve,20)));};
beforeEach(()=>{jest.clearAllMocks();localStorage.clear();global.IS_REACT_ACT_ENVIRONMENT=true;Object.defineProperty(global,'crypto',{value:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},configurable:true});api.get.mockResolvedValue({data:fixture});api.post.mockResolvedValue({data:{message:'Приказ отправлен.'}});container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
const render=async()=>act(async()=>root.render(<FrontierCommand/>));
test('viewing the map sends no orders and does not invent hidden sites',async()=>{await render();expect(container.textContent).toContain('Публичная сетка');expect(container.textContent).not.toContain('Тайный вход');expect(api.post).not.toHaveBeenCalled();});
test('army formation requires confirmation and submits actual chosen troop counts',async()=>{await render();await click('Армии');await act(async()=>Simulate.change(field('Боец · доступно 20'),{target:{value:'10'}}));await click('Выделить бойцов и припасы');expect(api.post).not.toHaveBeenCalled();await click('Подтвердить приказ');expect(api.post).toHaveBeenCalledWith('/frontier-strategy/order',expect.objectContaining({guild_id:0,kind:'form_army',args:expect.objectContaining({units:{39:10},days:2,commander:'player'})}));});
test('uncertain reply persists the request and reuses its UUID after reload',async()=>{api.post.mockRejectedValueOnce(new Error('connection lost'));await render();await act(async()=>Simulate.change(field('Сектор'),{target:{value:'Л050'}}));await click('Отправить разведчика');await click('Подтвердить приказ');const first=api.post.mock.calls[0][1];expect(button('Отмена').disabled).toBe(true);await act(async()=>root.unmount());root=createRoot(container);await render();expect(button('Отмена').disabled).toBe(true);await click('Подтвердить приказ');expect(api.post.mock.calls[1][1]).toEqual(first);});
test('ordinary member cannot form troops, spend treasury or offer wars',async()=>{api.get.mockResolvedValue({data:{...fixture,can_manage:false,leader:false}});await render();await click('Армии');expect(button('Выделить бойцов и припасы')).toBeUndefined();await click('Войны и договоры');expect(button('Объявить войну')).toBeUndefined();expect(button('Предложить договор')).toBeUndefined();});
test('negotiated peace displays every concession and requires an explicit acceptance',async()=>{api.get.mockResolvedValue({data:{...fixture,peace_offers:[{id:'p1',status:'proposed',terms:[{name:'Л050',mandatory:true,owner:0},{name:'П020',owner:1}],accepted:[1],required:[0,1],expires:1794100000,participants:[0,1]}]}});await render();await click('Войны и договоры');expect(container.textContent).toContain('Цель войны: Л050');expect(container.textContent).toContain('П020');await click('Принять условия');expect(api.post).not.toHaveBeenCalled();await click('Подтвердить приказ');expect(api.post).toHaveBeenCalledWith('/frontier-strategy/order',expect.objectContaining({kind:'accept_peace',args:{offer:'p1'}}));});

test('mirror admin acceptance requires confirmation and shows confirmed rollback',async()=>{api.get.mockImplementation(path=>Promise.resolve({data:path==='/player'?{is_admin:true}:fixture}));api.post.mockResolvedValue({data:{status:'passed',rolled_back:true,actor_unchanged:true,steps:['PASS: откат подтверждён']}});await render();await click('Проверить систему с откатом');expect(api.post).not.toHaveBeenCalled();await click('Запустить проверку');expect(api.post).toHaveBeenCalledWith('/frontier-strategy/self-test',{}, {timeout:120000});expect(container.textContent).toContain('Проверка пройдена. Откат подтверждён.');});

test('guildless admin can complete acceptance without a red membership error or extra refresh',async()=>{
 api.get.mockImplementation(path=>path==='/player'?Promise.resolve({data:{is_admin:true}}):Promise.reject({response:{status:403,data:{detail:'Для приказов нужно состоять в гильдии.'}}}));
 api.post.mockResolvedValue({data:{status:'passed',rolled_back:true,actor_unchanged:true,steps:[]}});
 await render();expect(container.querySelector('[role="alert"]')).toBeNull();
 await click('Проверить систему с откатом');await click('Запустить проверку');
 expect(container.textContent).toContain('Проверка пройдена. Откат подтверждён.');
 expect(button('Проверить систему с откатом').disabled).toBe(false);
 await waitForDialogExit();
 expect(document.querySelector('[role="dialog"]')).toBeNull();
 expect(container.querySelector('[role="alert"]')).toBeNull();
 expect(api.get.mock.calls.filter(([path])=>path==='/frontier-strategy/state')).toHaveLength(1);
});

test('a late initial membership response cannot turn a passed admin test into an error',async()=>{
 let rejectState;
 api.get.mockImplementation(path=>path==='/player'?Promise.resolve({data:{is_admin:true}}):new Promise((resolve,reject)=>{rejectState=reject;}));
 api.post.mockResolvedValue({data:{status:'passed',rolled_back:true,actor_unchanged:true,steps:[]}});
 await render();await click('Проверить систему с откатом');await click('Запустить проверку');
 await act(async()=>rejectState({response:{status:403,data:{detail:'Для приказов нужно состоять в гильдии.'}}}));
 expect(container.textContent).toContain('Проверка пройдена. Откат подтверждён.');
 await waitForDialogExit();expect(container.querySelector('[role="alert"]')).toBeNull();expect(document.querySelector('[role="dialog"]')).toBeNull();
});

test('acceptance does not claim success without unchanged actor confirmation',async()=>{
 api.get.mockImplementation(path=>Promise.resolve({data:path==='/player'?{is_admin:true}:fixture}));
 api.post.mockResolvedValue({data:{status:'passed',rolled_back:true,actor_unchanged:false,steps:[]}});
 await render();await click('Проверить систему с откатом');await click('Запустить проверку');
 expect(container.textContent).toContain('Проверка требует внимания.');expect(container.textContent).not.toContain('Проверка пройдена.');
});

test('all material names match the item catalogue and influence cannot be traded',async()=>{
 api.get.mockResolvedValue({data:{...fixture,armies:[{id:'a1',name:'Дозор',at:'Л050',status:'escort',units:{39:1},players:[],supply:{},cargo:{112:1,114:1,115:1,116:1,117:1,118:1,119:1,120:1,121:1,influence:1},daily:{},connected:true}]}});
 await render();await click('Армии');
 const armyLabel=[...container.querySelectorAll('label')].find(label=>label.textContent==='Армия');
 await act(async()=>Simulate.change(document.getElementById(armyLabel.htmlFor),{target:{value:'a1'}}));
 for(const name of ['Железная руда','Брёвна','Мешок угля','Песчаник','Мешок песка','Стекло','Доски','Сталь','Каменный блок','Влияние'])expect(container.textContent).toContain(name+': 1');
 expect(container.textContent).toContain('Охраняет караван');expect(container.textContent).not.toContain('Ресурс 119');
 await click('Поставки и торговля');expect([...container.querySelectorAll('option')].some(option=>option.value==='influence')).toBe(false);
});

test('a cancelled battle is displayed as cancelled rather than a draw',async()=>{
 api.get.mockImplementation(path=>Promise.resolve({data:path.includes('/battles/')?{status:'cancelled',sector:'Л050',result:{winner:null,rounds:0,log:['Резерв возвращён']}}:{...fixture,events:[{id:'e1',title:'Бой отменён',battle:'b1'}]}}));
 await render();await click('Донесения');await click('Отчёт о бое');
 const dialog=document.querySelector('[role="dialog"]');expect(dialog.textContent).toContain('Бой отменён.');expect(dialog.textContent).not.toContain('ничья');expect(dialog.textContent).not.toContain('Победитель:');
});
