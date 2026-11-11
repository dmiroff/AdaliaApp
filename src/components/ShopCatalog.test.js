import React from 'react';
import {createRoot} from 'react-dom/client';
import {act, Simulate} from 'react-dom/test-utils';
import ShopCatalog from './ShopCatalog';
import api from '../http/apiClient';
import {birdNames, browseParams, emptyBrowse} from '../utils/itemBrowseFields';

jest.mock('../http/apiClient', () => ({get:jest.fn()}));
const item = (i=1) => ({item_id:i,name:`Ледяной лук Сокола ${i}`,level:70,rarity:2,prefix:'ice',suffix:'perception',free:3,base_value:1000,offer:{unit_price:50,currency:'shop',quantity:3}});
const page = (offset=0,more=false,total=1) => ({data:{items:total ? [item(offset+1)] : [],offset,next_offset:more?offset+100:null,total,filter_options:{prefix:['fire','ice','none'],suffix:['perception','strength','none'],type:['right_hand'],rarity:['2']}}});
let root,container,onBuy,onSelect;
global.IS_REACT_ACT_ENVIRONMENT=true;
beforeEach(() => {
    jest.clearAllMocks();api.get.mockResolvedValue(page());
    container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
    onBuy=jest.fn();onSelect=jest.fn();
});
afterEach(async () => {await act(async () => root.unmount());container.remove();});
const render = async (props={}) => act(async () => root.render(<ShopCatalog shopId={17} onBuy={onBuy} onSelect={onSelect} {...props}/>));
const click = async text => act(async () => Simulate.click([...container.querySelectorAll('button')].find(b => b.textContent===text)));
const change = async (selector,value) => act(async () => Simulate.change(container.querySelector(selector),{target:{value}}));
const submit = async () => act(async () => Simulate.submit(container.querySelector('form')));
const params = () => api.get.mock.calls.at(-1)[1].params;

test('combines inclusive level, prefix and actual bird fields in a single request', async () => {
    await render();
    expect(container.textContent).toContain('Сокола');
    await change('[type="search"]','лук');
    await change('[aria-label="Уровень от"]','60');
    await change('[aria-label="Уровень до"]','80');
    await change('[aria-label="Префикс"]','ice');
    await change('[aria-label="Птица"]','perception');
    expect(api.get).toHaveBeenCalledTimes(1);
    await submit();
    expect(params().q).toBe('лук');
    expect(JSON.parse(params().filters)).toEqual([
        {field:'prefix',operator:'equals',value:'ice'}, {field:'suffix',operator:'equals',value:'perception'},
        {field:'level',operator:'greaterOrEquals',value:'60'}, {field:'level',operator:'lessOrEquals',value:'80'}
    ]);
    await click('Рассчитать покупку');expect(onBuy).toHaveBeenCalledWith(1,1);
});

test('paging and refresh after checkout preserve all applied filters; reset clears them', async () => {
    api.get.mockResolvedValue(page(0,true,201));await render();
    await change('[aria-label="Префикс"]','ice');await submit();
    api.get.mockResolvedValue(page(100,true,201));await click('Следующие товары');
    expect(params().offset).toBe(100);expect(JSON.parse(params().filters)[0].value).toBe('ice');
    await render({revision:1});
    expect(params().offset).toBe(100);expect(JSON.parse(params().filters)[0].value).toBe('ice');
    api.get.mockResolvedValue(page());await click('Сбросить фильтры');
    expect(params().offset).toBe(0);expect(params().filters).toBe('[]');
    expect(container.querySelector('[aria-label="Префикс"]').value).toBe('');
});

test('an empty final page after purchase returns to the last existing page', async () => {
    api.get.mockResolvedValue(page(0,true,101));await render();
    api.get.mockResolvedValue(page(100,false,101));await click('Следующие товары');
    api.get.mockResolvedValueOnce(page(100,false,100)).mockResolvedValueOnce(page(0,false,100));
    await render({revision:1});expect(params().offset).toBe(0);
});

test('outdated responses are ignored and failed requests expose a retry', async () => {
    let resolveOld;api.get.mockImplementationOnce(() => new Promise(resolve => {resolveOld=resolve;}));
    await render();const oldSignal=api.get.mock.calls[0][1].signal;
    api.get.mockResolvedValue(page());await click('Сбросить фильтры');expect(oldSignal.aborted).toBe(true);
    await act(async () => resolveOld(page(100,false,999)));
    expect(container.textContent).not.toContain('999');
    api.get.mockRejectedValueOnce(new Error('network'));await submit();
    expect(container.querySelector('[role="alert"]').textContent).toContain('Не удалось загрузить');
    expect(container.textContent).not.toContain('Рассчитать покупку');
    await click('Повторить загрузку');expect(container.querySelector('[role="alert"]')).toBeNull();
});

test('private stock uses the same filters and selects an item without a purchase', async () => {
    await render({privateStock:true});
    expect(api.get.mock.calls[0][0]).toBe('/v1/shops/17/inventory');
    await click(`Выбрать: ${item().name}`);expect(onSelect).toHaveBeenCalledWith(item());
    expect(container.textContent).not.toContain('Рассчитать покупку');
});

test('validates quantities and forwards the selected amount', async () => {
    await render();await change('[aria-label^="Количество:"]','4');
    const button=[...container.querySelectorAll('button')].find(b => b.textContent==='Рассчитать покупку');
    expect(button.disabled).toBe(true);
    await change('[aria-label^="Количество:"]','2');await click('Рассчитать покупку');
    expect(onBuy).toHaveBeenCalledWith(1,'2');
});

test('additional inventory conditions and all eight birds serialize without losing zero', () => {
    const v={...emptyBrowse(),rarity:'0',extra:[{field:'weight',operator:'less',value:'0'},{field:'corrupted',operator:'equals',value:'false'}]};
    expect(JSON.parse(browseParams(v).filters)).toHaveLength(3);
    expect(birdNames.perception).toBe('Сокола');expect(Object.keys(birdNames)).toHaveLength(8);
});

test('older servers cannot silently ignore filters and unknown birds are not displayed as absent', async () => {
    const old=page();delete old.data.filter_options;delete old.data.total;
    api.get.mockResolvedValueOnce(old);await render();
    expect(container.querySelector('.ps-browse-controls').disabled).toBe(true);
    expect(container.textContent).toContain('Фильтры пока недоступны');
    expect(container.textContent).not.toContain('Без птицы');
    await click('Обновить каталог');expect(container.querySelector('.ps-browse-controls').disabled).toBe(false);
});
