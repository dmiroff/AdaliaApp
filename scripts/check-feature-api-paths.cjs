const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const axios = require('axios');
const constants = fs.readFileSync('src/utils/constants.js', 'utf8');
const declaration = constants.split('\n').find(line => line.startsWith('export const SERVER_APP_API_URL'));
const baseURL = vm.runInNewContext(declaration.replace('export ', '') + '; SERVER_APP_API_URL', {
  window: { location: { origin: 'https://test.adaliagame.ru' } }
});
const client = axios.create({ baseURL });
let checked = 0;
for (const file of ['AutoBuyTab.js', 'HeadContractPanel.js', 'CraftingTab.js']) {
  const source = fs.readFileSync(`src/components/${file}`, 'utf8');
  for (const match of source.matchAll(/apiClient\.(get|post|put|delete)\((['"`])([^'"`]+)\2/g)) {
    const endpoint = match[3].replace(/\$\{[^}]+\}/g, '112');
    const path = new URL(client.getUri({ url: endpoint })).pathname;
    assert.ok(path.startsWith('/api/'), `${file}: API base path missing: ${path}`);
    assert.ok(!path.startsWith('/api/api/'), `${file}: duplicate API prefix: ${path}`);
    checked++;
  }
}
assert.ok(checked >= 8, 'Feature requests must actually be checked');
console.log(`API path checks passed: ${checked} requests`);
