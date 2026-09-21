"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type Locale,
  type Translations,
  getTranslations,
} from "./translations";

export interface LocaleContextType {
  locale: Locale;
  isUrdu: boolean;
  dir: "rtl" | "ltr";
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: keyof Translations) => string;
  translations: Translations;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

export const QF_LOCALE_STORAGE_KEY = "qf:locale";
export const QF_LOCALE_CHANGED_EVENT = "qf:locale-changed";

export function resolveInitialLocale(): Locale {
  if (typeof window === "undefined") return "ur";
  try {
    const direct = window.localStorage.getItem(QF_LOCALE_STORAGE_KEY);
    if (direct === "ur" || direct === "en") return direct;

    // Check qf:web-preferences
    const storedPrefs = window.localStorage.getItem("qf:web-preferences");
    if (storedPrefs) {
      const parsed = JSON.parse(storedPrefs);
      if (parsed.locale === "ur" || parsed.locale === "en") {
        return parsed.locale;
      }
    }
  } catch {
    // Storage restrictions
  }
  return "ur"; // Quran Feham defaults to Urdu
}

export function applyDocumentLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  const dir = locale === "ur" ? "rtl" : "ltr";
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
  document.documentElement.setAttribute("data-locale", locale);

  // When in Urdu, set the html font to Urdu Nastaliq
  if (locale === "ur") {
    document.body.classList.add("font-urdu");
  } else {
    document.body.classList.remove("font-urdu");
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(resolveInitialLocale);

  // Sync to DOM whenever locale changes
  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(QF_LOCALE_STORAGE_KEY, newLocale);

        // Keep qf:web-preferences in sync
        const storedPrefs = window.localStorage.getItem("qf:web-preferences");
        const prefs = storedPrefs ? JSON.parse(storedPrefs) : {};
        prefs.locale = newLocale;
        window.localStorage.setItem("qf:web-preferences", JSON.stringify(prefs));

        // Dispatch custom event for immediate tab synchronization
        window.dispatchEvent(
          new CustomEvent(QF_LOCALE_CHANGED_EVENT, { detail: { locale: newLocale } }),
        );
      } catch {
        // Ignore quota
      }
    }
    applyDocumentLocale(newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "ur" ? "en" : "ur");
  }, [locale, setLocale]);

  // Listen to cross-component or cross-window changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleStorage(e: StorageEvent) {
      if (e.key === QF_LOCALE_STORAGE_KEY && (e.newValue === "ur" || e.newValue === "en")) {
        setLocaleState(e.newValue);
        applyDocumentLocale(e.newValue);
      }
    }

    function handleCustomEvent(e: Event) {
      const customEvent = e as CustomEvent<{ locale?: Locale }>;
      if (customEvent.detail?.locale) {
        setLocaleState(customEvent.detail.locale);
        applyDocumentLocale(customEvent.detail.locale);
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(QF_LOCALE_CHANGED_EVENT, handleCustomEvent);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(QF_LOCALE_CHANGED_EVENT, handleCustomEvent);
    };
  }, []);

  const translations = useMemo(() => getTranslations(locale), [locale]);
  const isUrdu = locale === "ur";
  const dir = isUrdu ? "rtl" : "ltr";

  const t = useCallback(
    (key: keyof Translations): string => {
      return translations[key] ?? key;
    },
    [translations],
  );

  const contextValue = useMemo<LocaleContextType>(
    () => ({
      locale,
      isUrdu,
      dir,
      setLocale,
      toggleLocale,
      t,
      translations,
    }),
    [locale, isUrdu, dir, setLocale, toggleLocale, t, translations],
  );

  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (!context) {
    // Fallback safe context if called outside provider
    const fallbackLocale = "ur";
    const translations = getTranslations(fallbackLocale);
    return {
      locale: fallbackLocale,
      isUrdu: true,
      dir: "rtl",
      setLocale: () => {},
      toggleLocale: () => {},
      t: (key) => translations[key] ?? key,
      translations,
    };
  }
  return context;
}
