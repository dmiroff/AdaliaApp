import {abilityRows} from './abilityPresentation';
test('ability cards translate nested effects and show charges once', () => {
    const rows = abilityRows({type:'Attack_ability', charges:100, max_charges:100, skill:'medicine', effects:{attacks:'combo'}});
    expect(rows.filter(([key]) => key==='Заряды')).toEqual([['Заряды','100']]);
    expect(JSON.stringify(rows)).toContain('Комбо-атака');
    expect(JSON.stringify(rows)).toContain('Медицина');
    expect(JSON.stringify(rows)).not.toMatch(/Attack_ability|medicine|combo/);
});
test('fire breath scaling is readable and internal fields stay hidden', () => {
    const rows = abilityRows({standalone_attack:true, apply_on:[4,5,6], effects:{damage:'1d6', damage_dice_per_levels:5, damage_type:'fire', associated_skills:['sign_fire']}});
    expect(JSON.stringify(rows)).toContain('каждые 5 уровней');
    expect(JSON.stringify(rows)).not.toMatch(/standalone_attack|apply_on|damage_dice_per_levels|sign_fire/);
});
test('different current and maximum charges are presented together', () => {
    expect(abilityRows({charges:1,max_charges:2})).toEqual([['Заряды','1 / 2']]);
});
