"use client";

import type { SurahResponse, SurahSummary } from "@quran-feham/contracts";
import {
  AlertCircle,
  BadgeCheck,
  BookOpenText,
  Ear,
  Eye,
  Headphones,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSurah, getSurahs } from "@/lib/api";
import {
  getListenStats,
  type ListenStats as ListeningStats,
  listenPercent,
  recordListen,
} from "@/lib/learning-store";

interface ListeningQuestion {
  ayahNumber: number;
  arabic: string;
  translation: string;
  audioUrl: string;
  choices: string[];
  surahName: string;
}

const emptyStats: ListeningStats = { correct: 0, total: 0 };

const plannedModes = [
  {
    name: "Follow Me",
    description: "Keep the text visible while Quran Feham follows your place word by word.",
  },
  {
    name: "Gentle Assist",
    description: "Stay quiet unless you are genuinely stuck, skip a word, or lose your place.",
  },
  {
    name: "Hifz Mode",
    description: "Hide the Quran and offer the next word only after a real hesitation.",
  },
  {
    name: "Correction Mode",
    description: "Flag meaningful sequence mistakes while still allowing self-correction.",
  },
  {
    name: "Exam Mode",
    description: "Give no help during recitation, then show an evidence-based report at the end.",
  },
] as const;

function shuffle<T>(values: readonly T[]): T[] {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex] as T, next[index] as T];
  }
  return next;
}

function uniqueTranslations(responses: SurahResponse[]): string[] {
  return responses
    .flatMap((response) => response.ayahs)
    .map((ayah) => ayah.translation?.trim() ?? "")
    .filter(
      (translation, index, all) => Boolean(translation) && all.indexOf(translation) === index,
    );
}

export function ReciteListeningPractice() {
  const [surahs, setSurahs] = useState<SurahSummary[]>([]);
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [question, setQuestion] = useState<ListeningQuestion | null>(null);
  const [sourceData, setSourceData] = useState<SurahResponse | null>(null);
  const [stats, setStats] = useState<ListeningStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealedArabic, setRevealedArabic] = useState(false);
  const [revealedUrdu, setRevealedUrdu] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const requestId = useRef(0);
  const previousAyah = useRef<number | null>(null);

  const prepareQuestion = useCallback(async (surahNumber: number) => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setLoading(true);
    setError("");
    setQuestion(null);
    setSourceData(null);
    setSelectedChoice(null);
    setRevealedArabic(false);
    setRevealedUrdu(false);

    try {
      const response = await getSurah(surahNumber);
      if (requestId.current !== currentRequest) return;

      const candidates = response.ayahs.filter(
        (ayah) => Boolean(ayah.translation?.trim()) && Boolean(ayah.audioUrl),
      );
      if (candidates.length === 0) {
        throw new Error(
          "This Surah does not currently have both Urdu translation and recitation audio.",
        );
      }

      const withoutImmediateRepeat = candidates.filter(
        (ayah) => candidates.length === 1 || ayah.ayahNumber !== previousAyah.current,
      );
      const candidatePool = withoutImmediateRepeat.length > 0 ? withoutImmediateRepeat : candidates;
      const ayah = candidatePool[Math.floor(Math.random() * candidatePool.length)];
      if (!ayah?.translation || !ayah.audioUrl) {
        throw new Error("A complete listening prompt could not be prepared.");
      }

      const sourceResponses = [response];
      if (uniqueTranslations(sourceResponses).length < 4 && surahNumber !== 1) {
        sourceResponses.push(await getSurah(1));
      }
      if (requestId.current !== currentRequest) return;

      const distractors = shuffle(
        uniqueTranslations(sourceResponses).filter(
          (translation) => translation !== ayah.translation,
        ),
      ).slice(0, 3);
      if (distractors.length < 3) {
        throw new Error("Four distinct translation choices are not available for this prompt.");
      }

      previousAyah.current = ayah.ayahNumber;
      setQuestion({
        ayahNumber: ayah.ayahNumber,
        arabic: ayah.arabic,
        translation: ayah.translation,
        audioUrl: ayah.audioUrl,
        choices: shuffle([ayah.translation, ...distractors]),
        surahName: response.surah.nameEnglish,
      });
      setSourceData(response);
    } catch (cause) {
      if (requestId.current !== currentRequest) return;
      setError(
        cause instanceof Error ? cause.message : "The listening prompt could not be loaded.",
      );
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setStats(getListenStats(window.localStorage));
    let active = true;
    getSurahs()
      .then((items) => {
        if (active) setSurahs(items);
      })
      .catch(() => {
        // The selected Surah can still load even if the index request fails.
      })
      .finally(() => {
        if (active) setListLoading(false);
      });
    void prepareQuestion(1);
    return () => {
      active = false;
      requestId.current += 1;
    };
  }, [prepareQuestion]);

  function answer(choice: string) {
    if (!question || selectedChoice) return;
    const correct = choice === question.translation;
    setSelectedChoice(choice);
    setRevealedArabic(true);
    setRevealedUrdu(true);
    const next = recordListen(window.localStorage, correct);
    setStats(next);
    window.dispatchEvent(new CustomEvent("qf:listening", { detail: next }));
  }

  const score = stats.total > 0 ? listenPercent(stats) : null;

  return (
    <div className="mx-auto w-full max-w-[92rem] px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
      <header className="border-b border-line pb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
          Recite · Listen now
        </p>
        <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Train your ear first.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Hear a real Qari recitation, then choose the closest established Urdu translation.
              Arabic stays hidden until you ask for it.
            </p>
          </div>
          <div className="flex shrink-0 gap-6 border-l-2 border-accent pl-4">
            <div>
              <p className="text-2xl font-semibold">{score === null ? "—" : `${score}%`}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                Accuracy
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.total}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                Answered
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-7" aria-labelledby="listening-practice-heading">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="grid gap-2 text-sm font-semibold" htmlFor="listening-surah">
            Practise a Surah
            <select
              id="listening-surah"
              className="min-h-12 w-full rounded-xl border bg-surface px-3 text-ink disabled:opacity-60"
              value={selectedSurah}
              disabled={listLoading}
              onChange={(event) => {
                const next = Number(event.target.value);
                setSelectedSurah(next);
                previousAyah.current = null;
                void prepareQuestion(next);
              }}
            >
              {surahs.length > 0 ? (
                surahs.map((surah) => (
                  <option key={surah.number} value={surah.number}>
                    {surah.number}. {surah.nameEnglish} · {surah.nameArabic}
                  </option>
                ))
              ) : (
                <option value={1}>1. Al-Fatihah</option>
              )}
            </select>
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={() => void prepareQuestion(selectedSurah)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 font-semibold text-ink hover:bg-surface-soft disabled:cursor-wait disabled:opacity-60"
          >
            <RotateCcw aria-hidden="true" size={18} className={loading ? "animate-spin" : ""} />
            New ayah
          </button>
        </div>

        <h2 id="listening-practice-heading" className="sr-only">
          Listening comprehension practice
        </h2>
        {loading ? (
          <div className="mt-5 grid min-h-80 place-items-center rounded-[1.5rem] border border-line bg-surface px-5 text-center">
            <div>
              <LoaderCircle
                aria-hidden="true"
                className="mx-auto animate-spin text-accent"
                size={32}
              />
              <p className="mt-4 font-semibold">Preparing a recitation…</p>
              <p className="mt-1 text-sm text-muted">
                Loading Quran, Urdu translation, and audio sources.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="mt-5 rounded-[1.5rem] border border-danger/35 bg-surface p-6 sm:p-8">
            <div className="flex gap-3">
              <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0 text-danger" size={22} />
              <div>
                <h2 className="font-semibold">Listening practice is temporarily unavailable</h2>
                <p className="mt-2 leading-7 text-muted">{error}</p>
                <button
                  type="button"
                  onClick={() => void prepareQuestion(selectedSurah)}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-action px-4 font-semibold text-on-action hover:bg-action-hover"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : question ? (
          <div className="mt-5 grid overflow-hidden rounded-[1.5rem] border border-line bg-surface xl:grid-cols-[minmax(0,0.9fr)_minmax(24rem,1.1fr)]">
            <div className="flex flex-col items-center justify-center bg-accent-soft px-5 py-8 text-center sm:px-10 sm:py-12">
              <span className="grid size-14 place-items-center rounded-full bg-surface text-accent shadow-sm">
                <Headphones aria-hidden="true" size={27} />
              </span>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-muted">
                {question.surahName} · Ayah {question.ayahNumber}
              </p>
              <audio
                key={question.audioUrl}
                className="mt-5 w-full max-w-md"
                controls
                preload="metadata"
                src={question.audioUrl}
                aria-label={`Recitation of ${question.surahName}, ayah ${question.ayahNumber}`}
              >
                <track
                  default
                  kind="captions"
                  label="Arabic Quran text"
                  srcLang="ar"
                  src={`data:text/vtt;charset=utf-8,${encodeURIComponent(`WEBVTT\n\n00:00:00.000 --> 00:10:00.000\n${question.arabic}`)}`}
                />
                Your browser does not support audio playback.
              </audio>

              <div className="mt-7 min-h-24 w-full max-w-2xl border-t border-line pt-6">
                {revealedArabic ? (
                  <p
                    className="font-quran text-3xl leading-[2] text-ink sm:text-4xl"
                    lang="ar"
                    dir="rtl"
                  >
                    {question.arabic}
                  </p>
                ) : (
                  <p className="mx-auto max-w-md text-sm leading-6 text-muted">
                    Listen without reading first. Reveal the Arabic only if you need help locating
                    the words.
                  </p>
                )}
              </div>

              <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setRevealedArabic(true)}
                  disabled={revealedArabic}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-soft disabled:opacity-60"
                >
                  <Eye aria-hidden="true" size={17} />
                  {revealedArabic ? "Arabic revealed" : "Reveal Arabic"}
                </button>
                <button
                  type="button"
                  onClick={() => setRevealedUrdu(true)}
                  disabled={revealedUrdu}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-soft disabled:opacity-60"
                >
                  <BookOpenText aria-hidden="true" size={17} />
                  {revealedUrdu ? "Urdu revealed" : "Reveal Urdu"}
                </button>
              </div>

              {revealedUrdu ? (
                <div className="mt-5 w-full max-w-2xl rounded-xl bg-surface p-4">
                  <p className="font-urdu text-xl leading-[2] text-ink" lang="ur" dir="rtl">
                    {question.translation}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="p-5 sm:p-8 lg:p-10">
              <div className="flex items-center gap-2 text-accent">
                <Ear aria-hidden="true" size={20} />
                <p className="text-xs font-bold uppercase tracking-[0.14em]">Meaning recognition</p>
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">
                What did you understand?
              </h2>
              <p className="mt-2 leading-7 text-muted">
                Choose the closest established translation.
              </p>

              <fieldset className="mt-6 grid gap-3">
                <legend className="sr-only">Urdu translation choices</legend>
                {question.choices.map((choice, index) => {
                  const answered = selectedChoice !== null;
                  const isCorrect = choice === question.translation;
                  const isSelected = choice === selectedChoice;
                  const answerStyle = answered
                    ? isCorrect
                      ? "border-accent bg-accent-soft"
                      : isSelected
                        ? "border-danger bg-surface-soft"
                        : "border-line bg-surface opacity-65"
                    : "border-line bg-surface hover:border-accent hover:bg-accent-soft";
                  return (
                    <button
                      key={choice}
                      type="button"
                      disabled={answered}
                      onClick={() => answer(choice)}
                      className={`grid min-h-16 grid-cols-[2rem_1fr] items-center gap-3 rounded-xl border p-3 text-left transition-colors disabled:cursor-default ${answerStyle}`}
                    >
                      <span className="grid size-8 place-items-center rounded-full border border-line text-sm font-semibold">
                        {index + 1}
                      </span>
                      <span className="font-urdu text-base leading-8" lang="ur" dir="rtl">
                        {choice}
                      </span>
                    </button>
                  );
                })}
              </fieldset>

              {selectedChoice ? (
                <div className="mt-6 border-t border-line pt-5">
                  <div className="flex items-start gap-3">
                    {selectedChoice === question.translation ? (
                      <BadgeCheck
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-accent"
                        size={22}
                      />
                    ) : (
                      <Volume2
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-warning"
                        size={22}
                      />
                    )}
                    <div>
                      <p className="font-semibold">
                        {selectedChoice === question.translation
                          ? "Correct — you recognised the meaning by ear."
                          : "Review the translation, then replay the recitation."}
                      </p>
                      <button
                        type="button"
                        onClick={() => void prepareQuestion(selectedSurah)}
                        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-action px-4 font-semibold text-on-action hover:bg-action-hover"
                      >
                        Next ayah
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {sourceData ? (
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs leading-5 text-muted">
            <span>
              Translation: {sourceData.translationSource?.edition ?? "unavailable"} ·{" "}
              {sourceData.translationSource?.provider ?? ""}
            </span>
            <span>
              Recitation: {sourceData.recitationSource?.edition ?? "unavailable"} ·{" "}
              {sourceData.recitationSource?.provider ?? ""}
            </span>
            {sourceData.warnings.map((warning) => (
              <span key={warning} className="text-warning">
                {warning}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section
        className="mt-14 border-t border-line pt-8"
        aria-labelledby="recitation-roadmap-heading"
      >
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-accent">
            <Sparkles aria-hidden="true" size={19} />
            <p className="text-xs font-bold uppercase tracking-[0.14em]">
              Recitation Assist roadmap
            </p>
          </div>
          <h2
            id="recitation-roadmap-heading"
            className="mt-2 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl"
          >
            The teacher-beside-you experience is not live yet.
          </h2>
          <p className="mt-3 leading-7 text-muted">
            Listening comprehension above works today. Microphone alignment, hesitation detection,
            word correction, Hifz prompts, and exam reports still require the Quran-specific speech
            engine. This page will not pretend your microphone is being assessed.
          </p>
        </div>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {plannedModes.map((mode) => (
            <article
              key={mode.name}
              className="grid gap-3 py-5 sm:grid-cols-[10rem_1fr_auto] sm:items-center"
            >
              <h3 className="font-semibold">{mode.name}</h3>
              <p className="leading-7 text-muted">{mode.description}</p>
              <span className="w-fit rounded-full bg-surface-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-muted">
                Planned · not live
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
