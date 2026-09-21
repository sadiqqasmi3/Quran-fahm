"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { Brand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";

export function PublicHeader() {
  const { t, isUrdu } = useLocale();

  return (
    <header className="border-b border-line bg-canvas/95" data-no-print>
      <div className="mx-auto flex h-16 max-w-[100rem] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Brand />
        <nav aria-label="Public navigation" className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/quran"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-ink hover:bg-surface-soft"
          >
            {t("navQuran")}
          </Link>
          <Link
            href="/guide"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-accent hover:bg-surface-soft"
          >
            {t("navGuide")}
          </Link>
          <Link
            href="/sources"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-ink hover:bg-surface-soft sm:inline-flex"
          >
            {t("navSources")}
          </Link>
          <LanguageSwitcher showIcon={false} />
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink hover:border-accent"
          >
            {t("navSignIn")}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  const { t, isUrdu } = useLocale();

  return (
    <footer className="border-t border-line bg-surface" data-no-print>
      <div className="mx-auto grid max-w-[100rem] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] lg:px-10">
        <div className="max-w-xl space-y-3">
          <Brand />
          <p className="text-sm leading-6 text-muted">
            {isUrdu
              ? "قرآن مجید کا فہم، تلاوت، سماعت اور باہمی ختم القرآن—ہر آیت اور لفظ کے اصل مفہوم کے ساتھ۔"
              : "Understand, read, recite, and complete the Quran together—with every source layer kept visible and distinct."}
          </p>
        </div>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm"
        >
          <Link className="min-h-11 content-center text-muted hover:text-ink" href="/quran">
            {t("navQuran")}
          </Link>
          <Link className="min-h-11 content-center text-accent hover:text-ink font-medium" href="/guide">
            {t("navGuide")}
          </Link>
          <Link className="min-h-11 content-center text-muted hover:text-ink" href="/sources">
            {t("navSources")}
          </Link>
          <Link className="min-h-11 content-center text-muted hover:text-ink" href="/register">
            {t("navSignIn")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
