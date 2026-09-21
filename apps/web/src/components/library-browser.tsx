"use client";

import type { SurahSummary } from "@quran-feham/contracts";
import { ArrowUpRight, BookOpenText, LoaderCircle, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSurahs } from "@/lib/api";
import { PREVIEW_SURAHS } from "@/lib/preview-data";

export function LibraryBrowser() {
  const [surahs, setSurahs] = useState<SurahSummary[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"loading" | "runtime" | "preview">("loading");

  useEffect(() => {
    let active = true;
    getSurahs()
      .then((items) => {
        if (!active) return;
        setSurahs(items);
        setState("runtime");
      })
      .catch(() => {
        if (!active) return;
        setSurahs(PREVIEW_SURAHS);
        setState("preview");
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return surahs;
    return surahs.filter(
      (surah) =>
        String(surah.number) === normalized ||
        surah.nameEnglish.toLocaleLowerCase().includes(normalized) ||
        surah.nameTranslation.toLocaleLowerCase().includes(normalized) ||
        surah.nameArabic.includes(query.trim()),
    );
  }, [query, surahs]);

  return (
    <section aria-labelledby="surah-library-heading">
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="surah-library-heading" className="text-2xl font-semibold tracking-[-0.025em]">
            Surahs
          </h2>
          <p className="mt-1 text-muted">
            {state === "loading"
              ? "Loading the current release…"
              : state === "runtime"
                ? `${surahs.length} surahs from the live provider index`
                : "Limited interface preview"}
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
            size={18}
          />
          <label htmlFor="library-search" className="sr-only">
            Find a surah
          </label>
          <input
            id="library-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or number"
            className="min-h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-ink placeholder:text-muted"
          />
        </div>
      </div>

      {state === "preview" && (
        <p
          className="mt-5 rounded-xl border border-warning/30 bg-[#fff8e7] px-4 py-3 text-sm leading-6 text-[#694300]"
          role="status"
        >
          The Quran API is unavailable. This short list is navigation preview data; only Al-Fatihah
          has a built-in text preview.
        </p>
      )}

      {state === "loading" ? (
        <div className="grid min-h-64 place-items-center" role="status">
          <span className="flex items-center gap-3 text-sm text-muted">
            <LoaderCircle className="animate-spin" aria-hidden="true" size={20} /> Loading surahs…
          </span>
        </div>
      ) : (
        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((surah) => (
            <Link
              key={surah.number}
              href={`/quran?surah=${surah.number}`}
              className="group grid min-h-24 grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-accent"
            >
              <span className="text-sm text-muted">{surah.number}</span>
              <span>
                <span className="block font-semibold text-ink">{surah.nameEnglish}</span>
                <span className="mt-1 block text-sm text-muted">
                  {surah.nameTranslation} · {surah.ayahCount}
                </span>
              </span>
              <span className="text-right">
                <span className="font-quran block text-2xl text-accent" lang="ar" dir="rtl">
                  {surah.nameArabic}
                </span>
                <ArrowUpRight
                  className="ml-auto mt-1 text-muted group-hover:text-accent"
                  aria-hidden="true"
                  size={16}
                />
              </span>
            </Link>
          ))}
          {visible.length === 0 && (
            <div className="col-span-full rounded-xl border border-line bg-surface px-6 py-12 text-center">
              <BookOpenText className="mx-auto text-muted" aria-hidden="true" size={30} />
              <p className="mt-4 font-semibold">No matching surah</p>
              <p className="mt-1 text-sm text-muted">
                Try an English, Arabic, translated name, or surah number.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
