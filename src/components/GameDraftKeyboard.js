import React from 'react';

export default function GameDraftKeyboard({keyboard,onCommand,disabled=false,revision,sourceId,compactCosts=false}) {
  return <div className="game-draft-keyboard" aria-label={keyboard.inline ? 'Кнопки сообщения' : 'Доступные действия'}>
    {keyboard.rows.map((row,index) => <div className="game-draft-keyboard__row" key={index}>
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
    </div>)}
  </div>;
}
