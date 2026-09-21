"use client";

import {
  BookOpenText,
  Check,
  ChevronRight,
  Languages,
  LoaderCircle,
  Network,
  Search,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ApiFailure, type QuranSearchResponse, searchQuran } from "@/lib/api";
import { type MasteryMap, markKnown, readMasteryMap, reviewLater } from "@/lib/learning-store";
import {
  LEARNING_WORDS,
  type LearningWord,
  normalizeArabic,
  PROTOTYPE_LEARNING_PACK_VERSION,
  ROOT_NOTES,
} from "@/lib/prototype-learning-data";

type ExploreTab = "words" | "roots" | "search";
type SearchScope = "translation" | "arabic";

const translationOptions = [
  { id: "ur.jalandhry", label: "Urdu · Jalandhry" },
  { id: "ur.junagarhi", label: "Urdu · Junagarhi" },
  { id: "ur.maududi", label: "Urdu · Maududi" },
] as const;

const tabs: Array<{ id: ExploreTab; label: string; icon: typeof Search }> = [
  { id: "words", label: "Words", icon: Languages },
  { id: "roots", label: "Roots", icon: Network },
  { id: "search", label: "Quran search", icon: Search },
];

function matchesWord(word: LearningWord, query: string): boolean {
  const plain = query.trim().toLocaleLowerCase();
  if (!plain) return true;
  const normalizedCandidates = [
    normalizeArabic(plain),
    plain.includes("\u0670") ? normalizeArabic(plain.replace(/\u0670/g, "ا")) : null,
  ].filter(Boolean) as string[];
  const values = [word.display, word.urdu, word.root, word.lemma, word.pos, ...word.aliases];
  return values.some((value) => {
    if (!value) return false;
    return (
      value.toLocaleLowerCase().includes(plain) ||
      normalizedCandidates.some(
        (normQuery) => normQuery.length > 0 && normalizeArabic(value).includes(normQuery),
      )
    );
  });
}

function WordInspector({
  word,
  strength,
  onKnown,
  onReview,
}: {
  word: LearningWord;
  strength: number | null;
  onKnown: () => void;
  onReview: () => void;
}) {
  return (
    <section className="border border-line bg-surface p-5 sm:p-6" aria-labelledby="word-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-source">
            Reviewed learner gloss
          </p>
          <h2
            id="word-heading"
            className="font-quran mt-3 text-4xl text-accent"
            lang="ar"
            dir="rtl"
          >
            {word.display}
          </h2>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          {strength === null ? "New" : `${strength}%`}
        </span>
      </div>
      <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
        <div className="grid grid-cols-[5rem_1fr] gap-4 py-3">
          <dt className="text-muted">Urdu</dt>
          <dd className="font-urdu text-right text-base leading-7" lang="ur" dir="rtl">
            {word.urdu}
          </dd>
        </div>
        <div className="grid grid-cols-[5rem_1fr] gap-4 py-3">
          <dt className="text-muted">Root</dt>
          <dd className="text-right font-semibold" lang="ar" dir="rtl">
            {word.root ?? "Not listed in this pack"}
          </dd>
        </div>
        <div className="grid grid-cols-[5rem_1fr] gap-4 py-3">
          <dt className="text-muted">Lemma</dt>
          <dd className="text-right" lang="ar" dir="rtl">
            {word.lemma}
          </dd>
        </div>
        <div className="grid grid-cols-[5rem_1fr] gap-4 py-3">
          <dt className="text-muted">Type</dt>
          <dd className="font-urdu text-right" lang="ur" dir="rtl">
            {word.pos}
          </dd>
        </div>
      </dl>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onKnown}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action px-3 text-sm font-semibold text-on-action hover:bg-action-hover"
        >
          <Check aria-hidden="true" size={18} />I know this
        </button>
        <button
          type="button"
          onClick={onReview}
          className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm font-semibold hover:bg-surface-soft"
        >
          Review later
        </button>
      </div>
      <p className="mt-4 text-xs leading-5 text-muted">
        This is a limited teaching gloss from {PROTOTYPE_LEARNING_PACK_VERSION}; meaning still
        depends on the ayah context.
      </p>
    </section>
  );
}

export function ExploreWorkspace() {
  const [tab, setTab] = useState<ExploreTab>("words");
  const [wordQuery, setWordQuery] = useState("");
  const [selectedWord, setSelectedWord] = useState<LearningWord | null>(null);
  const [mastery, setMastery] = useState<MasteryMap>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("translation");
  const [translationEdition, setTranslationEdition] = useState("ur.jalandhry");
  const [results, setResults] = useState<QuranSearchResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const inspectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMastery(readMasteryMap(window.localStorage));
  }, []);

  const visibleWords = useMemo(
    () => LEARNING_WORDS.filter((word) => matchesWord(word, wordQuery)),
    [wordQuery],
  );

  function selectWord(word: LearningWord) {
    setSelectedWord(word);
    requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        inspectorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  function updateKnown(word: LearningWord) {
    markKnown(window.localStorage, word.key);
    setMastery(readMasteryMap(window.localStorage));
  }

  function updateReview(word: LearningWord) {
    reviewLater(window.localStorage, word.key);
    setMastery(readMasteryMap(window.localStorage));
  }

  function openRoot(root: string, keys: readonly string[]) {
    setWordQuery(root);
    setTab("words");
    const first = LEARNING_WORDS.find((word) => keys.includes(word.key));
    if (first) setSelectedWord(first);
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchTerm.trim();
    if (query.length < 2) {
      setSearchError("Enter at least two characters.");
      return;
    }
    setSearching(true);
    setSearchError("");
    setResults(null);
    try {
      setResults(await searchQuran(query, translationEdition, searchScope));
    } catch (error) {
      setSearchError(
        error instanceof ApiFailure
          ? error.message
          : "Quran search is temporarily unavailable. Please try again.",
      );
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`inline-flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold ${
              tab === id
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <Icon aria-hidden="true" size={18} />
            {label}
          </button>
        ))}
      </div>

      {tab === "words" && (
        <div className="mt-7">
          <label htmlFor="word-search" className="sr-only">
            Search the reviewed learner word pack
          </label>
          <div className="relative max-w-2xl">
            <Search
              aria-hidden="true"
              size={19}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="word-search"
              type="search"
              value={wordQuery}
              onChange={(event) => setWordQuery(event.target.value)}
              placeholder="Search Arabic, Urdu, root or lemma"
              className="min-h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-4 text-ink placeholder:text-muted"
            />
          </div>
          <p className="mt-3 text-sm text-muted">
            {visibleWords.length} of {LEARNING_WORDS.length} reviewed prototype entries
          </p>

          <div className="mt-6 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2">
              {visibleWords.map((word) => {
                const record = mastery[word.key];
                const strength =
                  typeof record?.strength === "number" ? Math.round(record.strength) : null;
                return (
                  <button
                    key={word.key}
                    type="button"
                    onClick={() => selectWord(word)}
                    aria-pressed={selectedWord?.key === word.key}
                    className={`min-h-32 bg-surface p-4 text-left hover:bg-surface-soft ${
                      selectedWord?.key === word.key
                        ? "relative z-10 ring-2 ring-inset ring-accent"
                        : ""
                    }`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-quran text-3xl text-accent" lang="ar" dir="rtl">
                        {word.display}
                      </span>
                      <span className="text-xs font-semibold text-muted">
                        {strength === null ? "New" : `${strength}%`}
                      </span>
                    </span>
                    <span
                      className="font-urdu mt-3 block text-right text-sm leading-7"
                      lang="ur"
                      dir="rtl"
                    >
                      {word.urdu}
                    </span>
                    <span className="mt-2 block text-xs text-muted">
                      {word.root ? `Root ${word.root} · ` : ""}
                      {word.pos}
                    </span>
                  </button>
                );
              })}
              {visibleWords.length === 0 && (
                <div className="col-span-full bg-surface px-5 py-12 text-center text-muted">
                  No reviewed learner word matches this search.
                </div>
              )}
            </div>
            <div
              ref={inspectorRef}
              className="order-first scroll-mt-24 lg:order-last lg:sticky lg:top-6"
            >
              {selectedWord ? (
                <WordInspector
                  word={selectedWord}
                  strength={
                    Number.isFinite(Number(mastery[selectedWord.key]?.strength))
                      ? Math.round(Number(mastery[selectedWord.key]?.strength))
                      : null
                  }
                  onKnown={() => updateKnown(selectedWord)}
                  onReview={() => updateReview(selectedWord)}
                />
              ) : (
                <aside className="border border-line bg-surface p-5 sm:p-6">
                  <h2 className="font-semibold">Choose a word</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Open a reviewed entry to see its Urdu learner gloss, root, lemma and word type.
                  </p>
                </aside>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "roots" && (
        <section className="mt-7" aria-labelledby="roots-heading">
          <div className="max-w-3xl border-l-4 border-accent bg-accent-soft px-5 py-4">
            <h2 id="roots-heading" className="font-semibold">
              Notice relationships, then return to context
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              A root helps you recognize related forms. It does not mean every derived word has the
              same meaning in every ayah.
            </p>
          </div>
          <div className="mt-6 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {ROOT_NOTES.map((root) => (
              <button
                key={root.root}
                type="button"
                onClick={() => openRoot(root.root, root.keys)}
                className="group min-h-40 bg-surface p-5 text-left hover:bg-surface-soft"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-quran text-3xl text-accent" lang="ar" dir="rtl">
                    {root.root}
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    size={19}
                    className="text-muted group-hover:text-accent"
                  />
                </span>
                <span className="font-urdu mt-4 block text-right leading-7" lang="ur" dir="rtl">
                  {root.gloss}
                </span>
                <span className="mt-3 block text-xs text-muted">
                  {root.keys.length} reviewed {root.keys.length === 1 ? "entry" : "entries"}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {tab === "search" && (
        <section className="mt-7" aria-labelledby="quran-search-heading">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,40rem)_1fr]">
            <div>
              <h2 id="quran-search-heading" className="text-xl font-semibold">
                Search the Quran
              </h2>
              <p className="mt-2 leading-7 text-muted">
                Choose the exact source you intend to search. Results open at the matching ayah in
                the Quran reader.
              </p>
              <form onSubmit={submitSearch} className="mt-6 space-y-5">
                <fieldset>
                  <legend className="text-sm font-semibold">Search in</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(
                      [
                        ["translation", "Urdu translation"],
                        ["arabic", "Arabic Quran"],
                      ] as const
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-3 text-center text-sm font-semibold ${
                          searchScope === value
                            ? "border-accent bg-accent-soft text-accent"
                            : "border-line bg-surface text-muted"
                        }`}
                      >
                        <input
                          type="radio"
                          name="search-scope"
                          value={value}
                          checked={searchScope === value}
                          onChange={() => setSearchScope(value)}
                          className="sr-only"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {searchScope === "translation" && (
                  <div>
                    <label htmlFor="search-edition" className="text-sm font-semibold">
                      Translation edition
                    </label>
                    <select
                      id="search-edition"
                      value={translationEdition}
                      onChange={(event) => setTranslationEdition(event.target.value)}
                      className="mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-3"
                    >
                      {translationOptions.map((translation) => (
                        <option key={translation.id} value={translation.id}>
                          {translation.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="quran-search" className="text-sm font-semibold">
                    Word or phrase
                  </label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      id="quran-search"
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder={searchScope === "arabic" ? "مثلاً رَحْمَة" : "مثلاً رحمت یا صبر"}
                      className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 text-ink placeholder:text-muted"
                      lang={searchScope === "arabic" ? "ar" : "ur"}
                      dir="rtl"
                    />
                    <button
                      type="submit"
                      disabled={searching}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover disabled:opacity-60"
                    >
                      {searching ? (
                        <LoaderCircle aria-hidden="true" size={19} className="animate-spin" />
                      ) : (
                        <Search aria-hidden="true" size={19} />
                      )}
                      Search
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <aside className="border-l-4 border-source bg-surface px-5 py-4 text-sm leading-6 text-muted">
              Arabic search uses the labelled runtime Uthmani provider edition. Urdu search uses the
              named translation you select. Search results are source text, not AI-generated
              answers.
            </aside>
          </div>

          <div className="mt-8" aria-live="polite">
            {searchError && (
              <p
                className="border border-danger bg-surface px-4 py-3 text-sm text-danger"
                role="alert"
              >
                {searchError}
              </p>
            )}
            {results && (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
                  <h3 className="text-lg font-semibold">
                    {results.count} {results.count === 1 ? "match" : "matches"}
                  </h3>
                  <p className="text-xs text-muted">Edition: {results.edition}</p>
                </div>
                <div className="divide-y divide-line border-b border-line">
                  {results.matches.map((match) => (
                    <article
                      key={`${match.globalNumber}-${match.surah.number}-${match.ayahNumber}`}
                      className="grid gap-3 py-5 sm:grid-cols-[9rem_1fr_auto] sm:items-center"
                    >
                      <p className="font-semibold">
                        {match.surah.nameEnglish} {match.surah.number}:{match.ayahNumber}
                      </p>
                      <p
                        className={`${results.edition === "quran-uthmani" ? "font-quran text-2xl leading-[1.8]" : "font-urdu text-base leading-8"} text-right`}
                        lang={results.edition === "quran-uthmani" ? "ar" : "ur"}
                        dir="rtl"
                      >
                        {match.text}
                      </p>
                      <Link
                        href={`/quran?surah=${match.surah.number}&ayah=${match.ayahNumber}`}
                        className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-line px-3 text-sm font-semibold text-accent hover:bg-accent-soft"
                      >
                        Open <ChevronRight aria-hidden="true" size={17} />
                      </Link>
                    </article>
                  ))}
                  {results.matches.length === 0 && (
                    <p className="py-10 text-center text-muted">
                      No matches were returned by the selected edition.
                    </p>
                  )}
                </div>
                {results.count > results.matches.length && (
                  <p className="mt-3 text-xs text-muted">
                    Showing the first {results.matches.length} matches. Refine the phrase to narrow
                    the result.
                  </p>
                )}
              </>
            )}
            {!results && !searchError && !searching && (
              <div className="border-y border-line py-10 text-center text-muted">
                <BookOpenText aria-hidden="true" className="mx-auto mb-3" size={28} />
                Search results will appear here with an exact link to the reader.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
