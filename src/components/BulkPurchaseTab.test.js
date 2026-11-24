import React from 'react';
import {fireEvent, render, screen, within} from '@testing-library/react';
import {Context} from '../index';
import GetDataById from '../http/GetData';
import {fetchBuyRequests, getPlayerStorage} from '../http/bulkPurchase';
import BulkPurchaseTab from './BulkPurchaseTab';

jest.mock('../index', () => ({Context:require('react').createContext(null)}));
jest.mock('../http/GetData', () => ({__esModule:true, default:jest.fn()}));
jest.mock('../http/bulkPurchase', () => ({fetchBuyRequests:jest.fn(), getPlayerStorage:jest.fn()}));
jest.mock('./CreateBuyRequestModal', () => () => null);
jest.mock('./SellModal', () => () => null);
jest.mock('./CancelRequestModal', () => () => null);
jest.mock('./StorageCollectModal', () => () => null);

test('trade keeps quick filters for own and sellable requests, and clears both on reset', async () => {
    const user = {setPlayer:jest.fn(), setPlayerInventory:jest.fn()};
    GetDataById.mockResolvedValue({data:{id:7, inventory_new:{'2':{name:'Железо', count:2}}}});
    fetchBuyRequests.mockResolvedValue([
        {id:1, user_id:7, item_id:1, item_name:'Полотно', buy_price:5, buy_amount:3},
        {id:2, user_id:8, item_id:2, item_name:'Железо', buy_price:7, buy_amount:2},
        {id:3, user_id:8, item_id:3, item_name:'Перо', buy_price:2, buy_amount:1}
    ]);
    getPlayerStorage.mockResolvedValue({data:{items:[]}});
    render(<Context.Provider value={{user}}><BulkPurchaseTab /></Context.Provider>);
    await screen.findByText('Железо');
    const filters = within(screen.getByRole('form', {name:'Фильтры заявок на скупку'}));
    const mine = filters.getByRole('button', {name:'Мои'});
    const sellable = filters.getByRole('button', {name:'Можно продать'});

    fireEvent.click(mine);
    expect(screen.getByText('Полотно')).toBeInTheDocument();
    expect(screen.queryByText('Железо')).toBeNull();
    fireEvent.click(mine);
    fireEvent.click(sellable);
    expect(screen.getByText('Железо')).toBeInTheDocument();
    expect(screen.queryByText('Перо')).toBeNull();
    expect(screen.queryByText('Полотно')).toBeNull();
    fireEvent.click(filters.getByRole('button', {name:'Сбросить фильтры'}));
    expect(sellable).toHaveAttribute('aria-pressed', 'false');
    expect(filters.getByRole('status')).toHaveTextContent('Найдено: 3 из 3');
});
