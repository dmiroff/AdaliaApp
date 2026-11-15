import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import SpellBook from './SpellBook';
import GameDraftKeyboard from './GameDraftKeyboard';
import {normalizeKeyboard} from '../utils/gameDraftProtocol';
import {spellKeyboardGroups} from '../utils/spellBook';
import api from '../http/apiClient';
jest.mock('../http/apiClient',()=>({get:jest.fn(),post:jest.fn()}));
const spells={'Луч':{damage_type:'light'},'Огонь':{damage_type:'fire'},'1':{damage_type:'ice'}};
beforeEach(()=>{jest.clearAllMocks();localStorage.clear();api.get.mockResolvedValue({data:{prepared_magic:spells,order:['Луч','Огонь','1']}});});

test('group by element and save exact order without casting a spell',async()=>{
 api.post.mockResolvedValue({data:{prepared_magic:spells,order:['Огонь','1','Луч']}});
 render(<SpellBook spells={spells}/>);
 await waitFor(()=>expect(screen.getByRole('button',{name:'По стихиям'})).toBeEnabled());
 fireEvent.click(screen.getByRole('button',{name:'По стихиям'}));
 expect(api.post).not.toHaveBeenCalled();
 expect(screen.getByLabelText('Позиция: Огонь')).toHaveValue('0');
 fireEvent.click(screen.getByRole('button',{name:'Сохранить порядок'}));
 await screen.findByText(/Порядок сохранён/);
 expect(api.post).toHaveBeenCalledWith('/player/spells/order',{order:['Огонь','1','Луч']});
});

test('mobile position selection persists numeric spell names and stale-save message',async()=>{
 api.post.mockRejectedValue({response:{status:409,data:{detail:'Список заклинаний изменился.'}}});
 render(<SpellBook spells={spells}/>);
 await waitFor(()=>expect(screen.getByLabelText('Позиция: 1')).toBeEnabled());
 fireEvent.change(screen.getByLabelText('Позиция: 1'),{target:{value:'0'}});
 fireEvent.click(screen.getByRole('button',{name:'Сохранить порядок'}));
 await screen.findByRole('alert');
 expect(api.post.mock.calls[0][1].order).toEqual(['1','Луч','Огонь']);
 expect(screen.getByRole('alert')).toHaveTextContent('Список заклинаний изменился.');
});

test('more than twenty spell buttons stay visible and keep payload/revision',()=>{
 const book=Array.from({length:25},(_,i)=>({key:'Заклинание '+i,element:i%2?'fire':'ice'}));
 const keyboard=normalizeKeyboard({inline:true,buttons:book.map(s=>[{action:{type:'text',label:s.key,payload:{action_selected:'Spells'}}}])});
 const onCommand=jest.fn();render(<GameDraftKeyboard keyboard={keyboard} spellbook={book} onCommand={onCommand} revision="91" sourceId="91"/>);
 expect(screen.getAllByRole('button')).toHaveLength(25);
 fireEvent.click(screen.getByRole('button',{name:'Заклинание 24'}));
 expect(onCommand).toHaveBeenCalledWith('Заклинание 24','91','Заклинание 24',{action_selected:'Spells'},'91');
 fireEvent.click(screen.getByLabelText('Группировать заклинания по стихиям'));
 expect(screen.getByRole('heading',{name:'Мой порядок'})).toBeInTheDocument();
});

test('ordinary keyboards are not regrouped',()=>{
 expect(spellKeyboardGroups({rows:[[{command:'Где я',payload:{}}]]},[{key:'X',element:'fire'}],true)).toBeNull();
});
