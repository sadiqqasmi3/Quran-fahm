"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookOpenText,
  ChevronDown,
  HelpCircle,
  Languages,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  type GuideLanguage,
  filterGuideSections,
  getGuideContent,
} from "@/lib/app-guide-data";
import { useLocale } from "@/lib/i18n/locale-context";
import { LanguageSwitcher } from "./language-switcher";

export interface AppGuideWorkspaceProps {
  initialLanguage?: GuideLanguage;
  showHeaderBack?: boolean;
}

export function AppGuideWorkspace({
  showHeaderBack = true,
}: AppGuideWorkspaceProps) {
  const { locale, setLocale, isUrdu, dir } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const content = useMemo(() => getGuideContent(locale), [locale]);

  // Filter sections by search query and category
  const filteredSections = useMemo(
    () => filterGuideSections(content.sections, activeCategory, searchQuery),
    [content.sections, activeCategory, searchQuery],
  );

  return (
    <div
      dir={dir}
      lang={locale}
      className={`min-h-screen bg-canvas text-ink transition-colors ${
        isUrdu ? "font-urdu" : "font-sans"
      }`}
    >
      {/* Top Banner & Language Direction Switcher */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-md px-4 py-3.5 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {showHeaderBack && (
              <Link
                href="/home"
                className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface hover:bg-surface-soft hover:text-accent transition"
                aria-label={isUrdu ? "ہوم پر واپس جائیں" : "Back to Home"}
              >
                {isUrdu ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
              </Link>
            )}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                {content.badge}
              </span>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-ink line-clamp-1">
                {content.title}
              </h1>
            </div>
          </div>

          {/* Prominent Language Switcher */}
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 space-y-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-accent-soft/30 via-surface to-surface p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3.5 py-1 text-xs font-semibold text-accent">
              <Sparkles size={14} />
              <span>{isUrdu ? "آسان اور مکمل رہنما" : "Comprehensive & Accessible"}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-tight">
              {content.title}
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-muted max-w-2xl">
              {content.subtitle}
            </p>

            {/* Quick search input */}
            <div className="pt-3">
              <div className="relative max-w-lg">
                <Search
                  size={18}
                  className={`absolute top-1/2 -translate-y-1/2 text-muted ${
                    isUrdu ? "right-3.5" : "left-3.5"
                  }`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={content.searchPlaceholder}
                  className={`w-full rounded-2xl border border-line bg-surface py-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none shadow-sm ${
                    isUrdu ? "pr-11 pl-4" : "pl-11 pr-4"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Decorative Corner Icon */}
          <div
            className={`pointer-events-none absolute -bottom-8 opacity-10 text-accent ${
              isUrdu ? "-left-8" : "-right-8"
            }`}
          >
            <BookOpen size={220} />
          </div>
        </section>

        {/* Quick Tips Cards for Elderly & Beginners */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <HelpCircle size={20} />
            <h3 className="text-lg sm:text-xl font-bold text-ink">
              {content.quickTipsTitle}
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {content.quickTips.map((tip, idx) => {
              const Icon = tip.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5 shadow-sm hover:border-accent/50 transition"
                >
                  <div className="size-10 rounded-xl bg-accent-soft text-accent grid place-items-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <h4 className="font-bold text-ink text-base">{tip.title}</h4>
                  <p className="text-sm leading-relaxed text-muted">{tip.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Categories Bar */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {content.categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition ${
                  activeCategory === cat.id
                    ? "bg-accent text-on-action shadow-sm"
                    : "border border-line bg-surface text-ink hover:bg-surface-soft"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Detailed Sections */}
        <section className="space-y-8">
          {filteredSections.length === 0 ? (
            <div className="text-center py-16 border border-line rounded-3xl bg-surface p-8">
              <Search size={40} className="mx-auto text-muted mb-3" />
              <p className="text-lg font-bold text-ink">
                {isUrdu ? "کوئی نتیجہ نہیں ملا" : "No results found"}
              </p>
              <p className="text-sm text-muted mt-1">
                {isUrdu
                  ? "براہ کرم کوئی دوسرا لفظ تلاش کریں یا تمام عنوانات پر کلک کریں۔"
                  : "Try a different search keyword or switch back to All Topics."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="mt-4 rounded-xl bg-accent-soft px-4 py-2 text-xs font-semibold text-accent hover:bg-accent hover:text-on-action transition"
              >
                {isUrdu ? "تلاش صاف کریں" : "Clear Search"}
              </button>
            </div>
          ) : (
            filteredSections.map((sec) => (
              <article
                key={sec.id}
                id={sec.id}
                className="scroll-mt-24 rounded-3xl border border-line bg-surface p-6 sm:p-8 lg:p-10 shadow-sm space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-ink">
                      {sec.title}
                    </h3>
                    <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
                      {sec.summary}
                    </p>
                  </div>
                  {sec.actionUrl && (
                    <Link
                      href={sec.actionUrl}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs sm:text-sm font-semibold text-on-action hover:opacity-90 active:scale-95 transition shrink-0"
                    >
                      <span>{sec.actionLabel}</span>
                      {isUrdu ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                    </Link>
                  )}
                </div>

                {/* Steps Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {sec.steps.map((st, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex gap-3.5 rounded-2xl border border-line/60 bg-surface-soft/60 p-4 sm:p-5"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent text-on-action text-xs font-bold">
                        {st.number}
                      </span>
                      <div className="space-y-1">
                        <h4 className="font-bold text-ink text-sm sm:text-base">
                          {st.title}
                        </h4>
                        <p className="text-xs sm:text-sm leading-relaxed text-muted">
                          {st.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </section>

        {/* Collapsible FAQ Section */}
        <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8 lg:p-10 space-y-6 shadow-sm">
          <div className="space-y-1 border-b border-line pb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-ink">
              {content.faqTitle}
            </h3>
            <p className="text-sm sm:text-base text-muted">{content.faqSubtitle}</p>
          </div>

          <div className="divide-y divide-line">
            {content.faqs.map((faq, fIdx) => {
              const isOpen = openFaqIndex === fIdx;
              return (
                <div key={fIdx} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : fIdx)}
                    className="flex w-full items-center justify-between gap-4 text-left font-bold text-ink text-sm sm:text-base hover:text-accent transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 transition-transform ${
                        isOpen ? "rotate-180 text-accent" : "text-muted"
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted pr-2">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom Call to Action */}
        <section className="rounded-3xl border border-accent/20 bg-accent-soft/40 p-6 sm:p-8 text-center space-y-4">
          <h3 className="text-xl sm:text-2xl font-bold text-ink">
            {isUrdu
              ? "ابھی تلاوت اور فہم کا سفر شروع کریں"
              : "Begin Your Quran Understanding Journey"}
          </h3>
          <p className="text-sm sm:text-base text-muted max-w-xl mx-auto">
            {isUrdu
              ? "پندرہ سطری روایتی مصحف کھولیں یا روزمرہ تلاوت سے اپنے دن کو بابرکت بنائیں۔"
              : "Open the 15-Line Mushaf or start reading with word-by-word comprehension today."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/mushaf"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-on-action hover:opacity-90 transition shadow-sm"
            >
              <BookOpen size={18} />
              <span>{isUrdu ? "۱۵ سطری مصحف کھولیں" : "Open 15-Line Mushaf"}</span>
            </Link>
            <Link
              href="/quran"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink hover:bg-surface-soft transition"
            >
              <BookOpenText size={18} />
              <span>{isUrdu ? "قرآن ریڈر" : "Study Reader"}</span>
            </Link>
            <Link
              href="/khatm"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink hover:bg-surface-soft transition"
            >
              <UsersRound size={18} />
              <span>{isUrdu ? "خاندانی ختم روم" : "Family Khatm"}</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
