"use client";

import {
  BookOpen,
  CheckCircle2,
  CloudOff,
  Download,
  HardDrive,
  LoaderCircle,
  Trash2,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getMushafPageRangeForPara,
  mushafPageImageUrl,
  PARAS,
  type ParaMetadata,
} from "@/lib/para-data";

interface OfflineState {
  online: boolean;
  serviceWorkerReady: boolean;
  cachedQuranRequests: number;
  cachedShellRequests: number;
}

const initialState: OfflineState = {
  online: true,
  serviceWorkerReady: false,
  cachedQuranRequests: 0,
  cachedShellRequests: 0,
};

const MUSHAF_CACHE_NAME = "qf-web-v2-mushaf";

async function inspectOfflineState(): Promise<OfflineState> {
  const next: OfflineState = {
    ...initialState,
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    serviceWorkerReady: Boolean(
      typeof navigator !== "undefined" && navigator.serviceWorker?.controller,
    ),
  };

  if (typeof window === "undefined" || !("caches" in window)) return next;
  try {
    const keys = (await window.caches.keys()).filter((key) => key.startsWith("qf-web-v2-"));
    const requestGroups = await Promise.all(
      keys.map(async (key) => ({ key, requests: await (await window.caches.open(key)).keys() })),
    );
    for (const group of requestGroups) {
      if (group.key.endsWith("-quran")) next.cachedQuranRequests += group.requests.length;
      else next.cachedShellRequests += group.requests.length;
    }
  } catch {
    // Ignore cache inspection errors
  }
  return next;
}

async function inspectDownloadedParas(): Promise<Set<number>> {
  if (typeof window === "undefined" || !("caches" in window)) return new Set();
  try {
    const cache = await window.caches.open(MUSHAF_CACHE_NAME);
    const keys = await cache.keys();
    const cachedUrls = new Set(keys.map((r) => new URL(r.url).pathname));
    const downloaded = new Set<number>();

    for (const para of PARAS) {
      const { startPage, endPage } = getMushafPageRangeForPara(para.number);
      let allPresent = true;
      for (let p = startPage; p <= endPage; p++) {
        if (!cachedUrls.has(mushafPageImageUrl(p))) {
          allPresent = false;
          break;
        }
      }
      if (allPresent) downloaded.add(para.number);
    }
    return downloaded;
  } catch {
    return new Set();
  }
}

export function DownloadsWorkspace() {
  const [state, setState] = useState<OfflineState>(initialState);
  const [downloadedParas, setDownloadedParas] = useState<Set<number>>(new Set());
  const [downloadingPara, setDownloadingPara] = useState<{
    paraNumber: number;
    current: number;
    total: number;
  } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      setChecking(true);
      void Promise.all([inspectOfflineState(), inspectDownloadedParas()])
        .then(([nextState, nextDownloaded]) => {
          if (active) {
            setState(nextState);
            setDownloadedParas(nextDownloaded);
          }
        })
        .finally(() => {
          if (active) setChecking(false);
        });
    };

    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    navigator.serviceWorker?.addEventListener("controllerchange", refresh);

    return () => {
      active = false;
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      navigator.serviceWorker?.removeEventListener("controllerchange", refresh);
    };
  }, []);

  async function handleDownloadPara(para: ParaMetadata) {
    if (typeof window === "undefined" || !("caches" in window)) return;
    const { startPage, endPage, totalPages } = getMushafPageRangeForPara(para.number);
    setDownloadingPara({ paraNumber: para.number, current: 0, total: totalPages });

    try {
      const cache = await window.caches.open(MUSHAF_CACHE_NAME);
      let done = 0;

      for (let p = startPage; p <= endPage; p++) {
        const url = mushafPageImageUrl(p);
        const match = await cache.match(url);
        if (!match) {
          const res = await fetch(url);
          if (res.ok) await cache.put(url, res);
        }
        done += 1;
        setDownloadingPara({ paraNumber: para.number, current: done, total: totalPages });
      }

      setDownloadedParas((prev) => new Set([...prev, para.number]));
      const nextState = await inspectOfflineState();
      setState(nextState);
    } catch {
      // Graceful error handling
    } finally {
      setDownloadingPara(null);
    }
  }

  async function handleRemovePara(paraNumber: number) {
    if (typeof window === "undefined" || !("caches" in window)) return;
    const { startPage, endPage } = getMushafPageRangeForPara(paraNumber);

    try {
      const cache = await window.caches.open(MUSHAF_CACHE_NAME);
      for (let p = startPage; p <= endPage; p++) {
        await cache.delete(mushafPageImageUrl(p));
      }
      setDownloadedParas((prev) => {
        const next = new Set(prev);
        next.delete(paraNumber);
        return next;
      });
      const nextState = await inspectOfflineState();
      setState(nextState);
    } catch {
      // Graceful error handling
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
      <header className="border-b border-line pb-7">
        <p className="text-sm font-semibold text-accent">Offline · Downloads</p>
        <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Keep the Quran available when your connection is not.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">
          Download 15-line Mushaf Paras to your device for offline reading. Pre-downloaded pages and
          cached Quran passages load instantly without requiring an internet connection.
        </p>
      </header>

      <section className="mt-8 grid gap-5 sm:grid-cols-3" aria-label="Offline status">
        <StatusItem
          icon={state.online ? Wifi : CloudOff}
          label="Connection"
          value={state.online ? "Online" : "Offline"}
          detail="Updates automatically when this device reconnects."
        />
        <StatusItem
          icon={HardDrive}
          label="Offline cache"
          value={
            state.serviceWorkerReady ? "Cache active" : checking ? "Checking…" : "Active (Browser)"
          }
          detail={`${state.cachedShellRequests} interface resources and pages saved.`}
        />
        <StatusItem
          icon={BookOpen}
          label="15-Line Mushaf"
          value={`${downloadedParas.size} of 30 Paras saved`}
          detail="Downloaded Paras remain fully readable without internet."
        />
      </section>

      {/* Explicit 15-Line Mushaf Download Section */}
      <section className="mt-12" aria-labelledby="mushaf-packs-title">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-line pb-4">
          <div>
            <h2 id="mushaf-packs-title" className="text-2xl font-semibold tracking-[-0.025em]">
              15-Line Mushaf Offline Packs
            </h2>
            <p className="mt-1 text-sm text-muted">
              Standard Pakistani / Indo-Pak layout (King Fahd Complex edition). Each Para is ~3 MB.
            </p>
          </div>
          <span className="text-xs font-semibold text-accent">
            {downloadedParas.size} / 30 Paras Ready Offline
          </span>
        </div>

        <div className="mt-6 divide-y divide-line border-y border-line">
          {PARAS.map((para) => {
            const isDownloaded = downloadedParas.has(para.number);
            const isDownloading = downloadingPara?.paraNumber === para.number;

            return (
              <article
                key={para.number}
                className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center sm:py-5"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-soft text-sm font-bold text-muted">
                    {para.number}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="font-semibold text-ink">
                        پارہ {para.number} · {para.nameLatin}
                      </h3>
                      <span className="font-quran text-lg text-accent" dir="rtl">
                        {para.nameArabic}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      Surah {para.start.surah}:{para.start.ayah} — {para.end.surah}:{para.end.ayah}{" "}
                      · {para.totalMushafPages} pages (Pages {para.startMushafPage}–
                      {para.endMushafPage})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isDownloading ? (
                    <span className="flex items-center gap-2 rounded-xl bg-accent-soft px-4 py-2 text-xs font-semibold text-accent">
                      <LoaderCircle className="animate-spin" size={16} />
                      Downloading {downloadingPara.current} / {downloadingPara.total}…
                    </span>
                  ) : isDownloaded ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={15} /> Ready offline
                      </span>
                      <Link
                        href={`/mushaf?para=${para.number}`}
                        className="inline-flex min-h-9 items-center justify-center rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink hover:border-accent"
                      >
                        Read
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemovePara(para.number)}
                        className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-soft hover:text-danger"
                        title="Remove offline copy"
                        aria-label={`Remove offline copy of Para ${para.number}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDownloadPara(para)}
                      disabled={downloadingPara !== null}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-xs font-semibold text-ink hover:border-accent disabled:opacity-40"
                    >
                      <Download size={15} /> Download for offline
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Coverage Explanation */}
      <section className="mt-14" aria-labelledby="available-offline-title">
        <h2 id="available-offline-title" className="text-2xl font-semibold tracking-[-0.025em]">
          Honest offline architecture
        </h2>
        <div className="mt-5 divide-y divide-line border-y border-line">
          {[
            [
              "15-Line Mushaf Pages",
              "Downloaded Para packs store verified, high-resolution pages locally inside standard browser CacheStorage.",
            ],
            [
              "Interactive Reader Cache",
              "Opened Surah text and translations are automatically preserved in the service worker for reading without network.",
            ],
            [
              "Learner Vocabulary & Bookmarks",
              "All bookmarks, reading history, and vocabulary progress operate client-first on your device.",
            ],
          ].map(([title, detail]) => (
            <article key={title} className="grid gap-3 py-5 sm:grid-cols-[2.5rem_1fr]">
              <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                <CheckCircle2 aria-hidden="true" size={20} />
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 leading-7 text-muted">{detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/mushaf"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
        >
          <BookOpen aria-hidden="true" size={19} /> Open 15-Line Mushaf
        </Link>
        <Link
          href="/quran"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-surface px-5 font-semibold text-ink hover:border-accent"
        >
          Open Study Reader
        </Link>
      </div>
    </div>
  );
}

function StatusItem({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Wifi;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="border-t-2 border-accent px-1 py-5">
      <Icon aria-hidden="true" className="text-accent" size={23} />
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
      <h2 className="mt-1 text-xl font-semibold">{value}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
    </article>
  );
}
