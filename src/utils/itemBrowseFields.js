import {dict_translator} from './Helpers';

export const birdNames = {intelligence:'Ворона', strength:'Орла', perception:'Сокола', constitution:'Стрижа', wisdom:'Совы', charisma:'Попугая', luck:'Журавля', agility:'Колибри'};
export const prefixNames = {light:'Свет', dark:'Тьма', life:'Жизнь', death:'Смерть', fire:'Огонь', ice:'Лёд', electric:'Молния', sound:'Звук', power:'Сила', wind:'Ветер', bludge:'Дробящий', slashing:'Рубящий', piercing:'Колющий'};
export const rarityNames = {0:'Обычный', 1:'Магический', 2:'Редкий', 3:'Очень редкий', 4:'Легендарный'};
const productTypeNames = {
    permanent:'Постоянное улучшение', premium:'Премиум', consumable:'Расходник', custom:'Индивидуальный заказ',
    rename:'Смена имени', beginner_pack:'Набор для новичка', cosmetic:'Образ', cosmetic_selectable:'Образ на заказ'
};
export function itemOptionLabel(field, value) {
    if (value === 'none') return field === 'prefix' ? 'Без префикса' : field === 'suffix' ? 'Без птицы' : 'Не указан';
    const labels = {suffix:birdNames, prefix:prefixNames, rarity:rarityNames};
    return (labels[field] ?? dict_translator)[value] || (field === 'type' && productTypeNames[value]) || value;
}
export const numberOperators = [{id:'greater',name:'>'},{id:'less',name:'<'},{id:'equals',name:'='},{id:'greaterOrEquals',name:'≥'},{id:'lessOrEquals',name:'≤'}];
export const itemFieldNames = {type:'Тип предмета',level:'Уровень',prefix:'Префикс',suffix:'Птица',rarity:'Редкость',value:'Базовая стоимость',weight:'Вес',count:'Количество',is_equippable:'Можно надеть',undefined:'Нераспознанный',junk:'Хлам',corrupted:'Проклят'};
export const fieldNames = {...itemFieldNames, favorite:'Избранное', equipped:'Экипирован', added_by:'Кто добавил', available:'Доступно для переноса', price:'Цена', own_request:'Моя заявка', sellable:'Можно продать', enabled:'Автопокупка включена'};
export const booleanFields = ['is_equippable','undefined','junk','corrupted','favorite','equipped','own_request','sellable','enabled'];
export const numericFields = ['level','rarity','value','weight','count','available','price'];
export const itemCategories = [
    ['all','Все предметы'], ['weapons','Оружие'], ['armor','Броня'],
    ['consumables','Расходники'], ['materials','Материалы и прочее']
];
export const itemSorts = [
    ['default','По порядку'], ['name','По названию'], ['level','Уровень · сначала высокий'],
    ['level_asc','Уровень · сначала низкий'], ['value','Базовая стоимость · сначала дорогие'],
    ['count','Количество · сначала больше'], ['weight','Вес · сначала тяжелее']
];
export const priceSorts = [['price_asc','Цена · сначала дешевле'], ['price_desc','Цена · сначала дороже']];
export const productFields = ['type', 'price'];
export const productSorts = [...itemSorts.slice(0, 2), ...priceSorts];
export const emptyBrowse = () => ({q:'',category:'all',sort:'default',minLevel:'',maxLevel:'',prefix:'',suffix:'',type:'',rarity:'',extra:[],flags:{}});

export function browseConditions(value) {
    const filters = value.extra.filter(f => f.field && f.value !== '');
    for (const [field, enabled] of Object.entries(value.flags || {})) {
        if (enabled) filters.push({field, operator:'equals', value:'true'});
    }
    for (const field of ['type','prefix','suffix','rarity']) {
        if (value[field] !== '') filters.push({field,operator:'equals',value:value[field]});
    }
    if (value.minLevel !== '') filters.push({field:'level',operator:'greaterOrEquals',value:value.minLevel});
    if (value.maxLevel !== '') filters.push({field:'level',operator:'lessOrEquals',value:value.maxLevel});
    return filters;
}

export function browseParams(value, offset=0) {
    return {q:value.q.trim(),category:value.category,sort:value.sort,filters:JSON.stringify(browseConditions(value)),offset};
}
