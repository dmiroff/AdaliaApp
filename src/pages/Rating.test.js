import React from 'react';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import Rating from './Rating';
import {GetRating,GetGrandGame,GetTournament,GetEventRating} from '../http/GetData';
jest.mock('../http/GetData',()=>({GetRating:jest.fn(),GetGrandGame:jest.fn(),GetTournament:jest.fn(),GetEventRating:jest.fn()}));
jest.mock('../utils/Helpers',()=>({dict_translator:{rating_skills:'Навыки'}}));
let root,container;
global.IS_REACT_ACT_ENVIRONMENT=true;
const seasonal=()=>({status:200,event_status:'active',week:1,total_weeks:2,
 starts_at:'2026-10-26T00:00:00+03:00',ends_at:'2026-11-02T00:00:00+03:00',participant_count:17,
 data:[{id:10,name:'Лидер Некрополя',score:500,player_position:1},{id:99,name:'Мой персонаж',score:42,player_position:17,is_self:true}],
 player_entry:{id:99,name:'Мой персонаж',score:42,player_position:17,is_self:true}});
beforeEach(()=>{
 jest.clearAllMocks();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
 GetRating.mockResolvedValue({rating_type:'rating_skills',data:[{id:1,name:'Обычный лидер',score:777,player_position:1}]});
 GetGrandGame.mockResolvedValue({data:[]});GetTournament.mockResolvedValue({data:[]});GetEventRating.mockResolvedValue(seasonal());
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
const render=async()=>act(async()=>root.render(<Rating/>));

test('ordinary and event rankings are visible together by default with own place and Moscow dates',async()=>{
 await render();
 const active=container.querySelector('.tab-pane.active');
 expect(active.textContent).toContain('Обычный недельный рейтинг: Навыки');
 expect(active.textContent).toContain('Обычный лидер');expect(active.textContent).toContain('777');
 expect(active.textContent).toContain('Ивентовый рейтинг Некрополя');
 expect(active.textContent).toContain('Лидер Некрополя');expect(active.textContent).toContain('Мой персонаж (вы)');
 expect(active.textContent).toContain('Ваше место: 17, очки: 42');
 expect(active.textContent).toContain('Неделя 1 из 2: 26 октября — 1 ноября');
 expect(active.textContent).toContain('Итоги: 2 ноября, 00:00 МСК');
});

test('event loading failure does not hide the ordinary ranking or pretend there are zero participants',async()=>{
 GetEventRating.mockRejectedValue(new Error('unavailable'));
 await render();expect(container.textContent).toContain('Обычный лидер');
 expect(container.textContent).toContain('Ивентовый рейтинг временно недоступен');
 expect(container.textContent).not.toContain('Участников: 0');
});

test('not-started event has an explicit label',async()=>{
 GetEventRating.mockResolvedValue({...seasonal(),event_status:'not_started',data:[],player_entry:null});
 await render();expect(container.textContent).toContain('Ивентовый рейтинг ещё не запущен');
});

test('second week keeps its own dates and shows when the results are final',async()=>{
 GetEventRating.mockResolvedValue({...seasonal(),week:2,event_status:'finished',
   starts_at:'2026-11-02T00:00:00+03:00',ends_at:'2026-11-09T00:00:00+03:00'});
 await render();
 expect(container.textContent).toContain('Неделя 2 из 2: 2 ноября — 8 ноября');
 expect(container.textContent).toContain('Итоги: 9 ноября, 00:00 МСК');
 expect(container.textContent).toContain('Зачёт завершён. Результаты сохранены');
});
