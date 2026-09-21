"use client";

import { ArrowRight, BookOpenText, Check, Ear, Eye, Languages, Mosque } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readMasteryMap } from "@/lib/learning-store";
import { LEARNING_PHRASES, LEARNING_WORDS, SALAH_SURAHS } from "@/lib/prototype-learning-data";

const salahSurahNames: Record<number, { english: string; arabic: string; purpose: string }> = {
  1: { english: "Al-Fatihah", arabic: "الفاتحة", purpose: "The opening recited in every rak‘ah" },
  108: {
    english: "Al-Kawthar",
    arabic: "الكوثر",
    purpose: "Read, listen, and connect its meaning",
  },
  112: {
    english: "Al-Ikhlas",
    arabic: "الإخلاص",
    purpose: "Build recognition of its central phrases",
  },
  113: {
    english: "Al-Falaq",
    arabic: "الفلق",
    purpose: "Understand the words of seeking protection",
  },
  114: { english: "An-Nas", arabic: "الناس", purpose: "Follow its repeated words and meanings" },
};

const futureSalahLessons = ["Ruku", "Sajdah", "Tashahhud", "Durood"] as const;

export function SalahComprehension() {
  const [recognizedKeys, setRecognizedKeys] = useState<Set<string>>(new Set());
  const [revealedPhrases, setRevealedPhrases] = useState<Set<string>>(new Set());

  useEffect(() => {
    function refreshProgress() {
      const mastery = readMasteryMap(window.localStorage);
      setRecognizedKeys(
        new Set(
          Object.entries(mastery)
            .filter(([, record]) => Number(record.strength ?? 0) >= 60)
            .map(([key]) => key),
        ),
      );
    }
    refreshProgress();
    window.addEventListener("storage", refreshProgress);
    window.addEventListener("qf:mastery", refreshProgress);
    return () => {
      window.removeEventListener("storage", refreshProgress);
      window.removeEventListener("qf:mastery", refreshProgress);
    };
  }, []);

  const fatihahWords = useMemo(() => LEARNING_WORDS.filter((word) => word.pack === "fatihah"), []);
  const fatihahPhrases = useMemo(
    () => LEARNING_PHRASES.filter((phrase) => phrase.id.startsWith("fatihah-")),
    [],
  );
  const recognized = fatihahWords.filter((word) => recognizedKeys.has(word.key)).length;
  const progress =
    fatihahWords.length > 0 ? Math.round((recognized / fatihahWords.length) * 100) : 0;

  function togglePhrase(id: string) {
    setRevealedPhrases((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto w-full max-w-[92rem] px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
      <header className="border-b border-line pb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
          Salah comprehension
        </p>
        <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Understand what you already recite every day.
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted sm:text-lg">
          Practise outside Salah so familiar Arabic phrases can begin to carry their meaning
          directly—without forcing a word-by-word translation during prayer.
        </p>
      </header>

      <section
        className="mt-7 grid overflow-hidden rounded-[1.5rem] border border-line bg-surface lg:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)]"
        aria-labelledby="fatihah-heading"
      >
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-2 text-accent">
            <Mosque aria-hidden="true" size={20} />
            <p className="text-xs font-bold uppercase tracking-[0.14em]">Begin with Al-Fatihah</p>
          </div>
          <h2 id="fatihah-heading" className="mt-3 text-3xl font-semibold tracking-[-0.035em]">
            {progress}% of this learner pack recognised
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-muted">
            {recognized} of {fatihahWords.length} prototype learner words currently have a
            recognition strength of 60 or above on this device. This is a learning estimate—not a
            measure of religious or Quranic knowledge.
          </p>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface-soft" aria-hidden="true">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/learn?pack=fatihah"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
            >
              <Languages aria-hidden="true" size={19} />
              Practise Al-Fatihah words
            </Link>
            <Link
              href="/quran?surah=1"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 font-semibold hover:bg-surface-soft"
            >
              <BookOpenText aria-hidden="true" size={19} />
              Read with translation
            </Link>
            <Link
              href="/recite?mode=listen"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 font-semibold hover:bg-surface-soft"
            >
              <Ear aria-hidden="true" size={19} />
              Practise by listening
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center border-t border-line bg-accent-soft px-7 py-9 text-center lg:border-l lg:border-t-0">
          <div>
            <p className="font-quran text-5xl leading-[1.9] text-accent" lang="ar" dir="rtl">
              الْحَمْدُ لِلَّهِ
            </p>
            <p className="font-urdu mt-3 text-lg leading-8 text-ink" lang="ur" dir="rtl">
              تمام تعریف اللہ کے لیے ہے
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Phrase recognition, not a score of faith
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="phrase-practice-heading">
        <div className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Quick practice
            </p>
            <h2
              id="phrase-practice-heading"
              className="mt-1 text-2xl font-semibold tracking-[-0.025em]"
            >
              Let the Arabic trigger its meaning
            </h2>
          </div>
          <p className="text-sm text-muted">Tap a phrase after recalling it yourself.</p>
        </div>
        <div className="grid gap-3 pt-5 md:grid-cols-2 xl:grid-cols-3">
          {fatihahPhrases.map((phrase) => {
            const revealed = revealedPhrases.has(phrase.id);
            return (
              <button
                key={phrase.id}
                type="button"
                aria-expanded={revealed}
                onClick={() => togglePhrase(phrase.id)}
                className="min-h-44 rounded-2xl border border-line bg-surface p-5 text-left hover:border-accent hover:bg-accent-soft"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                    {revealed ? "Meaning revealed" : "Recall first"}
                  </span>
                  {revealed ? (
                    <Check aria-hidden="true" className="text-accent" size={19} />
                  ) : (
                    <Eye aria-hidden="true" className="text-muted" size={19} />
                  )}
                </span>
                <span
                  className="font-quran mt-5 block text-right text-3xl leading-[1.8] text-ink"
                  lang="ar"
                  dir="rtl"
                >
                  {phrase.arabic}
                </span>
                <span
                  className={`font-urdu mt-3 block min-h-8 text-right text-base leading-8 ${revealed ? "text-ink" : "select-none blur-sm text-muted"}`}
                  lang="ur"
                  dir="rtl"
                >
                  {phrase.urdu}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="short-surahs-heading">
        <div className="border-b border-line pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Read what you recite
          </p>
          <h2 id="short-surahs-heading" className="mt-1 text-2xl font-semibold tracking-[-0.025em]">
            Common short Surahs
          </h2>
        </div>
        <div className="divide-y divide-line">
          {SALAH_SURAHS.filter((number) => number !== 1).map((number) => {
            const item = salahSurahNames[number];
            if (!item) return null;
            return (
              <Link
                key={number}
                href={`/quran?surah=${number}`}
                className="grid min-h-24 gap-2 py-5 hover:text-accent sm:grid-cols-[3rem_1fr_auto] sm:items-center sm:gap-4"
              >
                <span className="text-sm font-bold text-muted">{number}</span>
                <span>
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <strong className="text-lg">{item.english}</strong>
                    <span className="font-quran text-xl" lang="ar" dir="rtl">
                      {item.arabic}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-muted">{item.purpose}</span>
                </span>
                <span className="inline-flex min-h-11 items-center gap-2 font-semibold">
                  Open Surah <ArrowRight aria-hidden="true" size={18} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12 grid gap-6 border-t border-line pt-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
            Next reviewed content
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">
            The rest of the Salah journey
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-muted">
            Ruku, Sajdah, Tashahhud, and Durood belong here, but their source text and teaching
            notes must be reviewed before lessons are published. They are visible as scope, not
            presented as finished content.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {futureSalahLessons.map((lesson) => (
            <div key={lesson} className="rounded-xl bg-surface-soft p-4">
              <p className="font-semibold">{lesson}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-muted">
                Planned · source review
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
