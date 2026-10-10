import React from 'react';
import {createRoot} from 'react-dom/client';
import {act, Simulate} from 'react-dom/test-utils';
import {MemoryRouter, Routes, Route} from 'react-router-dom';
import AuthCallback from './AuthCallback';
import {Context} from '../index';
import UserStore from '../store/UserStore';
jest.mock('../index',()=>({Context:require('react').createContext(null)}));
let root, container, user;
const response=data=>({ok:true,status:200,json:async()=>data});
beforeEach(()=>{localStorage.clear();user=new UserStore();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);global.fetch=jest.fn();});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();jest.useRealTimers();});
const render=async()=>act(async()=>root.render(<Context.Provider value={{user}}><MemoryRouter initialEntries={['/auth/99/bot-fixture']}><Routes><Route path="/auth/:id/:token" element={<AuthCallback/>}/><Route path="/inventory" element={<p>Инвентарь открыт</p>}/></Routes></MemoryRouter></Context.Provider>));
test('bot link saves both tokens, replaces another account refresh token and opens inventory',async()=>{
 localStorage.setItem('refresh_token','old-account');fetch.mockResolvedValue(response({status:200,access_token:'access-fixture',refresh_token:'refresh-fixture'}));
 await render();expect(container.textContent).toBe('Инвентарь открыт');expect(user.IsAuth).toBe(true);expect(localStorage.getItem('id')).toBe('99');expect(localStorage.getItem('refresh_token')).toBe('refresh-fixture');
 const options=fetch.mock.calls[0][1];expect(JSON.parse(options.body)).toEqual({player_id:99,token:'bot-fixture'});expect(options.headers.skip_zrok_interstitial).toBe('true');
});
test('older backend without refresh token cannot retain another account token',async()=>{
 localStorage.setItem('refresh_token','old-account');fetch.mockResolvedValue(response({status:200,access_token:'access-fixture'}));await render();expect(localStorage.getItem('refresh_token')).toBeNull();expect(container.textContent).toBe('Инвентарь открыт');
});
test('HTTP 200 with rejected credentials asks for a new bot link',async()=>{
 fetch.mockResolvedValue(response({status:401,access_token:null}));await render();expect(container.textContent).toContain('Ссылка больше не действует');expect(user.IsAuth).toBe(false);
});
test('connection error can retry the same link without erasing existing credentials',async()=>{
 localStorage.setItem('access_token','existing');fetch.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(response({status:200,access_token:'new-fixture'}));await render();expect(container.textContent).toContain('Не удалось подключиться');expect(localStorage.getItem('access_token')).toBe('existing');await act(async()=>Simulate.click(container.querySelector('button')));expect(container.textContent).toBe('Инвентарь открыт');
});
