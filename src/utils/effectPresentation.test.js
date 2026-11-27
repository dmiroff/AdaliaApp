import {effectRows, effectDuration} from './effectPresentation';

test('effect card uses Russian parameters, readable duration and legacy date', () => {
    const data = {duration:1800,effects:{wisdom_increase:1},text:'Мудрость повышена на 1.',end_date:'2026-11-17 15:52:55.037178'};
    const snapshot=JSON.stringify(data);
    const rows=effectRows(data);
    expect(rows).toContainEqual(['Длительность','30 мин']);
    expect(rows).toContainEqual(['Прибавка: Мудрость','1']);
    expect(rows.find(([key])=>key==='Действует до (МСК)')[1]).toContain('15:52');
    expect(rows.find(([key])=>key==='Действует до (МСК)')[1]).not.toContain('037178');
    expect(JSON.stringify(rows)).not.toMatch(/wisdom_increase|end_date/);
    expect(JSON.stringify(data)).toBe(snapshot);
});
test('curse has no invented expiry, metadata is hidden and offset dates retain time',()=>{
    const rows=effectRows({eon_curse:true,end_date:null,_owner:99,unknown_runtime_field:2,effects:{wisdom_increase:-1}});
    expect(rows).toContainEqual(['Срок действия','До снятия проклятия']);
    expect(JSON.stringify(rows)).not.toMatch(/unknown_runtime_field|_owner/);
    expect(effectDuration(3601)).toBe('1 ч 1 сек');
    expect(effectRows({end_date:'2026-11-17T12:52:55Z'})[0][1]).toContain('15:52');
});

test.each([
    ['piercing', 'к колющему урону'],
    ['bludge', 'к дробящему урону'],
    ['slashing', 'к рубящему урону'],
    ['fire', 'к огню'],
    ['ice', 'ко льду'],
    ['electric', 'к молнии'],
    ['sound', 'к звуку'],
    ['power', 'к власти'],
    ['death', 'к смерти'],
    ['wind', 'к ветру'],
    ['light', 'к свету'],
    ['dark', 'ко тьме'],
    ['life', 'к жизни'],
    ['mind', 'к урону мысли'],
    ['percing', 'к колющему урону'],
    ['stone', 'к дробящему урону'],
    ['lighting', 'к молнии'],
    ['poison', 'к яду'],
])('effect cards decline the %s deduction label', (type, phrase) => {
    expect(effectRows({effects: {[type + '_deduction']: 7}})).toEqual([[`Вычет ${phrase}`, '7']]);
});
