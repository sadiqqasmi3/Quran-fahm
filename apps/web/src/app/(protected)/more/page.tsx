"use client";

import {
  BookMarked,
  Bookmark,
  BookOpenCheck,
  CircleUserRound,
  Compass,
  Download,
  HelpCircle,
  Mosque,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

export default function MorePage() {
  const { t, isUrdu } = useLocale();

  const tools = [
    {
      href: "/guide",
      label: t("navGuide"),
      description: isUrdu
        ? "پورٹل استعمال کرنے کا آسان طریقہ، بزرگوں کے لیے رہنمائی اور سوالات۔"
        : "Complete step-by-step usage guide for all features, elders, and FAQs.",
      Icon: HelpCircle,
    },
    {
      href: "/learn",
      label: t("navLearn"),
      description: isUrdu
        ? "روزانہ کے قرآنی الفاظ، معانی، مادے اور دہرائی کی مشق۔"
        : "Daily vocabulary, phrases, roots, listening, and review.",
      Icon: BookMarked,
    },
    {
      href: "/explore",
      label: t("navExplore"),
      description: isUrdu
        ? "قرآنی الفاظ، مادوں اور تفسیری مواد کی تلاش و تحقیق۔"
        : "Search Quran words, roots, and provider content.",
      Icon: Compass,
    },
    {
      href: "/salah",
      label: t("navSalah"),
      description: isUrdu
        ? "سورۃ الفاتحہ، التحیات اور نماز کے اذکار کی تفہیم۔"
        : "Understand Al-Fatihah and familiar recitation.",
      Icon: Mosque,
    },
    {
      href: "/progress",
      label: t("navProgress"),
      description: isUrdu
        ? "اپنی تلاوت کا ریکارڈ، سیکھے ہوئے کلمات اور پیشرفت کا جائزہ۔"
        : "See bounded learning estimates and local activity.",
      Icon: TrendingUp,
    },
    {
      href: "/bookmarks",
      label: t("navBookmarks"),
      description: isUrdu
        ? "اس ڈیوائس پر محفوظ کی گئی آیات تک فوری رسائی۔"
        : "Return to ayahs saved on this device.",
      Icon: Bookmark,
    },
    {
      href: "/downloads",
      label: t("navDownloads"),
      description: isUrdu
        ? "بغیر انٹرنیٹ آف لائن دستیاب پاروں اور مواد کا معائنہ۔"
        : "Inspect what is currently available offline.",
      Icon: Download,
    },
    {
      href: "/sources",
      label: t("navSources"),
      description: isUrdu
        ? "مستند قرآنی مآخذ، اسناد اور علمی حدود کی تفصیل۔"
        : "See content provenance and scholarly boundaries.",
      Icon: BookOpenCheck,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
      <header className="border-b border-line pb-7">
        <p className="text-sm font-semibold text-accent">{t("appName")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
          {t("moreTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-muted">
          {t("moreSubtitle")}
        </p>
      </header>

      <nav className="mt-7 divide-y divide-line border-y border-line" aria-label="Quran tools">
        {tools.map(({ href, label, description, Icon }) => (
          <Link
            key={href}
            href={href}
            className="grid min-h-20 grid-cols-[2.75rem_1fr] items-center gap-4 py-4 sm:grid-cols-[2.75rem_11rem_1fr]"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
              <Icon aria-hidden="true" size={21} />
            </span>
            <span className="font-semibold text-ink">{label}</span>
            <span className="col-start-2 text-sm leading-6 text-muted sm:col-start-auto">
              {description}
            </span>
          </Link>
        ))}
      </nav>

      <section className="mt-9 rounded-2xl border border-line bg-surface p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div className="flex items-start gap-3">
          <CircleUserRound className="mt-0.5 shrink-0 text-accent" aria-hidden="true" size={23} />
          <div>
            <h2 className="font-semibold">{t("navAccount")}</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {isUrdu
                ? "تلاوت کی جگہ، پسندیدہ ترتیبات اور مشترکہ ختم رومز کو ہم آہنگ رکھنے کے لیے سائن ان کریں۔"
                : "Sign in to sync your reading place, preferences, and shared Khatm Rooms."}
            </p>
          </div>
        </div>
        <Link
          href="/account"
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover sm:mt-0 sm:w-auto transition"
        >
          {t("moreOpenAccount")}
        </Link>
      </section>
    </div>
  );
}
