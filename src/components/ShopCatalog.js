import React, {useEffect, useRef, useState} from 'react';
import api from '../http/apiClient';
import {browseParams, emptyBrowse, itemOptionLabel, itemSorts, priceSorts} from '../utils/itemBrowseFields';
import ItemFilters from './ItemFilters';

const offerSorts = [...itemSorts, ...priceSorts];

const fmt = value => Number(value || 0).toLocaleString('ru-RU');

export default function ShopCatalog({shopId, privateStock=false, currencyName='', disabled=false, revision=0, onBuy, onSelect}) {
    const [applied,setApplied] = useState(emptyBrowse);
    const [offset,setOffset] = useState(0);
    const [page,setPage] = useState({items:[],filter_options:{},total:0});
    const [loading,setLoading] = useState(true);
    const [error,setError] = useState('');
    const [retry,setRetry] = useState(0);
    const [quantities,setQuantities] = useState({});
    const request = useRef(0);
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
    function apply(value) {
        setOffset(0);
        setApplied({...value});
        setQuantities({});
    }
    const locked = loading || disabled || !!error;
    const supportsFilters = page.filter_options !== undefined;
    return <div className="ps-catalog">
        <ItemFilters manual label={privateStock ? 'Фильтры склада магазина' : 'Фильтры витрины магазина'}
            options={page.filter_options} sorts={privateStock ? itemSorts : offerSorts}
            disabled={disabled || !supportsFilters} onApply={apply} />
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
