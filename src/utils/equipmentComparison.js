export const EQUIPMENT_SLOTS = ['head', 'right_hand', 'left_hand', 'breast_armor', 'cloak', 'gloves', 'necklace', 'leg_armor', 'boots', 'secondary_weapon', 'belt', 'arm_armor', 'ring_1', 'ring_2', 'ring_3', 'ring_4', 'ring_5'];
export const comparisonSlots = (item) => {
  const type = item?.type;
  if (type === 'ring') return EQUIPMENT_SLOTS.filter(slot => slot.startsWith('ring_'));
  return EQUIPMENT_SLOTS.includes(type) ? [type] : [];
};
export const comparisonStats = (item, current) => {
  const keys = ['weapon_damage', 'weapon_damage_type', 'defence', 'weight', 'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  return keys.filter(key => item?.[key] !== undefined || current?.[key] !== undefined).map(key => {
    const next = item?.[key]; const previous = current?.[key];
    const delta = typeof next === 'number' && typeof previous === 'number' && Number.isFinite(next) && Number.isFinite(previous) ? Math.round((next - previous) * 100) / 100 : null;
    return {key, next, previous, delta};
  });
};
