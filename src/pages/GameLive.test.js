import React from 'react';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import GameLive from './GameLive';
import api from '../http/apiClient';

jest.mock('../http/apiClient',()=>({get:jest.fn(),post:jest.fn()}));
let root,container;
global.IS_REACT_ACT_ENVIRONMENT=true;
beforeEach(()=>{
    jest.clearAllMocks();localStorage.setItem('access_token','fixture');
    container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();localStorage.clear();});
async function mount(combat,inFight=true) {
    api.get.mockResolvedValue({data:{messages:[{id:'1',role:'bot',text:'Текущий ход: 2\n🏃 28',time:Date.now()}],
        player:{name:'Тестер',in_fight:inFight,current_health:9000,max_health:9000,combat},pending_command:null}});
    await act(async()=>root.render(<GameLive/>));
}
test('class actions update HP, AP and slots even when the last text report is old',async()=>{
    await mount({current_health:1234,max_health:3000,current_action_points:24,active_magic_slots:7});
    const vitals=container.querySelector('.game-current-vitals').textContent;
    expect(vitals).toContain('1234/3000');expect(vitals).toContain('24 ОД');expect(vitals).toContain('7 ОЗ');
    expect(vitals).not.toContain('28 ОД');expect(vitals).not.toContain('9000/9000');
});
test('zero health, AP and slots remain zero',async()=>{
    await mount({current_health:0,max_health:3000,current_action_points:0,active_magic_slots:0});
    const vitals=container.querySelector('.game-current-vitals').textContent;
    expect(vitals).toContain('0/3000');expect(vitals).toContain('0 ОД');expect(vitals).toContain('0 ОЗ');
});
test('older APIs retain text fallback',async()=>{
    await mount(undefined);
    const vitals=container.querySelector('.game-current-vitals').textContent;
    expect(vitals).toContain('9000/9000');expect(vitals).toContain('28 ОД');expect(vitals).not.toContain('ОЗ');
});
test('leaving a fight discards stale combat stats',async()=>{
    await mount({current_health:0,max_health:3000,current_action_points:0,active_magic_slots:0},false);
    const vitals=container.querySelector('.game-current-vitals').textContent;
    expect(vitals).toContain('9000/9000');expect(vitals).not.toContain('ОД');expect(vitals).not.toContain('ОЗ');
});
