import React from 'react';
import {createRoot} from 'react-dom/client';
import {act,Simulate} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import SignTechniques from './SignTechniques';
import api from '../http/apiClient';
jest.mock('../http/apiClient',()=>({__esModule:true,default:{get:jest.fn(),put:jest.fn()}}));
let container,root;
const catalogue = extra => ({prepared:[],in_camp:true,in_fight:false,techniques:[
    {id:'fire_aim',name:'Прицельная искра',element:'fire',cost:1,level:10,available:true,weapon_ready:true,charges:2,max_charges:2,description:'Следующая атака +20 п.п.'},
    {id:'fire_seal',name:'Печать жара',element:'fire',cost:1,level:100,available:true,weapon_ready:true,charges:2,max_charges:2,description:'Мгновенный ожог.'},
    {id:'ice_shell',name:'Хрустальная оболочка',element:'ice',cost:2,level:100,available:true,weapon_ready:false,charges:2,max_charges:2,description:'Первое попадание -30%.'}],...extra});
const render = async () => act(async()=>root.render(<MemoryRouter><SignTechniques/></MemoryRouter>));
beforeEach(()=>{jest.clearAllMocks();global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);api.get.mockResolvedValue({data:catalogue()});});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
test('saves selection and prevents adding a third technique',async()=>{
    api.get.mockResolvedValue({data:catalogue({prepared:['fire_aim']})});
    api.put.mockResolvedValue({data:catalogue({prepared:['fire_aim','fire_seal']})});
    await render();await act(async()=>Simulate.click(container.querySelectorAll('.sign-technique-card button')[1]));
    expect(api.put).toHaveBeenCalledWith('/sign-techniques',{prepared:['fire_aim','fire_seal']});
    expect(container.textContent).toContain('Подготовлено 2/2');
    expect(container.querySelectorAll('.sign-technique-card button')[2].disabled).toBe(true);
});
test.each([{in_camp:false},{in_fight:true}])('selection requires a camp outside battle: %o',async flags=>{
    api.get.mockResolvedValue({data:catalogue(flags)});await render();
    expect([...container.querySelectorAll('.sign-technique-card button')].every(button=>button.disabled)).toBe(true);
});
test('failed save retains the confirmed selection',async()=>{
    await render();api.put.mockRejectedValue(new Error('network'));
    await act(async()=>Simulate.click(container.querySelector('.sign-technique-card button')));
    expect(container.textContent).toContain('Подготовлено 0/2');
    expect(container.querySelector('[role=alert]')).toBeTruthy();
});
