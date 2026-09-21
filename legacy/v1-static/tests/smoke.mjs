const memory = new Map();
globalThis.localStorage = {
  getItem: k => memory.has(k) ? memory.get(k) : null,
  setItem: (k,v) => memory.set(k,String(v)),
  removeItem: k => memory.delete(k),
  key: i => [...memory.keys()][i] ?? null,
  get length(){ return memory.size; }
};
globalThis.window = { dispatchEvent(){} };
globalThis.CustomEvent = class CustomEvent { constructor(type, init){ this.type=type; this.detail=init?.detail; } };

const core = await import('../src/core.js');
const data = await import('../src/data.js');

function assert(condition, message){ if(!condition) throw new Error(message); }

assert(core.normalizeArabic('الرَّحْمَٰنِ') === 'الرحمن', 'Arabic normalization failed');
assert(core.findLearningWord('رَبِّ')?.key === 'رب', 'Fatihah learner lookup failed');
assert(core.findLearningWord('وَلَا')?.key === 'ولا', 'Particle lookup failed');
assert(core.findLearningWord('ٱلْعَٰلَمِينَ')?.key === 'العالمين', 'Uthmani Al-Alameen lookup failed');
assert(core.findLearningWord('ٱلصِّرَٰطَ')?.key === 'الصراط', 'Uthmani Al-Sirat lookup failed');
assert(data.SOURCE_REGISTRY.some(s => s.id === 'tanzil'), 'Source registry missing Tanzil');
assert(data.LEARNING_WORDS.length >= 40, 'Learning pack unexpectedly small');

const before = core.getMastery('رب');
assert(before === null, 'Mastery should start empty');
core.rateWord('رب','good');
const after = core.getMastery('رب');
assert(after.reviews === 1 && after.strength === 12, 'SRS good rating failed');
core.markKnown('رب');
assert(core.getMastery('رب').strength >= 70, 'Mark-known failed');

const payload = core.exportProgress();
assert(payload.format === 'quran-feham-progress', 'Export format failed');
console.log(`Quran Feham smoke tests passed: ${data.LEARNING_WORDS.length} learner entries, ${data.SOURCE_REGISTRY.length} source records.`);
