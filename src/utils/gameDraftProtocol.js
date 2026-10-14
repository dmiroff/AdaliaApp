export const GAME_DRAFT_ROUTE = '/play-draft';

export const isGameDraftEnabled = (hostname = window.location.hostname) =>
  ['test.adaliagame.ru', 'localhost', '127.0.0.1'].includes(hostname);

export const safeLink = value => {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, window.location.origin);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
};

const parse = value => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
};

// Preserve callback payloads: the visible label is not always the command.
export const normalizeKeyboard = source => {
  const keyboard = parse(source);
  if (!keyboard || typeof keyboard !== 'object') return {inline:false, rows:[]};
  const rows = keyboard.buttons || keyboard.keyboard || keyboard.inline_keyboard;
  if (!Array.isArray(rows)) return {inline:false, rows:[]};
  return {
    inline: Boolean(keyboard.inline || keyboard.inline_keyboard),
    rows: rows.slice(0, 10).map((row, ri) => (Array.isArray(row) ? row : [row]).slice(0, 5).map((button, bi) => {
      const action = button?.action || button || {};
      const label = String(action.label ?? action.text ?? '').slice(0, 200);
      const payload = parse(action.payload ?? action.callback_data);
      const href = safeLink(action.link ?? action.url);
      const link = ['open_link', 'link', 'url'].includes(action.type) || Boolean(action.url);
      const unsupported = ['location', 'request_geo_location', 'request_contact', 'open_app', 'vkpay'].includes(action.type);
      const command = typeof payload === 'object' && payload !== null
        ? typeof payload.command === 'string' ? label + payload.command : payload.full_command || label
        : typeof payload === 'string' ? payload : label;
      return {id:`${ri}-${bi}`,label,kind:link ? 'link' : unsupported ? 'unsupported' : 'command',
        href,command:command ? String(command) : null,payload,color:button?.color};
    }).filter(button => button.label)).filter(row => row.length),
  };
};
