import React from 'react';
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import HomeStorage from './HomeStorage';
import api from '../http/apiClient';

jest.mock('../http/apiClient', () => ({get:jest.fn(), post:jest.fn()}));

test('filters both sides of home storage and preserves the selected transfer stacks', async () => {
    const bow = {id:'1', name:'Ледяной лук Сокола', type:'right_hand', level:70, rarity:2,
        prefix:'ice', suffix:'perception', count:2, available:1, weight:3, equipped:1, is_equippable:true};
    const armor = {id:'2', name:'Доспех', type:'breast_armor', level:65, rarity:3,
        prefix:'fire', count:1, available:1, weight:5, is_equippable:true};
    const potion = {id:'3', name:'Лечебное зелье', type:'potion', level:1, rarity:0,
        count:2, available:2, weight:1};
    api.get.mockResolvedValue({data:{
        inventory:[bow, armor, potion], storage:[{...bow, id:'4', equipped:0}, potion],
        revision:'storage-revision', storage_weight:5, capacity:100, inventory_weight:10, max_weight:100
    }});
    api.post.mockImplementation(() => new Promise(() => {}));
    render(<HomeStorage />);

    fireEvent.click(await screen.findByRole('checkbox', {name:potion.name}));
    let filters = within(screen.getByRole('form', {name:'Фильтры домашнего хранилища'}));
    fireEvent.change(filters.getByLabelText('Категория'), {target:{value:'weapons'}});
    fireEvent.change(filters.getByLabelText('Уровень от'), {target:{value:'70'}});
    fireEvent.change(filters.getByLabelText('Уровень до'), {target:{value:'70'}});
    fireEvent.change(filters.getByLabelText('Префикс'), {target:{value:'ice'}});
    fireEvent.change(filters.getByLabelText('Птица'), {target:{value:'perception'}});
    fireEvent.click(filters.getByText('Дополнительные фильтры'));
    fireEvent.click(filters.getByRole('button', {name:'Добавить условие'}));
    fireEvent.change(filters.getByLabelText('Поле фильтра 1'), {target:{value:'available'}});
    fireEvent.change(filters.getByLabelText('Значение'), {target:{value:'1'}});
    expect(filters.getByRole('status')).toHaveTextContent('Найдено: 1 из 3');
    expect(screen.getByRole('checkbox', {name:bow.name})).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', {name:armor.name})).toBeNull();
    expect(screen.queryByRole('checkbox', {name:potion.name})).toBeNull();
    fireEvent.change(filters.getByRole('searchbox', {name:'Поиск предметов'}), {target:{value:'доспех'}});
    expect(filters.getByRole('status')).toHaveTextContent('Найдено: 0 из 3');
    fireEvent.click(filters.getByRole('button', {name:'Очистить поиск'}));
    expect(filters.getByRole('status')).toHaveTextContent('Найдено: 1 из 3');

    fireEvent.click(screen.getByRole('button', {name:'Выбрать найденные'}));
    fireEvent.click(screen.getByRole('button', {name:'Сложить выбранное'}));
    const confirm = within(await screen.findByRole('dialog'));
    expect(confirm.getByText(`${potion.name} × 2`)).toBeInTheDocument();
    fireEvent.click(confirm.getByRole('button', {name:'Отмена'}));

    fireEvent.click(screen.getByRole('button', {name:'Забрать из сундука'}));
    filters = within(screen.getByRole('form', {name:'Фильтры домашнего хранилища'}));
    expect(filters.getByRole('status')).toHaveTextContent('Найдено: 2 из 2');
    fireEvent.change(filters.getByLabelText('Редкость'), {target:{value:'0'}});
    expect(screen.queryByRole('checkbox', {name:bow.name})).toBeNull();
    fireEvent.click(filters.getByRole('button', {name:'Сбросить фильтры'}));
    expect(screen.getByRole('checkbox', {name:bow.name})).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', {name:bow.name}));
    fireEvent.click(screen.getByRole('button', {name:'Забрать выбранное'}));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', {name:'Подтвердить перенос'}));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/home-storage/transfer', {
        direction:'withdraw', revision:'storage-revision', items:[{item_id:'4', quantity:1}]
    }));
});
