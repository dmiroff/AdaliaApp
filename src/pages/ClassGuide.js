import React, { useEffect, useRef, useState } from 'react';
import t1Classes from '../data/t1ClassGuide.json';
import t2Guide from '../data/t2ClassGuide.json';
import t3Guide from '../data/t3ClassGuide.json';
import './ClassGuide.css';

const bookHref = '/help-books/adalia-class-book.pdf';
const tiers = {
  t1: { label: 'Т1', description: 'Начальные классы, доступные при создании персонажа.', classes: t1Classes },
  t2: { label: 'Т2', description: 'Задания на специализацию Т2 доступны у тренера с 10-го уровня.', classes: t2Guide.classes },
  t3: { label: 'Т3', description: 'Классы Т3 проходят испытания на зеркале.', classes: t3Guide.classes },
};

export default function ClassGuide({ contentRef }) {
  const [tier, setTier] = useState('t1');
  const [origins, setOrigins] = useState({ t2: '', t3: '' });
  const originRef = useRef(null);
  const focusOrigin = useRef(false);
  const isT1 = tier === 't1';
  const isT2 = tier === 't2';
  const isT3 = tier === 't3';
  const parent = origins[tier] || '';
  const { label, description, classes } = tiers[tier];
  const paths = parent ? classes.filter(entry => entry.parents.includes(parent)) : classes;
  const nextTier = isT1 ? 't2' : isT2 ? 't3' : null;

  useEffect(() => {
    if (!focusOrigin.current) return;
    focusOrigin.current = false;
    contentRef.current?.scrollIntoView?.({ block: 'start' });
    originRef.current?.focus({ preventScroll: true });
  }, [contentRef, tier]);

  const openPath = name => {
    focusOrigin.current = true;
    setOrigins(previous => ({ ...previous, [nextTier]: name }));
    setTier(nextTier);
  };

  return (
    <section className="class-guide" ref={contentRef} data-tier={tier} aria-labelledby="class-guide-title">
      <div className="class-guide__header">
        <div>
          <h2 id="class-guide-title">Дерево классов {label}</h2>
          <p className="class-guide__intro">{description}</p>
        </div>
        <a className="class-guide__book" href={bookHref} download>Скачать книгу классов (PDF)</a>
      </div>
      <div className="class-guide__tiers" role="group" aria-label="Ступень развития класса">
        {Object.entries(tiers).map(([key, option]) => (
          <button key={key} type="button" aria-pressed={tier === key}
            onClick={() => setTier(key)}>{option.label}</button>
        ))}
      </div>
      <div className={parent ? 'class-guide__tree' : 'class-guide__catalogue'}>
        {!isT1 && <div className="class-guide__origin">
          <label htmlFor="class-guide-parent">Исходный класс {isT2 ? 'Т1' : 'Т2'}</label>
          <select id="class-guide-parent" ref={originRef} value={parent}
            onChange={event => {
              const name = event.target.value;
              setOrigins(previous => ({ ...previous, [tier]: name }));
            }}>
            <option value="">Все классы {label}</option>
            {isT2 ? t1Classes.map(({ name }) => <option key={name}>{name}</option>) : t3Guide.families.map(family => (
              <optgroup key={family.name} label={family.name}>
                {family.parents.map(name => <option key={name}>{name}</option>)}
              </optgroup>
            ))}
          </select>
        </div>}
        <ul key={`${tier}:${parent}`} className="class-guide__paths"
          aria-label={parent ? `Ветки ${label} для класса «${parent}»` : `Классы ${label}`}>
          {paths.map(({ name, parents = [], pathNote, summary, play, health, healthPerLevel, spellSlots }) => {
            const otherParent = parent && parents.find(origin => origin !== parent);
            const artName = encodeURIComponent(name);
            return (
              <li key={name}>
                <details className="class-guide__card">
                  <summary>
                    <img className="class-guide__art" src={`/help-images/classes/${tier}/${artName}.webp`}
                      alt="" width="640" height="300" loading="lazy" decoding="async" />
                    <span className="class-guide__card-text">
                      <strong>{name}</strong>
                      <span>{summary}</span>
                      {pathNote && <small>{pathNote}</small>}
                      {!parent && parents.length > 0 && <small>Путь из ветки «{parents.join('» / «')}»</small>}
                      {otherParent && <small>Также из ветки «{otherParent}»</small>}
                    </span>
                  </summary>
                  <div className="class-guide__details">
                    {isT1 && <dl className="class-guide__stats">
                      <div><dt>Базовое здоровье</dt><dd>{health} (+{healthPerLevel} за уровень)</dd></div>
                      <div><dt>Базовые ячейки заклинаний</dt><dd>{spellSlots}</dd></div>
                    </dl>}
                    <h3>В бою</h3>
                    <p>{play}</p>
                    {nextTier && <button type="button" className="class-guide__continue"
                      onClick={() => openPath(name)}>Посмотреть ветки {tiers[nextTier].label}</button>}
                    {isT3 && <a className="class-guide__continue" href={`/help-images/classes/t3-cards/${artName}.webp`}
                      target="_blank" rel="noopener noreferrer" aria-label={`Открыть полную карточку «${name}»`}>
                      Открыть полную карточку ↗
                    </a>}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
