import React from 'react';
import {createRoot} from 'react-dom/client';
import {act, Simulate} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import api from '../http/apiClient';
import {Context} from '../index';
import T3Builder from './T3Builder';

jest.mock('../index', () => ({Context: require('react').createContext({})}));
jest.mock('../http/apiClient', () => ({get:jest.fn(),put:jest.fn(),post:jest.fn()}));
const fixture = () => ({active:true,player:{Character_class:'Арбитр',level:100,max_health:3000,action_points:30,magic_slots:8,talents:['Прочность']},talent_budget:33,
  talents:[{name:'Прочность',description:'Игнорирование урона',requirements:{constitution:16},max_count:1,can_add:false},
    {name:'Личный ответ',description:'Удар по нарушителю',requirements:{},max_count:1,can_add:true}],
  slots:{right_hand:'Оружие',left_hand:'Снаряжение в левой руке'},equipment:{right_hand:{id:12}},inventory:[{id:12,name:'Меч+20 (р)',type:'right_hand',count:4}],
  catalogue:[{name:'Меч',type:'right_hand',twohanded:false},{name:'Кувалда',type:'right_hand',twohanded:true}],
  prefixes:{weapon:{power:'Истинный'},armor:{power:'Истинная'}},suffixes:{strength:'Орла'}});
let container,root;
const button = text => [...container.querySelectorAll('button')].find(node => node.textContent === text);
const labelled = label => container.querySelector(`[aria-label="${label}"]`);
const click = async node => {await act(async () => node.dispatchEvent(new MouseEvent('click',{bubbles:true})));};
const change = async (node,value) => {await act(async () => Simulate.change(node,{target:{value}}));};
const mount = async value => {
  api.get.mockResolvedValue({data:value});
  await act(async () => root.render(<Context.Provider value={{user:{setPolygonOnly:jest.fn()}}}><MemoryRouter><T3Builder/></MemoryRouter></Context.Provider>));
};
beforeEach(() => {jest.clearAllMocks();global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(async () => {await act(async()=>root.unmount());container.remove();});

test('searches talent names and descriptions', async () => {
  await mount(fixture());
  expect(container.textContent).toContain('Выбрано 1 из 33');
  await change(labelled('Найти талант'),'нарушителю');
  expect([...container.querySelectorAll('h3')].map(node=>node.textContent)).toEqual(['Личный ответ']);
});
test('saves a full talent replacement and permits undoing a removal', async () => {
  const value=fixture();await mount(value);
  await click(labelled('Убрать Прочность'));
  expect(labelled('Добавить Прочность').disabled).toBe(false);
  await click(labelled('Добавить Прочность'));
  await click(labelled('Добавить Личный ответ'));
  api.put.mockResolvedValue({data:{...value,player:{...value.player,talents:['Прочность','Личный ответ']}}});
  await click(button('Сохранить таланты'));
  expect(api.put).toHaveBeenCalledWith('/game/t3/talents',{talents:['Прочность','Личный ответ']});
  expect(container.textContent).toContain('Таланты сохранены. Параметры пересчитаны.');
});
test('grants a selected weapon and equips only after the server responds', async () => {
  const value=fixture();await mount(value);
  await click(button('Снаряжение'));
  await click([...container.querySelectorAll('button[role="option"]')].find(node=>node.textContent==='Меч'));
  await change(labelled('Префикс'),'power');await change(labelled('Суффикс'),'strength');
  const item={id:-123,name:'Истинный Меч Орла+20 (р)',type:'right_hand',count:4};
  api.post.mockResolvedValue({data:{...value,inventory:[...value.inventory,item]}});
  await click(button('Получить +20р'));
  expect(api.post).toHaveBeenCalledWith('/game/t3/items',{name:'Меч',prefix:'power',suffix:'strength'});
  api.put.mockResolvedValue({data:{...value,inventory:[...value.inventory,item],equipment:{right_hand:item}}});
  await change(container.querySelector('#t3-slot-right_hand'),'-123');
  expect(api.put).toHaveBeenCalledWith('/game/t3/equipment',{slot:'right_hand',item_id:-123});
});
test('locks changes during combat and gives a clear entry instruction', async () => {
  const value=fixture();value.player.in_fight=true;await mount(value);
  expect(container.textContent).toContain('Идёт бой');
  expect(labelled('Добавить Личный ответ').disabled).toBe(true);
});
test('inactive profiles are directed to test_t3', async () => {
  await mount({active:false});expect(container.textContent).toContain('Начните с test_t3');
});

test.each([['Пиромант','Огонь · все воздействия'],['Неистовый','Оружейный класс']])('displays the selected class and its actual magic access: %s', async (name,label) => {
  const value=fixture();value.player.Character_class=name;value.magic_label=label;
  await mount(value);
  expect(container.textContent).toContain(name);
  expect(container.textContent).toContain(label);
  expect(container.textContent).not.toContain('Власть · все воздействия');
});
