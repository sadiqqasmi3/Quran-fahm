"use client";

import { Languages } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

export interface LanguageSwitcherProps {
  className?: string;
  showIcon?: boolean;
}

export function LanguageSwitcher({
  className = "",
  showIcon = true,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl border border-line bg-surface-soft p-1 shadow-sm ${className}`}
      role="group"
      aria-label="Language selection"
    >
      {showIcon && (
        <span className="px-1 text-muted">
          <Languages size={15} />
        </span>
      )}
      <button
        type="button"
        onClick={() => setLocale("ur")}
        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
          locale === "ur"
            ? "bg-accent text-on-action shadow-xs"
            : "text-muted hover:text-ink"
        }`}
        aria-pressed={locale === "ur"}
      >
        اردو
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
          locale === "en"
            ? "bg-accent text-on-action shadow-xs"
            : "text-muted hover:text-ink"
        }`}
        aria-pressed={locale === "en"}
      >
        English
      </button>
    </div>
  );
}
