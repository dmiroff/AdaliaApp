import React, { useRef, useState } from 'react';
import t2Guide from '../data/t2ClassGuide.json';
import t3Guide from '../data/t3ClassGuide.json';
import './ClassGuide.css';

const t1Classes = [...new Set(t2Guide.classes.flatMap(entry => entry.parents))];
const bookHref = '/help-books/adalia-class-book.pdf';

export default function ClassGuide({ contentRef }) {
  const [tier, setTier] = useState('t3');
  const [origins, setOrigins] = useState({ t2: t1Classes[0], t3: t3Guide.families[0].parents[0] });
  const originRef = useRef(null);
  const isT2 = tier === 't2';
  const parent = origins[tier];
  const tierLabel = isT2 ? 'Т2' : 'Т3';
  const paths = (isT2 ? t2Guide : t3Guide).classes.filter(entry => entry.parents.includes(parent));

  const openT3 = name => {
    setOrigins(previous => ({ ...previous, t3: name }));
    setTier('t3');
    contentRef.current?.scrollIntoView?.({ block: 'start' });
    originRef.current?.focus({ preventScroll: true });
  };

  return (
    <section className="class-guide" ref={contentRef} aria-labelledby="class-guide-title">
      <div className="class-guide__header">
        <div>
          <h2 id="class-guide-title">Дерево классов {tierLabel}</h2>
          <p className="class-guide__intro">
            {isT2 ? 'Задания на специализацию Т2 доступны у тренера с 10-го уровня.'
              : 'Классы Т3 проходят испытания на зеркале.'}
          </p>
        </div>
        <a className="class-guide__book" href={bookHref} download>Скачать книгу классов (PDF)</a>
      </div>
      <div className="class-guide__tiers" role="group" aria-label="Ступень развития класса">
        <button type="button" aria-pressed={isT2} onClick={() => setTier('t2')}>Т1 → Т2</button>
        <button type="button" aria-pressed={!isT2} onClick={() => setTier('t3')}>Т2 → Т3</button>
      </div>
      <div className="class-guide__tree">
        <div className="class-guide__origin">
          <label htmlFor="class-guide-parent">Исходный класс {isT2 ? 'Т1' : 'Т2'}</label>
          <select id="class-guide-parent" ref={originRef} value={parent}
            onChange={event => setOrigins({ ...origins, [tier]: event.target.value })}>
            {isT2 ? t1Classes.map(name => <option key={name}>{name}</option>) : t3Guide.families.map(family => (
              <optgroup key={family.name} label={family.name}>
                {family.parents.map(name => <option key={name}>{name}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <ul key={`${tier}:${parent}`} className="class-guide__paths"
          aria-label={`Ветки ${tierLabel} для класса «${parent}»`}>
          {paths.map(({ name, parents, pathNote, summary, play }) => {
            const otherParent = parents.find(origin => origin !== parent);
            return (
              <li key={name}>
                <details className="class-guide__card">
                  <summary>
                    <strong>{name}</strong>
                    <span>{summary}</span>
                    {otherParent && <small>Также из ветки «{otherParent}»</small>}
                    {pathNote && <small>{pathNote}</small>}
                  </summary>
                  <div className="class-guide__details">
                    <h3>В бою</h3>
                    <p>{play}</p>
                    {isT2 && <button type="button" className="class-guide__continue"
                      onClick={() => openT3(name)}>Посмотреть ветки Т3</button>}
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
