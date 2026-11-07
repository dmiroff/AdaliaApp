import api from '../../http/apiClient';
export const isFrontierObservationHost = (host=window.location.hostname) => ['test.adaliagame.ru','localhost','127.0.0.1'].includes(host);
const n=(v,d=0)=>v!==null&&v!==undefined&&!(typeof v==='string'&&!v.trim())&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):d;
const evenRound=v=>{const lo=Math.floor(v);return v-lo===.5 ? lo+(lo%2):Math.round(v);};
const signed=v=>Number.isFinite(Number(v))?Math.trunc(Number(v)):0;
export const unitPower=m=>Math.max(1,evenRound(Math.sqrt(Math.max(1,Math.trunc(n(m.max_health,1))))/2
 +Math.max(...['melee_attack','range_attack','magic_attack','pray_attack'].map(k=>signed(m[k])))
 +1.5*Math.max(...['melee_damage','range_damage','magic_damage','pray_damage'].map(k=>signed(m[k])))
 +.5*signed(m.defence)+.5*signed(m.action_points)));
export function playerCapacity(p){
 const breakdown={base:30,level:Math.floor(n(p.level)/2),charisma:Math.floor(Math.max(0,n(p.charisma)+signed(p.charisma_increase))/5),inspiration:Math.floor(Math.sqrt(n(p.persuasion)))};
 return {capacity:Object.values(breakdown).reduce((a,b)=>a+b,0),breakdown,skill_key:'persuasion',provisional:true};
}
export function heroCapacity(h){
 const s=h.skills||{},o=Math.trunc(n(s.overseer)),t=Math.trunc(n(s.trainer)),p=Math.trunc(n(s.pragmatist ?? s.pragmatic));
 return {kind:o||t||p?'strategist':'combat',capacity:o||t||p?50+8*o+5*t+3*p:20,provisional:true};
}
export function buildObservation(settlement,player,catalog){
 const rows=[],warnings=[],excluded=[];let total=0,count=0,load=0,food=0,essence=0,gold=0;
 const busyIds={},seenBusy=new Set();
 for(const group of ['heroes_on_mission','wounded_heroes'])for(const [name,hero] of Object.entries(settlement.heroes?.[group]||{})){
  if(seenBusy.has(name)||!hero||hero.id===null||hero.id===undefined)continue;
  seenBusy.add(name);const key=String(hero.id);busyIds[key]=(busyIds[key]||0)+1;
 }
 for(const [id,unit] of Object.entries(settlement.garrison||{})){
  if(!unit||typeof unit!=='object'||Array.isArray(unit)){warnings.push(`Некорректная запись гарнизона ${id}`);continue;}
  let amount=n(unit.amount,-1);
  if(amount<0||!Number.isInteger(amount)){warnings.push(`Некорректная численность ${id}`);continue;}
  if(!amount)continue;
  if(['reserved','march','battle','wounded','mission'].includes(unit.state)){excluded.push({id,count:amount,reason:unit.state});continue;}
  const unavailable=Math.min(amount,busyIds[id]||0);if(unavailable){excluded.push({id,count:unavailable,reason:'hero_unavailable'});amount-=unavailable;}
  if(!amount)continue;
  const m=catalog[id];count+=amount;
  if(!m){warnings.push(`Нет проверенного профиля существа ${id}`);rows.push({id,name:unit.name||id,count:amount,power:null,command_weight:null});continue;}
  const power=unitPower(m)*amount,w=n(m.command_weight,1)*amount,f=n(m.ration_day,1)*amount*.75,e=n(m.essence_day)*amount*.75,g=n(m.wage_day,10)*amount;
  total+=power;load+=w;food+=f;essence+=e;gold+=g;
  rows.push({id,name:unit.name||m.name||id,count:amount,power,command_weight:w,food_day:f,essence_day:e,gold_day:g});
 }
 const heroes=settlement.heroes||{},busy=new Set([...Object.keys(heroes.heroes_on_mission||{}),...Object.keys(heroes.wounded_heroes||{})]);
 const commanders=[{id:'player',name:player.name||'Персонаж',kind:'player',...playerCapacity(player)}];
 for(const [name,hero] of Object.entries(heroes.active_heroes||{})){
  if(!hero||typeof hero!=='object'||busy.has(name))continue;
  if(!hero.skills&&!Object.prototype.hasOwnProperty.call(settlement.garrison||{},String(hero.id)))continue;
  commanders.push({id:'hero:'+name,name,...heroCapacity(hero)});
 }
 return {phase:'A',read_only:true,available:true,rules_version:'frontier-v6-observation-1',roster_count:count,power:warnings.length?null:total,known_power:total,complete:!warnings.length,command_load:load,rows,excluded,commanders,
 maintenance_preview:{food_day:food,essence_day:essence,gold_day:gold,provisional:true},bootstrap_preview:{days:5,food:Math.ceil(food*5),essence:Math.ceil(essence*5),credited:false},warnings,
 source:'live-roster-static-catalog',catalog_live:false,observed_at:new Date().toISOString(),features:{wars:false,treasury:false,caravans:false,movement:false,upkeep:false}};
}
const unwrap=response=>response.data?.data ?? response.data;
export async function loadObservation(){
 try{return (await api.get('/frontier-observation/state')).data;}
 catch(e){if(e.response?.status!==404)throw e;}
 // Existing authenticated APIs keep stage A useful before the new server is deployed.
 const [pr,gr]=await Promise.all([api.get('/player'),api.get('/guild')]);
 const player=unwrap(pr),guild=unwrap(gr),id=guild?.id ?? guild?.guild_id;
 if(guild?.has_guild===false||id===null||id===undefined)return {available:false,read_only:true,reason:'Для наблюдения нужна гильдия.'};
 const sr=await api.get(`/guild/${id}/settlement`);
 if(sr.data?.status===404||sr.data?.data===null)return {available:false,read_only:true,reason:'Поселение ещё не основано.'};
 const settlement=unwrap(sr),r=await fetch(`${process.env.PUBLIC_URL||''}/maps/frontier-observation-catalog.json`);
 if(!r.ok)throw new Error('Не удалось загрузить каталог армии.');
 const catalog=await r.json();return {...buildObservation(settlement,player,catalog.units),guild_name:guild.name,settlement_type:settlement.type};
}
export function findRoute(grid,from,to){
 if(!grid.adjacency?.[from]||!grid.adjacency?.[to])return null;
 const queue=[from],previous=new Map([[from,null]]);
 for(let i=0;i<queue.length;i++){
  const key=queue[i];if(key===to){const path=[];for(let k=to;k!==null;k=previous.get(k))path.unshift(k);return path;}
  for(const next of grid.adjacency[key]||[])if(!previous.has(next)){previous.set(next,key);queue.push(next);}
 }
 return null;
}
