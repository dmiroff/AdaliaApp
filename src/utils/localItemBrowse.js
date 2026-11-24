import Fuse from 'fuse.js';
import {booleanFields, browseConditions, itemOptionLabel, numericFields} from './itemBrowseFields';

const weaponTypes = ['right_hand', 'left_hand', 'secondary_weapon'];
const armorTypes = ['head', 'breast_armor', 'cloak', 'gloves', 'leg_armor', 'boots', 'belt', 'arm_armor'];
const consumableTypes = ['food', 'potion', 'potions', 'scroll', 'scrolls', 'consumable_items'];
const normalize = value => String(value ?? '').toLocaleLowerCase('ru').replace(/ё/g, 'е');
const isTrue = value => value === true || value === 'true' || Number(value) > 0;
const numberValue = value => Number(value) || 0;

function matchesCategory(item, category) {
    if (category === 'weapons') return weaponTypes.includes(item.type);
    if (category === 'armor') return armorTypes.includes(item.type);
    if (category === 'consumables') return consumableTypes.includes(item.type);
    if (category === 'materials') return !isTrue(item.is_equippable);
    return true;
}

function matchesCondition(item, {field, operator, value}) {
    const actual = item[field];
    if (booleanFields.includes(field)) return isTrue(actual) === (value === 'true');
    if (!numericFields.includes(field)) return String(actual || 'none') === value;
    const left = numberValue(actual);
    const right = Number(value);
    switch (operator) {
        case 'greater': return left > right;
        case 'less': return left < right;
        case 'greaterOrEquals': return left >= right;
        case 'lessOrEquals': return left <= right;
        default: return left === right;
    }
}

export function itemFilterOptions(items) {
    return Object.fromEntries(['type', 'prefix', 'suffix', 'rarity', 'added_by'].map(field => {
        const values = new Set();
        for (const item of items) {
            const value = item[field];
            if (value != null && value !== '') values.add(String(value));
            else if (field === 'prefix' || field === 'suffix') values.add('none');
        }
        return [field, [...values].sort((a, b) => itemOptionLabel(field, a).localeCompare(itemOptionLabel(field, b), 'ru'))];
    }));
}

export function browseLocalItems(items, browse, fuzzyOptions) {
    const conditions = browseConditions(browse);
    let results = items.filter(item => matchesCategory(item, browse.category) &&
        conditions.every(condition => matchesCondition(item, condition)));
    const query = normalize(browse.q).trim();
    if (query) {
        const terms = query.split(/\s+/);
        const searchable = results.map(row => {
            const name = normalize(row.name);
            const description = normalize(row.description);
            const nameAndDescription = `${name} ${description}`;
            return {row, name, description, nameAndDescription,
                text: `${nameAndDescription} ${normalize(row.type)} ${normalize(itemOptionLabel('type', row.type))}`};
        });
        const matches = new Set(searchable.filter(({text}) => terms.every(term => text.includes(term))).map(({row}) => row));
        if (fuzzyOptions) {
            const fuzzy = new Fuse(searchable, {keys:['name', 'description'], ...fuzzyOptions});
            for (const {item} of fuzzy.search(query)) matches.add(item.row);
        }
        results = [...matches];
    }
    if (browse.sort === 'name') {
        return results.sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), 'ru'));
    }
    if (browse.sort !== 'default') {
        const ascending = ['level_asc', 'price_asc'].includes(browse.sort);
        const field = browse.sort.replace(/_(asc|desc)$/, '');
        results.sort((a, b) => (ascending ? 1 : -1) * (numberValue(a[field]) - numberValue(b[field])));
    }
    return results;
}
