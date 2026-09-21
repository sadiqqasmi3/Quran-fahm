"use client";

import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  type CircleCheck,
  Headphones,
  Languages,
  Mic2,
  Mosque,
  type RotateCcw,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, getCurrentUser } from "@/lib/api";
import { parseReadingPositionResponse } from "@/lib/reading-position";

interface HomeState {
  name: string;
  surahNumber: number;
  ayahNumber: number;
  due: number;
  reviewed: number;
  listeningTotal: number;
  listeningPercent: number | null;
}

const initialState: HomeState = {
  name: "",
  surahNumber: 1,
  ayahNumber: 1,
  due: 0,
  reviewed: 0,
  listeningTotal: 0,
  listeningPercent: null,
};

function readLocalLearning(): Pick<
  HomeState,
  "due" | "reviewed" | "listeningTotal" | "listeningPercent"
> {
  try {
    const mastery = JSON.parse(window.localStorage.getItem("qf_mastery_v1") ?? "{}") as Record<
      string,
      { dueAt?: number; reviews?: number }
    >;
    const listening = JSON.parse(window.localStorage.getItem("qf_listen_v1") ?? "{}") as {
      correct?: number;
      total?: number;
    };
    const entries = Object.values(mastery);
    const total = Number(listening.total ?? 0);
    return {
      due: entries.filter((item) => !item.dueAt || item.dueAt <= Date.now()).length,
      reviewed: entries.filter((item) => Number(item.reviews ?? 0) > 0).length,
      listeningTotal: total,
      listeningPercent:
        total > 0 ? Math.round((Number(listening.correct ?? 0) / total) * 100) : null,
    };
  } catch {
    return { due: 0, reviewed: 0, listeningTotal: 0, listeningPercent: null };
  }
}

export function HomeDashboard() {
  const [state, setState] = useState<HomeState>(initialState);

  useEffect(() => {
    let active = true;
    const local = readLocalLearning();
    setState((current) => ({ ...current, ...local }));
    Promise.allSettled([getCurrentUser(), apiRequest("/users/reading-position")]).then(
      ([userResult, positionResult]) => {
        if (!active) return;
        setState((current) => {
          const next = { ...current };
          if (userResult.status === "fulfilled") {
            next.name = userResult.value.displayName?.trim() ?? "";
          }
          if (positionResult.status === "fulfilled") {
            const position = parseReadingPositionResponse(positionResult.value);
            if (position) {
              next.surahNumber = position.surahNumber;
              next.ayahNumber = position.ayahNumber;
            }
          }
          return next;
        });
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const continueHref = `/quran?surah=${state.surahNumber}&ayah=${state.ayahNumber}`;

  return (
    <div className="mx-auto w-full max-w-[92rem] px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
      <header className="border-b border-line pb-7 sm:flex sm:items-end sm:justify-between sm:gap-8">
        <div>
          <p className="text-sm font-semibold text-accent">Quran Feham · قرآن فہم</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            {state.name ? `${state.name}, what will you do` : "What will you do"} with Quran today?
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            Read, understand, practise, or join your family—start with one meaningful action.
          </p>
        </div>
        <p className="mt-5 flex shrink-0 items-center gap-2 text-sm text-muted sm:mt-0">
          <CalendarDays aria-hidden="true" size={17} />
          {new Intl.DateTimeFormat("en-PK", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(new Date())}
        </p>
      </header>

      <section className="mt-7 grid overflow-hidden rounded-[1.5rem] border border-line bg-surface lg:grid-cols-[1.35fr_0.65fr]">
        <div className="p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Continue reading
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Surah {state.surahNumber}
          </h2>
          <p className="mt-2 text-lg text-muted">Continue from ayah {state.ayahNumber}</p>
          <Link
            href={continueHref}
            className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
          >
            Continue reading <ArrowRight aria-hidden="true" size={19} />
          </Link>
        </div>
        <div className="flex min-h-56 items-center justify-center border-t border-line bg-accent-soft px-8 py-9 text-center lg:border-l lg:border-t-0">
          <div>
            <p
              className="font-quran text-4xl leading-[2] text-accent sm:text-5xl"
              lang="ar"
              dir="rtl"
            >
              وَقُل رَّبِّ زِدْنِي عِلْمًا
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              “My Lord, increase me in knowledge.” · 20:114
            </p>
          </div>
        </div>
      </section>

      <section className="mt-11" aria-labelledby="today-actions">
        <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Your next actions
            </p>
            <h2 id="today-actions" className="mt-1 text-2xl font-semibold tracking-[-0.025em]">
              Today
            </h2>
          </div>
          <Link
            href="/progress"
            className="min-h-11 content-center text-sm font-semibold text-accent hover:underline"
          >
            View progress
          </Link>
        </div>
        <div className="divide-y divide-line">
          <ActionRow
            icon={Languages}
            eyebrow="Understand"
            title={
              state.due > 0
                ? `${state.due} words are ready for review`
                : "Start a 10-minute Quran lesson"
            }
            body={
              state.reviewed > 0
                ? `${state.reviewed} Quranic words have learning history on this device.`
                : "Arabic word → Urdu meaning → phrase → listening → review."
            }
            href="/learn"
            action={state.due > 0 ? "Review now" : "Start lesson"}
          />
          <ActionRow
            icon={Headphones}
            eyebrow="Listen"
            title="Train meaning recognition by ear"
            body={
              state.listeningPercent === null
                ? "Hear a real recitation, then identify its Urdu meaning."
                : `${state.listeningPercent}% across ${state.listeningTotal} answered listening prompts.`
            }
            href="/recite?mode=listen"
            action="Practise listening"
          />
          <ActionRow
            icon={Mic2}
            eyebrow="Recite"
            title="Recitation Assist is being built in stages"
            body="Listening practice works now. Live microphone alignment and correction are not yet enabled."
            href="/recite"
            action="See recitation modes"
          />
          <ActionRow
            icon={UsersRound}
            eyebrow="Together"
            title="Family Khatm Rooms"
            body="Signed-in members can create, join, claim, read, and complete Paras. Push updates and reminders come later."
            href="/khatm"
            action="Open Khatm"
          />
          <ActionRow
            icon={Mosque}
            eyebrow="Salah"
            title="Understand what you already recite every day"
            body="Begin with Al-Fatihah, short surahs, and the vocabulary of Salah."
            href="/salah"
            action="Continue Salah"
          />
        </div>
      </section>

      <section className="mt-11 border-t border-line pt-7" aria-labelledby="four-pillars">
        <h2 id="four-pillars" className="sr-only">
          The four pillars
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [Languages, "Understand", "Build direct Quranic Arabic comprehension."],
            [BookOpenText, "Read", "Use Quran Feham as your everyday Quran."],
            [Mic2, "Recite", "Practise with quiet, intelligent assistance."],
            [UsersRound, "Together", "Complete Quran with family and community."],
          ].map(([Icon, title, body]) => {
            const PillarIcon = Icon as typeof CircleCheck;
            return (
              <article key={String(title)} className="border-l-2 border-accent px-4 py-2">
                <PillarIcon aria-hidden="true" className="text-accent" size={21} />
                <h3 className="mt-4 font-semibold">{String(title)}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{String(body)}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ActionRow({
  icon: Icon,
  eyebrow,
  title,
  body,
  href,
  action,
}: {
  icon: typeof RotateCcw;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  action: string;
}) {
  return (
    <article className="grid gap-4 py-6 sm:grid-cols-[3rem_1fr_auto] sm:items-center">
      <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
        <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{eyebrow}</p>
        <h3 className="mt-1 text-lg font-semibold">{title}</h3>
        <p className="mt-1 max-w-3xl leading-7 text-muted">{body}</p>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-11 items-center gap-2 font-semibold text-accent hover:underline"
      >
        {action} <ArrowRight aria-hidden="true" size={18} />
      </Link>
    </article>
  );
}
