export const isPlayerEventsEnabled = (hostname = window.location.hostname) =>
  ['test.adaliagame.ru', 'localhost', '127.0.0.1'].includes(hostname);
