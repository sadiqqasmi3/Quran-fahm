import {
  APP_VERSION, TRANSLATIONS, RECITERS, SALAH_SURAHS, SOURCE_REGISTRY,
  LEARNING_WORDS, LEARNING_PHRASES, ROOT_NOTES, TUTOR_PRESETS
} from './data.js';
import {
  normalizeArabic, tokenizeArabic, findLearningWord, getSettings, saveSettings,
  getMastery, getMasteryMap, rateWord, markKnown, reviewLater, dueWords,
  masteryStats, currentStreak, recordActivity, listenPercent, recordListen,
  getListenStats, exportProgress, importProgress, resetProgress, downloadJson,
  clearDataCache
} from './core.js';
import { getSurahList, getSurah, getVerseBundle, searchQuran, providerHealth } from './api.js';

const app = document.querySelector('#app');
const state = {
  route: '/learn',
  surahs: null,
  currentSurah: 1,
  surahData: null,
  quranLoading: false,
  quranError: '',
  wordSheet: null,
  lesson: null,
  listen: { surah: 1, data:null, question:null, loading:false, error:'', revealedArabic:false, revealedUrdu:false, answered:false },
  exploreTab: 'words',
  exploreQuery: '',
  searchResults: null,
  searchLoading: false,
  tutor: { bundle:null, loading:false, error:'', surah:1, ayah:1, messages:[] },
  health: null,
  toastTimer: null
};

recordActivity('open');

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function attr(value = '') { return esc(value).replace(/`/g,'&#96;'); }
function clamp(n,min,max){ return Math.min(max,Math.max(min,Number(n))); }
function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function route(){ return (location.hash.replace(/^#/,'').split('?')[0] || '/learn').replace(/\/$/,'') || '/learn'; }
function go(path){ location.hash = path; }
function setting(){ return getSettings(); }
function translationName(){ return TRANSLATIONS.find(x=>x.id===setting().translation)?.short || setting().translation; }
function reciterName(){ return RECITERS.find(x=>x.id===setting().reciter)?.name || setting().reciter; }

const ICONS = {
  learn:'<path d="M5 4h10a4 4 0 0 1 4 4v11H8a3 3 0 0 0-3 3V4Z"/><path d="M5 17h11"/>',
  quran:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z"/>',
  listen:'<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
  explore:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  ask:'<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/><path d="M8 9h8M8 13h5"/>',
  salah:'<path d="M12 3v3M8 6h8M7 21V10h10v11M4 21h16"/><path d="M9 10a3 3 0 0 1 6 0"/>',
  source:'<path d="M12 2v20M5 7h14M5 17h14"/><path d="M5 7v10M19 7v10"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2v-4h.1A1.7 1.7 0 0 0 3.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2h4v.1A1.7 1.7 0 0 0 15 3.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 8a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4h-.1a1.7 1.7 0 0 0-1.7 1.6Z"/>',
  play:'<path d="m8 5 11 7-11 7V5Z"/>',
  close:'<path d="M18 6 6 18M6 6l12 12"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  download:'<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14"/>',
  upload:'<path d="M12 16V4m0 0 4 4m-4-4-4 4M5 20h14"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'
};
function icon(name, cls='nav-icon'){ return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||''}</svg>`; }

const mainNav = [
  ['/learn','learn','Learn'], ['/quran','quran','Quran'], ['/listen','listen','Listen'], ['/explore','explore','Explore'], ['/ask','ask','Ask']
];

function navItem([href,ic,label], mobile=false){
  const active = state.route===href || (href==='/learn' && state.route==='/');
  return `<a href="#${href}" class="${active?'active':''}">${icon(ic)}<span>${label}</span></a>`;
}
function shell(content, title='Quran Feham'){
  return `<div class="shell">
    <aside class="sidebar">
      <a class="brand" href="#/learn"><div class="brand-mark">QF</div><div><strong>Quran Feham</strong><span dir="rtl">قرآن فہم</span></div></a>
      <nav class="nav">${mainNav.map(x=>navItem(x)).join('')}</nav>
      <div class="sidebar-foot">
        <a href="#/salah">Salah comprehension</a>
        <a href="#/sources">Sources & governance</a>
        <a href="#/settings">Settings</a>
        <span class="small faint" style="padding:7px 10px">v${APP_VERSION}</span>
      </div>
    </aside>
    <main class="main">
      <header class="topbar"><div class="topbar-title">${esc(title)}</div><div class="topbar-actions"><span class="pill">${esc(translationName())}</span><a class="btn icon ghost" href="#/settings" aria-label="Settings">${icon('settings','nav-icon')}</a></div></header>
      <div class="mobile-brand"><a class="brand" href="#/learn"><div class="brand-mark">QF</div><div><strong>Quran Feham</strong><span dir="rtl">قرآن فہم</span></div></a><a class="btn icon ghost" href="#/settings">${icon('settings')}</a></div>
      ${content}
    </main>
    <nav class="bottom-nav">${mainNav.map(x=>navItem(x,true)).join('')}</nav>
  </div>${renderWordSheet()}`;
}

function pageHead(eyebrow,title,lede,actions=''){
  return `<div class="page-head"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${title}</h1><p class="lede">${lede}</p></div>${actions}</div>`;
}
function progress(value){ return `<div class="progress"><span style="width:${clamp(value,0,100)}%"></span></div>`; }
function badge(text,type=''){ return `<span class="pill ${type}">${esc(text)}</span>`; }
function loadingCards(){ return `<div class="loading">${[1,2,3].map(()=>`<div class="card"><div class="skeleton" style="width:32%;margin-bottom:18px"></div><div class="skeleton" style="height:42px;margin-bottom:14px"></div><div class="skeleton" style="width:70%"></div></div>`).join('')}</div>`; }

function renderLearn(){
  if (state.lesson) return shell(renderLesson(), 'Daily lesson');
  const s = masteryStats();
  const streak = currentStreak();
  const lp = listenPercent();
  const due = dueWords(5);
  const content = `<section class="page">
    ${pageHead('Personal learning','Understand what you recite.','Urdu is the bridge. The goal is direct recognition when Quranic Arabic is recited, without translating every word in your head.',`<button class="btn primary" data-action="start-lesson">Start today’s lesson</button>`)}
    <div class="grid two">
      <div class="card hero-progress accent">
        <div class="row between"><span class="pill ok">Learning estimate</span><span class="small muted">Reviewed lexicon</span></div>
        <div class="percent">${s.estimate}%</div><div class="caption">Mastery across the current reviewed learning pack. This is not a claim about total Quran comprehension.</div>${progress(s.estimate)}
      </div>
      <div class="grid two">
        <div class="card metric"><div class="label">Words mastered</div><div class="value">${s.mastered}</div><div class="delta">${s.recognized} audio-ready/recognized</div></div>
        <div class="card metric"><div class="label">Due today</div><div class="value">${s.due}</div><div class="delta">Adaptive review queue</div></div>
        <div class="card metric"><div class="label">Listening</div><div class="value">${lp}%</div><div class="delta">${getListenStats().total} answered</div></div>
        <div class="card metric"><div class="label">Streak</div><div class="value">${streak}</div><div class="delta">active learning days</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-head"><div><div class="eyebrow">Continue</div><h2>Surah Al-Fatihah</h2></div><button class="btn" data-action="open-surah" data-surah="1">Open in Quran</button></div>
      <div class="card clickable" data-action="start-lesson">
        <div class="row between"><div><h3>10-minute comprehension session</h3><p class="muted small">Review meaning → recognize the Arabic → rate recall → apply it in a phrase.</p></div><span class="pill ok">${due.length} ready now</span></div>
        <div class="row wrap" style="margin-top:14px">${due.map(w=>`<span class="pill arabic" style="font-size:15px">${esc(w.display)}</span>`).join('') || '<span class="muted small">Your near-term reviews are complete. We will introduce new words.</span>'}</div>
      </div>
    </div>

    <div class="section"><div class="section-head"><h2>Quick practice</h2></div>
      <div class="practice-grid">
        <a href="#/listen" class="card practice clickable"><div class="symbol">◉</div><div><h3>Listening</h3><div class="desc">Hear first. Reveal Arabic only when you need it.</div></div></a>
        <button class="card practice clickable" data-action="start-lesson"><div class="symbol">ع</div><div><h3>Word meanings</h3><div class="desc">Spaced repetition from your personal review queue.</div></div></button>
        <a href="#/explore" class="card practice clickable"><div class="symbol">جذر</div><div><h3>Roots</h3><div class="desc">Recognize related Quranic words by root families.</div></div></a>
        <a href="#/salah" class="card practice clickable"><div class="symbol">۝</div><div><h3>Salah</h3><div class="desc">Begin with the Quran you already recite every day.</div></div></a>
      </div>
    </div>

    <div class="section"><div class="card soft"><div class="row between wrap"><div><h3>Content integrity comes before feature count.</h3><p class="muted small" style="margin:0">Quran text and established translations are provider content. Learner glosses are separately labelled. AI is not used to invent Quran translation.</p></div><a class="btn ghost" href="#/sources">How sources work ${icon('chevron','nav-icon')}</a></div></div></div>
  </section>`;
  return shell(content,'Learn');
}

function startLesson(){
  const queue = dueWords(7);
  state.lesson = { stage:'words', queue:queue.length ? queue : LEARNING_WORDS.slice(0,7), index:0, revealed:false, ratings:[], phrase:null, phraseAnswered:false, phraseCorrect:null };
  render();
}
function renderLesson(){
  const l = state.lesson;
  if (l.stage==='done') {
    const good = l.ratings.filter(x=>x==='good'||x==='easy').length;
    return `<section class="page narrow"><div class="lesson-shell">${pageHead('Session complete','Good. Stop here.','Short, repeated sessions are more useful than cramming.')}
      <div class="card accent" style="text-align:center;padding:40px"><div class="eyebrow">Today</div><h2>${l.ratings.length} words reviewed</h2><div class="value" style="font-size:50px;font-weight:750;margin:16px 0">${good}/${l.ratings.length}</div><p class="muted">recalled comfortably</p>${progress(l.ratings.length ? good/l.ratings.length*100 : 0)}
      <div class="row" style="justify-content:center;margin-top:22px"><button class="btn primary" data-action="finish-lesson">Back to Learn</button><a class="btn" href="#/listen">Test by listening</a></div></div></div></section>`;
  }
  if (l.stage==='phrase') return renderPhraseLesson();
  const word = l.queue[l.index];
  const m = getMastery(word.key);
  return `<section class="page narrow"><div class="lesson-shell">
    <div class="row between" style="margin-bottom:14px"><button class="btn ghost" data-action="finish-lesson">← Exit</button><span class="small muted">${l.index+1} / ${l.queue.length}</span></div>
    <div class="lesson-progress">${Array.from({length:l.queue.length+1},(_,i)=>`<span class="${i<l.index?'done':''}"></span>`).join('')}</div>
    <div class="card flashcard">
      <div class="eyebrow">Meaning recall</div><div class="arabic-word" dir="rtl">${esc(word.display)}</div>
      ${l.revealed ? `<div class="meaning urdu">${esc(word.urdu)}</div><div class="row wrap" style="justify-content:center;margin-top:13px">${word.root?badge(`Root ${word.root}`):''}${badge(word.pos||'')}${m?badge(`${m.strength||0}% strength`,'ok'):badge('New')}</div>` : `<p class="muted">Say the meaning to yourself before revealing it.</p><button class="btn primary" data-action="reveal-word">Reveal meaning</button>`}
    </div>
    ${l.revealed ? `<div class="rating-row"><button class="btn" data-rating="again">Again</button><button class="btn" data-rating="hard">Hard</button><button class="btn" data-rating="good">Good</button><button class="btn primary" data-rating="easy">Easy</button></div><p class="small faint" style="text-align:center;margin-top:10px">Your rating schedules the next review locally on this device.</p>`:''}
  </div></section>`;
}
function renderPhraseLesson(){
  const p = state.lesson.phrase;
  const alternatives = shuffle(LEARNING_PHRASES.filter(x=>x.id!==p.id)).slice(0,3).map(x=>x.urdu);
  const choices = state.lesson.phraseChoices || (state.lesson.phraseChoices = shuffle([p.urdu,...alternatives]));
  return `<section class="page narrow"><div class="lesson-shell">
    <div class="lesson-progress">${Array.from({length:state.lesson.queue.length+1},()=>'<span class="done"></span>').join('')}</div>
    <div class="card" style="padding:30px"><div class="eyebrow">Phrase recognition</div><div class="arabic" style="font-size:39px;text-align:center;margin:24px 0">${esc(p.arabic)}</div><p class="muted" style="text-align:center">What does the phrase mean?</p>
      <div class="choice-list">${choices.map(c=>{ const cls=state.lesson.phraseAnswered?(c===p.urdu?'correct':(c===state.lesson.phraseSelected?'wrong':'')):''; return `<button class="choice urdu ${cls}" data-phrase-choice="${attr(c)}" ${state.lesson.phraseAnswered?'disabled':''}>${esc(c)}</button>`; }).join('')}</div>
      ${state.lesson.phraseAnswered?`<div class="row between" style="margin-top:18px"><span class="pill ${state.lesson.phraseCorrect?'ok':'warn'}">${state.lesson.phraseCorrect?'Correct':'Review it once more'}</span><button class="btn primary" data-action="complete-lesson">Finish session</button></div>`:''}
    </div></div></section>`;
}

function renderQuran(){
  const settings = setting();
  const selector = state.surahs ? `<select id="surah-select" aria-label="Select Surah">${state.surahs.map(s=>`<option value="${s.number}" ${s.number===state.currentSurah?'selected':''}>${s.number}. ${esc(s.englishName)} · ${esc(s.name)}</option>`).join('')}</select>` : '<div class="skeleton" style="height:44px"></div>';
  let body = '';
  if (state.quranLoading) body = loadingCards();
  else if (state.quranError) body = `<div class="error"><h3>Could not load Quran data</h3><p>${esc(state.quranError)}</p><button class="btn" data-action="reload-surah">Try again</button></div>`;
  else if (state.surahData) body = renderSurah(state.surahData,settings);
  else body = loadingCards();
  return shell(`<section class="page">
    ${pageHead('Read + understand','Quran','Canonical Arabic stays visually separate from translation and learning aids.',`<a class="btn" href="#/sources">${icon('info','nav-icon')} Sources</a>`)}
    <div class="reader-tools"><div>${selector}</div><div class="controls"><button class="toggle ${settings.showTranslation?'on':''}" data-setting-toggle="showTranslation">Urdu translation</button><button class="toggle ${settings.showWordOverlay?'on':''}" data-setting-toggle="showWordOverlay">Learning overlay</button></div></div>
    ${body}
  </section>`,'Quran');
}
function renderSurah(surah,settings){
  const ed = surah.translationEdition;
  return `<div class="card surah-heading"><div class="arabic arabic-name">${esc(surah.name)}</div><h2>${esc(surah.englishName)}</h2><div class="meta">${esc(surah.revelationType)} · ${surah.numberOfAyahs} ayat · Translation: ${esc(ed?.englishName||translationName())}</div>${surah.warnings?.length?`<div style="margin-top:10px">${surah.warnings.map(x=>badge(x,'warn')).join(' ')}</div>`:''}</div>
    <div class="ayah-list" style="margin-top:14px">${surah.ayahs.map(a=>renderAyah(a,settings)).join('')}</div>
    <div class="card soft small muted" style="margin-top:16px">Arabic and translation are loaded from the selected Quran provider at runtime. Learner word glosses are a separate reviewed teaching layer and may not cover every word yet.</div>`;
}
function renderAyah(a,settings){
  const words = tokenizeArabic(a.text);
  const scale = Number(settings.arabicSize)||1;
  return `<article class="card paper ayah-card" id="ayah-${a.numberInSurah}">
    <div class="ayah-top"><span class="ayah-number">${a.numberInSurah}</span><div class="ayah-actions">${a.audio?`<button class="btn icon" data-play-audio="${attr(a.audio)}" aria-label="Play ayah">${icon('play','nav-icon')}</button>`:''}<button class="btn icon" data-copy-ayah="${a.numberInSurah}" aria-label="Copy ayah">⧉</button></div></div>
    <div class="arabic ayah-text" style="font-size:clamp(${(27*scale).toFixed(1)}px,${(4.5*scale).toFixed(2)}vw,${(40*scale).toFixed(1)}px)">${esc(a.text)}</div>
    ${settings.showWordOverlay?`<div class="word-row">${words.map(w=>{ const match=findLearningWord(w.raw); const known=match && (getMastery(match.key)?.strength||0)>=60; return `<button class="word-token ${known?'known':''}" data-word="${attr(w.raw)}" data-ayah="${a.numberInSurah}" title="${match?esc(match.urdu):'Learner gloss not reviewed yet'}">${esc(w.raw)}</button>`; }).join('')}</div><div class="learning-note">Tap a word. Underlines mark words already recognized in your learning profile.</div>`:''}
    ${settings.showTranslation && a.translation?`<div class="urdu ayah-translation">${esc(a.translation)}</div>`:''}
  </article>`;
}

function renderWordSheet(){
  const ws = state.wordSheet;
  if (!ws) return '';
  const m = ws.match ? getMastery(ws.match.key) : null;
  return `<div class="sheet-backdrop" data-action="close-sheet"><aside class="sheet" role="dialog" aria-modal="true" aria-label="Word details" onclick="event.stopPropagation()">
    <div class="sheet-head"><div><div class="eyebrow">Learning layer</div><h2>Word inspector</h2></div><button class="btn icon ghost" data-action="close-sheet">${icon('close')}</button></div>
    <div class="arabic big-word">${esc(ws.raw)}</div>
    ${ws.match ? `<div class="card accent"><div class="small muted">Learner gloss · not a Quran translation</div><div class="urdu" style="font-size:22px;margin-top:8px">${esc(ws.match.urdu)}</div></div>
      <dl class="kv"><dt>Root</dt><dd class="arabic">${esc(ws.match.root||'—')}</dd><dt>Lemma</dt><dd class="arabic">${esc(ws.match.lemma||'—')}</dd><dt>Part of speech</dt><dd>${esc(ws.match.pos||'—')}</dd><dt>Mastery</dt><dd>${m?`${m.strength||0}% · ${esc(m.stage||'learning')}`:'New word'}</dd></dl>
      <div class="row"><button class="btn primary" data-word-known="${attr(ws.match.key)}">I know this</button><button class="btn" data-word-later="${attr(ws.match.key)}">Review later</button></div>` : `<div class="card soft"><h3>No reviewed word gloss yet</h3><p class="muted small">We intentionally do not guess a word meaning from an LLM. Use the established verse translation below while this learner lexicon grows through licensed/reviewed sources.</p></div>`}
    ${ws.ayah?.translation?`<div class="section"><div class="eyebrow">Established Urdu translation</div><div class="urdu card soft">${esc(ws.ayah.translation)}</div></div>`:''}
    <div class="section small faint">Canonical Quran text → established translation → learner gloss. These layers are never merged silently.</div>
  </aside></div>`;
}

function renderListen(){
  const l = state.listen;
  let body='';
  if(l.loading) body=loadingCards();
  else if(l.error) body=`<div class="error"><p>${esc(l.error)}</p><button class="btn" data-action="new-listen">Try again</button></div>`;
  else if(l.question) body=renderListenQuestion(l.question);
  else body=`<div class="empty"><p>Prepare a listening question from a real Qari recitation.</p><button class="btn primary" data-action="new-listen">Start</button></div>`;
  const select = state.surahs ? `<select id="listen-surah">${state.surahs.map(s=>`<option value="${s.number}" ${s.number===l.surah?'selected':''}>${s.number}. ${esc(s.englishName)}</option>`).join('')}</select>` : '';
  return shell(`<section class="page narrow">
    ${pageHead('Audio recognition','Listen first.','The skill we care about is understanding Quran when you hear it, not only when translation is visible.')}
    <div class="grid two" style="grid-template-columns:1fr 200px;margin-bottom:14px"><div>${select}</div><button class="btn" data-action="new-listen">New ayah</button></div>
    ${body}
  </section>`,'Listen');
}
function renderListenQuestion(q){
  const l=state.listen;
  return `<div class="player">
    <div class="card player-main"><button class="play-circle" data-play-audio="${attr(q.audio)}" ${q.audio?'':'disabled'}>${icon('play','nav-icon')}</button><div class="eyebrow">${esc(q.surahName)} · ${q.numberInSurah}</div>
      <div class="arabic listen-arabic ${l.revealedArabic?'':'hidden-text'}">${esc(q.text)}</div>
      <div class="row wrap" style="justify-content:center;margin-top:15px"><button class="btn" data-action="reveal-listen-arabic">${l.revealedArabic?'Arabic revealed':'Reveal Arabic'}</button><button class="btn" data-action="reveal-listen-urdu">${l.revealedUrdu?'Urdu revealed':'Reveal Urdu'}</button></div>
      ${l.revealedUrdu?`<div class="urdu listen-urdu" style="margin-top:16px">${esc(q.translation)}</div>`:''}
    </div>
    <div class="card"><h3>What did you understand?</h3><p class="muted small">Choose the closest established translation.</p><div class="choice-list">${q.choices.map(c=>{ const cls=l.answered?(c===q.translation?'correct':(c===l.selectedChoice?'wrong':'')):''; return `<button class="choice urdu ${cls}" data-listen-choice="${attr(c)}" ${l.answered?'disabled':''}>${esc(c)}</button>`; }).join('')}</div>${l.answered?`<div class="row between" style="margin-top:15px"><span class="pill ${l.correct?'ok':'warn'}">${l.correct?'Correct':'Review and replay'}</span><button class="btn primary" data-action="new-listen">Next ayah</button></div>`:''}</div>
  </div>`;
}

function renderExplore(){
  const tabs=[['words','Words'],['roots','Roots'],['search','Quran search']];
  let content='';
  if(state.exploreTab==='words') content=renderWordExplore();
  if(state.exploreTab==='roots') content=renderRootExplore();
  if(state.exploreTab==='search') content=renderSearchExplore();
  return shell(`<section class="page">${pageHead('Language patterns','Explore','Build direct recognition through words, roots and phrases. Search results remain tied to the selected Quran edition.')}
    <div class="tabs">${tabs.map(([id,label])=>`<button class="${state.exploreTab===id?'active':''}" data-explore-tab="${id}">${label}</button>`).join('')}</div>${content}</section>`,'Explore');
}
function renderWordExplore(){
  const q=state.exploreQuery.toLowerCase().trim();
  const words=LEARNING_WORDS.filter(w=>!q || [w.display,w.urdu,w.root,w.lemma].some(v=>String(v||'').toLowerCase().includes(q)) || normalizeArabic(w.display).includes(normalizeArabic(q)));
  return `<div class="search" style="margin-bottom:14px">${icon('search','search-icon')}<input class="field" id="explore-query" value="${attr(state.exploreQuery)}" placeholder="Search Arabic, Urdu, root…"></div><div class="grid three">${words.map(w=>{ const m=getMastery(w.key); return `<button class="card clickable" data-open-word-key="${attr(w.key)}" style="text-align:left"><div class="row between"><div class="arabic" style="font-size:28px;color:var(--accent-2)">${esc(w.display)}</div>${m?badge(`${m.strength||0}%`,'ok'):badge('New')}</div><div class="urdu" style="font-size:15px;margin-top:8px">${esc(w.urdu)}</div><div class="small faint" style="margin-top:8px">${w.root?`Root ${esc(w.root)} · `:''}${esc(w.pos||'')}</div></button>`;}).join('')}</div>`;
}
function renderRootExplore(){
  return `<div class="card accent" style="margin-bottom:16px"><h3>Why roots matter</h3><p class="muted small" style="margin:0">Roots help you notice relationships across changing word forms. A root is a learning signal, not a guarantee that every derived word has the same meaning in context.</p></div><div class="root-grid">${ROOT_NOTES.map(r=>`<button class="card root-card clickable" data-root="${attr(r.root)}" style="text-align:left"><div class="root">${esc(r.root)}</div><div class="urdu" style="font-size:14px">${esc(r.gloss)}</div><div class="small faint">${r.keys.length} reviewed entries</div></button>`).join('')}</div>`;
}
function renderSearchExplore(){
  let results='';
  if(state.searchLoading) results=loadingCards();
  else if(state.searchResults) results = state.searchResults.length ? `<div class="stack">${state.searchResults.slice(0,50).map(m=>`<button class="card clickable" data-search-open="${m.surah?.number||1}" data-search-ayah="${m.numberInSurah||1}" style="text-align:left"><div class="row between"><strong>${esc(m.surah?.englishName||'Surah')} ${m.numberInSurah||''}</strong><span class="pill">Open</span></div><div class="urdu" style="margin-top:8px">${esc(m.text||'')}</div></button>`).join('')}</div>` : `<div class="empty">No matches returned by the selected edition.</div>`;
  return `<form id="quran-search-form" class="row" style="align-items:stretch;margin-bottom:16px"><input class="field" id="quran-search-input" value="${attr(state.exploreQuery)}" placeholder="مثلاً صبر، رحمت، یا Arabic word"><button class="btn primary">Search</button></form><p class="small faint">Arabic queries search the Uthmani edition. Other queries search your selected Urdu translation (${esc(translationName())}).</p>${results}`;
}

function renderAsk(){
  const t=state.tutor;
  const bundle=t.bundle;
  return shell(`<section class="page narrow">${pageHead('Source-grounded tutor','Ask','This web build deliberately refuses to invent tafsir or translation. It answers from the current verse, the selected established translation, and reviewed learner glosses.')}
    <div class="card" style="margin-bottom:14px"><div class="row between wrap"><div><div class="eyebrow">Current verse</div><strong>Surah ${t.surah}:${t.ayah}</strong></div><div class="row"><button class="btn" data-tutor-nav="prev">←</button><button class="btn" data-tutor-nav="next">→</button></div></div>${t.loading?'<div class="skeleton" style="margin-top:14px"></div>':t.error?`<div class="error" style="margin-top:12px">${esc(t.error)}</div>`:bundle?`<div class="arabic" style="font-size:28px;margin-top:12px">${esc(bundle.text)}</div><div class="urdu muted" style="font-size:15px;margin-top:8px">${esc(bundle.translation)}</div>`:''}</div>
    <div class="prompt-row">${TUTOR_PRESETS.map(p=>`<button class="prompt-chip urdu" data-tutor-preset="${attr(p)}">${esc(p)}</button>`).join('')}</div>
    <div class="card chat" id="chat-log">${t.messages.length?t.messages.map(m=>`<div class="message ${m.role}"><div class="tag">${m.role==='assistant'?'Teaching explanation':'You'}</div><div class="${m.role==='assistant'?'urdu':''}">${esc(m.text).replace(/\n/g,'<br>')}</div></div>`).join(''):`<div class="empty">Choose a prompt or ask about the current ayah. For scholarly interpretation, the tutor will tell you when a reviewed tafsir source is required.</div>`}</div>
    <form id="tutor-form" class="chat-compose"><input class="field" id="tutor-input" placeholder="اس آیت یا لفظ کے بارے میں پوچھیں…"><button class="btn primary">Ask</button></form>
    <div class="card soft small muted" style="margin-top:14px"><strong>Authority order:</strong> Quran text → established translation → reviewed scholarly source → learner explanation. This static tutor currently stops before unsourced scholarly claims.</div>
  </section>`,'Ask');
}

function renderSalah(){
  const map=getMasteryMap();
  const fatihah=LEARNING_WORDS.filter(w=>w.pack==='fatihah');
  const recognized=fatihah.filter(w=>(map[w.key]?.strength||0)>=60).length;
  const pct=Math.round(recognized/fatihah.length*100);
  const labels={1:'Al-Fatihah',112:'Al-Ikhlas',113:'Al-Falaq',114:'An-Nas',108:'Al-Kawthar'};
  return shell(`<section class="page narrow">${pageHead('Daily recitation','Salah comprehension','Start with Quran you already repeat. The target is meaning recognition during recitation, not a separate translation exercise.')}
    <div class="card accent"><div class="row between"><div><div class="eyebrow">Al-Fatihah learner pack</div><h2>${pct}% recognized</h2></div><span class="pill ok">${recognized}/${fatihah.length} words</span></div>${progress(pct)}<div class="row wrap" style="margin-top:16px"><button class="btn primary" data-action="fatihah-lesson">Practice Al-Fatihah</button><button class="btn" data-action="open-surah" data-surah="1">Read with translation</button></div></div>
    <div class="section"><div class="section-head"><h2>Common short surahs</h2></div><div class="stack">${SALAH_SURAHS.map(n=>`<button class="card clickable row between" data-action="open-surah" data-surah="${n}"><div><strong>${labels[n]||`Surah ${n}`}</strong><div class="small muted">Read, listen, then hide translation as recognition improves.</div></div>${icon('chevron')}</button>`).join('')}</div></div>
    <div class="section card soft"><h3>How to use this in Salah</h3><p class="muted small">Practice outside Salah first. During Salah, do not force a word-by-word translation. Let familiar Arabic phrases trigger their meaning directly. Quran Feham measures repeated recognition so the Urdu bridge can gradually disappear.</p></div>
  </section>`,'Salah');
}

function renderSources(){
  const levels=[
    ['0','Canonical Quran','Never generated or paraphrased by AI.'],
    ['1','Established translation','Named edition/provider; kept visually separate from Quran.'],
    ['2','Approved tafsir','Only after explicit source licensing/review.'],
    ['3','Scholarly / Hanafi note','Separate layer; school-specific, cited and reviewed.'],
    ['4','Teaching explanation','May simplify language but never masquerades as Quran/tafsir.'],
    ['5','Analogy / personalization','Optional learning aid with the lowest authority.']
  ];
  return shell(`<section class="page">${pageHead('Provenance first','Sources & scholarly governance','Open source does not automatically mean open religious content. Quran Feham tracks code, text, translation, morphology and audio rights separately.')}
    <div class="grid two"><div class="card"><h2>Authority hierarchy</h2><div class="source-levels">${levels.map(([n,name,desc])=>`<div class="source-level"><div class="level-num">${n}</div><div><strong>${name}</strong><div class="small muted">${desc}</div></div>${n==='0'?badge('Immutable','ok'):''}</div>`).join('')}</div></div>
    <div class="card"><h2>Non-negotiable rules</h2><div class="stack small muted"><div>• Quran text and translation are never generated by an LLM.</div><div>• Translation, tafsir and teaching explanations are never visually merged.</div><div>• “Hanafi” means a separate reviewed fiqh/scholarly note, never a different Quran.</div><div>• Recitation uses a real Qari recording; synthetic TTS is not used to recite Quran.</div><div>• Unclear licensing stays out of the bundled product until permission is verified.</div></div></div></div>
    <div class="section"><div class="section-head"><h2>Source registry</h2><span class="small muted">Runtime + planned integrations</span></div><div class="table-wrap"><table><thead><tr><th>Source</th><th>Purpose</th><th>Status</th><th>Rights / handling</th></tr></thead><tbody>${SOURCE_REGISTRY.map(s=>`<tr><td><a href="${attr(s.url)}" target="_blank" rel="noopener"><strong>${esc(s.name)}</strong></a></td><td>${esc(s.type)}<div class="small faint">${esc(s.usage)}</div></td><td>${badge(s.status,s.status==='active'?'ok':s.status.includes('permission')?'warn':'')}</td><td>${esc(s.license)}</td></tr>`).join('')}</tbody></table></div></div>
  </section>`,'Sources');
}

function renderSettings(){
  const s=setting();
  return shell(`<section class="page narrow">${pageHead('Personal setup','Settings','Your learning state stays on this device in the web MVP. Export it before clearing browser storage.')}
    <div class="stack gap-lg">
      <div class="card"><h2>Quran content</h2><label class="small muted" for="translation-setting">Urdu translation</label><select id="translation-setting" style="margin:7px 0 16px">${TRANSLATIONS.map(t=>`<option value="${t.id}" ${s.translation===t.id?'selected':''}>${esc(t.name)} · ${esc(t.provider)}</option>`).join('')}</select><label class="small muted" for="reciter-setting">Reciter</label><select id="reciter-setting" style="margin-top:7px">${RECITERS.map(r=>`<option value="${r.id}" ${s.reciter===r.id?'selected':''}>${esc(r.name)}</option>`).join('')}</select><p class="small faint" style="margin-top:12px">Audio is streamed from the provider. Quran Feham does not bundle or re-license reciter recordings.</p></div>
      <div class="card"><h2>Reading</h2><div class="row between"><span>Show Urdu translation</span><button class="toggle ${s.showTranslation?'on':''}" data-setting-toggle="showTranslation">${s.showTranslation?'On':'Off'}</button></div><div class="row between" style="margin-top:12px"><span>Word learning overlay</span><button class="toggle ${s.showWordOverlay?'on':''}" data-setting-toggle="showWordOverlay">${s.showWordOverlay?'On':'Off'}</button></div><label class="small muted" for="arabic-size" style="display:block;margin-top:18px">Arabic text size</label><input id="arabic-size" type="range" min="0.85" max="1.35" step="0.05" value="${s.arabicSize}" style="width:100%;accent-color:var(--accent)"></div>
      <div class="card"><h2>Your progress</h2><div class="row wrap"><button class="btn" data-action="export-progress">${icon('download','nav-icon')} Export JSON</button><label class="btn" for="import-file">${icon('upload','nav-icon')} Import JSON<input id="import-file" type="file" accept="application/json" hidden></label><button class="btn" data-action="clear-cache">Clear Quran cache</button><button class="btn danger" data-action="reset-progress">Reset learning progress</button></div></div>
      <div class="card soft"><div class="row between"><div><h3>Quran data provider</h3><div class="small muted">Al Quran Cloud runtime health</div></div><span id="provider-health">${state.health?badge(state.health.ok?'Online':'Unavailable',state.health.ok?'ok':'warn'):badge('Checking…')}</span></div></div>
    </div>
  </section>`,'Settings');
}

function renderNotFound(){ return shell(`<section class="page narrow"><div class="empty"><h2>Page not found</h2><a class="btn primary" href="#/learn">Return to Learn</a></div></section>`,'Quran Feham'); }

function render(){
  state.route=route();
  let html;
  switch(state.route){
    case '/': case '/learn': html=renderLearn(); break;
    case '/quran': html=renderQuran(); break;
    case '/listen': html=renderListen(); break;
    case '/explore': html=renderExplore(); break;
    case '/ask': html=renderAsk(); break;
    case '/salah': html=renderSalah(); break;
    case '/sources': html=renderSources(); break;
    case '/settings': html=renderSettings(); break;
    default: html=renderNotFound();
  }
  app.innerHTML=html;
  afterRender();
}

function toast(message){
  document.querySelector('.toast')?.remove();
  const el=document.createElement('div'); el.className='toast'; el.textContent=message; document.body.appendChild(el);
  clearTimeout(state.toastTimer); state.toastTimer=setTimeout(()=>el.remove(),2600);
}

let audioPlayer = null;
function playAudio(url){
  if(!url){ toast('Audio is not available for this ayah.'); return; }
  if(audioPlayer){ audioPlayer.pause(); audioPlayer=null; }
  audioPlayer=new Audio(url); audioPlayer.play().catch(()=>toast('Could not start audio. Check browser permissions or connection.'));
}

async function ensureSurahs(){
  if(state.surahs) return;
  try { state.surahs=await getSurahList(); render(); } catch(e){ console.warn(e); }
}
async function loadCurrentSurah(force=false){
  if(state.quranLoading) return;
  if(!force && state.surahData?.number===state.currentSurah) return;
  state.quranLoading=true; state.quranError=''; render();
  try { state.surahData=await getSurah(state.currentSurah); }
  catch(e){ state.quranError=e.message || 'Unknown Quran data error.'; }
  finally { state.quranLoading=false; render(); if(state.scrollAyah){ setTimeout(()=>{document.querySelector(`#ayah-${state.scrollAyah}`)?.scrollIntoView({behavior:'smooth',block:'center'}); state.scrollAyah=null;},50); } }
}
async function loadListenQuestion(){
  const l=state.listen; l.loading=true; l.error=''; l.question=null; l.answered=false; l.revealedArabic=false; l.revealedUrdu=false; render();
  try {
    const data=await getSurah(l.surah); l.data=data;
    const candidates=data.ayahs.filter(a=>a.translation && a.audio);
    const a=candidates[Math.floor(Math.random()*candidates.length)];
    const pool=shuffle(candidates.filter(x=>x.numberInSurah!==a.numberInSurah).map(x=>x.translation));
    let extras=[];
    if(pool.length<3 && l.surah!==1){ const f=await getSurah(1); extras=shuffle(f.ayahs.map(x=>x.translation)).filter(Boolean); }
    const choices=shuffle([a.translation,...pool,...extras].filter(Boolean).filter((v,i,x)=>x.indexOf(v)===i).slice(0,4));
    l.question={...a,surahName:data.englishName,choices};
  } catch(e){ l.error=e.message; }
  finally { l.loading=false; render(); }
}
async function loadTutorVerse(){
  const t=state.tutor; t.loading=true; t.error=''; render();
  try { t.bundle=await getVerseBundle(t.surah,t.ayah); }
  catch(e){ t.error=e.message; }
  finally { t.loading=false; render(); }
}

function answerTutor(question){
  const b=state.tutor.bundle;
  if(!b) return 'آیت ابھی load نہیں ہوئی۔ پہلے آیت load ہونے دیں۔';
  const q=String(question||'').toLowerCase();
  const words=tokenizeArabic(b.text).map(w=>({raw:w.raw,match:findLearningWord(w.raw)}));
  const known=words.filter(w=>w.match);
  if(q.includes('root')){
    if(!known.length) return 'اس آیت کے الفاظ ابھی ہمارے reviewed root pack میں موجود نہیں ہیں۔ میں root guess نہیں کروں گا۔';
    return known.map(w=>`${w.raw} → ${w.match.root || 'root اس pack میں درج نہیں'} (${w.match.urdu})`).join('\n');
  }
  if(q.includes('word by word') || q.includes('لفظ')){
    return words.map(w=>`${w.raw} → ${w.match?.urdu || 'reviewed gloss ابھی available نہیں'}`).join('\n');
  }
  if(q.includes('grammar')){
    if(!known.length) return 'اس آیت کے لیے reviewed grammar tags ابھی available نہیں ہیں۔ Quran Feham grammar invent نہیں کرے گا۔';
    return known.map(w=>`${w.raw} → ${w.match.pos || '—'}${w.match.lemma?` · lemma: ${w.match.lemma}`:''}`).join('\n');
  }
  if(q.includes('تفسیر') || q.includes('حکم') || q.includes('حنفی') || q.includes('halal') || q.includes('haram')){
    return `یہ سوال scholarly interpretation مانگتا ہے۔ موجودہ web build میں reviewed tafsir/Hanafi source configure نہیں ہے، اس لیے میں unsourced دینی حکم نہیں بناؤں گا۔\n\nموجودہ منتخب اردو ترجمہ:\n${b.translation}`;
  }
  return `منتخب مستند اردو ترجمہ:\n${b.translation}\n\nLearner breakdown:\n${known.length?known.map(w=>`${w.raw} = ${w.match.urdu}`).join('، '):'اس آیت کے لیے reviewed learner gloss ابھی محدود ہے۔'}\n\nنوٹ: اوپر translation ہے؛ learner breakdown صرف سمجھنے کی مدد ہے، تفسیر نہیں۔`;
}

function openWord(raw,ayahNo){
  const ayah=state.surahData?.ayahs.find(a=>a.numberInSurah===Number(ayahNo));
  state.wordSheet={ raw, match:findLearningWord(raw), ayah };
  render();
}
function openWordByKey(key){
  const match=LEARNING_WORDS.find(w=>w.key===key); if(!match) return;
  state.wordSheet={ raw:match.display, match, ayah:null }; render();
}

function afterRender(){
  if(state.route==='/quran'){ ensureSurahs(); if(!state.quranLoading && state.surahData?.number!==state.currentSurah) loadCurrentSurah(); }
  if(state.route==='/listen'){ ensureSurahs(); if(!state.listen.question && !state.listen.loading) loadListenQuestion(); }
  if(state.route==='/ask' && !state.tutor.bundle && !state.tutor.loading) loadTutorVerse();
  if(state.route==='/settings' && !state.health){ providerHealth().then(h=>{state.health=h; if(route()==='/settings') render();}); }
}

app.addEventListener('click', async e=>{
  const target=e.target.closest('button,a,[data-action]'); if(!target) return;
  const action=target.dataset.action;
  if(action==='start-lesson'){ e.preventDefault(); startLesson(); return; }
  if(action==='finish-lesson'){ state.lesson=null; render(); return; }
  if(action==='reveal-word'){ state.lesson.revealed=true; render(); return; }
  if(target.dataset.rating){ const rating=target.dataset.rating; const l=state.lesson; const word=l.queue[l.index]; rateWord(word.key,rating); l.ratings.push(rating); l.index++; l.revealed=false; if(l.index>=l.queue.length){ l.stage='phrase'; l.phrase=shuffle(LEARNING_PHRASES)[0]; } render(); return; }
  if(target.dataset.phraseChoice){ const l=state.lesson; l.phraseAnswered=true; l.phraseSelected=target.dataset.phraseChoice; l.phraseCorrect=l.phraseSelected===l.phrase.urdu; render(); return; }
  if(action==='complete-lesson'){ state.lesson.stage='done'; render(); return; }
  if(action==='fatihah-lesson'){ state.lesson={stage:'words',queue:LEARNING_WORDS.filter(w=>w.pack==='fatihah').slice(0,9),index:0,revealed:false,ratings:[],phrase:null,phraseAnswered:false}; go('/learn'); render(); return; }
  if(action==='open-surah'){
    state.currentSurah=Number(target.dataset.surah||1); state.surahData=null; state.quranError=''; go('/quran'); return;
  }
  if(action==='reload-surah'){ state.surahData=null; loadCurrentSurah(true); return; }
  if(target.dataset.settingToggle){ const key=target.dataset.settingToggle; saveSettings({[key]:!setting()[key]}); if(state.route==='/quran') state.surahData=null; render(); return; }
  if(target.dataset.playAudio){ playAudio(target.dataset.playAudio); return; }
  if(target.dataset.word){ openWord(target.dataset.word,target.dataset.ayah); return; }
  if(action==='close-sheet'){ state.wordSheet=null; render(); return; }
  if(target.dataset.wordKnown){ markKnown(target.dataset.wordKnown); toast('Marked as recognized.'); state.wordSheet=null; render(); return; }
  if(target.dataset.wordLater){ reviewLater(target.dataset.wordLater); toast('Added to your review queue.'); state.wordSheet=null; render(); return; }
  if(target.dataset.openWordKey){ openWordByKey(target.dataset.openWordKey); return; }
  if(target.dataset.root){ state.exploreTab='words'; state.exploreQuery=target.dataset.root; render(); return; }
  if(target.dataset.exploreTab){ state.exploreTab=target.dataset.exploreTab; state.searchResults=null; render(); return; }
  if(action==='new-listen'){ loadListenQuestion(); return; }
  if(action==='reveal-listen-arabic'){ state.listen.revealedArabic=true; render(); return; }
  if(action==='reveal-listen-urdu'){ state.listen.revealedUrdu=true; render(); return; }
  if(target.dataset.listenChoice && !state.listen.answered){ state.listen.answered=true; state.listen.selectedChoice=target.dataset.listenChoice; state.listen.correct=target.dataset.listenChoice===state.listen.question.translation; recordListen(state.listen.correct); state.listen.revealedArabic=true; state.listen.revealedUrdu=true; render(); return; }
  if(target.dataset.tutorPreset){ const q=target.dataset.tutorPreset; state.tutor.messages.push({role:'user',text:q},{role:'assistant',text:answerTutor(q)}); render(); return; }
  if(target.dataset.tutorNav){
    if(target.dataset.tutorNav==='prev') state.tutor.ayah=Math.max(1,state.tutor.ayah-1); else state.tutor.ayah++;
    state.tutor.bundle=null; loadTutorVerse(); return;
  }
  if(target.dataset.searchOpen){ state.currentSurah=Number(target.dataset.searchOpen); state.scrollAyah=Number(target.dataset.searchAyah); state.surahData=null; go('/quran'); return; }
  if(target.dataset.copyAyah){ const a=state.surahData?.ayahs.find(x=>x.numberInSurah===Number(target.dataset.copyAyah)); if(a){ await navigator.clipboard?.writeText(`${a.text}\n${a.translation}\nQuran ${state.currentSurah}:${a.numberInSurah}`); toast('Ayah copied with translation and reference.'); } return; }
  if(action==='export-progress'){ downloadJson(`quran-feham-progress-${new Date().toISOString().slice(0,10)}.json`,exportProgress()); toast('Progress exported.'); return; }
  if(action==='clear-cache'){ clearDataCache(); state.surahData=null; toast('Cached Quran data cleared.'); return; }
  if(action==='reset-progress'){ if(confirm('Reset all Quran Feham learning progress on this device?')){ resetProgress(); state.lesson=null; toast('Learning progress reset.'); render(); } return; }
});

app.addEventListener('change', async e=>{
  if(e.target.id==='surah-select'){ state.currentSurah=Number(e.target.value); state.surahData=null; loadCurrentSurah(); }
  if(e.target.id==='listen-surah'){ state.listen.surah=Number(e.target.value); state.listen.question=null; loadListenQuestion(); }
  if(e.target.id==='translation-setting'){ saveSettings({translation:e.target.value}); state.surahData=null; state.listen.question=null; state.tutor.bundle=null; toast('Translation changed.'); render(); }
  if(e.target.id==='reciter-setting'){ saveSettings({reciter:e.target.value}); state.surahData=null; state.listen.question=null; toast('Reciter changed.'); render(); }
  if(e.target.id==='arabic-size'){ saveSettings({arabicSize:Number(e.target.value)}); }
  if(e.target.id==='import-file' && e.target.files?.[0]){
    try { const payload=JSON.parse(await e.target.files[0].text()); importProgress(payload); toast('Progress imported.'); render(); }
    catch(err){ toast(err.message || 'Could not import progress file.'); }
  }
});

app.addEventListener('input', e=>{
  if(e.target.id==='explore-query'){ state.exploreQuery=e.target.value; render(); const el=document.querySelector('#explore-query'); if(el){el.focus(); el.setSelectionRange(el.value.length,el.value.length);} }
});

app.addEventListener('submit', async e=>{
  if(e.target.id==='quran-search-form'){
    e.preventDefault(); const input=document.querySelector('#quran-search-input'); const q=input?.value.trim()||''; state.exploreQuery=q; if(!q)return;
    state.searchLoading=true; state.searchResults=null; render();
    try { const hasArabic=/[\u0600-\u06FF]/.test(q); const result=await searchQuran(q,hasArabic?'quran-uthmani':setting().translation); state.searchResults=result.matches; }
    catch(err){ state.searchResults=[]; toast(err.message); }
    finally { state.searchLoading=false; render(); }
  }
  if(e.target.id==='tutor-form'){
    e.preventDefault(); const input=document.querySelector('#tutor-input'); const q=input?.value.trim(); if(!q)return; state.tutor.messages.push({role:'user',text:q},{role:'assistant',text:answerTutor(q)}); render();
  }
});

window.addEventListener('hashchange',()=>{ state.route=route(); render(); });
window.addEventListener('qf:data-imported',()=>render());
window.addEventListener('qf:settings',()=>{ if(state.route!=='/settings') render(); });

if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{})); }

if(!location.hash) location.hash='/learn';
state.route=route();
render();
