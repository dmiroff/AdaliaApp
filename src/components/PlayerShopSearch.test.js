import React from 'react';
import {createRoot} from 'react-dom/client';
import {act, Simulate} from 'react-dom/test-utils';
import PlayerShopSearch from './PlayerShopSearch';
import api from '../http/apiClient';

jest.mock('../http/apiClient', () => ({get: jest.fn()}));
const row = (shop_id, name) => ({shop_id, name, owner_name: 'Искатель', currency_name: 'Марки'});
const response = (items, more = false, offset = 0) => ({data: {items, offset, has_more: more}});
let root, container, onOpen;
global.IS_REACT_ACT_ENVIRONMENT = true;
beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    api.get.mockResolvedValue(response([]));
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    onOpen = jest.fn();
});
afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    jest.useRealTimers();
});
const render = async () => act(async () => root.render(<PlayerShopSearch onOpen={onOpen}/>));
const type = async text => act(async () => Simulate.change(container.querySelector('input'), {target: {value: text}}));
const tick = async () => act(async () => jest.advanceTimersByTime(300));
const click = async text => act(async () => Simulate.click([...container.querySelectorAll('button')].find(button => button.textContent === text)));

test('finds shops while typing, debounces requests and opens the chosen match', async () => {
    api.get.mockResolvedValue(response([row(17, 'Лесная лавка')]));
    await render();
    expect(container.querySelector('input').placeholder).not.toMatch(/Кабачка|Например/);
    await type('Л');
    await tick();
    expect(api.get).not.toHaveBeenCalled();
    await type('Ле');
    await type('Лес');
    expect(api.get).not.toHaveBeenCalled();
    await tick();
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/v1/shops/search', expect.objectContaining({params: {q: 'Лес', offset: 0}}));
    expect(container.textContent).toContain('Владелец: Искатель');
    await click('Открыть «Лесная лавка»');
    expect(onOpen).toHaveBeenCalledWith(17);
});

test('an older response cannot replace the results of a newer query', async () => {
    let resolveOld;
    api.get.mockImplementationOnce(() => new Promise(resolve => {resolveOld = resolve;}));
    await render();
    await type('Лес');
    await tick();
    const signal = api.get.mock.calls[0][1].signal;
    api.get.mockResolvedValueOnce(response([row(2, 'Морская лавка')]));
    await type('Мор');
    expect(signal.aborted).toBe(true);
    await tick();
    await act(async () => resolveOld(response([row(1, 'Лесная лавка')])));
    expect(container.textContent).toContain('Морская лавка');
    expect(container.textContent).not.toContain('Лесная лавка');
});

test('clearing the input cancels pending work and hides previous results', async () => {
    let resolveSearch;
    api.get.mockImplementation(() => new Promise(resolve => {resolveSearch = resolve;}));
    await render();
    await type('Лес');
    await tick();
    await type('');
    await act(async () => resolveSearch(response([row(1, 'Лесная лавка')])));
    expect(container.textContent).not.toContain('Лесная лавка');
    expect(container.textContent).not.toContain('Ищем магазины');
});

test('shows an empty result and recovers from a search error on resubmission', async () => {
    api.get.mockRejectedValueOnce(new Error('network'));
    await render();
    await type('Лес');
    await tick();
    expect(container.querySelector('[role="alert"]').textContent).toContain('Не удалось найти');
    await act(async () => Simulate.submit(container.querySelector('form')));
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.textContent).toContain('Подходящие магазины не найдены');
});

test('pagination retains the query and a new query starts from the first page', async () => {
    api.get.mockResolvedValue(response([row(1, 'Лесная лавка')], true));
    await render();
    await type('Лес');
    await tick();
    api.get.mockResolvedValueOnce(response([row(2, 'Лесная кузня')], false, 20));
    await click('Ещё магазины');
    expect(api.get).toHaveBeenLastCalledWith('/v1/shops/search', expect.objectContaining({params: {q: 'Лес', offset: 20}}));
    await type('Мор');
    await tick();
    expect(api.get).toHaveBeenLastCalledWith('/v1/shops/search', expect.objectContaining({params: {q: 'Мор', offset: 0}}));
});

test('submitting immediately cancels the debounce and numeric IDs still open directly', async () => {
    await render();
    await type('Лес');
    await act(async () => Simulate.submit(container.querySelector('form')));
    await tick();
    expect(api.get).toHaveBeenCalledTimes(1);
    await type('17');
    await act(async () => Simulate.submit(container.querySelector('form')));
    await tick();
    expect(onOpen).toHaveBeenCalledWith('17');
    expect(api.get).toHaveBeenCalledTimes(1);
});
