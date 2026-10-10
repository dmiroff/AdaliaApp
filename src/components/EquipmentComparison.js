import { useState } from 'react';
import { comparisonSlots, comparisonStats } from '../utils/equipmentComparison';
import { dict_translator } from '../utils/Helpers';

export default function EquipmentComparison({item, player}) {
  const slots = comparisonSlots(item);
  const [selected, setSelected] = useState('');
  if (!item?.is_equippable || !slots.length) return null;
  const slot = slots.includes(selected) ? selected : slots[0];
  const current = player?.[slot];
  const stats = comparisonStats(item, current);
  const format = value => value === undefined || value === null ? '—' :
    typeof value === 'object' ? JSON.stringify(value) : dict_translator[value] || String(value);
  return <section className="equipment-comparison fantasy-paper p-3 mb-3" aria-label="Сравнение экипировки">
    <h6>Сравнение с экипировкой</h6>
    {slots.length > 1 && <label className="d-block mb-2">Слот
      <select className="form-select" value={slot} onChange={event => setSelected(event.target.value)}>
        {slots.map(value => <option key={value} value={value}>{dict_translator[value] || value}</option>)}
      </select>
    </label>}
    {!player?.inventory_new ? <p>Сравнение появится после загрузки персонажа.</p> : <>
      <p className="small">{dict_translator[slot] || slot}: {current?.name || 'Слот свободен'}</p>
      <div className="comparison-row comparison-heading"><span>Параметр</span><span>Сейчас</span><span>Предмет</span></div>
      {stats.map(({key, next, previous, delta}) => <div className="comparison-row" key={key}>
        <span>{dict_translator[key] || key}</span><span>{format(previous)}</span>
        <span>{format(next)} {delta !== null && delta !== 0 && <strong>({delta > 0 ? '+' : ''}{delta})</strong>}</span>
      </div>)}
      {!stats.length && <p className="small">У предметов нет общих параметров для численного сравнения.</p>}
      <p className="small mb-0">Параметры предметов; итоговые характеристики зависят от навыков и эффектов.</p>
    </>}
  </section>;
}
