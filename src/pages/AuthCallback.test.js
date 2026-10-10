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
test('restored bot login uses one API prefix and opens inventory',async()=>{
 fetch.mockResolvedValue(response({status:200,access_token:'access-fixture'}));
 await render();expect(container.textContent).toBe('Инвентарь открыт');expect(user.IsAuth).toBe(true);
 expect(fetch.mock.calls[0][0]).toBe(`${window.location.origin}/api/login`);
 expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({player_id:99,token:'bot-fixture'});
});
