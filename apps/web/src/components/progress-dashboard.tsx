"use client";

import {
  BookOpenCheck,
  CheckCircle2,
  Download,
  Flame,
  Headphones,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import {
  clearLearningProgress,
  currentStreak,
  exportProgress,
  getListenStats,
  importProgress,
  type LearningStats,
  listenPercent,
  masteryStats,
  readMasteryMap,
} from "@/lib/learning-store";

const MAX_IMPORT_BYTES = 512_000;

interface ProgressSnapshot {
  learning: LearningStats;
  listening: {
    correct: number;
    total: number;
  };
  streak: number;
}

const emptySnapshot: ProgressSnapshot = {
  learning: {
    total: 52,
    reviewed: 0,
    recognized: 0,
    mastered: 0,
    due: 0,
    estimate: 0,
  },
  listening: { correct: 0, total: 0 },
  streak: 0,
};

type Notice = { tone: "success" | "error"; text: string } | null;

function readSnapshot(): ProgressSnapshot {
  const storage = window.localStorage;
  return {
    learning: masteryStats(readMasteryMap(storage)),
    listening: getListenStats(storage),
    streak: currentStreak(storage),
  };
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-t border-line py-5 first:border-t-0 sm:border-l sm:border-t-0 sm:px-5 sm:first:border-l-0 sm:first:pl-0">
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">{value}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{detail}</p>
    </div>
  );
}

export function ProgressDashboard() {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot>(emptySnapshot);
  const [hydrated, setHydrated] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [importing, setImporting] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function refresh() {
    setSnapshot(readSnapshot());
  }

  useEffect(() => {
    refresh();
    setHydrated(true);
    const onProgressChange = () => refresh();
    window.addEventListener("storage", onProgressChange);
    window.addEventListener("qf:data-imported", onProgressChange);
    window.addEventListener("qf:mastery", onProgressChange);
    window.addEventListener("qf:listening", onProgressChange);
    return () => {
      window.removeEventListener("storage", onProgressChange);
      window.removeEventListener("qf:data-imported", onProgressChange);
      window.removeEventListener("qf:mastery", onProgressChange);
      window.removeEventListener("qf:listening", onProgressChange);
    };
  }, []);

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setNotice(null);
    setSelectedFile(file);
    if (file && file.size > MAX_IMPORT_BYTES) {
      setNotice({
        tone: "error",
        text: "That file is larger than the 500 KB progress-import limit.",
      });
    }
  }

  function downloadProgress() {
    try {
      const payload = exportProgress(window.localStorage);
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `quran-feham-progress-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setNotice({
        tone: "success",
        text: "Your local learning progress has been prepared as a Quran Feham JSON file.",
      });
    } catch {
      setNotice({ tone: "error", text: "The progress file could not be created." });
    }
  }

  async function importSelectedProgress() {
    if (!selectedFile) {
      setNotice({ tone: "error", text: "Choose a Quran Feham progress file first." });
      return;
    }
    if (selectedFile.size > MAX_IMPORT_BYTES) {
      setNotice({
        tone: "error",
        text: "That file is larger than the 500 KB progress-import limit.",
      });
      return;
    }

    setImporting(true);
    setNotice(null);
    try {
      const text = await selectedFile.text();
      if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES) {
        throw new Error("That file is larger than the 500 KB progress-import limit.");
      }
      let payload: unknown;
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error("That file is not valid JSON.");
      }
      const summary = importProgress(window.localStorage, payload);
      refresh();
      setSelectedFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setNotice({
        tone: "success",
        text: `Imported ${summary.masteryRecords} word records, ${summary.activityDays} activity days, and ${summary.listeningAnswers} listening answers.`,
      });
    } catch (cause) {
      setNotice({
        tone: "error",
        text: cause instanceof Error ? cause.message : "The progress file could not be imported.",
      });
    } finally {
      setImporting(false);
    }
  }

  function resetLocalProgress() {
    clearLearningProgress(window.localStorage);
    refresh();
    setResetArmed(false);
    window.dispatchEvent(new Event("qf:data-imported"));
    setNotice({
      tone: "success",
      text: "Learning, listening, and activity progress were removed from this browser.",
    });
  }

  const { learning, listening, streak } = snapshot;
  const listeningAccuracy =
    listening.total > 0 ? `${listenPercent(listening)}% accuracy` : "No answers yet";

  return (
    <div className="mx-auto w-full max-w-[92rem] px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
      <header className="border-b border-line pb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
          Your Quran journey
        </p>
        <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Progress you can act on.
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted sm:text-lg">
              See what you have practised on this device, then return to the words and listening
              prompts that need attention.
            </p>
          </div>
          <Link
            href="/learn"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
          >
            <RefreshCcw aria-hidden="true" size={18} /> Review due words
          </Link>
        </div>
      </header>

      <section className="mt-7" aria-labelledby="learning-summary-heading">
        <div className="flex items-center gap-2">
          <BookOpenCheck aria-hidden="true" className="text-accent" size={21} />
          <h2 id="learning-summary-heading" className="text-xl font-semibold">
            Learning summary
          </h2>
        </div>
        <div className="mt-4 rounded-2xl border border-line bg-surface px-5 sm:px-6">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Reviewed"
              value={hydrated ? `${learning.reviewed}/${learning.total}` : "—"}
              detail="words with at least one review"
            />
            <Metric
              label="Ready to study"
              value={hydrated ? String(learning.due) : "—"}
              detail="new or scheduled words due now"
            />
            <Metric
              label="Recognised"
              value={hydrated ? String(learning.recognized) : "—"}
              detail="60%+ self-rated recall strength"
            />
            <Metric
              label="Mastered"
              value={hydrated ? String(learning.mastered) : "—"}
              detail="85%+ self-rated recall strength"
            />
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2" aria-label="Listening and activity">
        <article className="border-l-2 border-accent bg-surface px-5 py-5 sm:px-6">
          <Headphones aria-hidden="true" className="text-accent" size={22} />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.13em] text-muted">
            Listening practice
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-[-0.04em]">
            {hydrated ? `${listening.correct}/${listening.total}` : "—"}
          </p>
          <p className="mt-2 leading-7 text-muted">
            {hydrated ? listeningAccuracy : "Loading local answers…"} across recorded Urdu meaning
            prompts.
          </p>
          <Link
            href="/recite?mode=listen"
            className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent hover:underline"
          >
            Continue listening practice
          </Link>
        </article>
        <article className="border-l-2 border-accent bg-surface px-5 py-5 sm:px-6">
          <Flame aria-hidden="true" className="text-accent" size={22} />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.13em] text-muted">
            Activity streak
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-[-0.04em]">
            {hydrated ? `${streak} ${streak === 1 ? "day" : "days"}` : "—"}
          </p>
          <p className="mt-2 leading-7 text-muted">
            Consecutive days with learning or listening activity saved on this browser.
          </p>
        </article>
      </section>

      <aside className="mt-8 flex gap-3 rounded-2xl border border-line bg-accent-soft px-5 py-5 sm:px-6">
        <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-accent" size={22} />
        <div>
          <h2 className="font-semibold">A learning estimate—not a judgment</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-muted">
            These numbers only describe practice in the 52-word V1 prototype learner pack and its
            listening prompts. They do not measure overall Quran comprehension, recitation quality,
            religious knowledge, or faith.
          </p>
        </div>
      </aside>

      <section className="mt-12 border-t border-line pt-8" aria-labelledby="data-controls-heading">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Your data</p>
          <h2
            id="data-controls-heading"
            className="mt-1 text-2xl font-semibold tracking-[-0.025em]"
          >
            Back up or move local progress
          </h2>
          <p className="mt-2 leading-7 text-muted">
            Learning progress is currently stored in this browser. Download a backup before changing
            devices or clearing browser data. Cloud learning sync is not enabled yet.
          </p>
        </div>

        {notice && (
          <div
            className={`mt-5 flex max-w-3xl gap-3 rounded-xl border px-4 py-3 text-sm leading-6 ${notice.tone === "success" ? "border-accent bg-accent-soft text-ink" : "border-danger bg-surface text-danger"}`}
            role={notice.tone === "error" ? "alert" : "status"}
          >
            {notice.tone === "success" && (
              <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-accent" size={19} />
            )}
            <span>{notice.text}</span>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <Download aria-hidden="true" className="text-accent" size={23} />
            <h3 className="mt-4 text-lg font-semibold">Export progress</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Save learning records, listening totals, activity days, and compatible reader
              preferences as a JSON backup.
            </p>
            <button
              type="button"
              onClick={downloadProgress}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line px-5 font-semibold hover:bg-surface-soft sm:w-auto"
            >
              <Download aria-hidden="true" size={18} /> Download backup
            </button>
          </article>

          <article className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <Upload aria-hidden="true" className="text-accent" size={23} />
            <h3 className="mt-4 text-lg font-semibold">Import progress</h3>
            <p id="progress-file-help" className="mt-2 text-sm leading-6 text-muted">
              Choose a Quran Feham JSON backup up to 500 KB. Nothing changes until you press Import
              selected file; a valid import replaces local progress.
            </p>
            <input
              ref={fileInput}
              id="progress-file"
              type="file"
              accept="application/json,.json"
              aria-describedby="progress-file-help progress-file-name"
              className="mt-4 block min-h-12 w-full cursor-pointer rounded-xl border border-line bg-canvas px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:font-semibold file:text-accent"
              onChange={handleFileSelection}
            />
            <p id="progress-file-name" className="mt-2 min-h-6 text-sm text-muted">
              {selectedFile
                ? `${selectedFile.name} · ${Math.ceil(selectedFile.size / 1024)} KB`
                : "No file selected"}
            </p>
            <button
              type="button"
              onClick={() => void importSelectedProgress()}
              disabled={!selectedFile || importing || selectedFile.size > MAX_IMPORT_BYTES}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <Upload aria-hidden="true" size={18} />
              {importing ? "Validating…" : "Import selected file"}
            </button>
          </article>
        </div>
      </section>

      <section className="mt-10 border-t border-line pt-7" aria-labelledby="reset-heading">
        <div className="max-w-3xl">
          <h2 id="reset-heading" className="text-lg font-semibold">
            Reset local learning progress
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            This removes word reviews, listening totals, and activity history from this browser. It
            does not delete your account or reading position.
          </p>
          {!resetArmed ? (
            <button
              type="button"
              onClick={() => {
                setResetArmed(true);
                setNotice(null);
              }}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-danger px-4 font-semibold text-danger hover:bg-surface-soft"
            >
              <Trash2 aria-hidden="true" size={18} /> Reset local progress
            </button>
          ) : (
            <div className="mt-4 rounded-xl border border-danger bg-surface p-4" role="alert">
              <p className="font-semibold text-danger">
                Remove this browser&apos;s learning progress?
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                This cannot be undone unless you exported a backup first.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={resetLocalProgress}
                  className="min-h-11 rounded-xl bg-danger px-4 font-semibold text-white"
                >
                  Delete local progress
                </button>
                <button
                  type="button"
                  onClick={() => setResetArmed(false)}
                  className="min-h-11 rounded-xl border border-line px-4 font-semibold hover:bg-surface-soft"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
