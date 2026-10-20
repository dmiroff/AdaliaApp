import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';

const source = fs.readFileSync(path.join(__dirname, 'DonationTab.js'), 'utf8');
const tree = parse(source, { sourceType: 'module', plugins: ['jsx'] });
let catalogue;
function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'VariableDeclarator' && node.id?.name === 'donationProducts') catalogue = node.init;
  Object.values(node).forEach(value => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') walk(value);
  });
}
walk(tree);
const rhythm = catalogue.elements.filter(node => node.type === 'ObjectExpression' && node.properties.some(property => property.key?.name === 'id' && property.value?.value === 27));
const products = playerData => rhythm.map(node => Function('playerData', `return (${source.slice(node.start, node.end)})`)(playerData));

test('combat rhythm is a permanent 300 daleon shop upgrade with command instructions', () => {
  const matches = products({ upgrades: [] }).filter(product => product.id === 27);
  expect(matches).toHaveLength(1);
  expect(matches[0]).toMatchObject({ name: '⚔️ Боевой ритм', price: 300, currency: '💎', type: 'permanent', category: 'premium', purchased: false });
  expect(matches[0].features.join(' ')).toContain('Н 3');
  expect(matches[0].features.join(' ')).toContain('Н 1');
  expect(matches[0].features.join(' ')).toContain('Без дополнительного усиления урона');
});

test('an owned combat rhythm is marked purchased, while other upgrades do not unlock it', () => {
  expect(products({ upgrades: ['Боевой ритм'] }).find(product => product.id === 27).purchased).toBe(true);
  expect(products({ upgrades: ['Торговец'] }).find(product => product.id === 27).purchased).toBe(false);
});
