import React from 'react';
import {createRoot} from 'react-dom/client';
import {act,Simulate} from 'react-dom/test-utils';
import {GameDemo as GameDraft} from './GameDraft';
import api from '../http/apiClient';
import {DRAFT_STORAGE_KEY} from '../services/gameDraftDemo';

jest.mock('../http/apiClient',()=>({__esModule:true,default:{get:jest.fn(),post:jest.fn()}}));
let root,container;
beforeEach(()=>{
  localStorage.clear();jest.clearAllMocks();
  container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
const render=async()=>act(async()=>root.render(<GameDraft/>));
const button=text=>[...container.querySelectorAll('button')].find(b=>b.textContent===text);
const click=async text=>act(async()=>Simulate.click(button(text)));

test('demo is usable without login and sends no backend mutations',async()=>{
  await render();
  expect(container.textContent).toContain('Прогресс вашего персонажа не меняется');
  await click('За город');await click('Осмотреть следы');
  expect(container.textContent).toContain('Противник: 24/24');
  expect(api.get).not.toHaveBeenCalled();expect(api.post).not.toHaveBeenCalled();
});

test('inline callback reward disables the old button after completion',async()=>{
  await render();
  for (const action of ['За город','Осмотреть следы','Ударить мечом','Ударить мечом','Забрать 8 монет']) await click(action);
  expect(button('Забрать 8 монет').disabled).toBe(true);
  expect(container.textContent).toContain('Теперь у демоперсонажа 20 монет');
});

test('text commands use the same scenario and history survives remount',async()=>{
  await render();
  await act(async()=>Simulate.change(container.querySelector('input'),{target:{value:'За город'}}));
  await act(async()=>Simulate.submit(container.querySelector('form')));
  expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toContain('trail');
  await act(async()=>root.unmount());root=createRoot(container);await render();
  expect(button('Осмотреть следы')).toBeTruthy();
});

test('real character display only reads the existing player API',async()=>{
  localStorage.setItem('access_token','fixture');
  api.get.mockResolvedValue({data:{status:200,data:{name:'Тестовый герой',level:7,current_health:30,max_health:40,location:'Fargos-downtown'}}});
  await render();await click('Показать персонажа');
  expect(api.get).toHaveBeenCalledWith('/player');
  expect(container.textContent).toContain('Тестовый герой');expect(api.post).not.toHaveBeenCalled();
});

test('profile error can be retried without resetting the demo',async()=>{
  localStorage.setItem('access_token','fixture');
  api.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({data:{status:200,data:{name:'Герой',level:1}}});
  await render();await click('За город');await click('Показать персонажа');
  expect(container.querySelector('[role="alert"]').textContent).toContain('Не удалось загрузить');
  await click('Показать персонажа');
  expect(container.textContent).toContain('Герой');expect(button('Осмотреть следы')).toBeTruthy();
});
