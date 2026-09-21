"use client";

import type { Ayah, SurahSummary } from "@quran-feham/contracts";
import { UserSettingsSchema } from "@quran-feham/contracts";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  LoaderCircle,
  MessageCircleQuestion,
  Send,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { answerDeterministicTutor, type TutorReply } from "@/features/tutor/deterministic-tutor";
import { apiRequest, getSurah, getSurahs } from "@/lib/api";
import { PREVIEW_FATIHA, PREVIEW_SURAHS } from "@/lib/preview-data";
import { TUTOR_PRESETS } from "@/lib/prototype-learning-data";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  reply?: TutorReply;
}

const translationOptions = [
  { id: "ur.jalandhry", label: "Fateh Muhammad Jalandhry" },
  { id: "ur.junagarhi", label: "Muhammad Junagarhi" },
  { id: "ur.maududi", label: "Abul Ala Maududi" },
] as const;

export function AskWorkspace({
  initialSurahNumber = 1,
  initialAyahNumber = 1,
}: {
  initialSurahNumber?: number;
  initialAyahNumber?: number;
}) {
  const [surahs, setSurahs] = useState<SurahSummary[]>(PREVIEW_SURAHS);
  const [surahNumber, setSurahNumber] = useState(initialSurahNumber);
  const [ayahNumber, setAyahNumber] = useState(initialAyahNumber);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [translationEdition, setTranslationEdition] = useState("ur.jalandhry");
  const [translationSourceName, setTranslationSourceName] = useState("Jalandhry");
  const [loadingVerse, setLoadingVerse] = useState(true);
  const [verseError, setVerseError] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const nextMessageId = useRef(1);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedAyah = useMemo(
    () => ayahs.find((ayah) => ayah.ayahNumber === ayahNumber) ?? null,
    [ayahNumber, ayahs],
  );
  const selectedSurah = useMemo(
    () => surahs.find((surah) => surah.number === surahNumber) ?? null,
    [surahNumber, surahs],
  );
  const translationLabel =
    translationOptions.find((option) => option.id === translationEdition)?.label ??
    translationSourceName;

  useEffect(() => {
    let active = true;
    getSurahs()
      .then((items) => {
        if (active && items.length > 0) setSurahs(items);
      })
      .catch(() => undefined);
    apiRequest("/users/settings")
      .then((value) => {
        if (!active) return;
        const parsed = UserSettingsSchema.safeParse(value);
        if (
          parsed.success &&
          translationOptions.some((option) => option.id === parsed.data.translationEditionId)
        ) {
          setTranslationEdition(parsed.data.translationEditionId);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingVerse(true);
    setVerseError("");
    setAyahs([]);
    getSurah(surahNumber, translationEdition, "ar.alafasy")
      .then((response) => {
        if (!active) return;
        setAyahs(response.ayahs);
        setTranslationSourceName(response.translationSource?.edition ?? translationLabel);
        const maximum = response.ayahs.length;
        setAyahNumber((current) => Math.min(Math.max(1, current), maximum));
      })
      .catch(() => {
        if (!active) return;
        if (surahNumber === 1) {
          setAyahs(PREVIEW_FATIHA);
          setAyahNumber((current) => Math.min(Math.max(1, current), PREVIEW_FATIHA.length));
          setVerseError(
            "Live Quran data is unavailable. Showing the clearly labelled local Al-Fatihah interface preview.",
          );
        } else {
          setVerseError("This ayah could not be loaded from the Quran provider. Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoadingVerse(false);
      });
    return () => {
      active = false;
    };
    // The resolved source name is display-only and must not trigger a data reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahNumber, translationEdition]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  function changeSurah(next: number) {
    setSurahNumber(next);
    setAyahNumber(1);
    setMessages([]);
  }

  function changeTranslation(next: string) {
    setTranslationEdition(next);
    setMessages([]);
  }

  function askTutor(value: string) {
    const prompt = value.trim();
    if (!prompt || !selectedAyah) return;
    const reply = answerDeterministicTutor(prompt, {
      arabic: selectedAyah.arabic,
      translation: selectedAyah.translation,
      translationName: translationSourceName || translationLabel,
    });
    const userMessage: ChatMessage = {
      id: nextMessageId.current++,
      role: "user",
      text: prompt,
    };
    const assistantMessage: ChatMessage = {
      id: nextMessageId.current++,
      role: "assistant",
      text: reply.text,
      reply,
    };
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setQuestion("");
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    askTutor(question);
  }

  const maximumAyah = ayahs.length || selectedSurah?.ayahCount || 1;

  return (
    <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-10 lg:py-10">
      <div className="min-w-0">
        <section className="border border-line bg-surface" aria-labelledby="selected-ayah-heading">
          <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[1fr_8rem] sm:p-5">
            <div>
              <label
                htmlFor="tutor-surah"
                className="text-xs font-bold uppercase tracking-[0.12em] text-muted"
              >
                Surah
              </label>
              <select
                id="tutor-surah"
                value={surahNumber}
                onChange={(event) => changeSurah(Number(event.target.value))}
                className="mt-1 min-h-11 w-full rounded-xl border border-line bg-surface px-3 font-semibold"
              >
                {surahs.map((surah) => (
                  <option key={surah.number} value={surah.number}>
                    {surah.number}. {surah.nameEnglish} · {surah.nameTranslation}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="tutor-ayah"
                className="text-xs font-bold uppercase tracking-[0.12em] text-muted"
              >
                Ayah
              </label>
              <select
                id="tutor-ayah"
                value={Math.min(ayahNumber, maximumAyah)}
                onChange={(event) => {
                  setAyahNumber(Number(event.target.value));
                  setMessages([]);
                }}
                disabled={loadingVerse || ayahs.length === 0}
                className="mt-1 min-h-11 w-full rounded-xl border border-line bg-surface px-3 font-semibold disabled:opacity-60"
              >
                {Array.from({ length: maximumAyah }, (_, index) => index + 1).map((number) => (
                  <option key={number} value={number}>
                    {number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-source">
                  Current verse
                </p>
                <h2 id="selected-ayah-heading" className="mt-1 text-lg font-semibold">
                  {selectedSurah?.nameEnglish ?? `Surah ${surahNumber}`} {surahNumber}:{ayahNumber}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous ayah"
                  onClick={() => {
                    setAyahNumber((current) => Math.max(1, current - 1));
                    setMessages([]);
                  }}
                  disabled={ayahNumber <= 1 || loadingVerse}
                  className="grid size-11 place-items-center rounded-xl border border-line text-muted hover:bg-surface-soft disabled:opacity-35"
                >
                  <ArrowLeft aria-hidden="true" size={19} />
                </button>
                <button
                  type="button"
                  aria-label="Next ayah"
                  onClick={() => {
                    setAyahNumber((current) => Math.min(maximumAyah, current + 1));
                    setMessages([]);
                  }}
                  disabled={ayahNumber >= maximumAyah || loadingVerse}
                  className="grid size-11 place-items-center rounded-xl border border-line text-muted hover:bg-surface-soft disabled:opacity-35"
                >
                  <ArrowRight aria-hidden="true" size={19} />
                </button>
              </div>
            </div>

            {loadingVerse ? (
              <div className="grid min-h-48 place-items-center text-muted" aria-live="polite">
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle aria-hidden="true" size={20} className="animate-spin" /> Loading
                  ayah
                </span>
              </div>
            ) : selectedAyah ? (
              <>
                {verseError && (
                  <p className="mt-5 border-l-4 border-warning bg-surface-soft px-4 py-3 text-sm leading-6 text-muted">
                    {verseError}
                  </p>
                )}
                <p
                  className="font-quran mt-7 text-right text-3xl leading-[2] sm:text-4xl"
                  lang="ar"
                  dir="rtl"
                >
                  {selectedAyah.arabic}
                </p>
                <div className="mt-6 border-t border-line pt-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-source">
                    Runtime translation · {translationSourceName}
                  </p>
                  <p
                    className="font-urdu mt-3 text-right text-lg leading-9 text-muted"
                    lang="ur"
                    dir="rtl"
                  >
                    {selectedAyah.translation ?? "منتخب ترجمہ اس وقت دستیاب نہیں ہے۔"}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <select
                    aria-label="Translation edition"
                    value={translationEdition}
                    onChange={(event) => changeTranslation(event.target.value)}
                    className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm"
                  >
                    {translationOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Link
                    href={`/quran?surah=${surahNumber}&ayah=${ayahNumber}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-accent hover:bg-accent-soft"
                  >
                    <BookOpenText aria-hidden="true" size={18} /> Open in Quran
                  </Link>
                </div>
              </>
            ) : (
              <p className="my-10 border border-danger px-4 py-3 text-sm text-danger" role="alert">
                {verseError || "The selected ayah is unavailable."}
              </p>
            )}
          </div>
        </section>

        <fieldset className="mt-5 flex min-w-0 gap-2 overflow-x-auto border-0 p-0 pb-1">
          <legend className="sr-only">Tutor prompts</legend>
          {TUTOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => askTutor(preset)}
              disabled={!selectedAyah}
              className="font-urdu min-h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-sm hover:border-accent hover:bg-accent-soft disabled:opacity-50"
              lang="ur"
              dir="rtl"
            >
              {preset}
            </button>
          ))}
        </fieldset>

        <section
          className="mt-4 border border-line bg-surface"
          aria-labelledby="conversation-heading"
        >
          <div className="flex items-center gap-2 border-b border-line px-4 py-3 sm:px-5">
            <MessageCircleQuestion aria-hidden="true" size={19} className="text-accent" />
            <h2 id="conversation-heading" className="font-semibold">
              Ask about this ayah
            </h2>
          </div>
          <div className="max-h-[32rem] min-h-56 overflow-y-auto p-4 sm:p-5" aria-live="polite">
            {messages.length === 0 ? (
              <div className="mx-auto max-w-xl py-9 text-center">
                <p className="font-semibold">Start with a focused question</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Ask for easy Urdu, word-by-word help, a reviewed root, or available grammar tags.
                  Unsourced tafsir and religious rulings are refused.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-accent-soft px-4 py-3 sm:max-w-[75%]"
                        : `max-w-[94%] border-l-4 bg-surface-soft px-4 py-4 sm:max-w-[85%] ${
                            message.reply?.kind === "refusal" ? "border-warning" : "border-accent"
                          }`
                    }
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.11em] text-muted">
                      {message.role === "user" ? "You" : message.reply?.label}
                    </p>
                    <p
                      className={`mt-2 whitespace-pre-line leading-8 ${message.role === "assistant" ? "font-urdu text-right" : "font-urdu text-right"}`}
                      lang="ur"
                      dir="rtl"
                    >
                      {message.text}
                    </p>
                  </article>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
          <form onSubmit={submitQuestion} className="flex gap-2 border-t border-line p-3 sm:p-4">
            <label htmlFor="tutor-question" className="sr-only">
              Ask about the selected ayah
            </label>
            <input
              id="tutor-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="اس آیت یا لفظ کے بارے میں پوچھیں…"
              className="font-urdu min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-canvas px-4 text-right placeholder:text-muted"
              lang="ur"
              dir="rtl"
            />
            <button
              type="submit"
              disabled={!selectedAyah || question.trim().length === 0}
              className="grid size-12 shrink-0 place-items-center rounded-xl bg-action text-on-action hover:bg-action-hover disabled:opacity-50"
              aria-label="Ask"
            >
              <Send aria-hidden="true" size={19} />
            </button>
          </form>
        </section>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-6">
        <section className="border border-line bg-surface p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" size={20} className="text-accent" />
            <h2 className="font-semibold">What is live now</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            This is the restored deterministic V1 tutor. It uses the selected provider ayah,
            selected named translation, and the limited reviewed learner pack. It is not the future
            full AI tutor.
          </p>
        </section>
        <section className="border-l-4 border-source bg-surface px-5 py-4">
          <h2 className="font-semibold">Authority order</h2>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-muted">
            <li>1. Quran text</li>
            <li>2. Named translation</li>
            <li>3. Approved tafsir — not connected yet</li>
            <li>4. Hanafi note — not connected yet</li>
            <li>5. Quran Feham teaching aid</li>
          </ol>
        </section>
      </aside>
    </div>
  );
}
