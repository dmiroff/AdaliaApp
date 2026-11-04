import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import AppRouter from './AppRouter';
import { Context } from '../index';
import apiClient from '../http/apiClient';

jest.mock('../index', () => ({ Context: require('react').createContext(null) }));
jest.mock('../http/apiClient', () => ({ get: jest.fn() }));
jest.mock('../pages/NotAuth', () => () => <p>Login fixture</p>);
jest.mock('../pages/AuthCallback', () => () => <p>Auth fixture</p>);
jest.mock('../pages/Help', () => () => <p>Public help fixture</p>);

test.each([false, true])('help bypasses API verification even with stale credentials: %s', async saved => {
  localStorage.clear();
  if (saved) { localStorage.setItem('access_token', 'test-only'); localStorage.setItem('id', '1'); }
  apiClient.get.mockRejectedValue(new Error('API offline'));
  const user = { IsAuth: false, setIsAuth: jest.fn(), setUser: jest.fn() };
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  // This is ReactDOM act for async rendering, not a Testing Library wrapper.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => {
    root.render(<Context.Provider value={{ user }}><MemoryRouter initialEntries={['/help#сила']}>
      <AppRouter />
    </MemoryRouter></Context.Provider>);
  });
  expect(container.textContent).toBe('Public help fixture');
  expect(apiClient.get).not.toHaveBeenCalled();
  expect(localStorage.getItem('access_token')).toBe(saved ? 'test-only' : null);
  act(() => root.unmount());
  container.remove();
  localStorage.clear();
});

test.each([true, false])('returns a direct-link tester only after successful Adalia verification: %s', async valid => {
  const descriptor=Object.getOwnPropertyDescriptor(window,'location');
  Object.defineProperty(window,'location',{configurable:true,value:{hostname:'test.adaliagame.ru',assign:jest.fn()}});
  localStorage.setItem('access_token','tester-fixture');localStorage.setItem('id','999');sessionStorage.setItem('navyi_return','1');
  if(valid)apiClient.get.mockResolvedValue({data:{player_id:999}});else apiClient.get.mockRejectedValue({response:{status:401}});
  const user={IsAuth:false,setIsAuth:jest.fn(),setUser:jest.fn()},container=document.createElement('div');document.body.appendChild(container);const root=createRoot(container);
  await act(async()=>root.render(<Context.Provider value={{user}}><MemoryRouter initialEntries={['/notauth']}><AppRouter/></MemoryRouter></Context.Provider>));
  if(valid){expect(window.location.assign).toHaveBeenCalledWith('/navyi/');expect(sessionStorage.getItem('navyi_return')).toBeNull()}else{expect(window.location.assign).not.toHaveBeenCalled();expect(sessionStorage.getItem('navyi_return')).toBe('1')}
  await act(async()=>root.unmount());container.remove();localStorage.clear();sessionStorage.clear();Object.defineProperty(window,'location',descriptor);
});
