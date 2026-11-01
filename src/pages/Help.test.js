import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import Help from './Help';
import data from '../../public/help-data.json';

let container;
let root;
let originalFetch;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => data });
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  global.fetch = originalFetch;
});
const mount = async path => {
  // This is ReactDOM act for async rendering, not a Testing Library wrapper.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => {
    root.render(<MemoryRouter initialEntries={[path || '/help']}><Help /></MemoryRouter>);
  });
};

test('a public deep link loads without player/API credentials and opens touch/keyboard explanations', async () => {
  await mount('/help#атрибуты');
  expect(global.fetch).toHaveBeenCalledWith('/help-data.json', expect.objectContaining({ credentials: 'omit' }));
  expect(container.querySelector('#help-article-title').textContent).toBe('Атрибуты');
  const term = [...container.querySelectorAll('.help-term')].find(button => button.textContent.toLowerCase() === 'сила');
  act(() => Simulate.mouseEnter(term));
  expect(container.querySelector('[role="dialog"]').textContent).toContain('10 × Сила');
  act(() => window.dispatchEvent(new Event('resize')));
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  act(() => Simulate.click(term));
  expect(document.activeElement).toBe(container.querySelector('[role="dialog"]'));
  act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(document.activeElement).toBe(term);
  act(() => Simulate.mouseEnter(term));
  expect(container.querySelector('[role="dialog"]')).toBeNull();
});

test('search, reset and article links work on the full handbook', async () => {
  await mount();
  const search = container.querySelector('input[type="search"]');
  act(() => Simulate.change(search, { target: { value: 'длань льда' } }));
  expect(container.querySelector('.help-index a').textContent).toContain('Длань Льда');
  act(() => container.querySelector('.help-index a').click());
  expect(container.querySelector('#help-article-title').textContent).toBe('Длань Льда');
  act(() => Simulate.change(search, { target: { value: 'никогданенайти123' } }));
  expect(container.querySelector('.help-empty').textContent).toContain('Ничего не найдено');
  act(() => Simulate.click(container.querySelector('.help-empty button')));
  expect(search.value).toBe('');
  expect(container.querySelectorAll('.help-index li')).toHaveLength(data.topics.length);
});

test('failed loading can be retried and an unknown article has a recovery link', async () => {
  global.fetch.mockRejectedValueOnce(new Error('network'));
  await mount('/help#не-существует');
  expect(container.querySelector('[role="alert"]').textContent).toContain('не загрузилась');
  await act(async () => Simulate.click(container.querySelector('[role="alert"] button')));
  expect(container.querySelector('#help-article-title').textContent).toBe('Раздел не найден');
  act(() => container.querySelector('.help-article a').click());
  expect(container.querySelector('#help-article-title').textContent).toBe('Добро пожаловать в Адалию');
});
