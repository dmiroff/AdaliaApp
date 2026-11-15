import React,{useState} from 'react';
import {spellKeyboardGroups} from '../utils/spellBook';

export default function GameDraftKeyboard({keyboard,onCommand,disabled=false,revision,sourceId,compactCosts=false,spellbook}) {
  const storageKey='spellbook-grouped:'+ (localStorage.getItem('id')||'session');
  const [grouped,setGrouped]=useState(()=>{try{return localStorage.getItem(storageKey)!=='false';}catch{return true;}});
  const groups=spellKeyboardGroups(keyboard,spellbook,grouped);
  const renderRows=rows=>rows.map((row,index) => <div className="game-draft-keyboard__row" key={index}>
      {row.map(button => {
        const cost = compactCosts ? button.label.match(/^(.*?)\s+(\d+)\/(\d+)(?:\+\d+)?$/) : null;
        const shortage = cost ? Math.max(0, Number(cost[2]) - Number(cost[3])) : 0;
        if (button.kind === 'link' && button.href) return <a key={button.id} href={button.href}
          className="game-draft-action game-draft-action--link" target="_blank" rel="noopener noreferrer">{button.label} ↗</a>;
        return <button key={button.id} type="button"
          className={`game-draft-action ${button.color === 'positive' ? 'game-draft-action--primary' : ''}`}
          disabled={disabled || shortage > 0 || button.kind !== 'command' || !button.command}
          onClick={() => onCommand(button.command,revision,button.label,button.payload,sourceId)}>
          {cost ? <>{cost[1]} · {cost[2]} ОД{shortage > 0 && <small>Не хватает {shortage} ОД</small>}</> : button.label}
        </button>;
      })}
    </div>);
  const chunk=buttons=>Array.from({length:Math.ceil(buttons.length/2)},(_,i)=>buttons.slice(i*2,i*2+2));
  return <div className="game-draft-keyboard" aria-label={keyboard.inline ? 'Кнопки сообщения' : 'Доступные действия'}>
    {groups&&<label className="game-spell-grouping"><input type="checkbox" checked={grouped} onChange={e=>{setGrouped(e.target.checked);try{localStorage.setItem(storageKey,String(e.target.checked));}catch{}}}/> Группировать заклинания по стихиям</label>}
    {groups&&<a href="/character#magic" className="game-history-toggle">Настроить порядок заклинаний</a>}
    {groups?groups.map(group=><section className="game-spell-group" key={group.name} aria-label={group.name}><h4>{group.name}</h4>{renderRows(chunk(group.buttons))}</section>):renderRows(keyboard.rows)}
  </div>;
}
