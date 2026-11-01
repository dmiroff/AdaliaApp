import data from '../../public/help-data.json';
import { buildGlossary, helpIdFromHash, searchHelp, splitHelpTerms, validateHelp } from './gameHelp';

test('the complete handbook has valid destinations, source coverage and all spell combinations', () => {
  expect(validateHelp(data)).toBe(data);
  expect(data.vkArticleCount).toBe(26);
  expect(data.topics.filter(topic => topic.sourceKey).length).toBe(data.originalTopicCount);
  expect(data.topics.filter(topic => topic.kind === 'handbook')).toHaveLength(26);
  expect(data.topics.filter(topic => topic.kind === 'spell')).toHaveLength(66);
  expect(new Set(data.topics.filter(topic => topic.kind === 'skill').map(topic => topic.title)).size).toBe(23);
  data.categories.forEach(category => expect(data.topics.some(topic => topic.id === category.root)).toBe(true));
});

test('search handles ё/е, aliases, word combinations and category filters', () => {
  expect(searchHelp(data.topics, 'ловкость')[0].title).toBe('Ловкость');
  expect(searchHelp(data.topics, 'телосложение')[0].id).toBe('выносливость');
  expect(searchHelp(data.topics, 'длань лед')[0].title).toBe('Длань Льда');
  expect(searchHelp(data.topics, 'сила', 'magic').every(topic => topic.category === 'magic')).toBe(true);
  expect(searchHelp(data.topics, 'неизвестноеслово123')).toEqual([]);
});

test('glossary matches complete Russian words, longest names and inflected attributes', () => {
  const glossary = buildGlossary(data.topics);
  const tokens = splitHelpTerms('Сила и модификатор Силы, а не усиление. Быстрые ноги.', glossary, 'бой');
  expect(tokens.filter(token => typeof token !== 'string').map(token => token.topic.id))
    .toEqual(['сила', 'сила', 'talent-быстрые-ноги']);
  expect(splitHelpTerms('Сила', glossary, 'сила')).toEqual(['Сила']);
});

test('broken links and unsupported schemas fail visibly rather than showing incomplete rules', () => {
  expect(() => validateHelp({ ...data, schemaVersion: 2 })).toThrow();
  expect(() => validateHelp({ ...data, topics: [{ ...data.topics[0], related: ['missing'] }] })).toThrow();
  expect(helpIdFromHash('#%D1%81%D0%B8%D0%BB%D0%B0')).toBe('сила');
  expect(helpIdFromHash('#%xx')).toBe('');
});

test('reviewed contextual links avoid metaphorical attributes and distinguish the berserk condition', () => {
  const topic = id => data.topics.find(item => item.id === id);
  const guide = key => data.topics.find(item => item.sourceUrl?.endsWith(`-${key}`));
  expect(splitHelpTerms('Сила и Жрец', buildGlossary(data.topics, guide('poseleniya')), 'none')).toEqual(['Сила и Жрец']);
  expect(splitHelpTerms('силу', buildGlossary(data.topics, guide('westlands')), 'none')).toEqual(['силу']);
  expect(splitHelpTerms('свою жизнь', buildGlossary(data.topics, topic('тёмный-эльф')), 'none')).toEqual(['свою жизнь']);
  const armor = splitHelpTerms('Берсерк', buildGlossary(data.topics, guide('magic-items')), 'none');
  expect(armor[0].topic.kind).toBe('condition');
  const barbarian = splitHelpTerms('Берсерк', buildGlossary(data.topics, topic('варвар')), 'none');
  expect(barbarian[0].topic.kind).toBe('talent');
  ['Молот', 'Сфера', 'Боги'].forEach(text => {
    expect(splitHelpTerms(text, buildGlossary(data.topics), 'none')[0].topic).toBeDefined();
  });
});
