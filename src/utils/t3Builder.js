export const isT3BuilderEnabled = (hostname = window.location.hostname) =>
  ['test.adaliagame.ru', 'localhost', '127.0.0.1'].includes(hostname);

export const countedTalents = names => names.reduce((counts, name) => ({...counts, [name]: (counts[name] || 0) + 1}), {});
export const canAddTalent = (row, count, savedCount) => count < row.max_count && (row.can_add || count < savedCount);

export const itemFitsSlot = (item, slot) => item.type === slot ||
  (slot.startsWith('ring_') && item.type === 'ring') ||
  (slot === 'secondary_weapon' && item.type === 'right_hand') ||
  (slot === 'left_hand' && item.type === 'right_hand' && !item.twohanded);

export const talentRequirements = requirements => Object.entries(requirements || {})
  .filter(([key]) => key !== 'Character_class')
  .map(([key, value]) => `${({strength:'Сила',constitution:'Выносливость',agility:'Ловкость',wisdom:'Мудрость',intelligence:'Интеллект',perception:'Восприятие',charisma:'Харизма',luck:'Удача'})[key] || key}: ${Array.isArray(value) ? value.join(' / ') : value}`)
  .join(' · ');
