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
