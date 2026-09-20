import { LEARNING_WORDS } from './data.js';

const STORAGE = {
  mastery: 'qf_mastery_v1',
  settings: 'qf_settings_v1',
  activity: 'qf_activity_v1',
  listen: 'qf_listen_v1',
  cachePrefix: 'qf_cache_'
};

const DEFAULT_SETTINGS = {
  translation: 'ur.jalandhry',
  reciter: 'ar.alafasy',
  arabicSize: 1,
  showTranslation: true,
  showWordOverlay: true,
  cacheDays: 7
};

export function normalizeArabic(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[ٱأإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[ـ۝۞﴾﴿0-9٠-٩]/g, '')
    .replace(/[^\u0621-\u064A]/g, '')
    .trim();
}

export function tokenizeArabic(text = '') {
  return String(text)
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean)
    .map(token => ({ raw: token, normalized: normalizeArabic(token) }));
}

const aliasIndex = (() => {
  const map = new Map();
  LEARNING_WORDS.forEach(item => {
    const aliases = new Set([item.key, item.display, ...(item.aliases || [])]);
    aliases.forEach(alias => map.set(normalizeArabic(alias), item));
  });
  return map;
})();

export function findLearningWord(raw) {
  const n = normalizeArabic(raw);
  if (!n) return null;
  if (aliasIndex.has(n)) return aliasIndex.get(n);
  // Conservative clitic fallback: remove a single leading conjunction/preposition only.
  for (const prefix of ['و','ف','ب','ل','ك']) {
    if (n.startsWith(prefix) && aliasIndex.has(n.slice(1))) return aliasIndex.get(n.slice(1));
  }
  return null;
}

export function safeJsonParse(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...safeJsonParse(localStorage.getItem(STORAGE.settings), {}) };
}

export function saveSettings(patch) {
  const next = { ...getSettings(), ...patch };
  localStorage.setItem(STORAGE.settings, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('qf:settings', { detail: next }));
  return next;
}

export function getMasteryMap() {
  return safeJsonParse(localStorage.getItem(STORAGE.mastery), {});
}

export function getMastery(key) {
  return getMasteryMap()[key] || null;
}

export function setMastery(key, record) {
  const all = getMasteryMap();
  all[key] = { ...all[key], ...record, key, updatedAt: Date.now() };
  localStorage.setItem(STORAGE.mastery, JSON.stringify(all));
  recordActivity('review');
  window.dispatchEvent(new CustomEvent('qf:mastery', { detail: all[key] }));
  return all[key];
}

function nextIntervalDays(rating, old) {
  const previous = Math.max(0, Number(old?.intervalDays || 0));
  if (rating === 'again') return 0;
  if (rating === 'hard') return previous < 1 ? 1 : Math.max(1, Math.round(previous * 1.35));
  if (rating === 'good') return previous < 1 ? 2 : Math.max(2, Math.round(previous * 2.15));
  if (rating === 'easy') return previous < 1 ? 4 : Math.max(4, Math.round(previous * 3.2));
  return 1;
}

export function rateWord(key, rating) {
  const old = getMastery(key) || { reviews: 0, lapses: 0, strength: 0, intervalDays: 0 };
  const days = nextIntervalDays(rating, old);
  const strengthDelta = { again: -18, hard: 4, good: 12, easy: 20 }[rating] ?? 0;
  const strength = Math.max(0, Math.min(100, Number(old.strength || 0) + strengthDelta));
  const dueAt = Date.now() + (rating === 'again' ? 10 * 60 * 1000 : days * 86400000);
  return setMastery(key, {
    reviews: Number(old.reviews || 0) + 1,
    lapses: Number(old.lapses || 0) + (rating === 'again' ? 1 : 0),
    strength,
    intervalDays: days,
    dueAt,
    lastRating: rating,
    lastReviewedAt: Date.now(),
    stage: strength >= 85 ? 'mastered' : strength >= 60 ? 'audio-ready' : strength >= 35 ? 'recognized' : 'learning'
  });
}

export function markKnown(key) {
  const old = getMastery(key) || {};
  return setMastery(key, { strength: Math.max(70, old.strength || 0), dueAt: Date.now() + 4 * 86400000, stage:'recognized', reviews:(old.reviews || 0) + 1 });
}

export function reviewLater(key) {
  const old = getMastery(key) || {};
  return setMastery(key, { strength: Math.max(5, old.strength || 0), dueAt: Date.now(), stage:'learning' });
}

export function dueWords(limit = 12) {
  const now = Date.now();
  const mastery = getMasteryMap();
  const scored = LEARNING_WORDS.map((word, index) => {
    const m = mastery[word.key];
    const isDue = !m || !m.dueAt || m.dueAt <= now;
    const priority = !m ? 1000 - index : (100 - (m.strength || 0)) + (isDue ? 500 : 0);
    return { word, mastery:m, isDue, priority };
  });
  return scored.filter(x => x.isDue).sort((a,b) => b.priority-a.priority).slice(0, limit).map(x => x.word);
}

export function masteryStats() {
  const map = getMasteryMap();
  const records = Object.values(map);
  const mastered = records.filter(r => (r.strength || 0) >= 85).length;
  const recognized = records.filter(r => (r.strength || 0) >= 60).length;
  const reviewed = records.filter(r => (r.reviews || 0) > 0).length;
  const total = LEARNING_WORDS.length;
  const weighted = records.reduce((sum, r) => sum + Math.min(100, r.strength || 0), 0);
  const estimate = total ? Math.round(weighted / (total * 100) * 100) : 0;
  return { mastered, recognized, reviewed, total, estimate, due: dueWords(999).length };
}

export function recordActivity(type = 'open') {
  const all = safeJsonParse(localStorage.getItem(STORAGE.activity), []);
  const day = new Date().toISOString().slice(0,10);
  const existing = all.find(x => x.day === day);
  if (existing) existing.count = (existing.count || 0) + 1;
  else all.push({ day, count:1, type });
  const trimmed = all.slice(-90);
  localStorage.setItem(STORAGE.activity, JSON.stringify(trimmed));
}

export function currentStreak() {
  const days = new Set(safeJsonParse(localStorage.getItem(STORAGE.activity), []).map(x => x.day));
  let streak = 0;
  const cursor = new Date();
  for (let i=0;i<365;i++) {
    const key = cursor.toISOString().slice(0,10);
    if (days.has(key)) streak++;
    else if (i === 0) { cursor.setDate(cursor.getDate()-1); continue; }
    else break;
    cursor.setDate(cursor.getDate()-1);
  }
  return streak;
}

export function getListenStats() {
  return { correct:0, total:0, ...safeJsonParse(localStorage.getItem(STORAGE.listen), {}) };
}

export function recordListen(correct) {
  const old = getListenStats();
  const next = { correct: old.correct + (correct ? 1 : 0), total: old.total + 1 };
  localStorage.setItem(STORAGE.listen, JSON.stringify(next));
  recordActivity('listen');
  return next;
}

export function listenPercent() {
  const s = getListenStats();
  return s.total ? Math.round(s.correct / s.total * 100) : 0;
}

export function cacheSet(key, data) {
  try { localStorage.setItem(STORAGE.cachePrefix + key, JSON.stringify({ at:Date.now(), data })); } catch {}
}

export function cacheGet(key, maxAgeMs = 7*86400000) {
  const payload = safeJsonParse(localStorage.getItem(STORAGE.cachePrefix + key), null);
  if (!payload) return null;
  if (Date.now() - payload.at > maxAgeMs) return null;
  return payload.data;
}

export function clearDataCache() {
  Object.keys(localStorage).filter(k => k.startsWith(STORAGE.cachePrefix)).forEach(k => localStorage.removeItem(k));
}

export function exportProgress() {
  return {
    format: 'quran-feham-progress',
    version: 1,
    exportedAt: new Date().toISOString(),
    mastery: getMasteryMap(),
    settings: getSettings(),
    activity: safeJsonParse(localStorage.getItem(STORAGE.activity), []),
    listen: getListenStats()
  };
}

export function importProgress(payload) {
  if (!payload || payload.format !== 'quran-feham-progress' || payload.version !== 1) throw new Error('Unsupported Quran Feham progress file.');
  localStorage.setItem(STORAGE.mastery, JSON.stringify(payload.mastery || {}));
  localStorage.setItem(STORAGE.settings, JSON.stringify({ ...DEFAULT_SETTINGS, ...(payload.settings || {}) }));
  localStorage.setItem(STORAGE.activity, JSON.stringify(payload.activity || []));
  localStorage.setItem(STORAGE.listen, JSON.stringify(payload.listen || {correct:0,total:0}));
  window.dispatchEvent(new Event('qf:data-imported'));
}

export function resetProgress() {
  [STORAGE.mastery, STORAGE.activity, STORAGE.listen].forEach(k => localStorage.removeItem(k));
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
