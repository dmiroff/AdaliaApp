import React, { useState } from 'react';
import guide from '../data/t3ClassGuide.json';
import './T3ClassGuide.css';

// The public origins follow tools/build_t3_class_tree.py in the game repository.
export default function T3ClassGuide({ contentRef }) {
  const [parent, setParent] = useState(guide.families[0].parents[0]);
  const paths = guide.classes.filter(entry => entry.parents.includes(parent));

  return (
    <section className="t3-guide" ref={contentRef} aria-labelledby="t3-guide-title">
      <h2 id="t3-guide-title">Дерево классов Т3</h2>
      <p className="t3-guide__intro">Классы Т3 проходят испытания на зеркале.</p>
      <div className="t3-guide__tree">
        <div className="t3-guide__origin">
          <label htmlFor="t3-guide-parent">Исходный класс Т2</label>
          <select id="t3-guide-parent" value={parent} onChange={event => setParent(event.target.value)}>
            {guide.families.map(family => (
              <optgroup key={family.name} label={family.name}>
                {family.parents.map(name => <option key={name}>{name}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <ul key={parent} className="t3-guide__paths" aria-label={`Ветки Т3 для класса «${parent}»`}>
          {paths.map(({ name, parents, summary, play }) => {
            const otherParent = parents.find(origin => origin !== parent);
            return (
              <li key={name}>
                <details className="t3-guide__card">
                  <summary>
                    <strong>{name}</strong>
                    <span>{summary}</span>
                    {otherParent && <small>Также из ветки «{otherParent}»</small>}
                  </summary>
                  <div className="t3-guide__details">
                    <h3>В бою</h3>
                    <p>{play}</p>
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
