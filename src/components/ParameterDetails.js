import {dict_translator} from '../utils/Helpers';
import {EQUIPMENT_SLOTS} from '../utils/equipmentComparison';

const dependencies = {
  action_points: ['agility'], initiative: ['perception'],
  melee_attack: ['strength'], melee_damage: ['strength'],
  range_attack: ['perception'], range_damage: ['perception'],
  magic_attack: ['intelligence'], magic_damage: ['intelligence'],
  pray_attack: ['wisdom'], pray_damage: ['wisdom'], magic_resist: ['wisdom'],
};

export default function ParameterDetails({player, parameter, label, value}) {
  const sources = [];
  const ids = [...new Set([parameter, ...(dependencies[parameter] || [])])];
  for (const slot of EQUIPMENT_SLOTS) {
    const item = player?.[slot];
    for (const key of ids) {
      const amount = item?.[key];
      if (typeof amount === 'number' && amount !== 0) sources.push(`${item.name}: ${dict_translator[key] || key} ${amount > 0 ? '+' : ''}${amount}`);
    }
  }
  for (const [name, effect] of Object.entries(player?.temporary_effects || {})) {
    for (const key of ids) {
      const amount = effect?.effects?.[key];
      if (typeof amount === 'number' && amount !== 0) sources.push(`${name}: ${dict_translator[key] || key} ${amount > 0 ? '+' : ''}${amount}`);
    }
  }
  return <details className="parameter-details">
    <summary><span>{label}</span><strong>{value ?? '—'}</strong><span className="parameter-details-hint">Откуда значение</span></summary>
    <div className="parameter-details-body">
      <p>Раса: {player?.Race || '—'}.</p>
      {parameter === 'action_points' && <p>Количество ОД зависит от итоговой ловкости, включая расовые изменения и действующие эффекты.</p>}
      {(dependencies[parameter] || []).map(key => <p key={key}>{dict_translator[key] || key}: {Number(player?.[key] || 0) + Number(player?.[`${key}_increase`] || 0)}.</p>)}
      {sources.length > 0 && <ul>{sources.map((source, index) => <li key={index}>{source}</li>)}</ul>}
      <p>Итоговое значение рассчитано игрой. Здесь показаны доступные данные об атрибутах, снаряжении и временных эффектах; таланты и особые правила также могут влиять на результат.</p>
    </div>
  </details>;
}
