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
  act(() => window.dispatchEvent(new Event('scroll')));
  expect(container.querySelector('[role="dialog"]')).not.toBeNull();
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

test('the public tree switches from a starting class to T2 and follows its T3 paths', async () => {
  await mount('/help#дерево-классов');
  expect(global.fetch).not.toHaveBeenCalled();
  const book = container.querySelector('a[download]');
  expect(book.getAttribute('href')).toBe('/help-books/adalia-class-book.pdf');
  const toggle = label => [...container.querySelectorAll('.class-guide__tiers button')]
    .find(button => button.textContent === label);
  const origin = () => container.querySelector('#class-guide-parent');

  expect(container.querySelector('#class-guide-title').textContent).toBe('Дерево классов Т3');
  act(() => toggle('Т1 → Т2').click());
  expect([...origin().options].map(option => option.value)).toEqual(['Воин', 'Плут', 'Маг', 'Жрец']);
  act(() => Simulate.change(origin(), { target: { value: 'Жрец' } }));
  expect([...container.querySelectorAll('.class-guide__card strong')].map(name => name.textContent))
    .toEqual(['Жрец Жизни', 'Жрец Света', 'Жрец Тьмы']);

  const light = [...container.querySelectorAll('.class-guide__card')]
    .find(card => card.querySelector('strong').textContent === 'Жрец Света');
  light.open = true;
  act(() => light.querySelector('button').click());
  expect(toggle('Т2 → Т3').getAttribute('aria-pressed')).toBe('true');
  expect(origin().value).toBe('Жрец Света');
  expect(document.activeElement).toBe(origin());
  expect(container.querySelector('.class-guide__paths').textContent).toContain('Иерофант');
  act(() => toggle('Т1 → Т2').click());
  expect(origin().value).toBe('Жрец');
});

test('Oathbreaker appears in the Paladin branch with its special unlock note', async () => {
  await mount('/help#дерево-классов');
  const origin = container.querySelector('#class-guide-parent');
  act(() => Simulate.change(origin, { target: { value: 'Паладин' } }));
  const cards = [...container.querySelectorAll('.class-guide__card')];
  const oathbreaker = cards.find(card => card.querySelector('strong').textContent === 'Клятвопреступник');
  expect(oathbreaker.querySelector('small').textContent).toContain('после особой истории');
  expect(oathbreaker.textContent).toContain('Разрыв обета');
  expect([...origin.options].map(option => option.value)).not.toContain('Жрец Смерти');
});
