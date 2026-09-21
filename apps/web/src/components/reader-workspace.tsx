"use client";

import {
  type Ayah,
  type SourceAttribution,
  SUPPORTED_RECITATION_EDITIONS,
  type SurahSummary,
  UserSettingsSchema,
} from "@quran-feham/contracts";
import { ayahKey } from "@quran-feham/quran-content";
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  BookOpenText,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Headphones,
  Info,
  List,
  LoaderCircle,
  Menu,
  Pause,
  Play,
  Search,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiRequest, getSurah, getSurahs } from "@/lib/api";
import {
  BOOKMARKS_CHANGED_EVENT,
  bookmarkKey,
  readBookmarks,
  toggleBookmark,
} from "@/lib/bookmark-store";
import {
  isUnderstood,
  type MasteryMap,
  markKnown,
  readMasteryMap,
  reviewLater,
} from "@/lib/learning-store";
import { getParaForAyah, getParaStartingAt, PARAS, type ParaMetadata } from "@/lib/para-data";
import {
  PREVIEW_FATIHA,
  PREVIEW_FATIHA_SUMMARY,
  PREVIEW_NOTICE,
  PREVIEW_SURAHS,
} from "@/lib/preview-data";
import { findLearningWord, tokenizeArabic } from "@/lib/prototype-learning-data";
import { READING_HISTORY_CHANGED_EVENT, recordReadingHistory } from "@/lib/reading-history-store";
import { applyThemePreference } from "@/lib/theme";
import { MobileNavigation } from "./app-shell";
import { Brand } from "./brand";

type ReaderSourceState = "loading" | "published" | "runtime" | "preview" | "unavailable";

interface ReaderContent {
  ayahs: Ayah[];
  releaseId: string | null;
  arabicSource: SourceAttribution | null;
  translationSource: SourceAttribution | null;
  recitationSource: SourceAttribution | null;
  warnings: string[];
}

const emptyContent: ReaderContent = {
  ayahs: [],
  releaseId: null,
  arabicSource: null,
  translationSource: null,
  recitationSource: null,
  warnings: [],
};

const translations = [
  { id: "ur.jalandhry", label: "Urdu · Jalandhry", lang: "ur", dir: "rtl" },
  { id: "ur.junagarhi", label: "Urdu · Junagarhi", lang: "ur", dir: "rtl" },
  { id: "ur.maududi", label: "Urdu · Maududi", lang: "ur", dir: "rtl" },
  { id: "en.sahih", label: "English · Saheeh International", lang: "en", dir: "ltr" },
] as const;

function QuranNavigator({
  surahs,
  currentSurah,
  onSelectSurah,
  onSelectPara,
  idPrefix,
}: {
  surahs: SurahSummary[];
  currentSurah: number;
  onSelectSurah: (surah: SurahSummary) => void;
  onSelectPara: (para: ParaMetadata) => void;
  idPrefix: string;
}) {
  const [navTab, setNavTab] = useState<"surahs" | "paras">("surahs");
  const [query, setQuery] = useState("");

  const visibleSurahs = useMemo(() => {
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

  const visibleParas = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return PARAS;
    return PARAS.filter(
      (para) =>
        String(para.number) === normalized ||
        para.nameLatin.toLocaleLowerCase().includes(normalized) ||
        para.nameArabic.includes(query.trim()),
    );
  }, [query]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Navigation Mode Switcher */}
      <div className="flex border-b border-line p-2 bg-surface-soft/60">
        <button
          type="button"
          onClick={() => {
            setNavTab("surahs");
            setQuery("");
          }}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
            navTab === "surahs" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          Surahs (1–114)
        </button>
        <button
          type="button"
          onClick={() => {
            setNavTab("paras");
            setQuery("");
          }}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
            navTab === "paras" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          Paras / Juz (1–30)
        </button>
      </div>

      <div className="border-b border-line p-3">
        <label htmlFor={`${idPrefix}-nav-search`} className="sr-only">
          {navTab === "surahs" ? "Find a surah" : "Find a para"}
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
            size={18}
          />
          <input
            id={`${idPrefix}-nav-search`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              navTab === "surahs"
                ? "Find surah (e.g. Baqarah, 2, يٰس)"
                : "Find para (e.g. Sayaqool, 2, الم)"
            }
            className="min-h-10 w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-muted hover:border-muted"
          />
        </div>
      </div>

      <ul
        className="min-h-0 flex-1 overflow-y-auto p-2"
        aria-label={navTab === "surahs" ? "Surahs" : "Paras"}
      >
        {navTab === "surahs" &&
          visibleSurahs.map((surah) => {
            const active = surah.number === currentSurah;
            return (
              <li key={surah.number}>
                <button
                  type="button"
                  onClick={() => onSelectSurah(surah)}
                  aria-current={active ? "true" : undefined}
                  className={`mb-1 grid min-h-[4.25rem] w-full grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-xl px-2.5 text-left ${active ? "bg-accent-soft text-accent" : "text-ink hover:bg-surface-soft"}`}
                >
                  <span className="text-center text-sm text-muted">{surah.number}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{surah.nameEnglish}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {surah.nameTranslation} · {surah.ayahCount} ayahs
                    </span>
                  </span>
                  <span className="font-quran text-xl" lang="ar" dir="rtl">
                    {surah.nameArabic}
                  </span>
                </button>
              </li>
            );
          })}

        {navTab === "paras" &&
          visibleParas.map((para) => (
            <li key={para.number}>
              <button
                type="button"
                onClick={() => onSelectPara(para)}
                className="mb-1 grid min-h-[4.25rem] w-full grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-xl px-2.5 text-left text-ink hover:bg-surface-soft"
              >
                <span className="text-center text-sm text-muted">{para.number}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    پارہ {para.number} · {para.nameLatin}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    Surah {para.start.surah}:{para.start.ayah} — {para.end.surah}:{para.end.ayah}
                  </span>
                </span>
                <span className="font-quran text-xl" lang="ar" dir="rtl">
                  {para.nameArabic}
                </span>
              </button>
            </li>
          ))}

        {((navTab === "surahs" && visibleSurahs.length === 0) ||
          (navTab === "paras" && visibleParas.length === 0)) && (
          <p className="px-3 py-8 text-center text-sm text-muted">
            No matching {navTab === "surahs" ? "surah" : "para"}.
          </p>
        )}
      </ul>
    </div>
  );
}

function SourceLine({ label, source }: { label: string; source: SourceAttribution | null }) {
  const licenseIsUrl =
    source?.license.startsWith("https://") || source?.license.startsWith("http://");

  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-3 border-t border-line py-3 text-sm first:border-t-0">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 text-ink">
        {source ? (
          <>
            <span className="block font-semibold">{source.edition}</span>
            <span className="mt-0.5 block break-words text-xs text-muted">
              {source.provider} · {source.upstreamVersion}
            </span>
            <span className="mt-2 block break-all font-mono text-[0.7rem] leading-5 text-muted">
              SHA-256 {source.sha256}
            </span>
            {licenseIsUrl ? (
              <a
                href={source.license}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex min-h-11 items-center text-xs font-semibold text-source underline underline-offset-4"
              >
                Licence and source terms
              </a>
            ) : (
              <span className="mt-1 block text-xs leading-5 text-muted">
                Licence: {source.license}
              </span>
            )}
          </>
        ) : (
          <span className="text-muted">Not available</span>
        )}
      </dd>
    </div>
  );
}

function StudyPanel({
  idPrefix,
  selectedAyah,
  selectedSurah,
  translation,
  sourceState,
  content,
  selectedToken,
  mastery,
  onSelectToken,
  onMarkKnown,
  onReviewLater,
  onClose,
}: {
  idPrefix: string;
  selectedAyah: Ayah | null;
  selectedSurah: SurahSummary;
  translation: (typeof translations)[number];
  sourceState: ReaderSourceState;
  content: ReaderContent;
  selectedToken: string | null;
  mastery: MasteryMap;
  onSelectToken: (token: string) => void;
  onMarkKnown: (key: string) => void;
  onReviewLater: (key: string) => void;
  onClose?: () => void;
}) {
  const headingId = `${idPrefix}-study-heading`;
  const learningWord = selectedToken ? findLearningWord(selectedToken) : null;
  const masteryRecord = learningWord ? mastery[learningWord.key] : undefined;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-accent">
          <Headphones aria-hidden="true" size={19} />
          <h2 id={headingId} className="font-semibold text-ink">
            Study margin
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 place-items-center rounded-xl text-muted hover:bg-surface-soft hover:text-ink"
            aria-label="Close study margin"
          >
            <X aria-hidden="true" size={22} />
          </button>
        )}
      </div>
      {selectedAyah ? (
        <div className="mt-5">
          <p className="text-sm font-semibold text-source">
            {selectedSurah.nameEnglish} {selectedAyah.ayahNumber}
          </p>
          <p className="font-quran mt-4 text-right text-3xl leading-[1.9]" lang="ar" dir="rtl">
            {selectedAyah.arabic}
          </p>
          {selectedAyah.translation ? (
            <p
              className={`mt-4 border-t border-line pt-4 leading-8 text-muted ${translation.lang === "ur" ? "font-urdu text-lg" : ""}`}
              lang={translation.lang}
              dir={translation.dir}
            >
              {selectedAyah.translation}
            </p>
          ) : (
            <p className="mt-5 rounded-xl bg-surface-soft px-4 py-3 text-sm leading-6 text-muted">
              Translation is unavailable in this interface preview.
            </p>
          )}
          <div className="mt-6 border-t border-line pt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Word inspector</h3>
              <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
                Prototype pack
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              Tap a word for the carried-forward learner gloss. This 52-word pack is a teaching
              aid—not full reviewed morphology or a Quran translation.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2" dir="rtl">
              {tokenizeArabic(selectedAyah.arabic).map((token, index) => {
                const match = findLearningWord(token.raw);
                const active = selectedToken === token.raw;
                return (
                  <button
                    key={`${token.raw}-${index}`}
                    type="button"
                    onClick={() => onSelectToken(token.raw)}
                    aria-pressed={active}
                    className={`min-h-11 rounded-xl border px-3 font-quran text-lg ${
                      active
                        ? "border-accent bg-accent-soft text-accent"
                        : match
                          ? "border-line bg-surface hover:border-accent"
                          : "border-line bg-surface text-muted hover:border-muted"
                    }`}
                    title={
                      match
                        ? "Prototype learner gloss available"
                        : "No reviewed learner gloss in this pack"
                    }
                  >
                    {token.raw}
                  </button>
                );
              })}
            </div>
            {selectedToken && (
              <div className="mt-4 rounded-xl bg-surface-soft p-4" aria-live="polite">
                <p className="font-quran text-right text-3xl leading-[1.8]" dir="rtl" lang="ar">
                  {selectedToken}
                </p>
                {learningWord ? (
                  <>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                      Learner gloss · not Quran translation
                    </p>
                    <p className="font-urdu mt-2 text-right text-xl leading-9" dir="rtl" lang="ur">
                      {learningWord.urdu}
                    </p>
                    <dl className="mt-4 grid grid-cols-[5rem_1fr] gap-x-3 gap-y-2 border-t border-line pt-4 text-sm">
                      <dt className="text-muted">Root</dt>
                      <dd className="font-quran text-right" dir="rtl">
                        {learningWord.root ?? "—"}
                      </dd>
                      <dt className="text-muted">Lemma</dt>
                      <dd className="font-quran text-right" dir="rtl">
                        {learningWord.lemma}
                      </dd>
                      <dt className="text-muted">Practice</dt>
                      <dd className="flex items-center justify-between">
                        <span>
                          {masteryRecord
                            ? `${Number(masteryRecord.strength ?? 0)}% · ${masteryRecord.stage ?? "learning"}`
                            : "New word"}
                        </span>
                        {isUnderstood(masteryRecord) && (
                          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">
                            Understood
                          </span>
                        )}
                      </dd>
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onMarkKnown(learningWord.key)}
                        className="min-h-11 rounded-xl bg-action px-4 text-sm font-semibold text-on-action hover:bg-action-hover"
                      >
                        I know this
                      </button>
                      <button
                        type="button"
                        onClick={() => onReviewLater(learningWord.key)}
                        className="min-h-11 rounded-xl border border-line bg-surface px-4 text-sm font-semibold hover:border-accent"
                      >
                        Review later
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-muted">
                    No reviewed learner gloss exists for this word in the prototype pack. Quran
                    Feham will not guess one. Use the named verse translation above.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl bg-surface-soft p-4">
          <p className="font-semibold">Choose an ayah to study</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Available translation stays beside the reading canvas. Reviewed word analysis remains
            unavailable until a position-addressed release is published.
          </p>
        </div>
      )}

      <div className="mt-8 border-t border-line pt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Source record</h3>
          <Link
            href="/home"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-muted hover:bg-surface-soft hover:text-ink sm:inline-flex"
          >
            Home
          </Link>
          <Link
            href="/sources"
            className="min-h-11 content-center text-sm font-semibold text-source hover:underline"
          >
            Details
          </Link>
        </div>
        {sourceState === "published" || sourceState === "runtime" ? (
          <dl className="mt-2">
            <SourceLine label="Arabic" source={content.arabicSource} />
            <SourceLine label="Translation" source={content.translationSource} />
            <SourceLine label="Recitation" source={content.recitationSource} />
          </dl>
        ) : (
          <p className="mt-2 text-sm leading-6 text-muted">
            No published source manifest is connected to this preview.
          </p>
        )}
        {content.releaseId && (
          <p className="mt-3 break-all text-xs text-muted">
            {sourceState === "runtime" ? "Runtime fingerprint" : "Release"} {content.releaseId}
          </p>
        )}
      </div>
    </div>
  );
}

export function ReaderWorkspace({
  initialSurahNumber = 1,
  initialAyahNumber,
}: {
  initialSurahNumber?: number;
  initialAyahNumber?: number;
}) {
  const [surahs, setSurahs] = useState<SurahSummary[]>(PREVIEW_SURAHS);
  const [selectedSurah, setSelectedSurah] = useState<SurahSummary>(
    PREVIEW_SURAHS.find((surah) => surah.number === initialSurahNumber) ?? PREVIEW_FATIHA_SUMMARY,
  );
  const [content, setContent] = useState<ReaderContent>(emptyContent);
  const [sourceState, setSourceState] = useState<ReaderSourceState>("loading");
  const [selectedAyah, setSelectedAyah] = useState<Ayah | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [mastery, setMastery] = useState<MasteryMap>({});
  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(new Set());
  const [bookmarkNotice, setBookmarkNotice] = useState("");
  const [translationId, setTranslationId] =
    useState<(typeof translations)[number]["id"]>("ur.jalandhry");
  const [arabicScale, setArabicScale] = useState(1);
  const [recitationId, setRecitationId] = useState("ar.alafasy");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [recedeKnown, setRecedeKnown] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastExplicitPositionRef = useRef<{ savedAt: number } | null>(null);
  const positionSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const dialogRef = useRef<HTMLDialogElement>(null);
  const studyDialogRef = useRef<HTMLDialogElement>(null);
  const ayahListRef = useRef<HTMLDivElement>(null);
  const initialSelectionApplied = useRef(
    PREVIEW_SURAHS.some((surah) => surah.number === initialSurahNumber),
  );
  const initialAyahApplied = useRef(false);

  const translation = translations.find((item) => item.id === translationId) ?? translations[0];

  useEffect(() => {
    setMastery(readMasteryMap(window.localStorage));
  }, []);

  useEffect(() => {
    const refresh = () => {
      setBookmarkedKeys(
        new Set(readBookmarks(window.localStorage).map((bookmark) => bookmark.key)),
      );
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(BOOKMARKS_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(BOOKMARKS_CHANGED_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    function applySettings(value: unknown) {
      if (!value || typeof value !== "object") return;
      const candidate = value as Record<string, unknown>;
      if (
        typeof candidate.translationEditionId === "string" &&
        translations.some((item) => item.id === candidate.translationEditionId)
      ) {
        setTranslationId(candidate.translationEditionId as typeof translationId);
      }
      const nextScale = Number(candidate.arabicScale);
      if (Number.isFinite(nextScale) && nextScale >= 0.8 && nextScale <= 1.6) {
        setArabicScale(nextScale);
      }
      if (
        typeof candidate.recitationEditionId === "string" &&
        SUPPORTED_RECITATION_EDITIONS.some((edition) => edition === candidate.recitationEditionId)
      ) {
        setRecitationId(candidate.recitationEditionId);
      }
      if (["light", "dark", "system"].includes(String(candidate.theme))) {
        applyThemePreference(candidate.theme);
      }
    }

    const stored = window.localStorage.getItem("qf:web-preferences");
    if (stored) {
      try {
        applySettings(JSON.parse(stored));
      } catch {
        window.localStorage.removeItem("qf:web-preferences");
      }
    }

    let active = true;
    apiRequest("/users/settings")
      .then((settings) => {
        if (!active) return;
        const parsed = UserSettingsSchema.safeParse(settings);
        if (!parsed.success) return;
        applySettings(parsed.data);
        window.localStorage.setItem("qf:web-preferences", JSON.stringify(parsed.data));
        setSyncEnabled(true);
      })
      .catch(() => {
        if (active) setSyncEnabled(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getSurahs()
      .then((items) => {
        if (active && items.length > 0) setSurahs(items);
      })
      .catch(() => {
        if (active) setSurahs(PREVIEW_SURAHS);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (initialSelectionApplied.current) return;
    const requested = surahs.find((surah) => surah.number === initialSurahNumber);
    if (requested) {
      initialSelectionApplied.current = true;
      setSelectedSurah(requested);
    }
  }, [initialSurahNumber, surahs]);

  useEffect(() => {
    let active = true;
    setSourceState("loading");
    setSelectedAyah(null);
    setContent(emptyContent);
    getSurah(selectedSurah.number, translationId, recitationId)
      .then((response) => {
        if (!active) return;
        setSelectedSurah(response.surah);
        setContent({
          ayahs: response.ayahs,
          releaseId: response.contentReleaseId,
          arabicSource: response.arabicSource,
          translationSource: response.translationSource ?? null,
          recitationSource: response.recitationSource ?? null,
          warnings: response.warnings,
        });
        setSourceState(response.contentReleaseId.startsWith("runtime-") ? "runtime" : "published");
        if (
          !initialAyahApplied.current &&
          initialAyahNumber &&
          response.surah.number === initialSurahNumber
        ) {
          const initialAyah = response.ayahs.find((ayah) => ayah.ayahNumber === initialAyahNumber);
          if (initialAyah) {
            initialAyahApplied.current = true;
            setSelectedAyah(initialAyah);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const element = document.getElementById(
                  `ayah-${ayahKey(initialAyah.surahNumber, initialAyah.ayahNumber).replace(":", "-")}`,
                );
                element?.scrollIntoView({ block: "center" });
                element?.focus({ preventScroll: true });
              });
            });
          }
        }
      })
      .catch(() => {
        if (!active) return;
        if (selectedSurah.number === 1) {
          setContent({ ...emptyContent, ayahs: PREVIEW_FATIHA });
          setSourceState("preview");
        } else {
          setContent(emptyContent);
          setSourceState("unavailable");
        }
      });
    return () => {
      active = false;
    };
  }, [initialAyahNumber, initialSurahNumber, recitationId, selectedSurah.number, translationId]);

  useEffect(() => {
    if (!syncEnabled || content.ayahs.length === 0 || !ayahListRef.current) return;
    let dwellTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (!visible) return;
        if (dwellTimer) clearTimeout(dwellTimer);
        dwellTimer = setTimeout(() => {
          const ayahNumber = Number((visible.target as HTMLElement).dataset.ayahNumber);
          const ayah = content.ayahs.find((candidate) => candidate.ayahNumber === ayahNumber);
          if (ayah) void savePosition(ayah, "read");
        }, 1_200);
      },
      { threshold: 0.65 },
    );
    for (const article of ayahListRef.current.querySelectorAll<HTMLElement>("[data-ayah-number]")) {
      observer.observe(article);
    }
    return () => {
      if (dwellTimer) clearTimeout(dwellTimer);
      observer.disconnect();
    };
  }, [content.ayahs, syncEnabled]);

  useEffect(() => {
    return () => audioRef.current?.pause();
  }, []);

  function chooseSurah(surah: SurahSummary) {
    audioRef.current?.pause();
    setPlayingKey(null);
    setSelectedSurah(surah);
    if (dialogRef.current?.open) dialogRef.current.close();
    if (studyDialogRef.current?.open) studyDialogRef.current.close();
    window.scrollTo({ top: 0, behavior: "smooth" });
    recordReadingHistory(window.localStorage, {
      surahNumber: surah.number,
      ayahNumber: 1,
      surahNameArabic: surah.nameArabic,
      surahNameEnglish: surah.nameEnglish,
      mode: "read",
    });
    window.dispatchEvent(new Event(READING_HISTORY_CHANGED_EVENT));
  }

  function choosePara(para: ParaMetadata) {
    audioRef.current?.pause();
    setPlayingKey(null);
    const targetSurah = surahs.find((s) => s.number === para.start.surah);
    if (targetSurah) {
      setSelectedSurah(targetSurah);
      setSelectedAyah(null);
      setSelectedToken(null);
      if (dialogRef.current?.open) dialogRef.current.close();
      if (studyDialogRef.current?.open) studyDialogRef.current.close();
      recordReadingHistory(window.localStorage, {
        surahNumber: para.start.surah,
        ayahNumber: para.start.ayah,
        surahNameArabic: targetSurah.nameArabic,
        surahNameEnglish: targetSurah.nameEnglish,
        mode: "read",
        mushafPage: para.startMushafPage,
      });
      window.dispatchEvent(new Event(READING_HISTORY_CHANGED_EVENT));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const element = document.getElementById(
            `ayah-${ayahKey(para.start.surah, para.start.ayah).replace(":", "-")}`,
          );
          element?.scrollIntoView({ block: "center" });
          element?.focus({ preventScroll: true });
        });
      });
    }
  }

  function openSurahPicker() {
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }

  function openStudy(ayah: Ayah) {
    setSelectedAyah(ayah);
    setSelectedToken(null);
    void savePosition(ayah, "study");
    recordReadingHistory(window.localStorage, {
      surahNumber: ayah.surahNumber,
      ayahNumber: ayah.ayahNumber,
      surahNameArabic: selectedSurah.nameArabic,
      surahNameEnglish: selectedSurah.nameEnglish,
      mode: "study",
      mushafPage: getParaForAyah(ayah.surahNumber, ayah.ayahNumber)?.startMushafPage,
    });
    window.dispatchEvent(new Event(READING_HISTORY_CHANGED_EVENT));
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    requestAnimationFrame(() => {
      if (studyDialogRef.current && !studyDialogRef.current.open) {
        studyDialogRef.current.showModal();
      }
    });
  }

  function markWordKnown(key: string) {
    markKnown(window.localStorage, key);
    setMastery(readMasteryMap(window.localStorage));
    window.dispatchEvent(new Event("qf:mastery"));
  }

  function scheduleWordReview(key: string) {
    reviewLater(window.localStorage, key);
    setMastery(readMasteryMap(window.localStorage));
    window.dispatchEvent(new Event("qf:mastery"));
  }

  function playAyah(ayah: Ayah) {
    if (!ayah.audioUrl) return;
    const key = ayahKey(ayah.surahNumber, ayah.ayahNumber);
    if (playingKey === key) {
      audioRef.current?.pause();
      setPlayingKey(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(ayah.audioUrl);
    audioRef.current = audio;
    audio.addEventListener("ended", () => setPlayingKey(null), { once: true });
    audio
      .play()
      .then(() => {
        setPlayingKey(key);
        void savePosition(ayah, "listen");
        recordReadingHistory(window.localStorage, {
          surahNumber: ayah.surahNumber,
          ayahNumber: ayah.ayahNumber,
          surahNameArabic: selectedSurah.nameArabic,
          surahNameEnglish: selectedSurah.nameEnglish,
          mode: "listen",
          mushafPage: getParaForAyah(ayah.surahNumber, ayah.ayahNumber)?.startMushafPage,
        });
        window.dispatchEvent(new Event(READING_HISTORY_CHANGED_EVENT));
      })
      .catch(() => setPlayingKey(null));
  }

  function toggleAyahBookmark(ayah: Ayah) {
    try {
      const result = toggleBookmark(window.localStorage, {
        surahNumber: ayah.surahNumber,
        ayahNumber: ayah.ayahNumber,
        surahName: selectedSurah.nameEnglish,
        surahNameArabic: selectedSurah.nameArabic,
        arabicText: ayah.arabic,
        ...(ayah.translation ? { translationText: ayah.translation } : {}),
        translationLanguage: translation.lang,
        translationDirection: translation.dir,
      });
      setBookmarkedKeys(
        new Set(readBookmarks(window.localStorage).map((bookmark) => bookmark.key)),
      );
      setBookmarkNotice(
        result.bookmarked
          ? `Saved ${selectedSurah.nameEnglish}, ayah ${ayah.ayahNumber}.`
          : `Removed ${selectedSurah.nameEnglish}, ayah ${ayah.ayahNumber} from bookmarks.`,
      );
      window.dispatchEvent(new Event(BOOKMARKS_CHANGED_EVENT));
    } catch {
      setBookmarkNotice("This bookmark could not be saved in this browser.");
    }
  }

  function savePosition(ayah: Ayah, mode: "read" | "study" | "listen"): Promise<void> {
    if (!syncEnabled) return Promise.resolve();
    if (mode === "read") {
      const explicit = lastExplicitPositionRef.current;
      if (explicit && Date.now() - explicit.savedAt < 30_000) {
        return Promise.resolve();
      }
    } else {
      lastExplicitPositionRef.current = { savedAt: Date.now() };
    }

    positionSaveQueueRef.current = positionSaveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          await apiRequest("/users/reading-position", {
            method: "PUT",
            body: JSON.stringify({
              surahNumber: ayah.surahNumber,
              ayahNumber: ayah.ayahNumber,
              mode,
            }),
          });
        } catch {
          // The reader is public. Signed-out and temporarily offline readers
          // keep working while authenticated sessions use the same endpoint.
        }
      });
    return positionSaveQueueRef.current;
  }

  return (
    <div className="min-h-dvh bg-canvas pb-20 lg:pb-0">
      <header
        className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-surface/97 px-3 sm:px-5"
        data-no-print
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openSurahPicker}
            className="grid size-11 place-items-center rounded-xl text-muted hover:bg-surface-soft hover:text-ink lg:hidden"
            aria-label="Open surah list"
          >
            <Menu aria-hidden="true" size={22} />
          </button>
          <Brand />
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/sources"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-muted hover:bg-surface-soft hover:text-ink sm:inline-flex"
          >
            Sources
          </Link>
          <Link
            href="/more"
            className="grid size-11 place-items-center rounded-xl text-muted hover:bg-surface-soft hover:text-ink"
            aria-label="More Quran tools and account"
          >
            <CircleUserRound aria-hidden="true" size={22} />
          </Link>
        </div>
      </header>

      <dialog
        ref={dialogRef}
        className="m-0 h-dvh max-h-none w-[min(90vw,24rem)] max-w-none border-0 bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/45 lg:hidden"
        aria-labelledby="surah-dialog-title"
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <h2 id="surah-dialog-title" className="font-semibold">
            Choose a surah
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="grid size-11 place-items-center rounded-xl text-muted hover:bg-surface-soft"
            aria-label="Close surah list"
          >
            <X aria-hidden="true" size={22} />
          </button>
        </div>
        <div className="h-[calc(100dvh-4rem)]">
          <QuranNavigator
            idPrefix="dialog"
            surahs={surahs}
            currentSurah={selectedSurah.number}
            onSelectSurah={chooseSurah}
            onSelectPara={choosePara}
          />
        </div>
      </dialog>

      <dialog
        ref={studyDialogRef}
        id="study-sheet"
        className="study-sheet border-0 border-t border-line bg-surface px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 text-ink shadow-2xl backdrop:bg-black/45 lg:hidden"
        aria-labelledby="mobile-study-heading"
      >
        <StudyPanel
          idPrefix="mobile"
          selectedAyah={selectedAyah}
          selectedSurah={selectedSurah}
          translation={translation}
          sourceState={sourceState}
          content={content}
          selectedToken={selectedToken}
          mastery={mastery}
          onSelectToken={setSelectedToken}
          onMarkKnown={markWordKnown}
          onReviewLater={scheduleWordReview}
          onClose={() => studyDialogRef.current?.close()}
        />
      </dialog>

      <p className="sr-only" aria-live="polite">
        {bookmarkNotice}
      </p>

      <main id="main-content" className="reader-grid">
        <aside
          className="sticky top-16 hidden h-[calc(100dvh-4rem)] min-h-0 border-r border-line bg-surface lg:block"
          aria-label="Surah and Para navigation"
        >
          <QuranNavigator
            idPrefix="rail"
            surahs={surahs}
            currentSurah={selectedSurah.number}
            onSelectSurah={chooseSurah}
            onSelectPara={choosePara}
          />
        </aside>

        <section className="min-w-0 bg-canvas" aria-labelledby="surah-title">
          <h1 id="surah-title" className="sr-only">
            {selectedSurah.nameEnglish}
          </h1>
          <div
            className="sticky top-16 z-30 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur-sm sm:px-6"
            data-no-print
          >
            <div className="reading-measure flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={openSurahPicker}
                className="flex min-h-11 items-center gap-2 rounded-xl px-1 text-left lg:hidden"
                aria-label="Choose a surah"
              >
                <List className="text-muted" aria-hidden="true" size={19} />
                <span>
                  <span className="block font-semibold text-ink">{selectedSurah.nameEnglish}</span>
                  <span className="block text-xs text-muted">
                    {selectedSurah.nameTranslation} · {selectedSurah.ayahCount} ayahs
                  </span>
                </span>
              </button>
              <div className="hidden min-h-11 items-center px-1 lg:flex">
                <span>
                  <span className="block font-semibold text-ink">{selectedSurah.nameEnglish}</span>
                  <span className="block text-xs text-muted">
                    {selectedSurah.nameTranslation} · {selectedSurah.ayahCount} ayahs
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRecedeKnown((v) => !v)}
                  title={
                    recedeKnown
                      ? "Direct Arabic Mode active: Click to restore full translation display"
                      : "Direct Arabic Mode: Subdue translations to read Arabic directly without crutches"
                  }
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
                    recedeKnown
                      ? "border-accent bg-accent text-on-action"
                      : "border-line bg-surface text-muted hover:border-accent hover:text-ink"
                  }`}
                >
                  <Sparkles size={14} />
                  <span className="hidden sm:inline">Direct Arabic</span>
                </button>
                <label htmlFor="translation" className="sr-only">
                  Translation
                </label>
                <select
                  id="translation"
                  value={translationId}
                  onChange={(event) => setTranslationId(event.target.value as typeof translationId)}
                  className="min-h-11 max-w-44 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink"
                >
                  {translations.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <label htmlFor="arabic-scale" className="sr-only">
                  Arabic text size
                </label>
                <input
                  id="arabic-scale"
                  type="range"
                  min="0.85"
                  max="1.35"
                  step="0.1"
                  value={arabicScale}
                  onChange={(event) => setArabicScale(Number(event.target.value))}
                  className="hidden w-24 accent-accent sm:block"
                />
                <Settings2 className="hidden text-muted sm:block" aria-hidden="true" size={18} />
              </div>
            </div>
          </div>

          <div className="reading-measure px-4 py-6 sm:px-6 sm:py-10">
            {sourceState === "preview" && (
              <div
                className="mb-6 rounded-xl border border-warning/30 bg-[#fff8e7] px-4 py-3 text-sm leading-6 text-[#694300]"
                role="status"
              >
                <Info className="mr-2 inline" aria-hidden="true" size={17} />
                {PREVIEW_NOTICE}
              </div>
            )}
            {sourceState === "runtime" && (
              <div
                className="mb-6 rounded-xl border border-source/30 bg-[#eef6fb] px-4 py-3 text-sm leading-6 text-[#234b69]"
                role="status"
              >
                <Info className="mr-2 inline" aria-hidden="true" size={17} />
                Live provider response. It is source-labelled and validated, but it is not yet an
                immutable, reviewer-approved Quran Feham content release.
              </div>
            )}
            {content.warnings.length > 0 && (
              <div
                className="mb-6 rounded-xl border border-warning/30 bg-[#fff8e7] px-4 py-3 text-sm text-[#694300]"
                role="status"
              >
                {content.warnings.join(" ")}
              </div>
            )}

            <header className="mb-4 rounded-2xl border border-line bg-surface px-5 py-7 text-center sm:px-8 sm:py-9">
              <p className="font-quran text-4xl text-accent sm:text-5xl" lang="ar" dir="rtl">
                {selectedSurah.nameArabic}
              </p>
              <p className="mt-3 text-sm text-muted">
                Surah {selectedSurah.number} · {selectedSurah.revelationType}
              </p>
            </header>

            {sourceState === "loading" && (
              <div className="grid min-h-72 place-items-center" role="status">
                <span className="flex items-center gap-3 text-sm text-muted">
                  <LoaderCircle className="animate-spin" aria-hidden="true" size={20} />
                  Loading source-attributed text…
                </span>
              </div>
            )}

            {sourceState !== "loading" && content.ayahs.length === 0 && (
              <div className="rounded-2xl border border-line bg-surface px-6 py-16 text-center">
                <BookOpenText
                  className="mx-auto text-muted"
                  aria-hidden="true"
                  size={32}
                  strokeWidth={1.5}
                />
                <h2 className="mt-5 text-xl font-semibold">
                  This surah is not available in preview.
                </h2>
                <p className="mx-auto mt-2 max-w-md leading-7 text-muted">
                  Connect the Quran API to load labelled runtime content or a configured published
                  release. The interface will not substitute unverified text.
                </p>
                <button
                  type="button"
                  onClick={() => chooseSurah(PREVIEW_FATIHA_SUMMARY)}
                  className="mt-6 min-h-11 rounded-xl border border-line bg-surface px-4 font-semibold text-ink hover:border-accent"
                >
                  Return to Al-Fatihah preview
                </button>
              </div>
            )}

            <div
              ref={ayahListRef}
              className="divide-y divide-line rounded-2xl border border-line bg-surface"
            >
              {content.ayahs.map((ayah) => {
                const key = ayahKey(ayah.surahNumber, ayah.ayahNumber);
                const active = selectedAyah?.ayahNumber === ayah.ayahNumber;
                const playing = playingKey === key;
                const bookmarked = bookmarkedKeys.has(
                  bookmarkKey(ayah.surahNumber, ayah.ayahNumber),
                );
                const juzBoundary = getParaStartingAt(ayah.surahNumber, ayah.ayahNumber);
                const currentPara = getParaForAyah(ayah.surahNumber, ayah.ayahNumber);
                return (
                  <div key={key}>
                    {juzBoundary && (
                      <div className="m-4 rounded-2xl border-2 border-accent/40 bg-accent-soft/60 p-5 text-center sm:m-6">
                        <div className="flex items-center justify-center gap-3">
                          <span className="h-px flex-1 bg-accent/30" />
                          <span className="rounded-full bg-accent px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-on-action">
                            پارہ {juzBoundary.number} · {juzBoundary.nameLatin}
                          </span>
                          <span className="h-px flex-1 bg-accent/30" />
                        </div>
                        <p
                          className="font-quran mt-2 text-3xl font-semibold text-ink"
                          lang="ar"
                          dir="rtl"
                        >
                          {juzBoundary.nameArabic}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Surah {juzBoundary.start.surah}:{juzBoundary.start.ayah} —{" "}
                          {juzBoundary.end.surah}:{juzBoundary.end.ayah} · 15-Line Mushaf Page{" "}
                          {juzBoundary.startMushafPage}
                        </p>
                      </div>
                    )}
                    <article
                      id={`ayah-${key.replace(":", "-")}`}
                      data-ayah-number={ayah.ayahNumber}
                      tabIndex={-1}
                      className={`px-4 py-7 sm:px-7 sm:py-9 ${active ? "bg-accent-soft/60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3" data-no-print>
                        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-sm font-semibold text-muted">
                          <span aria-hidden="true">{ayah.ayahNumber}</span>
                          <span className="sr-only">Ayah {ayah.ayahNumber}</span>
                        </span>
                        <div className="flex gap-1">
                          <Link
                            href={`/mushaf?para=${currentPara?.number ?? 1}&page=${currentPara?.startMushafPage ?? 2}`}
                            className="grid size-11 place-items-center rounded-xl text-muted hover:bg-surface-soft hover:text-ink"
                            title="Open in 15-Line Mushaf"
                            aria-label={`Open 15-line Mushaf for ayah ${ayah.ayahNumber}`}
                          >
                            <BookOpen aria-hidden="true" size={19} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleAyahBookmark(ayah)}
                            aria-pressed={bookmarked}
                            className={`grid size-11 place-items-center rounded-xl hover:bg-surface-soft ${bookmarked ? "text-accent" : "text-muted hover:text-accent"}`}
                            aria-label={`${bookmarked ? "Remove bookmark from" : "Bookmark"} ${selectedSurah.nameEnglish}, ayah ${ayah.ayahNumber}`}
                            title={bookmarked ? "Remove bookmark" : "Save ayah"}
                          >
                            {bookmarked ? (
                              <BookmarkCheck aria-hidden="true" size={20} />
                            ) : (
                              <Bookmark aria-hidden="true" size={20} />
                            )}
                          </button>
                          {ayah.audioUrl && (
                            <button
                              type="button"
                              onClick={() => playAyah(ayah)}
                              className="grid size-11 place-items-center rounded-xl text-muted hover:bg-surface-soft hover:text-accent"
                              aria-label={`${playing ? "Pause" : "Play"} ayah ${ayah.ayahNumber}`}
                            >
                              {playing ? (
                                <Pause aria-hidden="true" size={20} />
                              ) : (
                                <Play aria-hidden="true" size={20} />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openStudy(ayah)}
                            aria-pressed={active}
                            aria-haspopup="dialog"
                            aria-controls="study-sheet"
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-surface-soft hover:text-ink lg:hidden"
                          >
                            {active ? (
                              <Check aria-hidden="true" size={18} />
                            ) : (
                              <Info aria-hidden="true" size={18} />
                            )}
                            Study
                          </button>
                          <button
                            type="button"
                            onClick={() => openStudy(ayah)}
                            aria-pressed={active}
                            className="hidden min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-surface-soft hover:text-ink lg:inline-flex"
                          >
                            {active ? (
                              <Check aria-hidden="true" size={18} />
                            ) : (
                              <Info aria-hidden="true" size={18} />
                            )}
                            Study
                          </button>
                        </div>
                      </div>
                      <p
                        className="font-quran mt-5 text-right leading-[2.15] text-ink"
                        style={{
                          fontSize: `clamp(2.15rem, ${3.2 * arabicScale}vw, ${3.4 * arabicScale}rem)`,
                        }}
                        lang="ar"
                        dir="rtl"
                      >
                        {ayah.arabic}
                      </p>
                      {ayah.translation && (
                        <p
                          className={`mt-5 border-t border-line pt-5 leading-8 ${
                            translation.lang === "ur" ? "font-urdu text-lg" : ""
                          } ${
                            recedeKnown
                              ? "opacity-20 hover:opacity-100 transition-opacity cursor-pointer select-none hover:select-text"
                              : "text-muted"
                          }`}
                          title={
                            recedeKnown
                              ? "Direct Arabic Mode: hover or tap to reveal translation"
                              : undefined
                          }
                          lang={translation.lang}
                          dir={translation.dir}
                        >
                          {ayah.translation}
                        </p>
                      )}
                    </article>
                  </div>
                );
              })}
            </div>

            {content.ayahs.length > 0 && (
              <nav
                aria-label="Adjacent surahs"
                className="mt-6 flex justify-between gap-3"
                data-no-print
              >
                <button
                  type="button"
                  disabled={selectedSurah.number <= 1}
                  onClick={() => {
                    const previous = surahs.find(
                      (item) => item.number === selectedSurah.number - 1,
                    );
                    if (previous) chooseSurah(previous);
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 font-semibold text-ink hover:border-accent disabled:opacity-40"
                >
                  <ChevronLeft aria-hidden="true" size={19} /> Previous
                </button>
                <button
                  type="button"
                  disabled={selectedSurah.number >= 114}
                  onClick={() => {
                    const next = surahs.find((item) => item.number === selectedSurah.number + 1);
                    if (next) chooseSurah(next);
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 font-semibold text-ink hover:border-accent disabled:opacity-40"
                >
                  Next <ChevronRight aria-hidden="true" size={19} />
                </button>
              </nav>
            )}
          </div>
        </section>

        <aside
          className="hidden border-l border-line bg-surface px-5 py-6 lg:sticky lg:top-16 lg:block lg:h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:px-6"
          aria-labelledby="desktop-study-heading"
        >
          <StudyPanel
            idPrefix="desktop"
            selectedAyah={selectedAyah}
            selectedSurah={selectedSurah}
            translation={translation}
            sourceState={sourceState}
            content={content}
            selectedToken={selectedToken}
            mastery={mastery}
            onSelectToken={setSelectedToken}
            onMarkKnown={markWordKnown}
            onReviewLater={scheduleWordReview}
          />
        </aside>
      </main>
      <MobileNavigation />
    </div>
  );
}
