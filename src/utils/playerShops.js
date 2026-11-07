export const isPlayerShopsEnabled = (host = window.location.hostname) => ['adaliagame.ru','www.adaliagame.ru','test.adaliagame.ru','localhost','127.0.0.1'].includes(host);
export const isPlayerShopMirror = (host = window.location.hostname) => ['test.adaliagame.ru','localhost','127.0.0.1'].includes(host);
