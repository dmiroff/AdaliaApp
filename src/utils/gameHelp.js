export const normalizeHelp = value => String(value || '').toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();

export function validateHelp(data) {
  if (data?.schemaVersion !== 1 || !Array.isArray(data.topics) || !Array.isArray(data.categories)
      || data.topics.length === 0) throw new Error('Некорректный формат справки');
  const ids = new Set(data.topics.map(topic => topic.id));
  if (ids.size !== data.topics.length || !ids.has('справка')) throw new Error('Некорректные разделы справки');
  data.topics.forEach(topic => {
    if (typeof topic.id !== 'string' || typeof topic.title !== 'string' || typeof topic.body !== 'string'
        || !Array.isArray(topic.related) || topic.related.some(id => !ids.has(id))) {
      throw new Error('Некорректная статья справки');
    }
  });
  return data;
}

export function searchHelp(topics, query, category = 'all') {
  const words = normalizeHelp(query).split(/\s+/).filter(Boolean);
  return topics.filter(topic => (category === 'all' || topic.category === category)
    && words.every(word => normalizeHelp(`${topic.title} ${topic.body} ${(topic.aliases || []).join(' ')}`).includes(word)))
    .map((topic, index) => ({ topic, index, score: words.length
      ? (normalizeHelp(topic.title) === normalizeHelp(query) ? 4 : 0)
        + words.filter(word => normalizeHelp(topic.title).includes(word)).length : 0 }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => item.topic);
}

export function helpIdFromHash(hash) {
  try { return decodeURIComponent(hash.replace(/^#/, '')); } catch { return ''; }
}

export const helpHref = id => `/help#${encodeURIComponent(id)}`;

export function buildGlossary(topics) {
  const terms = new Map();
  const priority = { attribute: 0, guide: 1, parameter: 2, skill: 3, term: 4, talent: 5, eon: 6 };
  [...topics].sort((a, b) => (priority[a.kind] ?? 9) - (priority[b.kind] ?? 9)).forEach(topic => {
    [topic.title, ...(topic.aliases || [])].forEach(term => {
      const normalized = normalizeHelp(term);
      if (normalized.length >= 2 && !terms.has(normalized)) terms.set(normalized, topic);
    });
  });
  const escaped = [...terms.keys()].sort((a, b) => b.length - a.length)
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/е/g, '[её]'));
  return { terms, pattern: escaped.length ? new RegExp(`(${escaped.join('|')})`, 'giu') : null };
}

export function splitHelpTerms(text, glossary, currentId) {
  if (!glossary.pattern) return [text];
  // A fresh regex makes repeated paragraphs independent; Unicode boundaries
  // prevent highlighting «Сила» inside «усилами» or «маг» inside «бумага».
  const regex = new RegExp(glossary.pattern.source, 'giu');
  const parts = [];
  let cursor = 0;
  for (const match of text.matchAll(regex)) {
    const before = text[match.index - 1] || '';
    const after = text[match.index + match[0].length] || '';
    const topic = glossary.terms.get(normalizeHelp(match[0]));
    if (/[\p{L}\p{N}_]/u.test(before) || /[\p{L}\p{N}_]/u.test(after) || topic?.id === currentId) continue;
    if (cursor < match.index) parts.push(text.slice(cursor, match.index));
    parts.push({ text: match[0], topic });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}
