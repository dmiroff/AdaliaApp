import {createDemoSession,demoCommand,restoreDemoSession} from './gameDraftDemo';
import {isGameDraftEnabled,normalizeKeyboard} from '../utils/gameDraftProtocol';

test('draft is restricted to the exact test hostname and local development',() => {
  expect(isGameDraftEnabled('test.adaliagame.ru')).toBe(true);
  expect(isGameDraftEnabled('localhost')).toBe(true);
  for (const host of ['adaliagame.ru','www.adaliagame.ru','test.adaliagame.ru.evil.example','test-adaliagame.ru']) expect(isGameDraftEnabled(host)).toBe(false);
});

test('callback keeps its command payload rather than sending the button label',() => {
  const keyboard=normalizeKeyboard(JSON.stringify({inline:true,buttons:[[{action:{type:'callback',label:'Забрать 8 монет',payload:JSON.stringify({full_command:'Забрать награду'})}}]]}));
  expect(keyboard.inline).toBe(true);
  expect(keyboard.rows[0][0]).toMatchObject({label:'Забрать 8 монет',command:'Забрать награду',payload:{full_command:'Забрать награду'}});
});

test('Telegram and MAX keyboards keep row structure and callbacks',() => {
  expect(normalizeKeyboard({inline_keyboard:[[{text:'Атака',callback_data:'attack:1'}]]}).rows[0][0].command).toBe('attack:1');
  expect(normalizeKeyboard({buttons:[[{type:'callback',text:'Вперёд',payload:'go'}]]}).rows[0][0].command).toBe('go');
});

test('unsafe links and unsupported contact buttons cannot become actions',() => {
  const keyboard=normalizeKeyboard({buttons:[[{action:{type:'open_link',label:'Ссылка',link:'javascript:alert(1)'}},{action:{type:'request_contact',label:'Контакт'}}]]});
  expect(keyboard.rows[0][0].href).toBeNull();
  expect(keyboard.rows[0][1].kind).toBe('unsupported');
});

test('malformed keyboard does not crash rendering',() => {
  for (const value of [null,undefined,'broken',{}, {buttons:'bad'}]) expect(normalizeKeyboard(value).rows).toEqual([]);
});

test('short encounter can be completed and the same reward cannot be claimed twice',() => {
  let state=createDemoSession();
  for(const command of ['За город','Осмотреть следы','Ударить мечом','Ударить мечом']) state=demoCommand(state,command);
  expect(state.scene).toBe('reward');
  const rewardRevision=state.revision;
  const claimed=demoCommand(state,'Забрать награду',rewardRevision);
  expect(claimed.gold).toBe(20);
  expect(claimed.scene).toBe('city');
  expect(demoCommand(claimed,'Забрать награду',rewardRevision)).toBe(claimed);
  expect(state.gold).toBe(12);
});

test('only available scene actions can change the scenario',() => {
  const state=createDemoSession();
  const next=demoCommand(state,'Забрать награду');
  expect(next.scene).toBe('city');expect(next.gold).toBe(12);
  expect(next.messages.at(-1).text).toContain('такого действия нет');
});

test('saved history resumes the same scene and callback state',() => {
  let state=createDemoSession();
  state=demoCommand(state,'За город');state=demoCommand(state,'Осмотреть следы');
  expect(restoreDemoSession(JSON.stringify(state))).toEqual(state);
});

test('corrupt stored history is replaced by a usable initial scene',() => {
  const state=createDemoSession();
  for(const raw of ['not json','{}',JSON.stringify({...state,messages:[{text:'bad'}]}),JSON.stringify({...state,nextId:0}),JSON.stringify({...state,maxHealth:0})]) {
    expect(restoreDemoSession(raw).scene).toBe('city');
    expect(restoreDemoSession(raw).messages[0].text).toContain('Фаргоса');
  }
});

test('history is bounded and long input is bounded',() => {
  let state=createDemoSession();
  for(let i=0;i<70;i++) state=demoCommand(state,'x'.repeat(1000));
  expect(state.messages).toHaveLength(100);
  expect(state.messages.find(m=>m.role==='user').text).toHaveLength(500);
});
