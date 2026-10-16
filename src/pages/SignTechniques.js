import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import api from '../http/apiClient';
import {GAME_DRAFT_ROUTE} from '../utils/gameDraftProtocol';
import './SignTechniques.css';

const elements = {fire:'Огонь',ice:'Лёд',electric:'Молния',wind:'Ветер',stone:'Камень',power:'Власть',sound:'Звук',light:'Свет',dark:'Тьма',life:'Жизнь',death:'Смерть'};
const errorText = error => typeof error.response?.data?.detail === 'string' ? error.response.data.detail :
    error.response?.status === 404 ? 'Магические приёмы ещё не включены на сервере тестового зеркала.' : 'Не удалось загрузить приёмы. Попробуйте ещё раз.';

export default function SignTechniques() {
    const [data,setData] = useState(null);
    const [busy,setBusy] = useState(false);
    const [error,setError] = useState('');
    const [element,setElement] = useState('');
    const load = async () => {
        setBusy(true);setError('');
        try {setData((await api.get('/sign-techniques')).data);} catch(e) {setError(errorText(e));}
        finally {setBusy(false);}
    };
    useEffect(() => {load();}, []);
    return <main className="container sign-techniques-page">
        <header className="fantasy-paper sign-techniques-intro">
        <h1>Приёмы знаков</h1>
        <p>Приёмы открываются автоматически по уровню изученного знака: первый на 10, второй — на 100. Выбирать и готовить их перед боем не нужно. Для применения наденьте оружие той же стихии.</p>
        <p>Заряды у каждого приёма свои и восстанавливаются на отдыхе. Один приём за личный ход; тот же приём можно повторить через ход.</p>
        </header>
        {error && <div role="alert" className="sign-techniques-error">{error} <button className="fantasy-btn" disabled={busy} onClick={load}>Повторить</button></div>}
        {!data && !error && <p role="status">Загружаем приёмы…</p>}
        {data && <>
            <div className="fantasy-paper sign-techniques-selection" aria-live="polite">
                <strong>Открыто {data.techniques.filter(row => row.available).length} из {data.techniques.length}</strong>
                <span>В бою появятся все открытые приёмы стихии оружия в руке.</span>
                <Link className="fantasy-btn" to={GAME_DRAFT_ROUTE}>Открыть игровой чат</Link>
            </div>
            <label className="sign-techniques-filter">Стихия <select value={element} onChange={e => setElement(e.target.value)}><option value="">Все стихии</option>{Object.entries(elements).map(([key,name]) => <option value={key} key={key}>{name}</option>)}</select></label>
            <div className="sign-techniques-grid">{data.techniques.filter(row => !element || row.element === element).map(row => {
                const selected = row.available && row.weapon_ready;
                return <article key={row.id} className={`fantasy-paper sign-technique-card${selected ? ' selected' : ''}`}>
                    <div className="sign-technique-meta">{elements[row.element]} · знак {row.level} · {row.cost} ОД</div>
                    <h2>{row.name}</h2>
                    <p>{row.description}</p>
                    <p>{row.available ? `Заряды: ${row.charges}/${row.max_charges}. ${row.weapon_ready ? 'Оружие подходит.' : 'Наденьте стихийное оружие для применения.'}` : `Нужен знак ${row.level}.`}</p>

                </article>;
            })}</div>
        </>}
        <details className="fantasy-paper sign-mastery-help"><summary>Мастерские режимы магии</summary>
            <p>В бою откройте «Мастерство магии». Боевые режимы открываются с навыка формы 100 и усиливаются на 250 и 500. Поддерживаемое усиление оружия требует заклинание с аугментацией. Обычные заклинания остаются доступны.</p>
            <dl>
                <dt>Длань</dt><dd>Подготовка: 3 ОД и 1 очко заклинаний. Можно приготовить сколько угодно. При сближении врага все подходящие длани срабатывают по очереди, пока он жив. Усиление 15/25/35%; ожидание — три личных хода.</dd>
                <dt>Сгусток</dt><dd>Подвесить: 2 ОД и 1 очко заклинаний; выпустить: 1 ОД. Число заготовок не ограничено. Каждый свой ход: +15/20/25%, до +45/60/75%. Цель выбирается при выпуске.</dd>
                <dt>Сфера</dt><dd>В конце хода мага выдаёт щит вместо урона и расходует 1 очко заклинаний. Общий щит ограничен максимальным здоровьем получателя. Аугментация Союзника позволяет наложить её на союзника в дальности 4, занимая место другого улучшения.</dd>
                <dt>Короткий рывок</dt><dd>1 ОД и 1 очко заклинаний, половина дальности с округлением вверх и 50% урона. Иней запрещает оба варианта рывка; Скользящий шаг остаётся доступен.</dd>
                <dt>Поддерживаемое усиление оружия</dt><dd>Подготовьте усиление оружия с аугментацией. 3 ОД при наложении, затем 1 очко заклинаний в конце каждого своего хода. Магический компонент усиления получает +50%. Каждое оружие поддерживается отдельно.</dd>
                <dt>Поток</dt><dd>Прямой атакующий урон +10/15/20%, на 500 — ещё одна отдельная цель. Лечение не получает эти бонусы.</dd>
            </dl>
        </details>
    </main>;
}
