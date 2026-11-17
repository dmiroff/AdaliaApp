import {dict_translator} from './Helpers';

const labels = {end_date: 'Действует до (МСК)', duration: 'Длительность', text: 'Описание',
    description: 'Описание', effects: 'Эффекты', turns: 'Осталось ходов'};
export const effectLabel = key => {
    if (labels[key] || dict_translator[key]) return labels[key] || dict_translator[key];
    for (const [suffix, prefix] of [['_increase', 'Прибавка: '], ['_deduction', 'Вычет урона: ']]) {
        if (key.endsWith(suffix)) {
            const base = key.slice(0, -suffix.length);
            if (dict_translator[base]) return prefix + dict_translator[base];
        }
    }
    return /[a-zA-Z_]/.test(key) ? null : key;
};
export const effectDuration = seconds => {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(total / 3600), minutes = Math.floor(total % 3600 / 60), rest = total % 60;
    return [hours && `${hours} ч`, minutes && `${minutes} мин`, (rest || !total) && `${rest} сек`].filter(Boolean).join(' ');
};
const valueText = value => {
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
    if (Array.isArray(value)) return value.map(valueText).filter(Boolean).join(', ');
    if (value && typeof value === 'object') return Object.entries(value)
        .filter(([key]) => effectLabel(key)).map(([key, val]) => `${effectLabel(key)}: ${valueText(val)}`).join('; ');
    if (typeof value === 'string') return dict_translator[value] || value.replace(/\bHP\b/g, 'здоровья');
    return value == null ? '' : String(value);
};
export const effectRows = data => {
    const rows = [], seen = new Set();
    for (const [key, value] of Object.entries(data || {})) {
        const name = effectLabel(key);
        if (!name || value == null || key.startsWith('_') || key === 'name') continue;
        if (key === 'effects' && value && typeof value === 'object') {
            for (const [parameter, amount] of Object.entries(value)) {
                const label = effectLabel(parameter);
                if (!label || (parameter === 'description' && (data.text || data.description))) continue;
                rows.push([label, valueText(amount)]);
            }
            continue;
        }
        let text = valueText(value);
        if (key === 'duration') text = effectDuration(value);
        if (key === 'end_date') {
            let iso = String(value).replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1');
            // Legacy backend datetimes have no offset and use the server's Moscow time.
            if (!/(Z|[+-]\d{2}:?\d{2})$/.test(iso)) iso += '+03:00';
            const date = new Date(iso);
            text = Number.isNaN(date.getTime()) ? 'Не указано' : date.toLocaleString('ru-RU', {
                timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'});
        }
        const identity = `${name}:${text}`;
        if (text && !seen.has(identity)) {rows.push([name, text]); seen.add(identity);}
    }
    if (data?.eon_curse && !data.end_date) rows.push(['Срок действия', 'До снятия проклятия']);
    return rows;
};
