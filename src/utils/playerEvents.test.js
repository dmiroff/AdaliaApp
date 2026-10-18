import {isPlayerEventsEnabled} from './playerEvents';
test('player events are enabled on both game domains and local development', () => {
    for (const host of ['adaliagame.ru','www.adaliagame.ru','test.adaliagame.ru','localhost','127.0.0.1']) expect(isPlayerEventsEnabled(host)).toBe(true);
    for (const host of ['example.com','test.adaliagame.ru.example.com']) expect(isPlayerEventsEnabled(host)).toBe(false);
});
