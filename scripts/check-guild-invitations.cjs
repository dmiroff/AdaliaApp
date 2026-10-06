const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const source = fs.readFileSync('src/http/guildService.js', 'utf8');
const start = source.indexOf('export const InviteToGuild =');
const env = {console: {error() {}}, apiClient: {post: async (url, body) => {
  assert.equal(url, '/guild/invite');
  assert.deepEqual(JSON.parse(JSON.stringify(body)), {player_name: '112'});
  return {status: 200, data: {status: 200, message: 'Приглашение отправлено', data: {}}};
}}};
vm.createContext(env);
vm.runInContext(source.slice(start).replace('export const InviteToGuild =', 'globalThis.InviteToGuild ='), env);
(async () => {
  assert.equal((await env.InviteToGuild(' 112 ')).status, 200);
  env.apiClient.post = async () => {throw {response: {status: 400, data: {detail: 'Игрок уже состоит в гильдии'}}};};
  assert.equal((await env.InviteToGuild('112')).message, 'Игрок уже состоит в гильдии');
  console.log('Guild invitation request and error checks passed');
})().catch(error => {console.error(error); process.exitCode = 1;});
