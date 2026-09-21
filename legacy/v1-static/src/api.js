import { cacheGet, cacheSet, getSettings } from './core.js';

const BASE = 'https://api.alquran.cloud/v1';

async function fetchJson(url, { timeout = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal:controller.signal, headers:{ Accept:'application/json' } });
    if (!res.ok) throw new Error(`Quran data request failed (${res.status}).`);
    const json = await res.json();
    if (json?.code && Number(json.code) >= 400) throw new Error(json.status || 'Quran data provider error.');
    return json;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Quran data request timed out. Check your connection.');
    throw error;
  } finally { clearTimeout(timer); }
}

async function cached(key, url, maxAgeDays = 7) {
  const hit = cacheGet(key, maxAgeDays * 86400000);
  if (hit) return hit;
  const json = await fetchJson(url);
  cacheSet(key, json);
  return json;
}

export async function getSurahList() {
  const json = await cached('surah-list-v1', `${BASE}/surah`, 30);
  return json.data || [];
}

export async function getSurah(number, options = {}) {
  const settings = { ...getSettings(), ...options };
  const n = Math.min(114, Math.max(1, Number(number || 1)));
  const translation = settings.translation || 'ur.jalandhry';
  const reciter = settings.reciter || 'ar.alafasy';
  const urls = [
    cached(`surah-${n}-quran-uthmani`, `${BASE}/surah/${n}/quran-uthmani`, 30),
    cached(`surah-${n}-${translation}`, `${BASE}/surah/${n}/${translation}`, 7),
    cached(`surah-${n}-${reciter}`, `${BASE}/surah/${n}/${reciter}`, 7)
  ];
  const [arabicResult, translationResult, audioResult] = await Promise.allSettled(urls);
  if (arabicResult.status !== 'fulfilled') throw arabicResult.reason;

  const arabic = arabicResult.value.data;
  const trans = translationResult.status === 'fulfilled' ? translationResult.value.data : null;
  const audio = audioResult.status === 'fulfilled' ? audioResult.value.data : null;
  const transBy = new Map((trans?.ayahs || []).map(a => [a.numberInSurah, a]));
  const audioBy = new Map((audio?.ayahs || []).map(a => [a.numberInSurah, a]));

  return {
    number:n,
    name:arabic.name,
    englishName:arabic.englishName,
    englishNameTranslation:arabic.englishNameTranslation,
    revelationType:arabic.revelationType,
    numberOfAyahs:arabic.numberOfAyahs,
    translationEdition: trans?.edition || null,
    audioEdition: audio?.edition || null,
    warnings:[
      ...(trans ? [] : ['Urdu translation could not be loaded.']),
      ...(audio ? [] : ['Recitation audio could not be loaded.'])
    ],
    ayahs:(arabic.ayahs || []).map(a => ({
      number:a.number,
      numberInSurah:a.numberInSurah,
      text:a.text,
      juz:a.juz,
      page:a.page,
      manzil:a.manzil,
      ruku:a.ruku,
      sajda:a.sajda,
      translation:transBy.get(a.numberInSurah)?.text || '',
      audio:audioBy.get(a.numberInSurah)?.audio || '',
      audioSecondary:audioBy.get(a.numberInSurah)?.audioSecondary || []
    }))
  };
}

export async function getAyah(surah, ayah, edition = 'quran-uthmani') {
  const key = `ayah-${surah}-${ayah}-${edition}`;
  const json = await cached(key, `${BASE}/ayah/${Number(surah)}:${Number(ayah)}/${edition}`, 7);
  return json.data;
}

export async function getVerseBundle(surah, ayah, options = {}) {
  const settings = { ...getSettings(), ...options };
  const [arabic, translation, audio] = await Promise.allSettled([
    getAyah(surah, ayah, 'quran-uthmani'),
    getAyah(surah, ayah, settings.translation),
    getAyah(surah, ayah, settings.reciter)
  ]);
  if (arabic.status !== 'fulfilled') throw arabic.reason;
  return {
    surah:Number(surah), ayah:Number(ayah),
    text:arabic.value.text,
    translation:translation.status === 'fulfilled' ? translation.value.text : '',
    audio:audio.status === 'fulfilled' ? audio.value.audio : '',
    arabicEdition:arabic.value.edition,
    translationEdition:translation.status === 'fulfilled' ? translation.value.edition : null,
    audioEdition:audio.status === 'fulfilled' ? audio.value.edition : null
  };
}

export async function searchQuran(query, edition) {
  const q = String(query || '').trim();
  if (!q) return { matches:[], count:0 };
  const ed = edition || getSettings().translation || 'ur.jalandhry';
  const url = `${BASE}/search/${encodeURIComponent(q)}/all/${encodeURIComponent(ed)}`;
  const json = await fetchJson(url);
  return { matches: json.data?.matches || [], count:json.data?.count || 0 };
}

export async function providerHealth() {
  try {
    await fetchJson(`${BASE}/ayah/1:1/quran-uthmani`, { timeout:7000 });
    return { ok:true, provider:'Al Quran Cloud' };
  } catch (error) { return { ok:false, provider:'Al Quran Cloud', error:error.message }; }
}
