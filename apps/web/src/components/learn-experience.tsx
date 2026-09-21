"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Check,
  Clock3,
  Compass,
  Ear,
  GraduationCap,
  Layers3,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  currentStreak,
  dueWords,
  getListenStats,
  listenPercent,
  type MasteryMap,
  masteryStats,
  type RecallRating,
  rateWord,
  readMasteryMap,
} from "@/lib/learning-store";
import {
  LEARNING_PHRASES,
  LEARNING_WORDS,
  type LearningPhrase,
  type LearningWord,
  PROTOTYPE_LEARNING_PACK_VERSION,
} from "@/lib/prototype-learning-data";
import {
  type CurriculumStage,
  calculateSurahVocabularyReadiness,
  FREQUENT_SURAHS_PROFILES,
  PREPOSITIONS_DATA,
  PRONOUN_PARADIGMS,
  QURAN_VOCABULARY,
  VERB_PATTERNS,
} from "@/lib/quran-vocabulary";

const SESSION_SIZE = 7;

const ratingOptions: Array<{
  rating: RecallRating;
  label: string;
  hint: string;
  emphasized?: boolean;
}> = [
  { rating: "again", label: "Again", hint: "10 min" },
  { rating: "hard", label: "Hard", hint: "1 day" },
  { rating: "good", label: "Good", hint: "2 days", emphasized: true },
  { rating: "easy", label: "Easy", hint: "4 days" },
];

type LessonState =
  | null
  | {
      phase: "word";
      queue: LearningWord[];
      index: number;
      revealed: boolean;
      ratings: RecallRating[];
    }
  | {
      phase: "phrase";
      ratings: RecallRating[];
      phrase: LearningPhrase;
      choices: string[];
      selected: string | null;
    }
  | {
      phase: "complete";
      ratings: RecallRating[];
      phraseCorrect: boolean;
    };

function shuffle<T>(values: readonly T[]): T[] {
  const items = [...values];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapAt = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapAt]] = [items[swapAt] as T, items[index] as T];
  }
  return items;
}

function createPhraseRound(
  phrasePool: readonly LearningPhrase[] = LEARNING_PHRASES,
): Pick<Extract<LessonState, { phase: "phrase" }>, "phrase" | "choices"> {
  const available = phrasePool.length > 0 ? phrasePool : LEARNING_PHRASES;
  const phrase = available[Math.floor(Math.random() * available.length)] as LearningPhrase;
  const alternatives = shuffle(
    LEARNING_PHRASES.filter((candidate) => candidate.id !== phrase.id).map(
      (candidate) => candidate.urdu,
    ),
  ).slice(0, 3);
  return { phrase, choices: shuffle([phrase.urdu, ...alternatives]) };
}

function ProgressSegments({ complete, total }: { complete: number; total: number }) {
  return (
    <div
      className="flex gap-1.5"
      role="progressbar"
      aria-label="Lesson progress"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={complete}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-1.5 flex-1 rounded-full ${index < complete ? "bg-accent" : "bg-line"}`}
        />
      ))}
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-t border-line py-4 first:border-t-0 sm:border-l sm:border-t-0 sm:px-5 sm:first:border-l-0 sm:first:pl-0">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-ink">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
    </div>
  );
}

export function LearnExperience() {
  const [mastery, setMastery] = useState<MasteryMap>({});
  const [streak, setStreak] = useState(0);
  const [listening, setListening] = useState({ correct: 0, total: 0 });
  const [hydrated, setHydrated] = useState(false);
  const [lesson, setLesson] = useState<LessonState>(null);
  const [requestedPack, setRequestedPack] = useState<"fatihah" | null>(null);
  const [activeTab, setActiveTab] = useState<"vocab" | "grammar" | "readiness">("vocab");
  const [selectedStage, setSelectedStage] = useState<CurriculumStage | "all">("all");

  useEffect(() => {
    const storage = window.localStorage;
    if (new URLSearchParams(window.location.search).get("pack") === "fatihah") {
      setRequestedPack("fatihah");
    }
    setMastery(readMasteryMap(storage));
    setListening(getListenStats(storage));
    setStreak(currentStreak(storage));
    setHydrated(true);
  }, []);

  const stats = useMemo(() => masteryStats(mastery), [mastery]);

  const knownKeysSet = useMemo(() => {
    return new Set(
      Object.entries(mastery)
        .filter(
          ([_, rec]) =>
            (rec.strength ?? 0) >= 40 || rec.stage === "mastered" || rec.stage === "recognized",
        )
        .map(([k]) => k),
    );
  }, [mastery]);

  const packWords = useMemo(() => {
    if (requestedPack === "fatihah") {
      return LEARNING_WORDS.filter((word) => word.pack === "fatihah");
    }
    if (selectedStage !== "all") {
      const vocabFiltered = QURAN_VOCABULARY.filter((w) => w.stage === selectedStage);
      return vocabFiltered.map((item) => ({
        key: item.key,
        display: item.display,
        urdu: item.urdu,
        root: item.root,
        lemma: item.lemma,
        pos: item.pos,
        pack: item.stage === "salah" ? ("fatihah" as const) : ("core" as const),
        aliases: [item.key],
      }));
    }
    return LEARNING_WORDS;
  }, [requestedPack, selectedStage]);

  const nextWords = useMemo(
    () =>
      dueWords(mastery, Number.POSITIVE_INFINITY)
        .filter((word) => requestedPack !== "fatihah" || word.pack === "fatihah")
        .slice(0, 5),
    [mastery, requestedPack],
  );

  function refreshLocalProgress() {
    const storage = window.localStorage;
    setMastery(readMasteryMap(storage));
    setListening(getListenStats(storage));
    setStreak(currentStreak(storage));
  }

  function startLesson() {
    const queue = dueWords(mastery, Number.POSITIVE_INFINITY)
      .filter((word) => requestedPack !== "fatihah" || word.pack === "fatihah")
      .slice(0, SESSION_SIZE);
    setLesson({
      phase: "word",
      queue: queue.length > 0 ? queue : packWords.slice(0, SESSION_SIZE),
      index: 0,
      revealed: false,
      ratings: [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitRating(rating: RecallRating) {
    if (lesson?.phase !== "word") return;
    const word = lesson.queue[lesson.index];
    if (!word) return;

    rateWord(window.localStorage, word.key, rating);
    const ratings = [...lesson.ratings, rating];
    refreshLocalProgress();
    if (lesson.index + 1 >= lesson.queue.length) {
      const phrasePool =
        requestedPack === "fatihah"
          ? LEARNING_PHRASES.filter((phrase) => phrase.id.startsWith("fatihah-"))
          : LEARNING_PHRASES;
      setLesson({ phase: "phrase", ratings, ...createPhraseRound(phrasePool), selected: null });
    } else {
      setLesson({ ...lesson, index: lesson.index + 1, revealed: false, ratings });
    }
  }

  function finishPhrase() {
    if (lesson?.phase !== "phrase" || lesson.selected === null) return;
    setLesson({
      phase: "complete",
      ratings: lesson.ratings,
      phraseCorrect: lesson.selected === lesson.phrase.urdu,
    });
  }

  if (lesson?.phase === "word") {
    const word = lesson.queue[lesson.index];
    if (!word) return null;
    const strength = Number(mastery[word.key]?.strength ?? 0);
    return (
      <div className="mx-auto min-h-[calc(100dvh-4rem)] max-w-4xl px-4 py-5 sm:px-8 sm:py-8 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setLesson(null)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-semibold text-muted hover:bg-surface hover:text-ink"
          >
            <ArrowLeft aria-hidden="true" size={19} /> Exit
          </button>
          <p className="text-sm font-semibold text-muted">
            Word {lesson.index + 1} of {lesson.queue.length}
          </p>
        </div>
        <div className="mt-4">
          <ProgressSegments complete={lesson.index} total={lesson.queue.length + 1} />
        </div>

        <section
          className="mt-6 flex min-h-[31rem] flex-col rounded-2xl border border-line bg-surface px-5 py-7 text-center shadow-[var(--qf-shadow-raised)] sm:px-10 sm:py-10"
          aria-labelledby="recall-heading"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
              Meaning recall
            </p>
            <h1 id="recall-heading" className="sr-only">
              Recall the meaning of {word.display}
            </h1>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center py-8">
            <p
              className="font-quran text-6xl leading-[1.7] text-ink sm:text-7xl"
              lang="ar"
              dir="rtl"
            >
              {word.display}
            </p>
            {!lesson.revealed ? (
              <>
                <p className="mt-5 max-w-md leading-7 text-muted">
                  Say the meaning to yourself. Reveal it when you are ready.
                </p>
                <button
                  type="button"
                  onClick={() => setLesson({ ...lesson, revealed: true })}
                  className="mt-7 min-h-12 rounded-xl bg-action px-6 font-semibold text-on-action hover:bg-action-hover"
                >
                  Reveal meaning
                </button>
              </>
            ) : (
              <div className="mt-6 w-full max-w-xl border-t border-line pt-6" aria-live="polite">
                <p className="font-urdu text-2xl leading-[2.1] text-ink" lang="ur" dir="rtl">
                  {word.urdu}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm text-muted">
                  {word.root && (
                    <span className="rounded-full bg-accent-soft px-3 py-1.5">
                      Root{" "}
                      <span className="font-quran" dir="rtl">
                        {word.root}
                      </span>
                    </span>
                  )}
                  <span className="rounded-full bg-surface-soft px-3 py-1.5">{word.pos}</span>
                  <span className="rounded-full bg-surface-soft px-3 py-1.5">
                    {strength > 0 ? `${strength}% recall strength` : "New word"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {lesson.revealed && (
            <div>
              <p className="mb-3 text-sm font-semibold text-muted">How well did you recall it?</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ratingOptions.map(({ rating, label, hint, emphasized }) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => submitRating(rating)}
                    className={`min-h-14 rounded-xl border px-3 py-2 text-sm font-semibold ${
                      emphasized
                        ? "border-action bg-action text-on-action hover:bg-action-hover"
                        : "border-line bg-surface text-ink hover:border-accent hover:bg-accent-soft"
                    }`}
                  >
                    <span className="block">{label}</span>
                    <span
                      className={`mt-0.5 block text-xs ${emphasized ? "opacity-80" : "text-muted"}`}
                    >
                      {hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
        <p className="mx-auto mt-4 max-w-xl text-center text-xs leading-5 text-muted">
          Your rating schedules the next review on this device. It is a practice record, not a
          measure of overall Quran understanding.
        </p>
      </div>
    );
  }

  if (lesson?.phase === "phrase") {
    const answered = lesson.selected !== null;
    return (
      <div className="mx-auto min-h-[calc(100dvh-4rem)] max-w-4xl px-4 py-5 sm:px-8 sm:py-8 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setLesson(null)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-semibold text-muted hover:bg-surface hover:text-ink"
          >
            <ArrowLeft aria-hidden="true" size={19} /> Exit
          </button>
          <p className="text-sm font-semibold text-muted">Phrase check</p>
        </div>
        <div className="mt-4">
          <ProgressSegments complete={lesson.ratings.length} total={lesson.ratings.length + 1} />
        </div>

        <section className="mt-6 rounded-2xl border border-line bg-surface px-5 py-8 shadow-[var(--qf-shadow-raised)] sm:px-10 sm:py-10">
          <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Recognise the phrase
          </p>
          <h1
            className="font-quran mt-7 text-center text-4xl leading-[1.9] text-ink sm:text-5xl"
            lang="ar"
            dir="rtl"
          >
            {lesson.phrase.arabic}
          </h1>
          <p className="mt-3 text-center leading-7 text-muted">
            Choose the closest learner meaning.
          </p>
          <div className="mx-auto mt-8 grid max-w-2xl gap-3">
            {lesson.choices.map((choice) => {
              const correct = answered && choice === lesson.phrase.urdu;
              const wrong = answered && choice === lesson.selected && !correct;
              return (
                <button
                  key={choice}
                  type="button"
                  disabled={answered}
                  onClick={() => setLesson({ ...lesson, selected: choice })}
                  className={`min-h-14 rounded-xl border px-4 py-3 text-right font-urdu text-base leading-8 disabled:opacity-100 ${
                    correct
                      ? "border-accent bg-accent-soft text-ink"
                      : wrong
                        ? "border-danger bg-surface-soft text-danger"
                        : "border-line bg-surface text-ink hover:border-accent hover:bg-accent-soft"
                  }`}
                  lang="ur"
                  dir="rtl"
                >
                  {choice}
                  {correct && <Check className="ml-2 inline" aria-hidden="true" size={18} />}
                </button>
              );
            })}
          </div>
          {answered && (
            <div
              className="mx-auto mt-7 flex max-w-2xl flex-col items-start justify-between gap-4 border-t border-line pt-5 sm:flex-row sm:items-center"
              aria-live="polite"
            >
              <p className="font-semibold text-ink">
                {lesson.selected === lesson.phrase.urdu
                  ? "Correct — you recognised the phrase."
                  : "Review the meaning once more, then continue."}
              </p>
              <button
                type="button"
                onClick={finishPhrase}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover sm:w-auto"
              >
                Finish <ArrowRight aria-hidden="true" size={18} />
              </button>
            </div>
          )}
        </section>
      </div>
    );
  }

  if (lesson?.phase === "complete") {
    const comfortable = lesson.ratings.filter(
      (rating) => rating === "good" || rating === "easy",
    ).length;
    return (
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-3xl place-items-center px-4 py-10 sm:px-8">
        <section className="w-full rounded-2xl border border-line bg-surface px-6 py-10 text-center shadow-[var(--qf-shadow-raised)] sm:px-10">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-accent">
            <BookOpenCheck aria-hidden="true" size={27} />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Session complete
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink">
            A short review, completed.
          </h1>
          <p className="mx-auto mt-3 max-w-lg leading-7 text-muted">
            Short, repeated sessions help recognition become more direct. Stop here or review
            another set.
          </p>
          <div className="mx-auto mt-8 grid max-w-lg grid-cols-2 divide-x divide-line border-y border-line py-5">
            <div>
              <p className="text-3xl font-semibold text-ink">
                {comfortable}/{lesson.ratings.length}
              </p>
              <p className="mt-1 text-sm text-muted">recalled comfortably</p>
            </div>
            <div>
              <p className="text-3xl font-semibold text-ink">
                {lesson.phraseCorrect ? "Yes" : "Review"}
              </p>
              <p className="mt-1 text-sm text-muted">phrase recognised</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setLesson(null)}
              className="min-h-12 rounded-xl bg-action px-6 font-semibold text-on-action hover:bg-action-hover"
            >
              Back to Learn
            </button>
            <button
              type="button"
              onClick={startLesson}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line px-6 font-semibold text-ink hover:bg-accent-soft"
            >
              <RotateCcw aria-hidden="true" size={18} /> Another session
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-line bg-surface px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Understand</p>
          <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
                {requestedPack === "fatihah"
                  ? "Practise Al-Fatihah vocabulary"
                  : "Learning Engine 2.0"}
              </h1>
              <p className="mt-2 max-w-2xl leading-7 text-muted">
                Build direct Quranic Arabic comprehension through high-frequency vocabulary, grammar
                discovery, and Salah readiness benchmarks.
              </p>
            </div>
            <button
              type="button"
              onClick={startLesson}
              disabled={!hydrated}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover disabled:cursor-wait disabled:opacity-60"
            >
              <Sparkles aria-hidden="true" size={19} />
              {requestedPack === "fatihah"
                ? "Start Al-Fatihah lesson"
                : selectedStage !== "all"
                  ? `Start ${selectedStage.replace("_", " ")} lesson`
                  : "Start today’s lesson"}
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setActiveTab("vocab")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === "vocab"
                  ? "bg-accent text-on-action"
                  : "bg-surface-soft text-muted hover:text-ink hover:bg-surface"
              }`}
            >
              <Layers3 size={16} /> Lessons & Vocabulary
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("grammar")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === "grammar"
                  ? "bg-accent text-on-action"
                  : "bg-surface-soft text-muted hover:text-ink hover:bg-surface"
              }`}
            >
              <Compass size={16} /> Grammar Discovery
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("readiness")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === "readiness"
                  ? "bg-accent text-on-action"
                  : "bg-surface-soft text-muted hover:text-ink hover:bg-surface"
              }`}
            >
              <GraduationCap size={16} /> Surah Comprehension
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 lg:px-10 lg:py-10">
        {/* ── TAB 1: VOCABULARY & LESSONS ── */}
        {activeTab === "vocab" && (
          <>
            <section className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
              <article className="rounded-2xl bg-hero px-6 py-7 text-on-hero sm:px-8 sm:py-9">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-on-hero/75">
                  <Clock3 aria-hidden="true" size={18} /> 10-minute comprehension session
                </div>
                <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                  Review what is due. Then recognise one phrase in context.
                </h2>
                <p className="mt-4 max-w-2xl leading-7 text-on-hero/75">
                  Begin with meaning recall, rate honestly, and let the review queue decide what
                  returns.
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {hydrated && nextWords.length > 0 ? (
                    nextWords.map((word) => (
                      <span
                        key={word.key}
                        className="rounded-full border border-white/20 px-3 py-1.5 font-quran text-xl"
                        lang="ar"
                        dir="rtl"
                      >
                        {word.display}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-on-hero/70">
                      {hydrated ? "Near-term reviews are complete." : "Loading your review queue…"}
                    </span>
                  )}
                </div>
              </article>

              <aside
                className="rounded-2xl border border-line bg-surface px-5 py-4 sm:px-6"
                aria-label="Learning progress"
              >
                <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <Stat
                    label="Due now"
                    value={hydrated ? String(stats.due) : "—"}
                    detail="review queue"
                  />
                  <Stat
                    label="Reviewed"
                    value={hydrated ? `${stats.reviewed}/${stats.total}` : "—"}
                    detail="learner gloss entries"
                  />
                  <Stat
                    label="Strong recall"
                    value={hydrated ? String(stats.mastered) : "—"}
                    detail="85%+ local strength"
                  />
                  <Stat
                    label="Listening"
                    value={hydrated && listening.total > 0 ? `${listenPercent(listening)}%` : "—"}
                    detail={
                      listening.total > 0 ? `${listening.total} answers recorded` : "no answers yet"
                    }
                  />
                </div>
              </aside>
            </section>

            {/* Curriculum Stages Filter */}
            <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Curriculum Stage Filter</h3>
                  <p className="text-xs text-muted">
                    Focus your practice on specific high-frequency Quran modules
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: "all", label: "All Core (~50)" },
                      { id: "salah", label: "Salah & Dhikr" },
                      { id: "particles_pronouns", label: "Particles & Pronouns (40%)" },
                      { id: "divine_attributes", label: "Divine Names & Nouns" },
                      { id: "core_verbs", label: "Core Verbs" },
                    ] as const
                  ).map((stage) => (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setSelectedStage(stage.id)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        selectedStage === stage.id
                          ? "bg-accent text-on-action"
                          : "border border-line bg-surface text-muted hover:border-accent hover:text-ink"
                      }`}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Stage Vocabulary Preview */}
              {selectedStage !== "all" && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 border-t border-line pt-4">
                  {QURAN_VOCABULARY.filter((item) => item.stage === selectedStage).map((item) => (
                    <div
                      key={item.key}
                      className="rounded-xl border border-line bg-surface-soft p-3 text-center"
                    >
                      <p className="font-quran text-2xl text-ink" lang="ar" dir="rtl">
                        {item.display}
                      </p>
                      <p className="font-urdu mt-1 text-sm text-muted" lang="ur" dir="rtl">
                        {item.urdu}
                      </p>
                      <p className="mt-1 text-[10px] text-muted">{item.frequency}x in Quran</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <section
              className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"
              aria-labelledby="learning-path-heading"
            >
              <div>
                <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
                  <div>
                    <p className="text-sm font-semibold text-accent">Your learning path</p>
                    <h2
                      id="learning-path-heading"
                      className="mt-1 text-2xl font-semibold tracking-[-0.025em] text-ink"
                    >
                      From a word to a familiar phrase
                    </h2>
                  </div>
                  {streak > 0 && (
                    <span className="text-sm font-semibold text-muted">
                      {streak}-day activity streak
                    </span>
                  )}
                </div>
                <ol className="divide-y divide-line">
                  {[
                    {
                      icon: Layers3,
                      step: "1",
                      title: "Recall the Urdu bridge",
                      body: "See one Quranic Arabic form and recall its short learner gloss before revealing it.",
                    },
                    {
                      icon: RotateCcw,
                      step: "2",
                      title: "Schedule the next review",
                      body: "Again, Hard, Good or Easy changes when that word returns on this device.",
                    },
                    {
                      icon: Ear,
                      step: "3",
                      title: "Recognise a complete phrase",
                      body: "Finish by reading a recurring structure as one meaningful unit.",
                    },
                  ].map(({ icon: Icon, step, title, body }) => (
                    <li
                      key={step}
                      className="grid grid-cols-[2.75rem_1fr] gap-4 py-5 sm:grid-cols-[2.75rem_1fr_auto] sm:items-center"
                    >
                      <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
                        <Icon aria-hidden="true" size={21} />
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                          Step {step}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-ink">{title}</h3>
                        <p className="mt-1 max-w-2xl leading-7 text-muted">{body}</p>
                      </div>
                      {step === "1" && (
                        <button
                          type="button"
                          onClick={startLesson}
                          className="col-start-2 inline-flex min-h-11 items-center gap-2 font-semibold text-accent hover:underline sm:col-start-auto"
                        >
                          Begin <ArrowRight aria-hidden="true" size={17} />
                        </button>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              <aside
                className="h-fit rounded-2xl border border-source/30 bg-surface p-6"
                aria-labelledby="pack-scope-heading"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-source">
                  Content boundary
                </p>
                <h2 id="pack-scope-heading" className="mt-2 text-xl font-semibold text-ink">
                  Reviewed prototype learner glosses
                </h2>
                <p className="mt-3 leading-7 text-muted">
                  This working pack contains short teaching glosses and phrases preserved from V1.
                  It is not a Quran translation or tafsir.
                </p>
                <p className="mt-5 border-t border-line pt-4 font-mono text-xs leading-5 text-muted">
                  {PROTOTYPE_LEARNING_PACK_VERSION}
                </p>
              </aside>
            </section>
          </>
        )}

        {/* ── TAB 2: GRAMMAR DISCOVERY ── */}
        {activeTab === "grammar" && (
          <div className="space-y-10">
            {/* Pronoun Paradigms */}
            <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <div className="border-b border-line pb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">
                  Pattern 1 · Pronoun Matrix
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-ink">
                  Attached vs Detached Pronouns
                </h2>
                <p className="mt-1 text-sm text-muted">
                  In Quranic Arabic, pronouns attach directly to the ends of nouns (for possession)
                  and verbs (for objects).
                </p>
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-muted">
                      <th className="pb-3 font-semibold">Person</th>
                      <th className="pb-3 font-semibold">Detached</th>
                      <th className="pb-3 font-semibold">Attached</th>
                      <th className="pb-3 font-semibold">Urdu Meaning</th>
                      <th className="pb-3 font-semibold">Quranic Example</th>
                      <th className="pb-3 font-semibold">Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {PRONOUN_PARADIGMS.map((p) => (
                      <tr key={p.detached} className="hover:bg-surface-soft">
                        <td className="py-3 font-medium text-muted">
                          {p.person} {p.number}
                        </td>
                        <td className="py-3 font-quran text-2xl text-ink font-semibold" dir="rtl">
                          {p.detached}
                        </td>
                        <td
                          className="py-3 font-quran text-2xl text-accent font-semibold"
                          dir="rtl"
                        >
                          {p.attached}
                        </td>
                        <td className="py-3 font-urdu text-base text-ink" dir="rtl">
                          {p.meaningUrdu}
                        </td>
                        <td className="py-3 font-quran text-lg text-ink" dir="rtl">
                          {p.example.arabic}
                        </td>
                        <td className="py-3 text-xs text-muted">{p.example.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Prepositions of Jar */}
            <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <div className="border-b border-line pb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">
                  Pattern 2 · Essential Particles
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-ink">
                  Prepositions of Jar (حروف الجر)
                </h2>
                <p className="mt-1 text-sm text-muted">
                  These 6 prepositions account for over 11,000 occurrences in the Quran!
                </p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PREPOSITIONS_DATA.map((prep) => (
                  <div
                    key={prep.preposition}
                    className="rounded-xl border border-line bg-surface-soft p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-quran text-3xl font-bold text-accent" dir="rtl">
                        {prep.preposition}
                      </span>
                      <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent">
                        {prep.frequency}x in Quran
                      </span>
                    </div>
                    <p className="font-urdu mt-2 text-lg font-semibold text-ink" dir="rtl">
                      {prep.meaningUrdu}
                    </p>
                    <p className="text-xs text-muted">{prep.meaningEnglish}</p>
                    <div className="mt-3 border-t border-line pt-2">
                      <p className="font-quran text-base text-ink text-right" dir="rtl">
                        {prep.example.arabic}
                      </p>
                      <p className="mt-1 text-right font-urdu text-xs text-muted" dir="rtl">
                        {prep.example.urdu}
                      </p>
                      <p className="mt-1 text-right text-[10px] text-muted">
                        Ayahs: {prep.example.reference}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Core Verb Paradigms */}
            <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <div className="border-b border-line pb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">
                  Pattern 3 · High-Frequency Verbs
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-ink">
                  Past vs Present Verb Paradigms
                </h2>
                <p className="mt-1 text-sm text-muted">
                  The 5 most frequent verbs in the Quran covering over 4,000 occurrences.
                </p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {VERB_PATTERNS.map((verb) => (
                  <div
                    key={verb.root}
                    className="rounded-xl border border-line bg-surface-soft p-4"
                  >
                    <div className="flex items-center justify-between border-b border-line pb-2">
                      <span className="text-xs font-bold text-muted">Root: {verb.root}</span>
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">
                        {verb.frequency}x
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-xs text-muted">Past (ماضي):</span>
                        <span className="font-quran text-lg text-ink font-semibold" dir="rtl">
                          {verb.past}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-xs text-muted">Present (مضارع):</span>
                        <span className="font-quran text-lg text-accent font-semibold" dir="rtl">
                          {verb.present}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-xs text-muted">Noun (مصدر):</span>
                        <span className="font-quran text-base text-ink" dir="rtl">
                          {verb.masdar}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-line pt-2 text-xs">
                      <p className="font-urdu text-sm font-semibold text-ink text-right" dir="rtl">
                        {verb.meaningUrdu}
                      </p>
                      <p className="mt-1 text-muted text-right">{verb.example.reference}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── TAB 3: SURAH READINESS ── */}
        {activeTab === "readiness" && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-ink">Surah Comprehension Readiness</h2>
              <p className="mt-1 text-sm text-muted">
                Track how much key vocabulary you understand in frequently recited prayer Surahs
                based on your current review history.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FREQUENT_SURAHS_PROFILES.map((profile) => {
                const readiness = calculateSurahVocabularyReadiness(
                  profile.surahNumber,
                  knownKeysSet,
                );
                return (
                  <div
                    key={profile.surahNumber}
                    className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-muted">
                            Surah {profile.surahNumber}
                          </p>
                          <h3 className="mt-0.5 text-lg font-semibold text-ink">
                            {profile.nameEnglish}
                          </h3>
                        </div>
                        <span className="font-quran text-2xl font-semibold text-accent" dir="rtl">
                          {profile.nameArabic}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {profile.totalAyahs} Ayahs · {profile.totalWords} Words
                      </p>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-muted">Vocabulary Understood</span>
                          <span className="text-ink">{readiness.readinessPercentage}%</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full rounded-full bg-line overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              readiness.stage === "ready"
                                ? "bg-emerald-600"
                                : readiness.stage === "growing"
                                  ? "bg-amber-500"
                                  : "bg-accent"
                            }`}
                            style={{ width: `${readiness.readinessPercentage}%` }}
                          />
                        </div>
                        <p className="mt-1.5 text-right text-[11px] text-muted">
                          {readiness.knownCount} / {readiness.totalKeyLemmas} key words known
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-line pt-3">
                      <Link
                        href={`/quran?surah=${profile.surahNumber}`}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-surface-soft py-2 text-xs font-semibold text-ink hover:border-accent hover:bg-accent-soft transition"
                      >
                        <BookOpen size={14} /> Read & Study
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
