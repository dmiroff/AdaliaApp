import { magicStudyLimit, validStudySelection } from './magicStudy';

const augs = ['sign_magic_effect', 'sign_magic_accuracy', 'sign_magic_range', 'sign_magic_augmentation'];
test.each([
  ['Человек', augs, [], 2],
  ['Драконид', [...augs, 'sign_fire'], [], 2],
  ['Драконид-Вампир', [...augs, 'sign_fire'], [], 2],
  ['Человек', [...augs, 'sign_fire', 'sign_touch'], [], 1],
  ['Человек', [...augs, 'sign_light', 'sign_touch'], [], 1],
  ['Человек', [...augs, 'sign_touch'], [], 1],
  ['Человек', augs, ['sign_fire', 'sign_dash'], 1],
])('limit for %s %j with pending %j', (Race, available_signs, pending, limit) => {
  expect(magicStudyLimit({ Race, available_signs }, pending)).toBe(limit);
});
test.each([
  [['sign_fire', 'sign_dash'], 2, true],
  [['sign_fire', 'sign_ice'], 2, false],
  [['sign_fire', 'sign_magic_augmentation'], 2, false],
  [['sign_fire'], 2, false],
  [['sign_fire', 'sign_fire'], 2, false],
  [['sign_magic_augmentation'], 1, true],
])('selection %j, limit %i', (signs, limit, valid) => {
  expect(validStudySelection(signs, limit)).toBe(valid);
});
