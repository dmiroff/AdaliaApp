import {dict_translator} from './Helpers';

export const birdNames = {intelligence:'Ворона', strength:'Орла', perception:'Сокола', constitution:'Стрижа', wisdom:'Совы', charisma:'Попугая', luck:'Журавля', agility:'Колибри'};
export const prefixNames = {light:'Свет', dark:'Тьма', life:'Жизнь', death:'Смерть', fire:'Огонь', ice:'Лёд', electric:'Молния', sound:'Звук', power:'Сила', wind:'Ветер', bludge:'Дробящий', slashing:'Рубящий', piercing:'Колющий'};
export const rarityNames = {0:'Обычный', 1:'Магический', 2:'Редкий', 3:'Очень редкий', 4:'Легендарный'};
export function itemOptionLabel(field, value) {
    if (value === 'none') return field === 'prefix' ? 'Без префикса' : field === 'suffix' ? 'Без птицы' : 'Не указан';
    return (field === 'suffix' ? birdNames[value] : field === 'prefix' ? prefixNames[value] : field === 'rarity' ? rarityNames[value] : dict_translator[value]) || value;
}
export const numberOperators = [{id:'greater',name:'>'},{id:'less',name:'<'},{id:'equals',name:'='},{id:'greaterOrEquals',name:'≥'},{id:'lessOrEquals',name:'≤'}];
export const itemFieldNames = {type:'Тип предмета',level:'Уровень',prefix:'Префикс',suffix:'Птица',rarity:'Редкость',value:'Базовая стоимость',weight:'Вес',count:'Количество',is_equippable:'Можно надеть',undefined:'Нераспознанный',junk:'Хлам',corrupted:'Проклят'};
export const booleanFields = ['is_equippable','undefined','junk','corrupted'];
export const numericFields = ['level','rarity','value','weight','count'];
export const emptyBrowse = () => ({q:'',category:'all',sort:'default',minLevel:'',maxLevel:'',prefix:'',suffix:'',type:'',rarity:'',extra:[]});

export function browseParams(value, offset=0) {
    const filters = value.extra.filter(f => f.field && f.value !== '');
    for (const field of ['type','prefix','suffix','rarity']) {
        if (value[field] !== '') filters.push({field,operator:'equals',value:value[field]});
    }
    if (value.minLevel !== '') filters.push({field:'level',operator:'greaterOrEquals',value:value.minLevel});
    if (value.maxLevel !== '') filters.push({field:'level',operator:'lessOrEquals',value:value.maxLevel});
    return {q:value.q.trim(),category:value.category,sort:value.sort,filters:JSON.stringify(filters),offset};
}
