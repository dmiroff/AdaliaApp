// Older bot workers can stamp a combat reply with their startup time. Use the
// preceding input as its lower bound; keep genuine future delivery times.
export function normalizeGameHistory(snapshot) {
  let lastInputTime=0;
  const legacySources=[];
  const messages=[...snapshot.messages].sort((a,b)=>Number(a.id)-Number(b.id)).map(message=>{
    if(message.role==='user')lastInputTime=Math.max(lastInputTime,message.time);
    if(message.role==='bot'&&message.time<lastInputTime){
      legacySources.push(message.id);
      return {...message,time:lastInputTime};
    }
    return message;
  }).sort((a,b)=>a.time-b.time||Number(a.id)-Number(b.id));
  const lastBot=[...messages].reverse().find(message=>message.role==='bot');
  const lastKeyboard=[...messages].reverse().find(message=>message.role==='bot'&&message.keyboard&&!message.keyboard.inline);
  return {...snapshot,messages,legacySources,
    displayRevision:lastBot?.id||snapshot.revision,
    displayKeyboard:lastKeyboard?.keyboard||snapshot.keyboard,
    displayKeyboardSource:lastKeyboard?.id||snapshot.keyboard_source};
}
