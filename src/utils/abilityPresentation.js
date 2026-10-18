import {dict_translator} from './Helpers';

const labels = {
    description: 'Описание', standalone_attack: 'Самостоятельная атака',
    damage_dice_per_levels: 'Рост урона', combo: 'Комбо-атака',
    skill_requirement: 'Требуемый навык', associated_skills: 'Влияющие навыки',
    missing_scale: 'Усиление от потерянного здоровья', duration: 'Длительность',
};
const hidden = new Set(['apply_on', 'name', 'max_charges', 'standalone_attack']);
const label = key => labels[key] || dict_translator[key] || (/[^a-zA-Z_]/.test(key) ? key : null);
export const formatAbilityValue = (value, key) => {
    if (value === null || value === undefined) return '';
    if (key === 'damage_dice_per_levels') return `Кубик урона за каждые ${value} уровней`;
    if (value === 'combo') return 'Комбо-атака';
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
    if (Array.isArray(value)) return value.map(v => formatAbilityValue(v)).filter(Boolean).join(', ');
    if (typeof value === 'object') return Object.entries(value).filter(([k]) => !hidden.has(k) && label(k))
        .map(([k, v]) => `${label(k)}: ${formatAbilityValue(v, k)}`).join(' · ');
    if (typeof value === 'string') return labels[value] || dict_translator[value] || (/^[a-z_]+$/i.test(value) ? 'Особый эффект' : value);
    return String(value);
};

export const abilityRows = data => {
    const rows = [];
    const current = data.charges ?? data.max_charges;
    if (current !== undefined && current !== null) {
        rows.push(['Заряды', data.max_charges != null && data.max_charges !== current ? `${current} / ${data.max_charges}` : String(current)]);
    }
    for (const [key, value] of Object.entries(data)) {
        if (hidden.has(key) || key === 'charges' || !label(key)) continue;
        if (key === 'effects' && value && typeof value === 'object' && !Array.isArray(value)) {
            for (const [effect, amount] of Object.entries(value)) {
                if (!hidden.has(effect) && label(effect)) rows.push([label(effect), formatAbilityValue(amount, effect)]);
            }
        } else {
            const text = formatAbilityValue(value, key);
            if (text) rows.push([label(key), text]);
        }
    }
    return rows;
};
