import React from 'react';

export default function GameDraftKeyboard({keyboard,onCommand,disabled=false,revision,sourceId}) {
  return <div className="game-draft-keyboard" aria-label={keyboard.inline ? 'Кнопки сообщения' : 'Доступные действия'}>
    {keyboard.rows.map((row,index) => <div className="game-draft-keyboard__row" key={index}>
      {row.map(button => button.kind === 'link' && button.href
        ? <a key={button.id} href={button.href} className="game-draft-action game-draft-action--link" target="_blank" rel="noopener noreferrer">{button.label} ↗</a>
        : <button key={button.id} type="button" className={`game-draft-action ${button.color === 'positive' ? 'game-draft-action--primary' : ''}`}
            disabled={disabled || button.kind !== 'command' || !button.command}
            onClick={() => onCommand(button.command,revision,button.label,button.payload,sourceId)}>{button.label}</button>)}
    </div>)}
  </div>;
}
