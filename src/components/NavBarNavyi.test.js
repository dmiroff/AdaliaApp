import React from 'react';
import {createRoot} from 'react-dom/client';
import {act,Simulate} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import NavBar from './NavBar';
import apiClient from '../http/apiClient';
jest.mock('../http/apiClient',()=>({__esModule:true,default:{get:jest.fn()}}));
import UserStore from '../store/UserStore';
import {Context} from '../index';

jest.mock('../index',()=>({Context:require('react').createContext(null)}));
jest.mock('./SettingsModal',()=>()=>null);
let root,container,user,locationDescriptor;
beforeEach(()=>{
 locationDescriptor=Object.getOwnPropertyDescriptor(window,'location');
 Object.defineProperty(window,'location',{configurable:true,value:{hostname:'test.adaliagame.ru',assign:jest.fn()}});
 window.matchMedia=()=>({matches:false,addListener:()=>{},removeListener:()=>{},addEventListener:()=>{},removeEventListener:()=>{}});
 localStorage.clear();localStorage.setItem('access_token','navyi-fixture');apiClient.get.mockReset();
 user=new UserStore();user.setUser(9999);user.setIsAuth(true);
 container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();Object.defineProperty(window,'location',locationDescriptor);});
const render=async()=>act(async()=>root.render(<Context.Provider value={{user}}><MemoryRouter><NavBar/></MemoryRouter></Context.Provider>));

test('any authenticated mirror administrator gets desktop and mobile game entry',async()=>{
 apiClient.get.mockResolvedValue({data:{is_admin:true}});await render();
 expect(apiClient.get).toHaveBeenCalledWith('/navyi/api/access',expect.objectContaining({baseURL:''}));
 const desktop=[...container.querySelectorAll('a')].find(e=>e.textContent.includes('Навьи тропы'));expect(desktop).toBeTruthy();
 const more=container.querySelector('[aria-controls=mobile-more-navigation]');await act(async()=>Simulate.click(more));
 const mobile=[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Навьи тропы'));expect(mobile).toBeTruthy();
 await act(async()=>Simulate.click(mobile));expect(window.location.assign).toHaveBeenCalledWith('/navyi/');
});
test('normal user and malformed truthy admin responses do not get the entry',async()=>{
 apiClient.get.mockResolvedValue({data:{is_admin:'True'}});await render();expect(container.textContent).not.toContain('Навьи тропы');
});
test('the main site never queries or shows the mirror game entry',async()=>{
 window.location.hostname='adaliagame.ru';await render();expect(apiClient.get).not.toHaveBeenCalled();expect(container.textContent).not.toContain('Навьи тропы');
});

test('a transient access failure recovers when the administrator returns to the tab',async()=>{
 apiClient.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({data:{is_admin:true}});
 await render();expect(container.textContent).not.toContain('Навьи тропы');
 await act(async()=>window.dispatchEvent(new Event('focus')));
 expect(container.textContent).toContain('Навьи тропы');
});
test('revoked administrator access removes the entry on recheck',async()=>{
 apiClient.get.mockResolvedValueOnce({data:{is_admin:true}}).mockResolvedValue({data:{is_admin:false}});
 await render();expect(container.textContent).toContain('Навьи тропы');
 await act(async()=>window.dispatchEvent(new Event('focus')));
 expect(container.textContent).not.toContain('Навьи тропы');
});
