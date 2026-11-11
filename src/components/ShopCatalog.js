import React, {useEffect, useId, useRef, useState} from 'react';
import api from '../http/apiClient';
import {booleanFields, browseParams, emptyBrowse, itemFieldNames, itemOptionLabel, numberOperators, numericFields} from '../utils/itemBrowseFields';

const fmt = value => Number(value || 0).toLocaleString('ru-RU');

export default function ShopCatalog({shopId, privateStock=false, currencyName='', disabled=false, revision=0, onBuy, onSelect}) {
    const [draft,setDraft] = useState(emptyBrowse);
    const [applied,setApplied] = useState(emptyBrowse);
    const [offset,setOffset] = useState(0);
    const [page,setPage] = useState({items:[],filter_options:{},total:0});
    const [loading,setLoading] = useState(true);
    const [error,setError] = useState('');
    const [retry,setRetry] = useState(0);
    const [quantities,setQuantities] = useState({});
    const request = useRef(0);
    const id = useId();
    useEffect(() => {
        const sequence=++request.current, controller=new AbortController();
        setLoading(true);setError('');
        api.get(`/v1/shops/${shopId}/${privateStock?'inventory':'offers'}`, {params:browseParams(applied,offset),signal:controller.signal})
            .then(({data}) => {
                if (sequence !== request.current || controller.signal.aborted) return;
                // A sale can remove the last page; preserve filters and move to the last existing page.
                if (offset>0 && data.total !== undefined && offset>=data.total) {
                    setOffset(Math.max(0,Math.floor((data.total-1)/100)*100));return;
                }
                setPage(data);
            }).catch(e => {
                if (sequence === request.current && !controller.signal.aborted) setError(typeof e.response?.data?.detail === 'string' ? e.response.data.detail : 'Не удалось загрузить товары. Повторите запрос.');
            }).finally(() => {if (sequence === request.current && !controller.signal.aborted) setLoading(false);});
        return () => controller.abort();
    }, [shopId,privateStock,applied,offset,revision,retry]);
    const update = (field,value) => setDraft(v => ({...v,[field]:value}));
    const changeExtra = (index,change) => setDraft(v => ({...v,extra:v.extra.map((f,i) => i===index ? {...f,...change} : f)}));
    const options = field => (page.filter_options?.[field] || []).map(value => <option key={value} value={value}>{itemOptionLabel(field,value)}</option>);
    function apply(event) {event.preventDefault();setOffset(0);setApplied({...draft});setQuantities({});}
    function reset() {const value=emptyBrowse();setDraft(value);setApplied(value);setOffset(0);setQuantities({});}
    const locked = loading || disabled || !!error;
    const supportsFilters = page.filter_options !== undefined;
    return <div className="ps-catalog">
        <form aria-label={privateStock?'Фильтры склада':'Фильтры витрины'} onSubmit={apply}>
            <fieldset className="ps-browse-controls" disabled={disabled || !supportsFilters}>
            <div className="ps-grid">
                <label htmlFor={`${id}-search`}>Название<input id={`${id}-search`} type="search" maxLength="100" placeholder="Поиск по названию" value={draft.q} onChange={e => update('q',e.target.value)}/></label>
                <label>Категория<select value={draft.category} onChange={e => update('category',e.target.value)}>{[['all','Все предметы'],['weapons','Оружие'],['armor','Броня'],['consumables','Расходники'],['materials','Материалы и прочее']].map(([v,label]) => <option key={v} value={v}>{label}</option>)}</select></label>
                <fieldset className="ps-level-range"><legend>Уровень</legend><div><label>От<input aria-label="Уровень от" type="number" min="0" step="1" max={draft.maxLevel || undefined} value={draft.minLevel} onChange={e => update('minLevel',e.target.value)}/></label><label>До<input aria-label="Уровень до" type="number" min={draft.minLevel || 0} step="1" value={draft.maxLevel} onChange={e => update('maxLevel',e.target.value)}/></label></div></fieldset>
                {['prefix','suffix'].map(field => <label key={field}>{itemFieldNames[field]}<select aria-label={itemFieldNames[field]} value={draft[field]} onChange={e => update(field,e.target.value)}><option value="">Все</option>{options(field)}</select></label>)}
                <label>Сортировка<select value={draft.sort} onChange={e => update('sort',e.target.value)}>{[['default','По порядку'],['name','По названию'],['level','Уровень: сначала высокий'],['level_asc','Уровень: сначала низкий'],['value','Базовая стоимость: сначала дорогие'],['count','Количество: сначала больше'],['weight','Вес: сначала тяжелее'],...(!privateStock ? [['price_asc','Цена: сначала дешевле'],['price_desc','Цена: сначала дороже']] : [])].map(([v,label]) => <option key={v} value={v}>{label}</option>)}</select></label>
            </div>
            <details className="ps-more-filters"><summary>Дополнительные фильтры</summary><div className="ps-grid">
                {['type','rarity'].map(field => <label key={field}>{itemFieldNames[field]}<select value={draft[field]} onChange={e => update(field,e.target.value)}><option value="">Все</option>{options(field)}</select></label>)}
            </div>{draft.extra.map((filter,index) => <div className="ps-grid ps-extra-filter" key={index}>
                <label>Поле фильтра {index+1}<select value={filter.field} onChange={e => changeExtra(index,{field:e.target.value,operator:'equals',value:''})}>{Object.entries(itemFieldNames).map(([v,label]) => <option key={v} value={v}>{label}</option>)}</select></label>
                {numericFields.includes(filter.field) ? <><label>Сравнение<select value={filter.operator} onChange={e => changeExtra(index,{operator:e.target.value})}>{numberOperators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}</select></label><label>Значение<input required type="number" min="0" step="any" value={filter.value} onChange={e => changeExtra(index,{value:e.target.value})}/></label></> : <label>Значение<select required value={filter.value} onChange={e => changeExtra(index,{value:e.target.value})}><option value="">Выберите</option>{booleanFields.includes(filter.field) ? <><option value="true">Да</option><option value="false">Нет</option></> : options(filter.field)}</select></label>}
                <button type="button" onClick={() => setDraft(v => ({...v,extra:v.extra.filter((_,i) => i!==index)}))}>Убрать условие {index+1}</button>
            </div>)}<button type="button" disabled={draft.extra.length>=6} onClick={() => setDraft(v => ({...v,extra:[...v.extra,{field:'weight',operator:'lessOrEquals',value:''}]}))}>Добавить условие</button></details>
            <div className="ps-inline ps-filter-actions"><button disabled={disabled}>Применить фильтры</button><button type="button" disabled={disabled} onClick={reset}>Сбросить фильтры</button></div>
            </fieldset>
        </form>
        {!supportsFilters && !loading && <p role="status">Фильтры пока недоступны. Каталог можно листать. <button onClick={() => setRetry(v => v+1)}>Обновить каталог</button></p>}
        {loading && <p role="status">Загружаем товары…</p>}
        {error && <div role="alert" className="ps-error">{error} <button onClick={() => setRetry(v => v+1)}>Повторить загрузку</button></div>}
        {!loading && !error && <p role="status">{page.total!==undefined ? `Найдено: ${fmt(page.total)} · показано ` : 'Показано: '}{page.items.length ? `${offset+1}–${offset+page.items.length}` : '0'}</p>}
        {!privateStock && applied.sort.startsWith('price_') && <p>Товары за золото и за валюту магазина показаны отдельными группами.</p>}
        <div className="ps-products" aria-busy={loading}>{!loading && !error && page.items.map(item => <article className="ps-product" key={item.item_id}>
            <small>Предмет №{item.item_id}</small><h3>{item.name}</h3><p>Уровень {item.level ?? '—'} · {itemOptionLabel('rarity',String(item.rarity ?? 'none'))}</p>
            {supportsFilters && <p>{itemOptionLabel('prefix',item.prefix || 'none')} · {itemOptionLabel('suffix',item.suffix || 'none')}</p>}
            {privateStock ? <><p>Свободно: {fmt(item.free)} · база {fmt(item.base_value)}</p><button disabled={locked} onClick={() => onSelect(item)}>Выбрать: {item.name}</button></> : <><p>{fmt(item.offer.unit_price)} {item.offer.currency==='gold'?'золота':currencyName} / шт.</p><p>Доступно: {fmt(item.offer.quantity)}</p><label>Количество<input aria-label={`Количество: ${item.name}`} type="number" min="1" max={item.offer.quantity} value={quantities[item.item_id] ?? 1} onChange={e => setQuantities(v => ({...v,[item.item_id]:e.target.value}))}/></label><button disabled={locked || !Number.isInteger(Number(quantities[item.item_id] ?? 1)) || Number(quantities[item.item_id] ?? 1)<1 || Number(quantities[item.item_id] ?? 1)>item.offer.quantity} onClick={() => onBuy(item.item_id,quantities[item.item_id] ?? 1)}>Рассчитать покупку</button></>}
        </article>)}</div>
        {!loading && !error && page.items.length===0 && <p>По этим условиям товаров нет. Измените или сбросьте фильтры.</p>}
        <div className="ps-inline ps-pagination" aria-label="Страницы товаров">{offset>0 && <button disabled={locked} onClick={() => setOffset(Math.max(0,offset-100))}>Предыдущие товары</button>}{page.next_offset!=null && <button disabled={locked} onClick={() => setOffset(page.next_offset)}>Следующие товары</button>}</div>
    </div>;
}
