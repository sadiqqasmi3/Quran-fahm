"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookOpenText,
  CalendarDays,
  type CircleCheck,
  Headphones,
  HelpCircle,
  Languages,
  Mic2,
  Mosque,
  type RotateCcw,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, getCurrentUser } from "@/lib/api";
import { useLocale } from "@/lib/i18n/locale-context";
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
  const { t, isUrdu, dir } = useLocale();

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
          <p className="text-sm font-semibold text-accent">{t("appName")} · قرآن فہم</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            {isUrdu
              ? state.name
                ? `محترم ${state.name}، ${t("homeGreeting")}`
                : t("homeGreeting")
              : state.name
                ? `${state.name}, what will you do with Quran today?`
                : "What will you do with Quran today?"}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            {t("homeSubGreeting")}
          </p>
        </div>
        <p className="mt-5 flex shrink-0 items-center gap-2 text-sm text-muted sm:mt-0">
          <CalendarDays aria-hidden="true" size={17} />
          {new Intl.DateTimeFormat(isUrdu ? "ur-PK" : "en-PK", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(new Date())}
        </p>
      </header>

      {/* Main Action Banner */}
      <section className="mt-7 grid overflow-hidden rounded-[1.5rem] border border-line bg-surface lg:grid-cols-[1.35fr_0.65fr]">
        <div className="p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            {t("homeContinueReading")}
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            {isUrdu ? `سورۃ نمبر ${state.surahNumber}` : `Surah ${state.surahNumber}`}
          </h2>
          <p className="mt-2 text-lg text-muted">
            {isUrdu ? `آیت نمبر ${state.ayahNumber} سے تلاوت شروع کریں` : `Continue from ayah ${state.ayahNumber}`}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={continueHref}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover transition"
            >
              <span>{t("homeContinueReading")}</span>
              {isUrdu ? <ArrowLeft aria-hidden="true" size={19} /> : <ArrowRight aria-hidden="true" size={19} />}
            </Link>
            <Link
              href="/mushaf"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-line bg-surface px-5 font-semibold text-ink hover:border-accent transition"
            >
              <BookOpen size={19} className="text-accent" />
              <span>{t("navMushaf")}</span>
            </Link>
          </div>
        </div>
        <div className="flex min-h-56 items-center justify-center border-t border-line bg-accent-soft px-8 py-9 text-center lg:border-l rtl:lg:border-l-0 rtl:lg:border-r lg:border-t-0">
          <div>
            <p
              className="font-quran text-4xl leading-[2] text-accent sm:text-5xl"
              lang="ar"
              dir="rtl"
            >
              وَقُل رَّبِّ زِدْنِي عِلْمًا
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              {isUrdu ? "”اور کہو: اے میرے رب! مجھے علم میں زیادہ کر۔“ · طٰہٰ: ۱۱۴" : "“My Lord, increase me in knowledge.” · 20:114"}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Action Rows */}
      <section className="mt-11" aria-labelledby="today-actions">
        <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              {isUrdu ? "روزمرہ کے معمولات" : "Your next actions"}
            </p>
            <h2 id="today-actions" className="mt-1 text-2xl font-semibold tracking-[-0.025em]">
              {isUrdu ? "آج کے مواقع" : "Today"}
            </h2>
          </div>
          <Link
            href="/progress"
            className="min-h-11 content-center text-sm font-semibold text-accent hover:underline"
          >
            {t("navProgress")}
          </Link>
        </div>
        <div className="divide-y divide-line">
          {/* 15-Line Mushaf */}
          <ActionRow
            icon={BookOpen}
            eyebrow={t("navMushaf")}
            title={t("homeMushafCardTitle")}
            body={t("homeMushafCardDesc")}
            href="/mushaf"
            action={t("open")}
            isUrdu={isUrdu}
          />
          {/* Learn Vocabulary */}
          <ActionRow
            icon={Languages}
            eyebrow={t("navLearn")}
            title={
              state.due > 0
                ? isUrdu
                  ? `${state.due} الفاظ دہرائی کے لیے تیار ہیں`
                  : `${state.due} words are ready for review`
                : t("homeLearnCardTitle")
            }
            body={
              state.reviewed > 0
                ? isUrdu
                  ? `${state.reviewed} قرآنی کلمات اس ڈیوائس پر محفوظ ہو چکے ہیں۔`
                  : `${state.reviewed} Quranic words have learning history on this device.`
                : t("homeLearnCardDesc")
            }
            href="/learn"
            action={state.due > 0 ? (isUrdu ? "دہرائی کریں" : "Review now") : t("open")}
            isUrdu={isUrdu}
          />
          {/* Khatm Rooms */}
          <ActionRow
            icon={UsersRound}
            eyebrow={t("navKhatm")}
            title={t("homeKhatmCardTitle")}
            body={t("homeKhatmCardDesc")}
            href="/khatm"
            action={t("open")}
            isUrdu={isUrdu}
          />
          {/* Listening & Recitation */}
          <ActionRow
            icon={Headphones}
            eyebrow={t("navRecite")}
            title={t("homeReciteCardTitle")}
            body={
              state.listeningPercent === null
                ? t("homeReciteCardDesc")
                : isUrdu
                  ? `سماعت کی درستگی: ${state.listeningPercent}% (${state.listeningTotal} سوالات کے جوابات)`
                  : `${state.listeningPercent}% across ${state.listeningTotal} answered listening prompts.`
            }
            href="/recite?mode=listen"
            action={t("open")}
            isUrdu={isUrdu}
          />
          {/* Salah */}
          <ActionRow
            icon={Mosque}
            eyebrow={t("navSalah")}
            title={t("homeSalahCardTitle")}
            body={t("homeSalahCardDesc")}
            href="/salah"
            action={t("open")}
            isUrdu={isUrdu}
          />
          {/* App Guide */}
          <ActionRow
            icon={HelpCircle}
            eyebrow={t("navGuide")}
            title={isUrdu ? "پورٹل استعمال کرنے کا طریقہ اور سوالات" : "How to use Quran Feham & FAQs"}
            body={
              isUrdu
                ? "ہر فیچر کے آسان مراحل، بزرگوں کے لیے گائیڈ اور فون پر ایپ بنانے کا طریقہ۔"
                : "Step-by-step guidance for non-tech users, elders, and mobile app installation."
            }
            href="/guide"
            action={t("open")}
            isUrdu={isUrdu}
          />
        </div>
      </section>

      {/* Four Pillars */}
      <section className="mt-11 border-t border-line pt-7" aria-labelledby="four-pillars">
        <h2 id="four-pillars" className="sr-only">
          {isUrdu ? "بنیادی ستون" : "The four pillars"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [
              Languages,
              t("navLearn"),
              isUrdu ? "قرآنی عربی کے الفاظ اور معانی کی بلا واسطہ سمجھ۔" : "Build direct Quranic Arabic comprehension.",
            ],
            [
              BookOpenText,
              t("navQuran"),
              isUrdu ? "روزمرہ تلاوت، لفظ بہ لفظ ترجمہ اور تفسیر۔" : "Use Quran Feham as your everyday Quran.",
            ],
            [
              Mic2,
              t("navRecite"),
              isUrdu ? "تلاوت سنیں اور درست ادائیگی کی مشق کریں۔" : "Practise with quiet, intelligent assistance.",
            ],
            [
              UsersRound,
              t("navKhatm"),
              isUrdu ? "خاندان اور احباب کے ساتھ باہمی ختم القرآن۔" : "Complete Quran with family and community.",
            ],
          ].map(([Icon, title, body]) => {
            const PillarIcon = Icon as typeof CircleCheck;
            return (
              <article key={String(title)} className="border-l-2 rtl:border-l-0 rtl:border-r-2 border-accent px-4 py-2">
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
  isUrdu,
}: {
  icon: typeof RotateCcw;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  action: string;
  isUrdu: boolean;
}) {
  return (
    <article className="grid gap-4 py-6 sm:grid-cols-[3rem_1fr_auto] sm:items-center">
      <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent shrink-0">
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
        <span>{action}</span>
        {isUrdu ? <ArrowLeft aria-hidden="true" size={18} /> : <ArrowRight aria-hidden="true" size={18} />}
      </Link>
    </article>
  );
}
