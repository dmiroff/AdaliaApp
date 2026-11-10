import React, {useCallback, useEffect, useRef, useState} from 'react';
import api from '../http/apiClient';

export default function PlayerShopSearch({disabled = false, onOpen}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const requestVersion = useRef(0);
    const controller = useRef(null);
    const timer = useRef(null);

    const cancelSearch = useCallback(() => {
        requestVersion.current += 1;
        clearTimeout(timer.current);
        controller.current?.abort();
    }, []);

    const search = useCallback(async (text, offset = 0) => {
        cancelSearch();
        const version = requestVersion.current;
        const request = new AbortController();
        controller.current = request;
        setSearching(true);
        setError('');
        try {
            const response = await api.get('/v1/shops/search', {
                params: {q: text, offset}, signal: request.signal,
            });
            if (version === requestVersion.current) {
                setResults({...response.data, query: text});
            }
        } catch (failure) {
            if (!request.signal.aborted && version === requestVersion.current) {
                setError('Не удалось найти магазины. Попробуйте ещё раз.');
            }
        } finally {
            if (version === requestVersion.current) setSearching(false);
        }
    }, [cancelSearch]);

    useEffect(() => {
        cancelSearch();
        setResults(null);
        setError('');
        const text = query.trim();
        const ready = text.length >= 2 || /^\d+$/.test(text);
        setSearching(ready);
        if (ready) timer.current = setTimeout(() => search(text), 300);
        return cancelSearch;
    }, [query, search, cancelSearch]);

    function submit(event) {
        event.preventDefault();
        const text = query.trim();
        if (/^\d+$/.test(text)) {
            cancelSearch();
            setSearching(false);
            onOpen(text);
        } else if (!text || text.length >= 2) {
            search(text);
        }
    }

    return <div className="ps-shop-search">
        <h2>Найти магазин</h2>
        <form onSubmit={submit} className="ps-inline">
            <label>Название магазина или имя владельца
                <input maxLength="60" placeholder="Введите название или имя владельца"
                    autoComplete="off" value={query} onChange={event => setQuery(event.target.value)}
                    aria-describedby="ps-search-hint" aria-controls="ps-search-results"/>
            </label>
            <button disabled={disabled || (query.trim().length === 1 && !/^\d$/.test(query.trim()))}>Найти магазин</button>
        </form>
        <p id="ps-search-hint">Введите хотя бы 2 символа — подходящие магазины появятся ниже.</p>
        <div role="status">{searching ? 'Ищем магазины…' : results ? `Найдено: ${results.items.length}${results.has_more ? '+' : ''}` : ''}</div>
        {error && <p role="alert" className="ps-error">{error}</p>}
        <div id="ps-search-results" aria-busy={searching}>
            {results && <>
                <ul className="ps-search-results">{results.items.map(shop => <li key={shop.shop_id}>
                    <div><strong>{shop.name}</strong><p>Владелец: {shop.owner_name} · Валюта: {shop.currency_name}</p></div>
                    <button disabled={disabled || searching} onClick={() => onOpen(shop.shop_id)}>Открыть «{shop.name}»</button>
                </li>)}</ul>
                {results.items.length === 0 && <p>Подходящие магазины не найдены. Попробуйте другую часть названия или имени.</p>}
                <div className="ps-inline">
                    {results.offset > 0 && <button disabled={disabled || searching} onClick={() => search(results.query, Math.max(0, results.offset - 20))}>Назад к результатам</button>}
                    {results.has_more && <button disabled={disabled || searching} onClick={() => search(results.query, results.offset + 20)}>Ещё магазины</button>}
                </div>
            </>}
        </div>
    </div>;
}
