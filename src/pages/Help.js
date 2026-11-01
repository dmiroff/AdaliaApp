import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { buildGlossary, helpHref, helpIdFromHash, searchHelp, splitHelpTerms, validateHelp } from '../utils/gameHelp';
import './Help.css';

const kindNames = { guide: 'Раздел', attribute: 'Атрибут', skill: 'Навык', talent: 'Талант',
  parameter: 'Параметр', term: 'Механика', eon: 'Эон', handbook: 'Руководство', spell: 'Заклинание',
  trauma: 'Травма', injury: 'Повреждение', profession: 'Ремесло' };

function HelpText({ text, glossary, currentId, onPreview }) {
  return text.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>
    {splitHelpTerms(paragraph, glossary, currentId).map((part, partIndex) => typeof part === 'string' ? part
      : <button key={partIndex} type="button" className="help-term" aria-haspopup="dialog"
          aria-label={`Подробнее: ${part.text}`}
          onMouseEnter={event => onPreview(part.topic, event.currentTarget, 'hover')}
          onFocus={event => onPreview(part.topic, event.currentTarget, 'focus')}
          onClick={event => onPreview(part.topic, event.currentTarget, 'click')}>
          {part.text}
        </button>)}
  </p>);
}

export default function Help() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [preview, setPreview] = useState(null);
  const [copied, setCopied] = useState(false);
  const searchRef = useRef(null);
  const contentRef = useRef(null);
  const previewRef = useRef(null);
  const previewAnchor = useRef(null);
  const ignoreFocus = useRef(false);
  const ignoreHoverUntil = useRef(0);
  const closeTimer = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const selectedId = helpIdFromHash(location.hash) || 'справка';

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch('/help-data.json', { signal: controller.signal, cache: 'no-cache', credentials: 'omit' })
      .then(response => { if (!response.ok) throw new Error('Help unavailable'); return response.json(); })
      .then(value => { if (!controller.signal.aborted) setData(validateHelp(value)); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);

  const topics = data?.topics;
  const filtered = useMemo(() => searchHelp(topics || [], query, category), [topics, query, category]);
  const lookup = useMemo(() => new Map((topics || []).map(topic => [topic.id, topic])), [topics]);
  const selected = lookup.get(selectedId);
  const glossary = useMemo(() => buildGlossary(topics || [], selected), [topics, selected]);
  const categoryName = data?.categories.find(item => item.id === selected?.category)?.title;

  const closePreview = useCallback((restoreFocus = false) => {
    clearTimeout(closeTimer.current);
    setPreview(null);
    if (restoreFocus) {
      // Removing the panel reveals the text under the close button. Ignore
      // that synthetic re-entry so it cannot immediately open a different term.
      ignoreHoverUntil.current = Date.now() + 250;
      ignoreFocus.current = true;
      previewAnchor.current?.focus();
      ignoreFocus.current = false;
    }
  }, []);
  const showPreview = (topic, anchor, trigger) => {
    if (trigger === 'focus' && ignoreFocus.current) return;
    if (trigger === 'hover' && Date.now() < ignoreHoverUntil.current) return;
    clearTimeout(closeTimer.current);
    previewAnchor.current = anchor;
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 32);
    const below = rect.bottom + 10;
    const above = below + 360 > window.innerHeight && rect.top > window.innerHeight / 2;
    setPreview({ topic, trigger, left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)),
      top: above ? undefined : Math.min(below, window.innerHeight - 120),
      bottom: above ? Math.max(16, window.innerHeight - rect.top + 10) : undefined, width,
      maxHeight: Math.min(340, Math.max(80, (above ? rect.top : window.innerHeight - rect.bottom) - 24)) });
  };
  const leavePreview = () => {
    if (preview?.trigger === 'hover') closeTimer.current = setTimeout(() => closePreview(), 180);
  };

  useEffect(() => {
    if (!preview) return undefined;
    if (preview.trigger === 'click') previewRef.current?.focus();
    const onKey = event => { if (event.key === 'Escape') { event.preventDefault(); closePreview(true); } };
    const onOutside = event => {
      if (!previewRef.current?.contains(event.target) && event.target !== previewAnchor.current) closePreview();
    };
    const onScroll = event => {
      if (!(event.target instanceof Node) || !previewRef.current?.contains(event.target)) closePreview();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutside);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutside);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      clearTimeout(closeTimer.current);
    };
  }, [preview, closePreview]);

  useEffect(() => {
    closePreview();
    setCopied(false);
    if (topics && selected) {
      document.title = `${selected.title} — Справка Адалии`;
      // Direct links and browser Back/Forward keep the selected article visible.
      if (location.hash) contentRef.current?.scrollIntoView?.({ behavior: 'auto', block: 'start' });
    }
  }, [selected, topics, location.hash, closePreview]);
  useEffect(() => {
    const title = document.title;
    return () => { document.title = title; clearTimeout(closeTimer.current); };
  }, []);

  const openTopic = id => {
    closePreview();
    navigate(helpHref(id));
  };
  const chooseCategory = value => {
    setCategory(value);
    if (!query && value !== 'all') openTopic(data.categories.find(item => item.id === value).root);
  };

  return <main className="game-help" aria-labelledby="help-title">
    <header className="help-hero">
      <div className="help-hero__seal" aria-hidden="true">А</div>
      <div><div className="help-eyebrow">АДАЛИЯ · ЗАПАДНЫЙ ФРОНТИР</div>
        <h1 id="help-title">Справочник искателя</h1>
        <p>Всё, что пригодится по ту сторону городских ворот.</p>
      </div>
      <span className="help-hero__note">Открыто для всех<br />Вход в игру не нужен</span>
    </header>

    {error ? <div className="help-status" role="alert"><h2>Справка пока не загрузилась</h2>
      <p>Проверьте соединение и попробуйте ещё раз.</p>
      <button type="button" className="fantasy-btn" onClick={() => setAttempt(value => value + 1)}>Повторить</button>
    </div> : !data ? <p className="help-status" role="status">Открываем справочник…</p> : <>
      <div className="help-search">
        <label htmlFor="help-search">Что хотите узнать?</label>
        <div className="help-search__field"><span aria-hidden="true">⌕</span>
          <input ref={searchRef} id="help-search" type="search" value={query}
            placeholder="Сила, магия, талант, класс…" onChange={event => setQuery(event.target.value)} />
          {query && <button type="button" aria-label="Очистить поиск" onClick={() => { setQuery(''); searchRef.current.focus(); }}>×</button>}
        </div>
        <p>Подчёркнутый термин — подсказка. Наведите мышь или нажмите на телефоне.</p>
      </div>
      <nav className="help-categories" aria-label="Темы справки">
        <button type="button" className={category === 'all' ? 'is-active' : ''}
          aria-pressed={category === 'all'} onClick={() => chooseCategory('all')}>Все темы</button>
        {data.categories.map(item => <button key={item.id} type="button" aria-pressed={category === item.id}
          className={category === item.id ? 'is-active' : ''} onClick={() => chooseCategory(item.id)}>
          <span aria-hidden="true">{item.icon}</span> {item.title}
        </button>)}
      </nav>
      <div className="help-layout">
        <aside className="help-index" aria-label="Статьи справки">
          <div className="help-index__heading"><h2>{query ? 'Результаты поиска' : 'Оглавление'}</h2>
            <span role="status" aria-live="polite">{filtered.length}</span></div>
          {filtered.length ? <ul>{filtered.map(topic => <li key={topic.id}>
            <Link to={helpHref(topic.id)} aria-current={selectedId === topic.id ? 'page' : undefined}
              className={selectedId === topic.id ? 'is-active' : ''}>
              <span>{topic.title}</span><small>{kindNames[topic.kind]}</small>
            </Link>
          </li>)}</ul> : <div className="help-empty"><p>Ничего не найдено.</p>
            <button type="button" onClick={() => { setQuery(''); setCategory('all'); }}>Сбросить поиск и фильтр</button>
          </div>}
        </aside>
        <article className="help-article" ref={contentRef} tabIndex="-1" aria-labelledby="help-article-title">
          {selected ? <>
            <div className="help-article__breadcrumb"><Link to={helpHref('справка')}>Справка</Link>
              {categoryName && <><span aria-hidden="true">/</span><span>{categoryName}</span></>}
            </div>
            <div className="help-article__heading"><div>
              <span className="help-eyebrow">{kindNames[selected.kind]}</span>
              <h2 id="help-article-title">{selected.title}</h2>
            </div><button type="button" className="help-copy" onClick={async () => {
              try { await navigator.clipboard.writeText(new URL(helpHref(selected.id), window.location.origin).href); setCopied(true); }
              catch { setCopied(false); }
            }} aria-label="Скопировать ссылку на статью">{copied ? '✓ Скопировано' : '↗ Ссылка'}</button></div>
            <div className="help-article__body" onMouseLeave={leavePreview}>
              <HelpText text={selected.body} glossary={glossary} currentId={selected.id} onPreview={showPreview} />
            </div>
            {selected.images?.map(picture => <figure className="help-map" key={picture.src}>
              <a href={picture.src} target="_blank" rel="noopener noreferrer" aria-label={`Открыть карту: ${picture.alt}`}>
                <img src={picture.src} alt={picture.alt} loading="lazy" />
              </a><figcaption>{picture.alt} · Нажмите, чтобы рассмотреть</figcaption>
            </figure>)}
            {selected.related.length > 0 && <section className="help-related" aria-label="Связанные статьи">
              <h3>Читать дальше</h3><div>{selected.related.map(id => <Link key={id} to={helpHref(id)}>
                {lookup.get(id).title}<span aria-hidden="true">↗</span>
              </Link>)}</div>
            </section>}
            <div className="help-article__footer">Правила сверены с механиками игры · {new Date(`${data.reviewedOn}T12:00:00`).toLocaleDateString('ru-RU')}</div>
          </> : <><h2 id="help-article-title">Раздел не найден</h2><p>Возможно, ссылка устарела.</p>
            <Link to={helpHref('справка')}>Открыть оглавление</Link></>}
        </article>
      </div>
    </>}
    {preview && <div ref={previewRef} className="help-preview" role="dialog" tabIndex="-1" aria-modal="false"
      aria-labelledby="help-preview-title" style={{ left: preview.left, top: preview.top, bottom: preview.bottom, width: preview.width, maxHeight: preview.maxHeight }}
      onMouseEnter={() => clearTimeout(closeTimer.current)} onMouseLeave={leavePreview}>
      <div className="help-preview__heading"><strong id="help-preview-title">{preview.topic.title}</strong>
        <button type="button" aria-label="Закрыть подсказку" onClick={() => closePreview(true)}>×</button></div>
      <p>{preview.topic.body.length > 600 ? `${preview.topic.body.slice(0, 600)}…` : preview.topic.body}</p>
      <button type="button" className="help-preview__link" onClick={() => openTopic(preview.topic.id)}>Открыть статью →</button>
    </div>}
  </main>;
}
