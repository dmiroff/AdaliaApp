import React, {useId, useState} from 'react';
import {Button} from 'react-bootstrap';
import {
    booleanFields, emptyBrowse, fieldNames, itemCategories, itemFieldNames, itemOptionLabel, itemSorts,
    numberOperators, numericFields
} from '../utils/itemBrowseFields';
import './ItemFilters.css';

const defaultFields = Object.keys(itemFieldNames);
const quickFields = ['prefix', 'suffix', 'type', 'rarity'];
const categoryShortNames = {all:'Все', materials:'Прочее'};

export default function ItemFilters({
    label = 'Фильтры предметов', initialValue, onApply, options = {}, fields = defaultFields,
    categories = itemCategories, sorts = itemSorts, disabled = false, result,
    manual = false, categoryShortcuts = false, shortcuts = {}, searchPlaceholder = 'По названию'
}) {
    const [draft, setDraft] = useState(() => initialValue || emptyBrowse());
    const searchId = useId();
    const update = (field, value) => {
        const next = {...draft, [field]:value};
        setDraft(next);
        if (!manual) onApply(next);
    };
    const changeCondition = (index, change) => update('extra',
        draft.extra.map((condition, i) => i === index ? {...condition, ...change} : condition));
    const removeCondition = index => update('extra', draft.extra.filter((_, i) => i !== index));
    const formatOption = (field, value) => booleanFields.includes(field)
        ? (value === 'true' ? 'Да' : 'Нет') : itemOptionLabel(field, value);
    const conditionLabel = ({field, operator, value}) => {
        const formatted = numericFields.includes(field)
            ? `${numberOperators.find(op => op.id === operator)?.name || '='} ${value}`
            : formatOption(field, value);
        return `${fieldNames[field]} ${formatted}`;
    };
    const optionsFor = (field, selected) => {
        const values = booleanFields.includes(field) ? ['true', 'false'] : options[field] || [];
        const available = selected && !values.includes(selected) ? [selected, ...values] : values;
        return available.map(value => <option key={value} value={value}>{formatOption(field, value)}</option>);
    };
    const quickSelect = field => fields.includes(field) && <label key={field}>
        {fieldNames[field]}
        <select className="form-select" aria-label={fieldNames[field]} value={draft[field]} onChange={e => update(field, e.target.value)}>
            <option value="">Все</option>
            {optionsFor(field, draft[field])}
        </select>
    </label>;

    const hasActiveConditions = draft.extra.some(condition => condition.value !== '');

    return <form className="item-filters" aria-label={label} onSubmit={event => {
        event.preventDefault();
        if (manual) onApply(draft);
    }}>
        <fieldset className="item-filters-fields" disabled={disabled}>
            {categoryShortcuts && <div className="item-filters-shortcuts item-filters-category-shortcuts"
                role="group" aria-label="Быстрые категории">
                {categories.map(([value, name]) => <Button key={value} type="button"
                    variant={draft.category === value ? 'primary' : 'outline-secondary'} aria-pressed={draft.category === value}
                    onClick={() => update('category', value)}>{categoryShortNames[value] || name}</Button>)}
            </div>}
            <div className="item-filters-grid item-filters-main">
                <div className="item-filters-search">
                    <label htmlFor={searchId}>Поиск предметов</label>
                    <div>
                        <input id={searchId} className="form-control" type="search" maxLength={manual ? 100 : undefined}
                            placeholder={searchPlaceholder} value={draft.q} onChange={e => update('q', e.target.value)}/>
                        {draft.q && <Button type="button" variant="outline-secondary" aria-label="Очистить поиск"
                            title="Очистить поиск" onClick={() => update('q', '')}>×</Button>}
                    </div>
                </div>
                {categories.length > 0 && <label className={categoryShortcuts ? 'item-filters-category-mobile' : undefined}>
                    Категория
                    <select className="form-select" value={draft.category} onChange={e => update('category', e.target.value)}>
                        {categories.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
                    </select>
                </label>}
                <label>Сортировка
                    <select className="form-select" value={draft.sort} onChange={e => update('sort', e.target.value)}>
                        {sorts.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
                    </select>
                </label>
                {fields.includes('level') && <fieldset className="item-filters-level">
                    <legend>Уровень</legend>
                    <div>
                        <input className="form-control" aria-label="Уровень от" placeholder="От" type="number" min="0"
                            max={draft.maxLevel || undefined} value={draft.minLevel} onChange={e => update('minLevel', e.target.value)}/>
                        <input className="form-control" aria-label="Уровень до" placeholder="До" type="number"
                            min={draft.minLevel || 0} value={draft.maxLevel} onChange={e => update('maxLevel', e.target.value)}/>
                    </div>
                </fieldset>}
                {quickFields.map(quickSelect)}
            </div>
            {Object.keys(shortcuts).length > 0 && <div className="item-filters-shortcuts" role="group" aria-label="Быстрые фильтры">
                {Object.entries(shortcuts).map(([field, name]) => <Button key={field} type="button"
                    variant={draft.flags[field] ? 'primary' : 'outline-secondary'} aria-pressed={Boolean(draft.flags[field])}
                    onClick={() => update('flags', {...draft.flags, [field]:!draft.flags[field]})}>{name}</Button>)}
            </div>}
            {fields.length > 0 && <details className="item-filters-more">
                <summary>Дополнительные фильтры{draft.extra.length > 0 && ` (${draft.extra.length})`}</summary>
                {draft.extra.map((condition, index) => <div className="item-filters-grid item-filter-condition" key={index}>
                    <label>Поле фильтра {index + 1}
                        <select className="form-select" value={condition.field} onChange={e => changeCondition(index, {
                            field:e.target.value, operator:'equals', value:''
                        })}>
                            {fields.map(field => <option key={field} value={field}>{fieldNames[field]}</option>)}
                        </select>
                    </label>
                    {numericFields.includes(condition.field) ? <>
                        <label>Сравнение
                            <select className="form-select" value={condition.operator} onChange={e => changeCondition(index, {operator:e.target.value})}>
                                {numberOperators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
                            </select>
                        </label>
                        <label>Значение
                            <input className="form-control" type="number"
                                min={condition.field === 'weight' && !manual ? undefined : 0} step="any" value={condition.value}
                                onChange={e => changeCondition(index, {value:e.target.value})}/>
                        </label>
                    </> : <label>Значение
                        <select className="form-select" value={condition.value} onChange={e => changeCondition(index, {value:e.target.value})}>
                            <option value="">Выберите</option>
                            {optionsFor(condition.field, condition.value)}
                        </select>
                    </label>}
                    <Button type="button" variant="outline-secondary" onClick={() => removeCondition(index)}>
                        Убрать условие {index + 1}
                    </Button>
                </div>)}
                <Button type="button" variant="outline-secondary" disabled={draft.extra.length >= 6}
                    onClick={() => update('extra', [...draft.extra, {
                        field:fields.includes('weight') ? 'weight' : fields[0], operator:'equals', value:''
                    }])}>Добавить условие</Button>
            </details>}
            {hasActiveConditions && <ul className="item-filters-active" aria-label="Активные фильтры">
                {draft.extra.map((condition, index) => condition.value !== '' && <li key={index}>
                    {conditionLabel(condition)}
                    <Button type="button" variant="outline-secondary" onClick={() => removeCondition(index)}
                        aria-label={`Убрать фильтр: ${conditionLabel(condition)}`}>×</Button>
                </li>)}
            </ul>}
            <div className="item-filters-actions">
                {manual && <Button type="submit">Применить фильтры</Button>}
                <Button type="button" variant="outline-secondary" onClick={() => {
                    const value = emptyBrowse();
                    setDraft(value);
                    onApply(value);
                }}>Сбросить фильтры</Button>
            </div>
        </fieldset>
        {result != null && <p className="item-filters-result" role="status">{result}</p>}
    </form>;
}
