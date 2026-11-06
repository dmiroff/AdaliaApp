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

test('a collision does not place the settlement optimistically',async()=>{
 api.post.mockRejectedValue({response:{data:{detail:'Рядом уже есть поселение.'}}});
 await render();await choose();await click('Основать поселение здесь');await click('Подтвердить место');
 expect(container.querySelector('[role="alert"]').textContent).toContain('Рядом уже есть поселение.');
 expect(container.querySelector('[aria-label="Поселение вашей гильдии"]')).toBeNull();
 expect(button('Основать поселение здесь')).toBeTruthy();
});
