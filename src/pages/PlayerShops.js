import React, {useContext, useEffect, useRef, useState} from 'react';
import {Context} from '../index';
import api from '../http/apiClient';
import './PlayerShops.css';
import {isPlayerShopMirror} from '../utils/playerShops';

const number = value => Number(value);
const fmt = value => Number(value || 0).toLocaleString('ru-RU');
const moneyName = (currency, name) => currency === 'gold' ? 'золота' : name;
const errorText = error => error.response?.status === 404 ? 'Эта возможность пока недоступна. Попробуйте позже.' : typeof error.response?.data?.detail === 'string' ? error.response.data.detail : 'Не удалось выполнить запрос. Повторите его: операция защищена от дублирования.';

function PriceFields({value, onChange}) {
    return <div className="ps-grid"><label>Расчёт цены<select aria-label="Расчёт цены" value={value.mode} onChange={e => onChange({...value,mode:e.target.value})}>
        <option value="fixed">Фиксированная цена</option><option value="base">Процент от базовой стоимости</option><option value="level">Уровень × редкость × префикс</option>
    </select></label><label>{value.mode === 'base' ? 'Процент (200 = двойная цена)' : value.mode === 'level' ? 'Ставка за уровень' : 'Цена за штуку'}
        <input type="number" min="1" required value={value.amount} onChange={e => onChange({...value,amount:e.target.value})}/></label>
        {value.mode === 'level' && <label>Множитель при префиксе<input type="number" min="1" max="100" required value={value.prefix} onChange={e => onChange({...value,prefix:e.target.value})}/></label>}
    </div>;
}
const priceData = p => ({mode:p.mode,...(p.mode === 'base' ? {percent:number(p.amount)} : p.mode === 'level' ? {per_level:number(p.amount),prefix_multiplier:number(p.prefix)} : {amount:number(p.amount)})});
const initialPrice = () => ({mode:'fixed',amount:'100',prefix:'2'});

export default function PlayerShops() {
    const {user} = useContext(Context);
    const ownerId = number(user.user?.id || localStorage.getItem('id'));
    const [tab,setTab] = useState('browse');
    const [admin,setAdmin] = useState(false);
    const [testReport,setTestReport] = useState(null);
    useEffect(() => {let current=true;api.get('/player').then(r => {if(current)setAdmin(r.data?.data?.is_admin === true);}).catch(() => {});return () => {current=false;};}, []);
    const [shopId,setShopId] = useState('');
    const [shopQuery,setShopQuery] = useState('');
    const [searchResults,setSearchResults] = useState(null);
    const [editingSnapshot,setEditingSnapshot] = useState(null);
    const [deletingRule,setDeletingRule] = useState(null);
    const ruleEditor=useRef(null);
    const [loadedShop,setLoadedShop] = useState(null);
    const [catalog,setCatalog] = useState({items:[]});
    const [balance,setBalance] = useState(null);
    const [manage,setManage] = useState(null);
    const [stock,setStock] = useState({items:[]});
    const [name,setName] = useState('Моя лавка');
    const [currencyName,setCurrencyName] = useState('Баллы');
    const [enabled,setEnabled] = useState(false);
    const [notice,setNotice] = useState('');
    const [error,setError] = useState('');
    const [busy,setBusy] = useState(false);
    const [qty,setQty] = useState({});
    const [quote,setQuote] = useState(null);
    const [history,setHistory] = useState([]);
    const [offerItem,setOfferItem] = useState('');
    const [offerQty,setOfferQty] = useState('1');
    const [offerCurrency,setOfferCurrency] = useState('shop');
    const [offerPrice,setOfferPrice] = useState(initialPrice);
    const [rule,setRule] = useState({id:'magic',side:'sell',type:'breast_armor',item_id:'',min_level:'1',max_level:'',rarity:'',prefix:'any',quantity:'100',budget:'10000000',currency:'shop',enabled:true});
    const [rulePrice,setRulePrice] = useState({mode:'level',amount:'2000',prefix:'2'});
    const [wallet,setWallet] = useState({player_id:'',amount:'',reason:''});
    const [sell,setSell] = useState({item_id:'',quantity:'1'});
    const [keyScopes,setKeyScopes] = useState(['read']);
    const [issuedKey,setIssuedKey] = useState(null);
    const [revokeId,setRevokeId] = useState('');
    const ids=useRef(new Map());
    const url=(id,path='') => `/v1/shops/${id}${path}`;
    async function mutate(id,path,body,method='post',stableId=null) {
        const fingerprint=JSON.stringify([id,path,body,method]);
        if (!ids.current.has(fingerprint)) ids.current.set(fingerprint,stableId || crypto.randomUUID());
        const response=await api.request({url:url(id,path),method,data:body,headers:{'Idempotency-Key':ids.current.get(fingerprint)}});
        ids.current.delete(fingerprint);
        return response.data;
    }
    async function act(fn) {
        if (busy) return;
        setBusy(true); setError(''); setNotice('');
        try { await fn(); } catch (e) { setError(errorText(e)); } finally {setBusy(false);}
    }
    async function openShopById(id) {
        await act(async () => {
            const info=(await api.get(url(id))).data;
            const rows=(await api.get(url(id,'/offers'))).data;
            const funds=(await api.get(url(id,`/wallets/${ownerId}`))).data;
            setShopId(String(id));setLoadedShop(info);setCatalog(rows);setBalance(funds);setQuote(null);
        });
    }
    async function searchShops(event,offset=0,query=shopQuery.trim()) {
        event?.preventDefault();
        if (/^\d+$/.test(query) && offset===0) {await openShopById(query);return;}
        await act(async () => setSearchResults({...((await api.get('/v1/shops/search',{params:{q:query,offset}})).data),query}));
    }
    function editRule(value) {
        setEditingSnapshot(JSON.parse(JSON.stringify(value)));
        const f=value.filters,p=value.price;
        setRule({id:value.id,side:value.side,type:f.type || '',item_id:f.item_id ?? '',min_level:f.min_level ?? '',max_level:f.max_level ?? '',
            rarity:f.rarity ?? '',prefix:f.prefix===undefined?'any':f.prefix?'yes':'no',quantity:value.quantity,budget:value.budget,currency:value.currency,enabled:value.enabled});
        setRulePrice({mode:p.mode,amount:p.amount ?? p.percent ?? p.per_level,prefix:p.prefix_multiplier ?? 2});
        setError('');setNotice(`Редактирование шаблона «${value.id}».`);ruleEditor.current?.scrollIntoView({behavior:'smooth',block:'start'});
    }
    function cancelEdit() {setEditingSnapshot(null);setRule(r => ({...r,id:'',enabled:true}));}
    async function deleteRule() {
        await act(async () => {
            await mutate(ownerId,`/rules/${encodeURIComponent(deletingRule.id)}?revision=${deletingRule.revision}`,null,'delete');
            if(editingSnapshot?.id===deletingRule.id)cancelEdit();
            setDeletingRule(null);setNotice('Шаблон удалён. История операций сохранена.');
            setManage((await api.get(url(ownerId,'/manage'))).data);
        });
    }
    async function loadManager() {
        await act(async () => {
            const value=(await api.get(url(ownerId,'/manage'))).data;
            const rows=(await api.get(url(ownerId,'/inventory'))).data;
            setManage(value); setName(value.name); setCurrencyName(value.currency_name); setEnabled(value.enabled); setStock(rows);
        });
    }
    async function askQuote(itemId,quantity,side='buy') {
        await act(async () => {
            const value=await mutate(loadedShop.shop_id,'/quotes',{side,item_id:number(itemId),quantity:number(quantity)});
            setQuote(value);
        });
    }
    async function confirm() {
        await act(async () => {
            const order=await mutate(loadedShop.shop_id,'/orders',{quote_id:quote.quote_id},'post','confirm:'+quote.quote_id);
            setQuote(null); setNotice(`Готово: ${order.item_name}, ${order.quantity} шт. Заказ ${order.order_id}.`);
            setCatalog((await api.get(url(loadedShop.shop_id,'/offers'))).data);
            setBalance((await api.get(url(loadedShop.shop_id,`/wallets/${ownerId}`))).data);
        });
    }
    const selected=stock.items.find(item => String(item.item_id)===String(offerItem));
    let preview=null;
    if (selected) {
        const p=priceData(offerPrice);
        preview=p.mode==='fixed' ? p.amount : p.mode==='base' ? Math.ceil(selected.base_value*p.percent/100) : p.per_level*selected.level*(selected.rarity || 1)*(selected.prefix ? p.prefix_multiplier : 1);
    }
    return <main className="player-shops"><header><p className="ps-eyebrow">ТОРГОВЫЕ ДОМА АДАЛИИ{isPlayerShopMirror() ? ' · ЗЕРКАЛО' : ''}</p><h1>Магазины игроков</h1><p>Своя лавка, своя валюта. Покупайте с подтверждением цены и настройте торговлю без программирования.</p></header>
        <nav className="ps-tabs" aria-label="Разделы магазина">{[['browse','Витрина'],['manage','Мой магазин'],['history','История']].map(([id,label]) => <button key={id} className={tab===id?'active':''} onClick={() => {setTab(id);setError('');setNotice('');}}>{label}</button>)}</nav>
        {error && <div role="alert" className="ps-error">{error}</div>}{notice && <div role="status" className="ps-notice">{notice}</div>}
        {tab==='browse' && <><section className="ps-panel"><h2>Найти магазин</h2><form onSubmit={searchShops} className="ps-inline"><label>Название магазина или имя владельца<input maxLength="60" placeholder="Например, Лавка Кабачка" value={shopQuery} onChange={e => setShopQuery(e.target.value)}/></label><button disabled={busy}>Найти магазин</button></form>
            {searchResults && <div aria-live="polite"><ul className="ps-search-results">{searchResults.items.map(r => <li key={r.shop_id}><div><strong>{r.name}</strong><p>Владелец: {r.owner_name} · Валюта: {r.currency_name}</p></div><button disabled={busy} onClick={() => openShopById(r.shop_id)}>Открыть «{r.name}»</button></li>)}</ul>{searchResults.items.length===0 && <p>Открытые магазины не найдены. Попробуйте часть названия.</p>}<div className="ps-inline">{searchResults.offset>0 && <button disabled={busy} onClick={() => searchShops(null,Math.max(0,searchResults.offset-20),searchResults.query)}>Назад к результатам</button>}{searchResults.has_more && <button disabled={busy} onClick={() => searchShops(null,searchResults.offset+20,searchResults.query)}>Ещё магазины</button>}</div></div>}</section>
            {loadedShop && <><section className="ps-panel"><h2>{loadedShop.name}</h2><p>Ваша валюта: <strong>{fmt(balance?.balance)} {loadedShop.currency_name}</strong></p>
                <div className="ps-products">{catalog.items.map(item => <article className="ps-product" key={item.item_id}><small>Предмет №{item.item_id}</small><h3>{item.name}</h3><p>{fmt(item.offer.unit_price)} {moneyName(item.offer.currency,loadedShop.currency_name)} / шт.</p><p>Доступно: {fmt(item.offer.quantity)}</p><label>Количество<input aria-label={`Количество: ${item.name}`} type="number" min="1" max={item.offer.quantity} value={qty[item.item_id] || 1} onChange={e => setQty({...qty,[item.item_id]:e.target.value})}/></label><button disabled={busy} onClick={() => askQuote(item.item_id,qty[item.item_id] || 1)}>Рассчитать покупку</button></article>)}</div>{catalog.items.length===0 && <p>В этой части витрины нет доступных товаров.</p>}
                <div className="ps-inline">{catalog.offset>0 && <button disabled={busy} onClick={() => act(async () => setCatalog((await api.get(url(loadedShop.shop_id,`/offers?offset=${Math.max(0,catalog.offset-100)}`))).data))}>Предыдущие товары</button>}{catalog.next_offset!==null && catalog.next_offset!==undefined && <button disabled={busy} onClick={() => act(async () => setCatalog((await api.get(url(loadedShop.shop_id,`/offers?offset=${catalog.next_offset}`))).data))}>Следующие товары</button>}</div>
            </section><section className="ps-panel"><h2>Продать магазину</h2><p>Магазин рассчитает цену по первому подходящему правилу скупки. До подтверждения вещи остаются у вас.</p><form className="ps-grid" onSubmit={e => {e.preventDefault();askQuote(sell.item_id,sell.quantity,'sell');}}><label>ID вашего предмета<input required type="number" value={sell.item_id} onChange={e => setSell({...sell,item_id:e.target.value})}/></label><label>Количество<input required type="number" min="1" value={sell.quantity} onChange={e => setSell({...sell,quantity:e.target.value})}/></label><button disabled={busy}>Рассчитать продажу</button></form></section></>}
        </>}
        {tab==='manage' && <>{admin && isPlayerShopMirror() && <section className="ps-panel"><h2>Проверка на фиктивных участниках</h2><p>Только для администратора зеркала. Тест временно создаёт магазин, покупателя и вещи, проверяет сделки через настоящий API и команду бота, затем откатывает все изменения. Ваш персонаж не используется в сделках.</p><button disabled={busy} onClick={() => act(async () => {setTestReport(null);setTestReport((await api.post(url(ownerId,'/self-test'),null,{timeout:90000})).data);})}>Проверить магазин без второй учётки</button>{testReport && <div className="ps-notice" role="status"><strong>{testReport.status==='passed'?'Все проверки пройдены':'Проверка завершена'}</strong><ul>{testReport.steps.map((step,i) => <li key={i}>{step}</li>)}</ul><p>Откат: {testReport.rolled_back?'подтверждён':'не подтверждён'}. Персонаж: {testReport.actor_unchanged?'без изменений':'требуется проверка'}.</p></div>}</section>}<section className="ps-panel"><h2>Настройка лавки</h2><p>Для аккаунтов класса «Магазин». Ваш ID: {ownerId}. Переименование валюты сохраняет все балансы.</p><button disabled={busy} onClick={loadManager}>Загрузить мои настройки и склад</button><form onSubmit={e => {e.preventDefault();act(async () => {const c=await mutate(ownerId,'',{name,currency_name:currencyName,enabled},'patch');setManage(c);setNotice('Настройки сохранены.');});}} className="ps-grid"><label>Название магазина<input required maxLength="60" value={name} onChange={e => setName(e.target.value)}/></label><label>Название валюты<input required maxLength="60" value={currencyName} onChange={e => setCurrencyName(e.target.value)}/></label><label className="ps-check"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)}/>Магазин открыт</label><button disabled={busy}>Сохранить настройки</button></form></section>
            <section className="ps-panel"><h2>Товар со склада</h2><p>Точный товар важнее шаблона. Количество 0 снимает товар с продажи. Остаток проверяется при покупке.</p><form onSubmit={e => {e.preventDefault();act(async () => {const r=await mutate(ownerId,`/offers/${offerItem}`,{quantity:number(offerQty),currency:offerCurrency,price:priceData(offerPrice)},'put');setNotice(`${r.name}: цена ${fmt(r.unit_price)} сохранена.`);});}}><div className="ps-grid"><label>Предмет<select aria-label="Предмет" required value={offerItem} onChange={e => setOfferItem(e.target.value)}><option value="">Выберите предмет</option>{stock.items.map(item => <option key={item.item_id} value={item.item_id}>{item.name} (#{item.item_id}, {item.free} шт.)</option>)}</select></label><label>Лимит штук<input required type="number" min="0" max={selected?.free || 1000000} value={offerQty} onChange={e => setOfferQty(e.target.value)}/></label><label>Валюта<select value={offerCurrency} onChange={e => setOfferCurrency(e.target.value)}><option value="shop">{currencyName}</option><option value="gold">Золото</option></select></label></div><PriceFields value={offerPrice} onChange={setOfferPrice}/>{preview!==null && <p className="ps-notice">Предпросмотр: {fmt(preview)} {moneyName(offerCurrency,currencyName)} / шт. Окончательную цену проверит сервер.</p>}<button disabled={busy || !selected}>Сохранить товар</button></form>
                {stock.next_offset!==null && stock.next_offset!==undefined && <button disabled={busy} onClick={() => act(async () => {const more=(await api.get(url(ownerId,`/inventory?offset=${stock.next_offset}`))).data;setStock({...more,items:[...stock.items,...more.items]});})}>Ещё предметы склада</button>}
            </section>
            <section className="ps-panel" ref={ruleEditor}><h2>{editingSnapshot ? `Редактирование: ${editingSnapshot.id}` : 'Шаблоны продажи и скупки'}</h2><p>Правила применяются по порядку: первое совпадение. Лимиты штук и бюджета уменьшаются после каждой сделки. Скупка за валюту магазина начисляет её продавцу в пределах бюджета.</p><form onSubmit={e => {e.preventDefault();act(async () => {
                const filters={...(rule.item_id!==''?{item_id:number(rule.item_id)}:{}),...(rule.type?{type:rule.type}:{}),...(rule.min_level!==''?{min_level:number(rule.min_level)}:{}),...(rule.max_level!==''?{max_level:number(rule.max_level)}:{}),...(rule.rarity!==''?{rarity:number(rule.rarity)}:{}),...(rule.prefix!=='any'?{prefix:rule.prefix==='yes'}:{})};
                const values={side:rule.side,filters,price:priceData(rulePrice),quantity:number(rule.quantity),budget:number(rule.budget),currency:rule.currency,enabled:rule.enabled};
                const changes=editingSnapshot ? Object.fromEntries(Object.entries(values).filter(([k,v]) => JSON.stringify(v)!==JSON.stringify(editingSnapshot[k]))) : values;
                if (editingSnapshot && !Object.keys(changes).length) {setNotice('Изменений нет.');return;}
                await mutate(ownerId,`/rules/${encodeURIComponent(rule.id)}`,changes,editingSnapshot?'patch':'put');
                cancelEdit();setNotice('Шаблон сохранён.');setManage((await api.get(url(ownerId,'/manage'))).data);
            });}}><div className="ps-grid"><label>Имя правила<input required maxLength="32" readOnly={!!editingSnapshot} value={rule.id} onChange={e => setRule({...rule,id:e.target.value})}/></label><label>Действие<select value={rule.side} onChange={e => setRule({...rule,side:e.target.value})}><option value="sell">Продавать со склада</option><option value="buy">Скупать у игроков</option></select></label><label>ID предмета (необязательно)<input type="number" value={rule.item_id} onChange={e => setRule({...rule,item_id:e.target.value,...(!rule.item_id && e.target.value && !editingSnapshot?{type:'',min_level:''}:{})})}/></label><label>Тип предмета<select disabled={!!rule.item_id} value={rule.type} onChange={e => setRule({...rule,type:e.target.value})}><option value="">Любой тип</option>{[['breast_armor','Нагрудники'],['arm_armor','Наручи'],['leg_armor','Поножи'],['right_hand','Оружие'],['belt','Пояса'],['goods','Материалы'],['head','Головные уборы'],['boots','Обувь'],['cloak','Плащи'],['gloves','Перчатки'],['ring','Кольца']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                {[['min_level','Уровень от'],['max_level','Уровень до'],['quantity','Оставшийся лимит штук'],['budget','Оставшийся бюджет']].map(([key,label]) => <label key={key}>{label}<input required={key==='quantity'||key==='budget'} min={key==='min_level'||key==='max_level'?'1':'0'} type="number" value={rule[key]} onChange={e => setRule({...rule,[key]:e.target.value})}/></label>)}
                <label>Редкость<select value={rule.rarity} onChange={e => setRule({...rule,rarity:e.target.value})}><option value="">Любая</option>{[1,2,3,4].map(v => <option key={v} value={v}>{v}</option>)}</select></label><label>Префикс<select value={rule.prefix} onChange={e => setRule({...rule,prefix:e.target.value})}><option value="any">Любой</option><option value="yes">Есть</option><option value="no">Нет</option></select></label><label>Валюта<select value={rule.currency} onChange={e => setRule({...rule,currency:e.target.value})}><option value="shop">{currencyName}</option><option value="gold">Золото</option></select></label></div><PriceFields value={rulePrice} onChange={setRulePrice}/><label className="ps-check"><input type="checkbox" checked={rule.enabled} onChange={e => setRule({...rule,enabled:e.target.checked})}/>Шаблон включён</label><div className="ps-inline"><button disabled={busy}>{editingSnapshot?'Сохранить изменения':'Сохранить правило'}</button>{editingSnapshot && <button type="button" disabled={busy} onClick={cancelEdit}>Отменить редактирование</button>}</div></form>
                <ol>{manage?.rules?.map(r => <li key={r.id}><strong>{r.id}</strong> · {r.side==='buy'?'Скупка':'Продажа'} · остаток {fmt(r.quantity)} шт. · бюджет {fmt(r.budget)} · {r.enabled?'включено':'пауза'} <button disabled={busy} onClick={() => act(async () => {const {id}=r;await mutate(ownerId,`/rules/${encodeURIComponent(id)}`,{enabled:!r.enabled},'patch');if(editingSnapshot?.id===id)setRule(v => ({...v,enabled:!r.enabled}));setManage((await api.get(url(ownerId,'/manage'))).data);})}>{r.enabled?'Приостановить':'Включить'}</button> <button disabled={busy} onClick={() => editRule(r)}>Редактировать</button> <button disabled={busy} onClick={() => {setError('');setDeletingRule({id:r.id,revision:manage.revision});}}>Удалить</button></li>)}</ol>
            </section><section className="ps-panel"><h2>Баланс покупателя</h2><p>Положительная сумма начисляет валюту, отрицательная списывает. Укажите причину: она останется в истории.</p><form className="ps-grid" onSubmit={e => {e.preventDefault();act(async () => {const r=await mutate(ownerId,'/wallet-transactions',{player_id:number(wallet.player_id),amount:number(wallet.amount),reason:wallet.reason});setNotice(`Баланс игрока ${r.player_id}: ${fmt(r.balance)} ${r.currency_name}`);});}}>{[['player_id','ID игрока','number'],['amount','Изменение баланса','number'],['reason','Причина','text']].map(([key,label,type]) => <label key={key}>{label}<input required type={type} value={wallet[key]} onChange={e => setWallet({...wallet,[key]:e.target.value})}/></label>)}<button disabled={busy}>Изменить баланс</button></form></section>
            <section className="ps-panel"><h2>Интеграция с внешним магазином</h2><p><a href="/docs/player-shops-api.pdf" target="_blank" rel="noreferrer">Руководство по настройке магазина и API (PDF)</a></p><p>Выберите права ключа. Ключ показывается один раз; храните его на сервере своего магазина. Внешний учёт валюты подключается через начисления и списания с уникальным номером заказа.</p><div className="ps-inline">{[['read','Чтение'],['offers','Товары и правила'],['wallets','Валюта'],['deliveries','Выдача'],['settings','Настройки']].map(([scope,label]) => <label className="ps-check" key={scope}><input type="checkbox" checked={keyScopes.includes(scope)} onChange={e => setKeyScopes(e.target.checked?[...keyScopes,scope]:keyScopes.filter(v => v!==scope))}/>{label}</label>)}</div><button disabled={busy||keyScopes.length===0} onClick={() => act(async () => setIssuedKey((await api.post(url(ownerId,'/keys'),{scopes:keyScopes,days:90})).data))}>Выпустить ключ на 90 дней</button>
                {issuedKey && <div className="ps-notice"><label>Ключ (сохраните сейчас)<input readOnly value={issuedKey.token}/></label><p>ID для отзыва: {issuedKey.key_id}</p><button onClick={() => setIssuedKey(null)}>Скрыть ключ</button></div>}
                <form className="ps-inline" onSubmit={e => {e.preventDefault();act(async () => {await mutate(ownerId,`/keys/${revokeId}`,{},'delete');setIssuedKey(null);setNotice('Ключ отозван.');});}}><label>ID ключа для отзыва<input required value={revokeId} onChange={e => setRevokeId(e.target.value)}/></label><button disabled={busy}>Отозвать ключ</button></form>
            </section></>}
        {tab==='history' && <section className="ps-panel"><h2>История операций</h2><form className="ps-inline" onSubmit={e => {e.preventDefault();act(async () => setHistory((await api.get(url(shopId || ownerId,'/transactions'))).data));}}><label>ID магазина<input type="number" placeholder={String(ownerId)} value={shopId} onChange={e => setShopId(e.target.value)}/></label><button disabled={busy}>Показать историю</button></form><div className="ps-history">{history.map(row => <article key={row.id}><strong>{({purchase:'Сделка',wallet:'Баланс',delivery:'Выдача',settings:'Настройки',rule:'Правило',rule_update:'Изменение шаблона',rule_delete:'Удаление шаблона',offer:'Товар',key:'Выпуск ключа',revoke:'Отзыв ключа'})[row.kind] || row.kind}</strong><time>{new Date(row.created_at+'Z').toLocaleString('ru-RU')}</time><p>{row.result.item_name || row.result.name || row.result.id || row.result.reason || row.result.currency_name || ''}</p>{row.result.total!==undefined && <p>{fmt(row.result.quantity)} шт. · {fmt(row.result.total)} {row.result.currency_name}</p>}{row.result.delta!==undefined && <p>Игрок {row.result.player_id}: {row.result.delta>0?'+':''}{fmt(row.result.delta)}; баланс {fmt(row.result.balance)}</p>}<small>Операция {row.id}</small></article>)}</div></section>}
        {deletingRule && <div className="ps-overlay"><section role="dialog" aria-modal="true" aria-labelledby="ps-delete-title" className="ps-dialog"><h2 id="ps-delete-title">Удалить шаблон «{deletingRule.id}»?</h2><p>Шаблон перестанет участвовать в расчёте цен. История выполненных операций сохранится.</p>{error && <p role="alert" className="ps-error">{error}</p>}<div className="ps-inline"><button disabled={busy} onClick={deleteRule}>Удалить шаблон</button><button disabled={busy} onClick={() => {setDeletingRule(null);setError('');}}>Отмена</button></div></section></div>}
        {quote && <div className="ps-overlay"><section role="dialog" aria-modal="true" aria-labelledby="ps-confirm-title" className="ps-dialog"><h2 id="ps-confirm-title">Подтвердите {quote.side==='buy'?'покупку':'продажу'}</h2><h3>{quote.item_name}</h3><p>{quote.quantity} шт. × {fmt(quote.unit_price)} = <strong>{fmt(quote.total)} {quote.currency_name}</strong></p><p>Комиссия: {fmt(quote.commission)}. Получателю оплаты: {fmt(quote.received)}.</p><p>Предложение действует 10 минут. Если условия изменятся, понадобится новый расчёт.</p>{error && <p role="alert" className="ps-error">{error}</p>}<div className="ps-inline"><button disabled={busy} onClick={confirm}>Подтвердить сделку</button><button disabled={busy} onClick={() => {setQuote(null);setError('');}}>Отмена</button></div></section></div>}
    </main>;
}
