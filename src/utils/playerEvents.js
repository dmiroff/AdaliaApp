export const isPlayerEventsEnabled = (hostname = window.location.hostname) =>
  ['adaliagame.ru', 'www.adaliagame.ru', 'test.adaliagame.ru', 'localhost', '127.0.0.1'].includes(hostname);
