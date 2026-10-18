import React from 'react';
import {createRoot} from 'react-dom/client';
import {act,Simulate} from 'react-dom/test-utils';
import GameDraftKeyboard from './GameDraftKeyboard';
import {normalizeKeyboard} from '../utils/gameDraftProtocol';
import GameLive from '../pages/GameLive';
import api from '../http/apiClient';
import {MassTransferModal} from './MassTransferModal';
import {MassTransferItems} from '../http/SupportFunctions';

jest.mock('../http/SupportFunctions',()=>({MassTransferItems:jest.fn()}));
jest.mock('../http/apiClient',()=>({__esModule:true,default:{get:jest.fn(),post:jest.fn()}}));
let root,container;
beforeEach(()=>{jest.clearAllMocks();localStorage.clear();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
const render=async element=>act(async()=>root.render(element));
const nativeKeyboard={inline:false,buttons:[[{action:{type:'text',label:'Атака 4/7',payload:{full_command:'Атака 4/7'}}}],[{action:{type:'text',label:'Защита 3/1'}}]]};

test('readable combat costs preserve the exact native command, payload and provenance',async()=>{
 const send=jest.fn();const keyboard=normalizeKeyboard(nativeKeyboard);
 await render(<GameDraftKeyboard keyboard={keyboard} compactCosts onCommand={send} revision="42" sourceId="41"/>);
 const [attack,defend]=container.querySelectorAll('button');
 expect(attack.textContent).toBe('Атака · 4 ОД');
 expect(defend.disabled).toBe(true);expect(defend.textContent).toContain('Не хватает 2 ОД');
 await act(async()=>Simulate.click(attack));
 expect(send).toHaveBeenCalledWith(keyboard.rows[0][0].command,'42','Атака 4/7',keyboard.rows[0][0].payload,'41');
});

test('VK-style labels stay unchanged outside combat mode',async()=>{
 await render(<GameDraftKeyboard keyboard={normalizeKeyboard(nativeKeyboard)} onCommand={()=>{}}/>);
 expect(container.querySelector('button').textContent).toBe('Атака 4/7');
});

const snapshot=()=>({messages:[
 {id:'1',role:'bot',text:'Старое событие',time:1,keyboard:{inline:false,buttons:[[{action:{type:'text',label:'Старая кнопка'}}]]}},
 {id:'2',role:'user',text:'Далее',time:2},
 {id:'3',role:'bot',text:'Текущее событие',time:3,keyboard:{inline:true,buttons:[[{action:{type:'text',label:'Выбрать путь',payload:{full_command:'История run 2 path'}}}]]}},
 ],revision:'3',keyboard_source:'1',keyboard:nativeKeyboard,pending_command:null,player:{name:'Тест',level:10,current_health:100,max_health:100}});

test('current inline story remains visible and old non-inline actions do not leak into controls',async()=>{
 localStorage.setItem('access_token','test');api.get.mockResolvedValue({data:snapshot()});
 await render(<GameLive/>);
 expect(container.querySelector('.game-current-state').textContent).toContain('Текущее событие');
 expect(container.querySelector('.game-draft-controls').textContent).not.toContain('Старая кнопка');
 const choose=[...container.querySelectorAll('button')].find(button=>button.textContent==='Выбрать путь');
 expect(choose.disabled).toBe(false);expect(api.post).not.toHaveBeenCalled();
 expect(container.querySelector('[role="log"]').hidden).toBe(true);
});

test('history can be opened without sending a game command',async()=>{
 localStorage.setItem('access_token','test');api.get.mockResolvedValue({data:snapshot()});
 await render(<GameLive/>);await act(async()=>Simulate.click(container.querySelector('.game-history-toggle')));
 expect(container.querySelector('[role="log"]').hidden).toBe(false);expect(api.post).not.toHaveBeenCalled();
});


test('transfer trims the real recipient and prevents duplicate requests before a response',async()=>{
 let finish;MassTransferItems.mockReturnValue(new Promise(resolve=>{finish=resolve;}));
 const complete=jest.fn(),close=jest.fn();
 await render(<MassTransferModal show selectedItems={new Set(['12'])} inventory={{12:{name:'Меч',count:2,value:10}}} onClose={close} onSuccess={complete}/>);
 const input=document.querySelector('input[placeholder="Точное имя персонажа"]');
 await act(async()=>Simulate.change(input,{target:{value:'  Шаенс  '}}));
 const submit=document.querySelector('.mass-submit-btn');
 await act(async()=>{Simulate.click(submit);Simulate.click(submit);});
 expect(MassTransferItems).toHaveBeenCalledTimes(1);
 expect(MassTransferItems).toHaveBeenCalledWith('Шаенс',[{itemId:'12',quantity:2}]);
 expect(document.body.textContent).not.toContain('Арагорн');
 await act(async()=>finish({message:'Передано'}));
 expect(complete).toHaveBeenCalledWith('Передано');expect(close).toHaveBeenCalledTimes(1);
});
