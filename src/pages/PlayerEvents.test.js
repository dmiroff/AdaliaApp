import React from 'react';
import {createRoot} from 'react-dom/client';
import {act, Simulate} from 'react-dom/test-utils';
import PlayerEvents from './PlayerEvents';
import api from '../http/apiClient';

jest.mock('../http/apiClient', () => ({__esModule: true, default: {get: jest.fn(), post: jest.fn()}}));
let container, root;
const event = (extra = {}) => ({id:'run1',host_id:1,host_name:'Ведущий',title:'Охота игроков',rules:'Очки за добычу',tie_rule:'По дате записи',
    status:'open',starts_at:Date.now()/1000-60,ends_at:Date.now()/1000+3600,prizes:[100],participation_gold:0,escrow:100,limit:20,
    conditions:[{kind:'item',target:'10',label:'Камень',points:3}],participants:{},leaderboard:[],history:[],...extra});
const button = name => [...container.querySelectorAll('button')].find(b => b.textContent === name);
const click = async name => act(async () => Simulate.click(button(name)));
const render = async () => act(async () => root.render(<PlayerEvents/>));

beforeEach(() => {
    jest.clearAllMocks();global.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');document.body.appendChild(container);root = createRoot(container);
    api.get.mockImplementation(path => Promise.resolve({data: path.endsWith('/targets') ? [] : path === '/player-events/run1' ? event() : {player_id:2,money:50,events:[event()]}}));
});
afterEach(async () => {await act(async () => root.unmount());container.remove();});

test('lists current events and participant can join without organizer controls', async () => {
    await render();
    // Select by the card instead of depending on the browser timezone/date format.
    await act(async () => Simulate.click(container.querySelector('.player-event-card')));
    expect(container.textContent).toContain('Получение предмета: Камень — 3 очк.');
    expect(button('Начать ивент')).toBeUndefined();
    api.post.mockResolvedValue({data:event({participants:{2:'Игрок'},leaderboard:[{player_id:2,name:'Игрок',place:1,score:0}]})});
    await click('Участвовать');
    expect(api.post).toHaveBeenCalledWith('/player-events/run1/join', expect.objectContaining({request_id:expect.any(String)}));
});

test('lost response retry reuses request key', async () => {
    await render();await act(async () => Simulate.click(container.querySelector('.player-event-card')));
    api.post.mockRejectedValue(new Error('network'));
    await click('Участвовать');await click('Участвовать');
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(api.post.mock.calls[0][1].request_id).toBe(api.post.mock.calls[1][1].request_id);
    expect(container.querySelector('[role=alert]')).toBeTruthy();
});

test('organizer sees corrections and finish; closed event cannot be changed', async () => {
    const current = event({status:'active',participants:{2:'Игрок'},leaderboard:[{player_id:2,name:'Игрок',place:1,score:5}],
        history:[{id:'score',player_id:2,delta:5,reason:'Первый раунд',at:1700000001}]});
    api.get.mockImplementation(path => Promise.resolve({data:path === '/player-events/run1' ? current : {player_id:1,money:900,events:[current]}}));
    await render();await act(async () => Simulate.click(container.querySelector('.player-event-card')));
    expect(button('Отменить начисление')).toBeTruthy();
    expect(button('Завершить и выдать награды')).toBeTruthy();
    expect(button('Участвовать')).toBeUndefined();
});

test('create form reserves all prizes including participant limit', async () => {
    await render();await click('Создать ивент');
    const input = container.querySelector('input[name=participation_gold]');
    await act(async () => Simulate.change(input,{target:{name:'participation_gold',value:'10'}}));
    expect(container.textContent).toContain('300 золота');
    expect(container.querySelector('textarea[name=tie_rule]').required).toBe(true);
});

test('race condition uses readable labels and submits its stable race key', async () => {
    api.get.mockImplementation((path, config) => Promise.resolve({data: path.endsWith('/targets')
        ? (config?.params.kind === 'kill_race' ? [{id:'Undead',name:'Нежить'}] : [{id:'Found_iron_ore6_next',name:'Добыча железной руды — этап 6, продолжение'}])
        : path === '/player-events/run1' ? event() : {player_id:1,money:20000,events:[]}}));
    api.post.mockResolvedValue({data:event()});
    await render();await click('Создать ивент');
    await act(async () => new Promise(resolve => setTimeout(resolve, 350)));
    expect(container.textContent).toContain('Добыча железной руды');
    expect(container.textContent).not.toContain('Found_iron_ore6_next');
    const kind = container.querySelector('fieldset select');
    await act(async () => Simulate.change(kind,{target:{value:'kill_race'}}));
    await act(async () => new Promise(resolve => setTimeout(resolve, 350)));
    const target = container.querySelectorAll('fieldset select')[1];
    await act(async () => Simulate.change(target,{target:{value:'Undead'}}));
    await click('Добавить условие');
    expect(container.textContent).toContain('Убийство по расе: Нежить');
    for (const [name,value] of [['title','Охота'],['rules','Убивайте нежить'],['tie_rule','Решает организатор']]) {
        const input = container.querySelector(`[name=${name}]`);
        await act(async () => Simulate.change(input,{target:{name,value}}));
    }
    await act(async () => Simulate.submit(container.querySelector('form')));
    expect(api.post).toHaveBeenCalledWith('/player-events', expect.objectContaining({conditions:[{kind:'kill_race',target:'Undead',points:1}]}));
});

test('insufficient prize reserve is explained before submitting', async () => {
    api.get.mockResolvedValue({data:{player_id:1,money:9572,events:[]}});
    await render();await click('Создать ивент');
    for (const [name,value] of [['limit','100'],['prizes','100, 100, 100'],['participation_gold','100']]) {
        await act(async () => Simulate.change(container.querySelector(`[name=${name}]`),{target:{name,value}}));
    }
    expect(container.textContent).toContain('Не хватает 728 золота');
    expect(button('Создать и уведомить администраторов').disabled).toBe(true);
    await act(async () => Simulate.submit(container.querySelector('form')));
    expect(api.post).not.toHaveBeenCalled();
});


test('creation refuses an event shorter than a day', async () => {
    api.get.mockResolvedValue({data:{player_id:1,money:10000,events:[]}});
    await render(); await click('Создать ивент');
    const start = container.querySelector('[name=starts_at]').value;
    await act(async () => Simulate.change(container.querySelector('[name=ends_at]'), {target:{name:'ends_at',value:start}}));
    expect(button('Создать и уведомить администраторов').disabled).toBe(true);
    expect(container.textContent).toContain('не менее суток');
    await act(async () => Simulate.submit(container.querySelector('form')));
    expect(api.post).not.toHaveBeenCalled();
});

test('organizer cannot settle rewards before the announced ending', async () => {
    const current = event({status:'active',ends_at:Date.now()/1000+86400,participants:{2:'Игрок'},leaderboard:[{player_id:2,name:'Игрок',place:1,score:5}]});
    api.get.mockImplementation(path => Promise.resolve({data:path === '/player-events/run1' ? current : {player_id:1,money:900,events:[current]}}));
    await render(); await act(async () => Simulate.click(container.querySelector('.player-event-card')));
    expect(button('Завершить и выдать награды').disabled).toBe(true);
});


test('active event allows joining and confirms participation after refresh', async () => {
    let current = event({status:'active'});
    api.get.mockImplementation(path => Promise.resolve({data:path === '/player-events/run1' ? current : {player_id:2,money:50,events:[current]}}));
    api.post.mockImplementation(() => {
        current = {...current, participants:{2:'Игрок'},leaderboard:[{player_id:2,name:'Игрок',place:1,score:0}]};
        return Promise.resolve({data:current});
    });
    await render();await act(async () => Simulate.click(container.querySelector('.player-event-card')));
    expect(button('Участвовать').disabled).toBe(false);
    expect(container.textContent).toContain('Действия до регистрации не учитываются');
    await click('Участвовать');
    expect(api.post).toHaveBeenCalledWith('/player-events/run1/join',expect.objectContaining({request_id:expect.any(String)}));
    expect(button('Участвовать')).toBeUndefined();
    expect(container.textContent).toContain('Вы участвуете в этом ивенте');
});

test.each(['finished','cancelled','active'])('closed or expired %s event cannot be joined', async status => {
    const current = event({status,ends_at:Date.now()/1000-1});
    api.get.mockImplementation(path => Promise.resolve({data:path === '/player-events/run1' ? current : {player_id:2,money:50,events:[current]}}));
    await render();await act(async () => Simulate.click(container.querySelector('.player-event-card')));
    expect(button('Участвовать')).toBeUndefined();
    expect(container.textContent).toContain('Регистрация закрыта');
});

test('full active event explains why registration is disabled', async () => {
    const current=event({status:'active',limit:2,participants:{3:'Третий',4:'Четвёртый'}});
    api.get.mockImplementation(path => Promise.resolve({data:path === '/player-events/run1' ? current : {player_id:2,money:50,events:[current]}}));
    await render();await act(async () => Simulate.click(container.querySelector('.player-event-card')));
    expect(button('Участвовать').disabled).toBe(true);
    expect(container.textContent).toContain('Все места заняты');
});
