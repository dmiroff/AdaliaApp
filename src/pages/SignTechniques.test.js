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
test.each([{in_camp:true},{in_camp:false},{in_fight:true}])('all learned techniques are automatic without selection: %o',async flags=>{
    api.get.mockResolvedValue({data:catalogue(flags)});await render();
    expect(container.textContent).toContain('Открыто 3 из 3');
    expect(container.textContent).toContain('открываются автоматически');
    expect(container.querySelectorAll('.sign-technique-card button')).toHaveLength(0);
    expect(api.put).not.toHaveBeenCalled();
    expect(container.querySelector('.sign-techniques-selection').textContent).not.toContain('/2');
});
test('shows sign threshold and weapon readiness separately',async()=>{
    const data=catalogue();data.techniques[1].available=false;
    api.get.mockResolvedValue({data});await render();
    expect(container.textContent).toContain('Открыто 2 из 3');
    expect(container.textContent).toContain('Нужен знак 100.');
    expect(container.textContent).toContain('Наденьте стихийное оружие');
    expect(container.querySelectorAll('.sign-technique-card.selected')).toHaveLength(1);
});
test('can retry a failed catalogue request',async()=>{
    api.get.mockRejectedValueOnce(new Error('network'));await render();
    expect(container.querySelector('[role=alert]')).toBeTruthy();
    await act(async()=>Simulate.click(container.querySelector('[role=alert] button')));
    expect(container.textContent).toContain('Открыто 3 из 3');
});
