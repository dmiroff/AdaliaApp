export const ELEMENTS = [
 ['fire','🔥 Огонь'],['ice','❄️ Лёд'],['electric','⚡ Молния'],['wind','💨 Ветер'],
 ['stone','🪨 Камень'],['power','👑 Власть'],['sound','🎵 Звук'],['life','🌿 Жизнь'],
 ['light','☀️ Свет'],['dark','🌑 Тьма'],['death','💀 Смерть'],['other','Прочее'],
];
export const spellElement = spell => ELEMENTS.some(([key])=>key===spell?.damage_type) ? spell.damage_type : 'other';
export const elementName = key => ELEMENTS.find(([id])=>id===key)?.[1] || 'Прочее';
export const groupOrder = (order,spells) => [...order].sort((a,b)=>ELEMENTS.findIndex(([key])=>key===spellElement(spells[a]))-ELEMENTS.findIndex(([key])=>key===spellElement(spells[b])));
export function moveSpell(order,key,target) {
 const next=order.filter(value=>value!==key);next.splice(Math.max(0,Math.min(next.length,target)),0,key);return next;
}
export function spellKeyboardGroups(keyboard,book,grouped) {
 const buttons=keyboard.rows.flat();
 if(!buttons.length || !book?.length || !buttons.every(button=>button.payload?.action_selected==='Spells'))return null;
 const byKey=new Map(book.map((spell,index)=>[spell.key,{...spell,index}]));
 if(!buttons.every(button=>byKey.has(button.command)))return null;
 const ordered=[...buttons].sort((a,b)=>byKey.get(a.command).index-byKey.get(b.command).index);
 if(!grouped)return [{name:'Мой порядок',buttons:ordered}];
 return ELEMENTS.map(([key,name])=>({name,buttons:ordered.filter(button=>byKey.get(button.command).element===key)})).filter(group=>group.buttons.length);
}
