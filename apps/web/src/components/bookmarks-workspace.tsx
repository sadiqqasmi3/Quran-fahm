"use client";

import {
  Bookmark,
  BookOpenText,
  Clock,
  HardDrive,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BOOKMARKS_CHANGED_EVENT,
  type QuranBookmark,
  readBookmarks,
  removeBookmark,
} from "@/lib/bookmark-store";
import {
  clearReadingHistory,
  READING_HISTORY_CHANGED_EVENT,
  type ReadingHistoryEntry,
  readReadingHistory,
} from "@/lib/reading-history-store";

function formatSavedDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatRelativeTime(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return formatSavedDate(value);
}

type WorkspaceTab = "bookmarks" | "history";

export function BookmarksWorkspace() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("bookmarks");
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);
  const [history, setHistory] = useState<ReadingHistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const refreshBookmarks = () => setBookmarks(readBookmarks(window.localStorage));
    const refreshHistory = () => setHistory(readReadingHistory(window.localStorage));

    refreshBookmarks();
    refreshHistory();
    setHydrated(true);

    window.addEventListener("storage", refreshBookmarks);
    window.addEventListener("storage", refreshHistory);
    window.addEventListener(BOOKMARKS_CHANGED_EVENT, refreshBookmarks);
    window.addEventListener(READING_HISTORY_CHANGED_EVENT, refreshHistory);

    return () => {
      window.removeEventListener("storage", refreshBookmarks);
      window.removeEventListener("storage", refreshHistory);
      window.removeEventListener(BOOKMARKS_CHANGED_EVENT, refreshBookmarks);
      window.removeEventListener(READING_HISTORY_CHANGED_EVENT, refreshHistory);
    };
  }, []);

  function remove(bookmark: QuranBookmark) {
    try {
      removeBookmark(window.localStorage, bookmark.surahNumber, bookmark.ayahNumber);
      setBookmarks(readBookmarks(window.localStorage));
      setNotice(`Removed ${bookmark.surahName}, ayah ${bookmark.ayahNumber}.`);
      window.dispatchEvent(new Event(BOOKMARKS_CHANGED_EVENT));
    } catch {
      setNotice("This bookmark could not be removed from this browser.");
    }
  }

  function handleClearHistory() {
    clearReadingHistory(window.localStorage);
    setHistory([]);
    setNotice("Reading history cleared.");
    window.dispatchEvent(new Event(READING_HISTORY_CHANGED_EVENT));
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
      <header className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">
            {activeTab === "bookmarks" ? "Saved ayahs" : "Reading history"}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            {activeTab === "bookmarks"
              ? "Return to verses you have bookmarked to read, hear, or study again."
              : "Review your recent reading path and jump back in where you left off."}
          </p>
        </div>
        <Link
          href="/quran"
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
        >
          <BookOpenText aria-hidden="true" size={19} /> Open Quran
        </Link>
      </header>

      {/* Mode Switcher Tabs */}
      <div className="mt-6 flex items-center justify-between border-b border-line pb-2">
        <div className="flex gap-2" role="tablist" aria-label="Saved vs History tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "bookmarks"}
            onClick={() => setActiveTab("bookmarks")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "bookmarks"
                ? "bg-accent text-on-action"
                : "text-muted hover:bg-surface-soft hover:text-ink"
            }`}
          >
            <Bookmark size={17} aria-hidden="true" />
            Saved Ayahs ({bookmarks.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "history"
                ? "bg-accent text-on-action"
                : "text-muted hover:bg-surface-soft hover:text-ink"
            }`}
          >
            <Clock size={17} aria-hidden="true" />
            Recent History ({history.length})
          </button>
        </div>

        {activeTab === "history" && history.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted hover:bg-surface-soft hover:text-danger"
          >
            <Trash2 size={15} /> Clear history
          </button>
        )}
      </div>

      <div className="mt-4 flex items-start gap-3 border-y border-line bg-surface-soft px-4 py-3.5 text-sm leading-6 text-muted sm:px-5">
        <HardDrive aria-hidden="true" className="mt-0.5 shrink-0 text-accent" size={19} />
        <p>
          <strong className="font-semibold text-ink">Private to this browser.</strong> Reading
          records stay local on this device and are preserved across offline sessions.
        </p>
      </div>

      <p className="sr-only" aria-live="polite">
        {notice}
      </p>

      {activeTab === "bookmarks" &&
        (hydrated && bookmarks.length === 0 ? (
          <section
            className="mt-8 border-y border-line py-14 text-center"
            aria-labelledby="empty-bookmarks-title"
          >
            <Bookmark
              className="mx-auto text-accent"
              aria-hidden="true"
              size={32}
              strokeWidth={1.7}
            />
            <h2 id="empty-bookmarks-title" className="mt-4 text-xl font-semibold text-ink">
              No ayahs saved yet
            </h2>
            <p className="mx-auto mt-2 max-w-md leading-7 text-muted">
              Open the Quran and use the bookmark button beside any ayah. It will appear here with a
              direct link back to that exact place.
            </p>
            <Link
              href="/quran"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-surface px-4 font-semibold text-ink hover:border-accent"
            >
              Choose an ayah
            </Link>
          </section>
        ) : (
          <ol className="mt-8 divide-y divide-line border-y border-line" aria-label="Saved ayahs">
            {bookmarks.map((bookmark) => (
              <li
                key={bookmark.key}
                className="grid gap-5 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:py-8"
              >
                <Link
                  href={`/quran?surah=${bookmark.surahNumber}&ayah=${bookmark.ayahNumber}`}
                  className="group min-w-0 rounded-lg focus-visible:outline-offset-4"
                >
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-semibold text-source group-hover:underline">
                      {bookmark.surahName} {bookmark.ayahNumber}
                    </span>
                    {bookmark.surahNameArabic && (
                      <span className="font-quran text-xl text-muted" lang="ar" dir="rtl">
                        {bookmark.surahNameArabic}
                      </span>
                    )}
                    <time className="text-xs text-muted" dateTime={bookmark.createdAt}>
                      Saved {formatSavedDate(bookmark.createdAt)}
                    </time>
                  </span>
                  {bookmark.arabicText && (
                    <span
                      className="font-quran mt-4 block text-right text-2xl leading-[1.9] text-ink sm:text-3xl"
                      lang="ar"
                      dir="rtl"
                    >
                      {bookmark.arabicText}
                    </span>
                  )}
                  {bookmark.translationText && (
                    <span
                      className={`mt-3 block text-base leading-8 text-muted ${bookmark.translationDirection === "rtl" ? "font-urdu text-right" : "text-left"}`}
                      lang={bookmark.translationLanguage ?? "ur"}
                      dir={bookmark.translationDirection ?? "rtl"}
                    >
                      {bookmark.translationText}
                    </span>
                  )}
                </Link>
                <div className="flex items-start sm:justify-end">
                  <button
                    type="button"
                    onClick={() => remove(bookmark)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-surface-soft hover:text-danger"
                    aria-label={`Remove bookmark for ${bookmark.surahName}, ayah ${bookmark.ayahNumber}`}
                  >
                    <Trash2 aria-hidden="true" size={18} /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
        ))}

      {activeTab === "history" &&
        (hydrated && history.length === 0 ? (
          <section
            className="mt-8 border-y border-line py-14 text-center"
            aria-labelledby="empty-history-title"
          >
            <Clock className="mx-auto text-accent" aria-hidden="true" size={32} strokeWidth={1.7} />
            <h2 id="empty-history-title" className="mt-4 text-xl font-semibold text-ink">
              No recent reading history
            </h2>
            <p className="mx-auto mt-2 max-w-md leading-7 text-muted">
              As you explore Surahs, Paras, and the 15-line Mushaf, your recent stops will be
              tracked here for quick 1-click continuation.
            </p>
            <Link
              href="/quran"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-surface px-4 font-semibold text-ink hover:border-accent"
            >
              Start reading now
            </Link>
          </section>
        ) : (
          <div className="mt-8">
            {/* Quick Resume Hero Banner */}
            {history[0] && (
              <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border-2 border-accent bg-accent-soft p-5 sm:flex-row sm:items-center">
                <div>
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                    <Sparkles size={15} /> Resume where you left off
                  </span>
                  <p className="mt-1 text-xl font-bold text-ink">
                    {history[0].surahNameEnglish} · Ayah {history[0].ayahNumber}
                    {history[0].surahNameArabic && (
                      <span className="font-quran ms-2 font-normal text-muted" dir="rtl">
                        ({history[0].surahNameArabic})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    Read {formatRelativeTime(history[0].visitedAt)}
                  </p>
                </div>
                <Link
                  href={
                    history[0].mushafPage
                      ? `/mushaf?page=${history[0].mushafPage}`
                      : `/quran?surah=${history[0].surahNumber}&ayah=${history[0].ayahNumber}`
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
                >
                  <RotateCcw size={17} /> Continue reading
                </Link>
              </div>
            )}

            <ol
              className="divide-y divide-line border-y border-line"
              aria-label="Recent reading history"
            >
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center sm:py-5"
                >
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-semibold text-ink">
                        {entry.surahNameEnglish} {entry.ayahNumber}
                      </span>
                      {entry.surahNameArabic && (
                        <span className="font-quran text-lg text-muted" dir="rtl">
                          {entry.surahNameArabic}
                        </span>
                      )}
                      <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[0.7rem] font-medium uppercase text-muted">
                        {entry.mode}
                      </span>
                    </div>
                    <p className="text-xs text-muted">{formatRelativeTime(entry.visitedAt)}</p>
                  </div>

                  <Link
                    href={
                      entry.mushafPage
                        ? `/mushaf?page=${entry.mushafPage}`
                        : `/quran?surah=${entry.surahNumber}&ayah=${entry.ayahNumber}`
                    }
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink hover:border-accent"
                  >
                    Resume
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ))}

      {!hydrated && (
        <div
          className="mt-8 border-y border-line py-12 text-center text-sm text-muted"
          role="status"
        >
          Loading…
        </div>
      )}
    </div>
  );
}
