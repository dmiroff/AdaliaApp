import {canAddTalent, countedTalents, isT3BuilderEnabled, itemFitsSlot} from './t3Builder';

test('manual builder is available on the mirror and local previews', () => {
  expect(isT3BuilderEnabled('test.adaliagame.ru')).toBe(true);
  expect(isT3BuilderEnabled('adaliagame.ru')).toBe(false);
});
test('a saved talent can be removed and reselected before saving', () => {
  const row = {max_count: 1, can_add: false};
  expect(canAddTalent(row, 0, 1)).toBe(true);
  expect(canAddTalent(row, 1, 1)).toBe(false);
  expect(canAddTalent(row, 0, 0)).toBe(false);
  expect(countedTalents(['A','A','B'])).toEqual({A:2,B:1});
});
test('two-handed weapons cannot be offered for the off hand', () => {
  expect(itemFitsSlot({type:'right_hand',twohanded:true},'left_hand')).toBe(false);
  expect(itemFitsSlot({type:'right_hand',twohanded:false},'left_hand')).toBe(true);
  expect(itemFitsSlot({type:'right_hand',twohanded:true},'secondary_weapon')).toBe(true);
  expect(itemFitsSlot({type:'ring'},'ring_5')).toBe(true);
});
