import {normalizeKeyboard} from '../utils/gameDraftProtocol';

export const DRAFT_STORAGE_KEY = 'adalia.game-draft.v1';
const scenes = ['city','trail','fight','reward','tavern'];
const reply = commands => ({buttons:commands.map(row => row.map(label => ({action:{type:'text',label},color:'secondary'})))});
export const sceneKeyboard = scene => normalizeKeyboard({
  city:reply([['За город','В таверну'],['Персонаж','Помощь']]),
  trail:reply([['Осмотреть следы'],['Вернуться в город']]),
  fight:reply([['Ударить мечом','Защищаться'],['Отступить']]),
  reward:reply([['Забрать награду'],['Вернуться в город']]),
  tavern:reply([['Отдохнуть'],['Вернуться в город']]),
}[scene]);

const addMessage = (session, role, text, extra = {}) => {
  const message = {id:session.nextId++,role,text,time:Date.now(),...extra};
  session.messages = [...session.messages,message].slice(-100);
};
const enter = (session, scene, text, extra = {}) => {
  session.scene = scene;
  session.revision += 1;
  addMessage(session,'bot',text,{sceneRevision:session.revision,...extra});
};
const welcome = 'Вы стоите у ворот Фаргоса. За стенами начинается Западный Фронтир. Стражник кивает на лесную тропу: сегодня там неспокойно.\n\nКуда отправимся?';
export const createDemoSession = () => ({
  version:1,scene:'city',revision:1,nextId:2,health:40,maxHealth:40,gold:12,enemyHealth:0,
  messages:[{id:1,role:'bot',text:welcome,time:Date.now(),image:'city',sceneRevision:1}],
});

export const restoreDemoSession = raw => {
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !scenes.includes(value.scene) || !Number.isSafeInteger(value.revision) || value.revision < 1 ||
      !Number.isSafeInteger(value.nextId) || value.nextId < 2 || !Array.isArray(value.messages) || !value.messages.length ||
      ![value.health,value.maxHealth,value.gold,value.enemyHealth].every(n => Number.isFinite(n) && n >= 0) || value.maxHealth < 1 || value.health > value.maxHealth ||
      value.messages.some(m => !Number.isSafeInteger(m.id) || !['bot','user'].includes(m.role) || typeof m.text !== 'string' || !Number.isFinite(m.time)) ||
      value.messages.some(m => m.id >= value.nextId)) return createDemoSession();
    return {...value,messages:value.messages.slice(-100)};
  } catch { return createDemoSession(); }
};

export const demoCommand = (previous, command, revision = previous.revision, label = command) => {
  // A button from an earlier scene cannot spend resources or claim a reward again.
  if (revision !== previous.revision) return previous;
  const input = String(command || '').trim().slice(0, 500);
  if (!input) return previous;
  const session = {...previous,messages:[...previous.messages]};
  addMessage(session,'user',String(label || input).slice(0,500));
  const action = input.toLocaleLowerCase('ru-RU');
  if (action === 'помощь' || action === '/help') {
    addMessage(session,'bot','Выбирайте действия на клавиатуре или вводите их текстом. Попробуйте «За город», осмотрите следы и завершите короткий бой. «Персонаж» показывает героя демосценария.\n\nВсе результаты этого сценария сохраняются только в этом браузере.',{
      keyboard:{inline:true,buttons:[[{action:{type:'open_link',label:'Открыть карту приложения',link:'/map'}}]]},sceneRevision:session.revision});
    return session;
  }
  if (action === 'персонаж') {
    addMessage(session,'bot',`Странник · демоперсонаж\nЗдоровье: ${session.health}/${session.maxHealth}\nМонеты: ${session.gold}\nСнаряжение: дорожный меч и плащ.`);
    return session;
  }
  if (action === 'где я' || action === 'локация') {
    const locations = {city:'Ворота Фаргоса',trail:'Лесная тропа',fight:'Лесная тропа · бой',reward:'Лесная тропа · награда',tavern:'Таверна Фаргоса'};
    addMessage(session,'bot',locations[session.scene]);return session;
  }
  const allowed = sceneKeyboard(session.scene).rows.flat().some(b => b.command.toLocaleLowerCase('ru-RU') === action);
  if (!allowed) {
    addMessage(session,'bot','В этом демосценарии такого действия нет. Выберите одну из кнопок ниже или введите «Помощь».');return session;
  }
  if (action === 'вернуться в город' || action === 'отступить') {
    enter(session,'city',action === 'отступить' ? 'Вы отступаете к городским воротам. Стража пропускает вас за стену. Можно отдохнуть в таверне.' : welcome,{image:'city'});
  } else if (action === 'за город') {
    enter(session,'trail','За воротами городские голоса сменяются шелестом листвы. На влажной земле видны свежие следы, а в кустах что-то движется.\n\nОсмотреть следы или вернуться?',{image:'forest'});
  } else if (action === 'в таверну') {
    enter(session,'tavern','В таверне пахнет хлебом и древесным дымом. У очага свободно место. Хозяин предлагает перевести дух перед дорогой.');
  } else if (action === 'отдохнуть') {
    session.health = session.maxHealth;
    enter(session,'tavern','Вы отдыхаете у очага. Здоровье восстановлено.');
  } else if (action === 'осмотреть следы') {
    session.enemyHealth = 24;
    enter(session,'fight','Из-за деревьев выходит лесной зверь. Он перекрывает тропу.\n\nНачинается демонстрационный бой. Выберите действие.',{image:'encounter'});
  } else if (action === 'ударить мечом') {
    session.enemyHealth = Math.max(0,session.enemyHealth-12);
    if (session.enemyHealth === 0) {
      enter(session,'reward','Последний удар заставляет зверя отступить в чащу. Тропа снова свободна. У корней дерева вы замечаете небольшой кошель.\n\nНаграда демосценария: 8 монет.',{
        keyboard:{inline:true,buttons:[[{action:{type:'callback',label:'Забрать 8 монет',payload:JSON.stringify({full_command:'Забрать награду'})},color:'positive'}]]}});
    } else {
      session.health = Math.max(1,session.health-4);
      enter(session,'fight',`Ваш удар: 12 урона. Здоровье противника: ${session.enemyHealth}/24.\nОтветный удар: 4 урона. Ваше здоровье: ${session.health}/${session.maxHealth}.`);
    }
  } else if (action === 'защищаться') {
    enter(session,'fight','Вы прикрываетесь клинком и отражаете удар. Здоровье не изменилось. Противник остаётся на тропе.');
  } else if (action === 'забрать награду') {
    session.gold += 8;
    enter(session,'city',`Вы забираете кошель и возвращаетесь в Фаргос.\n\nПолучено: 8 монет. Теперь у демоперсонажа ${session.gold} монет.`,{image:'city'});
  }
  return session;
};
