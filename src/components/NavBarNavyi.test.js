import React from 'react';
import {createRoot} from 'react-dom/client';
import {act,Simulate} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import NavBar from './NavBar';
import UserStore from '../store/UserStore';
import {Context} from '../index';

jest.mock('../index',()=>({Context:require('react').createContext(null)}));
jest.mock('./SettingsModal',()=>()=>null);
let root,container,user,locationDescriptor;
beforeEach(()=>{
 locationDescriptor=Object.getOwnPropertyDescriptor(window,'location');
 Object.defineProperty(window,'location',{configurable:true,value:{hostname:'test.adaliagame.ru',assign:jest.fn()}});
 window.matchMedia=()=>({matches:false,addListener:()=>{},removeListener:()=>{},addEventListener:()=>{},removeEventListener:()=>{}});
 localStorage.clear();localStorage.setItem('access_token','navyi-fixture');global.fetch=jest.fn();
 user=new UserStore();user.setUser(9999);user.setIsAuth(true);
 container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();Object.defineProperty(window,'location',locationDescriptor);delete global.fetch;});
const render=async()=>act(async()=>root.render(<Context.Provider value={{user}}><MemoryRouter><NavBar/></MemoryRouter></Context.Provider>));

test('any authenticated mirror administrator gets desktop and mobile game entry',async()=>{
 fetch.mockResolvedValue({ok:true,json:async()=>({is_admin:true})});await render();
 expect(fetch).toHaveBeenCalledWith('/navyi/api/access',expect.objectContaining({headers:{Authorization:'Bearer navyi-fixture'}}));
 const desktop=[...container.querySelectorAll('a')].find(e=>e.textContent.includes('Навьи тропы'));expect(desktop).toBeTruthy();
 const more=container.querySelector('[aria-controls=mobile-more-navigation]');await act(async()=>Simulate.click(more));
 const mobile=[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Навьи тропы'));expect(mobile).toBeTruthy();
 await act(async()=>Simulate.click(mobile));expect(window.location.assign).toHaveBeenCalledWith('/navyi/');
});
test('normal user and malformed truthy admin responses do not get the entry',async()=>{
 fetch.mockResolvedValue({ok:true,json:async()=>({is_admin:'True'})});await render();expect(container.textContent).not.toContain('Навьи тропы');
});
test('the main site never queries or shows the mirror game entry',async()=>{
 window.location.hostname='adaliagame.ru';await render();expect(fetch).not.toHaveBeenCalled();expect(container.textContent).not.toContain('Навьи тропы');
});
