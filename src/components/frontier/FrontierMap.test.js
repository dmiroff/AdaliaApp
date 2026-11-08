import React from 'react';
import {createRoot} from 'react-dom/client';
import {act,Simulate} from 'react-dom/test-utils';
import FrontierMap from './FrontierMap';
import {nearestBoundary} from './geometry';
import api from '../../http/apiClient';
import grid from '../../../public/maps/westlands-grid.json';
jest.mock('../../http/apiClient',()=>({__esModule:true,default:{get:jest.fn(),post:jest.fn()}}));
let container,root;
const boundary=grid.boundaries.find(b=>b.biome==='Wild_lands_forest');
const [[ax,ay],[bx,by]]=boundary.segments[0];
const point={x:(ax+bx)/2,y:(ay+by)/2};
const button=name=>[...document.querySelectorAll('button')].find(b=>b.textContent===name);
const click=async name=>act(async()=>Simulate.click(button(name)));
const choose=async()=>{
 const svg=container.querySelector('svg');
 await act(async()=>{Simulate.pointerDown(svg,{pointerId:1,button:0,clientX:point.x,clientY:point.y});Simulate.pointerUp(svg,{pointerId:1,clientX:point.x,clientY:point.y});});
};
beforeEach(()=>{
 jest.clearAllMocks();global.IS_REACT_ACT_ENVIRONMENT=true;
 global.fetch=jest.fn().mockResolvedValue({ok:true,json:async()=>grid});
 api.get.mockResolvedValue({data:{can_place:true,intent:'found',biome:'Wild_lands_forest',guild_name:'Гильдия',position:null}});
 container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
 SVGElement.prototype.setPointerCapture=()=>{};
 SVGElement.prototype.getScreenCTM=()=>({a:1,inverse:()=>({})});
 SVGElement.prototype.createSVGPoint=()=>({x:0,y:0,matrixTransform(){return {x:this.x,y:this.y};}});
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
const render=async()=>act(async()=>root.render(<FrontierMap/>));

test('snapping stays within the allowed biome',()=>{
 expect(nearestBoundary(grid,'Wild_lands_forest',point).boundary_id).toBe(boundary.id);
 expect(nearestBoundary(grid,'Wild_lands_mountains',point).boundary_id).not.toBe(boundary.id);
});

test.each(['found','place'])('leader confirms a %s position before the request is sent',async intent=>{
 api.get.mockResolvedValue({data:{can_place:true,intent,biome:'Wild_lands_forest',guild_name:'Гильдия',position:null}});
 const saved={boundary_id:boundary.id,biome:'Wild_lands_forest',...point};
 api.post.mockResolvedValue({data:{position:saved,message:'Место сохранено'}});
 await render();await choose();
 expect(api.post).not.toHaveBeenCalled();
 await click(intent==='found'?'Основать поселение здесь':'Закрепить место поселения');
 expect(api.post).not.toHaveBeenCalled();
 await click('Подтвердить место');
 expect(api.post).toHaveBeenCalledWith('/frontier-map/settlement',expect.objectContaining({intent,boundary_id:boundary.id,version:grid.version}));
 expect(container.textContent).toContain('Место сохранено');
 expect(container.querySelector('[aria-label="Поселение вашей гильдии"]')).toBeTruthy();
 expect(button('Основать поселение здесь')).toBeUndefined();
});

test('read-only members cannot select a place',async()=>{
 api.get.mockResolvedValue({data:{can_place:false,reason:'Место выбирает глава гильдии.',position:null}});
 await render();await choose();
 expect(container.textContent).toContain('Место выбирает глава гильдии.');
 expect(container.querySelector('[aria-label="Выбранное место"]')).toBeNull();
 expect(api.post).not.toHaveBeenCalled();
});

test('a missing settlement API leaves the map available for viewing without a raw 404 error',async()=>{
 api.get.mockRejectedValue({response:{status:404,data:{detail:'Not Found'}}});
 await render();await choose();
 expect(container.textContent).not.toContain('Not Found');
 expect(container.textContent).toContain('Выбор места поселения пока недоступен. Карту можно просматривать.');
 expect(container.querySelector('[role="alert"]')).toBeNull();
 expect(container.querySelectorAll('svg polygon')).toHaveLength(512);
 expect(container.querySelectorAll('[aria-label="Западная дорога"] path')).toHaveLength(2);
 expect(container.querySelector('[aria-label="Выбранное место"]')).toBeNull();
 expect(api.post).not.toHaveBeenCalled();
 const svg=container.querySelector('svg'),before=svg.getAttribute('viewBox');
 await act(async()=>Simulate.click(container.querySelector('[aria-label="Приблизить карту"]')));
 expect(svg.getAttribute('viewBox')).not.toBe(before);
});

test('read-only fallback does not conceal a failure to load the map itself',async()=>{
 api.get.mockRejectedValue({response:{status:404,data:{detail:'Not Found'}}});
 global.fetch.mockResolvedValue({ok:false});
 await render();
 expect(container.textContent).toContain('Не удалось загрузить сетку карты.');
 expect(container.querySelector('svg')).toBeNull();
});

test('scouted sectors use guild ownership fills and neutral guards are grey',async()=>{
 api.get.mockResolvedValue({data:{can_place:false,position:null}});
 const [a,b,c]=grid.sectors;
 await act(async()=>root.render(<FrontierMap strategy={{guild_id:0,guild_name:'Свои',guild_colours:{0:'#d95b43'},sectors:[{id:a.id,element:'Death',owner:null},{id:b.id,element:'Light',owner:0}],bases:[],armies:[],enemy_armies:[],caravans:[]}}/>));
 const polygon=id=>container.querySelector(`polygon[data-sector-id="${id}"]`);
 expect(polygon(a.id).getAttribute('fill')).toBe('#808080');
 expect(polygon(b.id).getAttribute('fill')).toBe('#d95b43');
 expect(polygon(b.id).getAttribute('stroke')).toBe('#fff4c7');
 expect(polygon(c.id).getAttribute('fill')).toBe('none');
 expect(polygon(c.id).textContent).toContain('Не разведан');
 expect(container.querySelector('[aria-label="Владельцы секторов"]').textContent).toContain('Защитники Обителей');
});

test('a collision does not place the settlement optimistically',async()=>{
 api.post.mockRejectedValue({response:{data:{detail:'Рядом уже есть поселение.'}}});
 await render();await choose();await click('Основать поселение здесь');await click('Подтвердить место');
 expect(container.querySelector('[role="alert"]').textContent).toContain('Рядом уже есть поселение.');
 expect(container.querySelector('[aria-label="Поселение вашей гильдии"]')).toBeNull();
 expect(button('Основать поселение здесь')).toBeTruthy();
});


test('ordinary mirror map loads known ownership without revealing unexplored sectors',async()=>{
 const [a,b]=grid.sectors;
 api.get.mockImplementation(path=>Promise.resolve({data:path==='/frontier-strategy/state'?{available:true,guild_id:0,guild_name:'Свои',guild_colours:{0:'#dc008a',4:'#2ca9de'},guilds:[{id:4,name:'Соседи',colour:'#2ca9de'}],sectors:[{id:a.id,owner:4,element:'Fire'}],bases:[],armies:[],caravans:[]}: {can_place:false,position:null}}));
 await render();
 expect(container.querySelector(`polygon[data-sector-id="${a.id}"]`).getAttribute('fill')).toBe('#2ca9de');
 expect(container.querySelector(`polygon[data-sector-id="${b.id}"]`).getAttribute('fill')).toBe('none');
 expect(api.post).not.toHaveBeenCalled();
});
