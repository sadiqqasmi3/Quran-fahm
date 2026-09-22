"use client";

import { type FC, type TouchEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Bookmark,
  BookOpenText,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  HelpCircle,
  Maximize2,
  Minimize2,
  Moon,
  RotateCcw,
  Share2,
  Sun,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import {
  PARAS,
  type ParaMetadata,
  getPara,
  mushafPageImageUrl,
  mushafParaPdfUrl,
} from "@/lib/para-data";
import { READING_HISTORY_CHANGED_EVENT, recordReadingHistory } from "@/lib/reading-history-store";
import {
  MUSHAF_DIRECTION_STORAGE_KEY,
  MUSHAF_THEME_STORAGE_KEY,
  MUSHAF_ZOOM_STORAGE_KEY,
  resolveInitialMushafPosition,
  saveMushafPosition,
} from "@/lib/mushaf-storage";
import { useLocale } from "@/lib/i18n/locale-context";

export type MushafTheme = "parchment" | "sepia" | "night";



export interface Mushaf15ReaderProps {
  initialPara?: number | undefined;
  initialPage?: number | undefined;
  onClose?: (() => void) | undefined;
  onCompletePara?: ((paraNumber: number) => Promise<void> | void) | undefined;
  isClaimedPara?: boolean | undefined;
}

export function Mushaf15Reader({
  initialPara,
  initialPage,
  onClose,
  onCompletePara,
  isClaimedPara = false,
}: Mushaf15ReaderProps) {
  const [initialPos] = useState(() => resolveInitialMushafPosition(initialPara, initialPage));
  const [paraNumber, setParaNumber] = useState<number>(initialPos.para);
  const currentPara = getPara(paraNumber);

  // Mushaf page number (2 to 611)
  const [currentPage, setCurrentPage] = useState<number>(initialPos.page);

  // Reading direction: "rtl" (Quran tradition, page 1 on right) or "ltr" (digital book flow)
  const [readingDirection, setReadingDirection] = useState<"rtl" | "ltr">(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(MUSHAF_DIRECTION_STORAGE_KEY);
      if (saved === "ltr" || saved === "rtl") return saved;
    }
    return "rtl";
  });

  const toggleReadingDirection = useCallback(() => {
    setReadingDirection((prev) => {
      const next = prev === "rtl" ? "ltr" : "rtl";
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(MUSHAF_DIRECTION_STORAGE_KEY, next);
        } catch {
          // Ignore
        }
      }
      return next;
    });
  }, []);

  const [theme, setTheme] = useState<MushafTheme>("parchment");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(MUSHAF_THEME_STORAGE_KEY);
      if (saved === "parchment" || saved === "sepia" || saved === "night") {
        setTheme(saved);
      }
    }
  }, []);

  const changeTheme = useCallback((newTheme: MushafTheme) => {
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(MUSHAF_THEME_STORAGE_KEY, newTheme);
      } catch {
        // Ignore
      }
    }
  }, []);

  const [zoom, setZoom] = useState<number>(1);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(MUSHAF_ZOOM_STORAGE_KEY);
      if (saved) {
        const parsed = Number.parseFloat(saved);
        if (!Number.isNaN(parsed) && parsed >= 0.8 && parsed <= 1.6) {
          setZoom(parsed);
        }
      }
    }
  }, []);

  const changeZoom = useCallback((newZoom: number) => {
    const clamped = Math.max(0.8, Math.min(1.6, Number(newZoom.toFixed(1))));
    setZoom(clamped);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(MUSHAF_ZOOM_STORAGE_KEY, String(clamped));
      } catch {
        // Ignore
      }
    }
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const [turnDirection, setTurnDirection] = useState<"next" | "prev">("next");
  const [incomingPage, setIncomingPage] = useState<number | null>(null);
  const [isTurning, setIsTurning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [paraSelectorOpen, setParaSelectorOpen] = useState(false);
  const [pageJumpOpen, setPageJumpOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { locale, setLocale, isUrdu } = useLocale();
  const [targetPageInput, setTargetPageInput] = useState(String(currentPage));

  // Page image loading and error states to eliminate blank white page flash
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isPageError, setIsPageError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Sync prop changes if initialPara or initialPage change while mounted
  useEffect(() => {
    if (typeof initialPara === "number" && initialPara >= 1 && initialPara <= 30) {
      setParaNumber(initialPara);
    }
  }, [initialPara]);

  useEffect(() => {
    if (typeof initialPage === "number" && initialPage >= 2 && initialPage <= 611) {
      setCurrentPage(initialPage);
    }
  }, [initialPage]);

  // Reset loading state when page changes or retry is clicked
  useEffect(() => {
    setIsPageLoading(true);
    setIsPageError(false);
  }, [currentPage, retryKey]);

  // Touch & wheel handling
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastWheelTime = useRef<number>(0);
  const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Persist current page & para in localStorage and synchronize URL query params
  useEffect(() => {
    if (typeof window !== "undefined") {
      saveMushafPosition(currentPage, paraNumber);

      // Synchronize URL query parameters (?para=X&page=Y) so reloads/shares resume exactly here
      if (window.location.pathname.includes("/mushaf")) {
        const currentUrl = new URL(window.location.href);
        const searchPage = currentUrl.searchParams.get("page");
        const searchPara = currentUrl.searchParams.get("para");
        if (searchPage !== String(currentPage) || searchPara !== String(paraNumber)) {
          currentUrl.searchParams.set("para", String(paraNumber));
          currentUrl.searchParams.set("page", String(currentPage));
          window.history.replaceState(null, "", currentUrl.toString());
        }
      }
    }
  }, [currentPage, paraNumber]);

  // Record reading history on page visit
  useEffect(() => {
    recordReadingHistory(window.localStorage, {
      surahNumber: currentPara.start.surah,
      ayahNumber: currentPara.start.ayah,
      surahNameArabic: currentPara.nameArabic,
      surahNameEnglish: `Para ${currentPara.number} (${currentPara.nameLatin})`,
      mode: "mushaf",
      mushafPage: currentPage,
    });
    window.dispatchEvent(new Event(READING_HISTORY_CHANGED_EVENT));
  }, [currentPage, currentPara]);

  function handlePageJump(e: React.FormEvent) {
    e.preventDefault();
    const pageNum = parseInt(targetPageInput, 10);
    if (!Number.isNaN(pageNum) && pageNum >= 2 && pageNum <= 611) {
      const foundPara = PARAS.find(
        (p) => pageNum >= p.startMushafPage && pageNum <= p.endMushafPage,
      );
      if (foundPara && foundPara.number !== paraNumber) {
        setParaNumber(foundPara.number);
      }
      setCurrentPage(pageNum);
      setPageJumpOpen(false);
    }
  }

  // Keep page within bounds of current Para when Para changes
  useEffect(() => {
    if (currentPage < currentPara.startMushafPage || currentPage > currentPara.endMushafPage) {
      setCurrentPage(currentPara.startMushafPage);
    }
  }, [currentPara, currentPage]);

  // Preload adjacent pages in browser memory AFTER the current page has loaded
  useEffect(() => {
    if (isPageLoading || isPageError) return;

    const pagesToPreload = [
      currentPage + 1,
      currentPage - 1,
    ].filter((p) => p >= 2 && p <= 611);

    const timer = setTimeout(() => {
      pagesToPreload.forEach((p) => {
        const img = new Image();
        img.src = mushafPageImageUrl(p);
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [currentPage, isPageLoading, isPageError]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  }, []);

  // Smooth two-leaf 3D page turn navigation (instant, zero wait, zero shaking)
  const goToPage = useCallback(
    (targetPage: number, direction: "next" | "prev") => {
      if (targetPage === currentPage) return;
      if (targetPage < 2 || targetPage > 611) return;

      // Detect if crossing into another Para
      const targetPara = PARAS.find(
        (p) => targetPage >= p.startMushafPage && targetPage <= p.endMushafPage,
      );
      if (targetPara && targetPara.number !== paraNumber) {
        setParaNumber(targetPara.number);
      }

      if (turnTimeoutRef.current) {
        clearTimeout(turnTimeoutRef.current);
      }

      setIncomingPage(targetPage);
      setTurnDirection(direction);
      setIsTurning(true);

      // Snappy 200ms page turn transition for instant responsiveness
      turnTimeoutRef.current = setTimeout(() => {
        setCurrentPage(targetPage);
        setIncomingPage(null);
        setIsTurning(false);
      }, 200);
    },
    [currentPage, paraNumber],
  );

  // Next page (advances page count forward in book)
  const nextPage = useCallback(() => {
    if (currentPage < 611) {
      goToPage(currentPage + 1, "next");
    }
  }, [currentPage, goToPage]);

  // Previous page (steps back in book)
  const prevPage = useCallback(() => {
    if (currentPage > 2) {
      goToPage(currentPage - 1, "prev");
    }
  }, [currentPage, goToPage]);

  // Mouse wheel & trackpad natural scrolling (least wait, responsive)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const now = Date.now();
      if (now - lastWheelTime.current < 180) return;

      // Vertical scroll down -> Next page (forward)
      if (e.deltaY > 18) {
        lastWheelTime.current = now;
        nextPage();
      }
      // Vertical scroll up -> Previous page (backward)
      else if (e.deltaY < -18) {
        lastWheelTime.current = now;
        prevPage();
      }
      // Horizontal trackpad scrolling
      else if (Math.abs(e.deltaX) > 22) {
        lastWheelTime.current = now;
        if (readingDirection === "rtl") {
          // In RTL: swiping left advances forward, swiping right goes back
          if (e.deltaX > 22) prevPage();
          else nextPage();
        } else {
          // In LTR: swiping right advances forward, swiping left goes back
          if (e.deltaX > 22) nextPage();
          else prevPage();
        }
      }
    },
    [nextPage, prevPage, readingDirection],
  );

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        nextPage();
      } else if (e.key === "PageUp") {
        e.preventDefault();
        prevPage();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (readingDirection === "rtl") nextPage();
        else prevPage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (readingDirection === "rtl") prevPage();
        else nextPage();
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          void toggleFullscreen();
        } else if (onClose) {
          onClose();
        }
      } else if (e.key === "f" || e.key === "F") {
        void toggleFullscreen();
      } else if (e.key === "h" || e.key === "H") {
        setHudVisible((v) => !v);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextPage, prevPage, isFullscreen, toggleFullscreen, onClose, readingDirection]);

  // Touch gestures for mobile swiping
  const handleTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const deltaX = t.clientX - touchStartX.current;
    const deltaY = t.clientY - touchStartY.current;

    // Minimum swipe distance of 40px, ensuring horizontal intent
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (readingDirection === "rtl") {
        // In RTL Arabic reading: drag/swipe left to flip forward
        if (deltaX < 0) nextPage();
        else prevPage();
      } else {
        if (deltaX < 0) nextPage();
        else prevPage();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Para completion action for Khatm members
  const handleCompletePara = async () => {
    if (!onCompletePara || completing) return;
    setCompleting(true);
    try {
      await onCompletePara(paraNumber);
      setIsCompleted(true);
    } catch {
      // Handled by parent
    } finally {
      setCompleting(false);
    }
  };

  const pageInPara = currentPage - currentPara.startMushafPage + 1;
  const isFinalPageOfPara = currentPage === currentPara.endMushafPage;
  const currentImageUrl = mushafPageImageUrl(currentPage);

  // Theme styles
  const themeBg =
    theme === "parchment"
      ? "bg-[#18231d] text-[#e8eee9]"
      : theme === "sepia"
        ? "bg-[#1f1a14] text-[#ece4d6]"
        : "bg-[#0b100d] text-[#d6ded9]";

  const pageFrameStyle =
    theme === "parchment"
      ? "border-[#2b3a30] shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
      : theme === "sepia"
        ? "border-[#3d3327] shadow-[0_20px_60px_rgba(0,0,0,0.65)]"
        : "border-[#1c2921] shadow-[0_20px_60px_rgba(0,0,0,0.85)]";

  const bookBgColor =
    theme === "night"
      ? "bg-[#111613]"
      : theme === "sepia"
        ? "bg-[#f4ebd9]"
        : "bg-[#fcfaf5]";

  const imageFilterClass =
    theme === "night"
      ? "invert-[0.92] hue-rotate-180 brightness-95 contrast-125"
      : theme === "sepia"
        ? "sepia-[0.25] contrast-[1.03]"
        : "";

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="15-Line Mushaf Reader"
      className={`fixed inset-0 z-50 flex flex-col select-none overflow-hidden ${themeBg} transition-colors duration-300`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── TOP HUD / CONTROLS ── */}
      <header
        className={`shrink-0 border-b border-white/10 bg-black/40 backdrop-blur-md px-3 py-2.5 sm:px-6 transition-all duration-300 ${
          hudVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4">
          {/* Left: Close & Para Selector */}
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Exit Mushaf reader"
                className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 transition"
              >
                <X size={20} />
              </button>
            )}

            {/* Para Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setParaSelectorOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition"
              >
                <span className="font-quran text-base sm:text-lg" dir="rtl">
                  {currentPara.nameArabic}
                </span>
                <span className="text-white/70">
                  پارہ {currentPara.number} ({currentPara.nameLatin})
                </span>
                <ChevronDown
                  size={15}
                  className={`transition-transform ${paraSelectorOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Para Selector Menu */}
              {paraSelectorOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 max-h-[70vh] w-72 overflow-y-auto rounded-2xl border border-white/15 bg-[#141d18] p-2 shadow-2xl backdrop-blur-xl">
                  <div className="px-3 py-2 text-[0.7rem] font-bold uppercase tracking-wider text-white/50 border-b border-white/10">
                    Jump to Para (30 Juz)
                  </div>
                  <div className="mt-1 divide-y divide-white/5">
                    {PARAS.map((p) => (
                      <button
                        key={p.number}
                        type="button"
                        onClick={() => {
                          setParaNumber(p.number);
                          setCurrentPage(p.startMushafPage);
                          setParaSelectorOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-xs sm:text-sm rounded-lg transition ${
                          p.number === paraNumber
                            ? "bg-emerald-600/30 text-emerald-300 font-semibold"
                            : "text-white/80 hover:bg-white/10"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="size-5 rounded-full bg-white/10 text-[0.7rem] font-bold grid place-items-center">
                            {p.number}
                          </span>
                          <span>{p.nameLatin}</span>
                        </span>
                        <span className="font-quran text-base" dir="rtl">
                          {p.nameArabic}
                        </span>
                      </button>
                    ))}
                  </div>
                  {/* Mobile Page indicator button */}
                  <button
                    type="button"
                    onClick={() => {
                      setTargetPageInput(String(currentPage));
                      setPageJumpOpen(true);
                    }}
                    className="flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-2 text-xs font-semibold text-white md:hidden hover:bg-white/20 transition"
                    title="Jump to page"
                  >
                    صفحہ {currentPage}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Center: Current Mushaf Page Info with clickable Page Jump */}
          <div className="text-center hidden md:block">
            <button
              type="button"
              onClick={() => {
                setTargetPageInput(String(currentPage));
                setPageJumpOpen(true);
              }}
              className="rounded-lg px-2.5 py-1 text-sm font-semibold tracking-wide hover:bg-white/10 active:scale-95 transition"
              title="Click to jump to any page (2–611)"
            >
              صفحہ {currentPage}{" "}
              <span className="text-xs font-normal text-white/60">
                (پارہ {currentPara.number} کا صفحہ {pageInPara} / {currentPara.totalMushafPages})
              </span>
            </button>
            <p className="text-[0.7rem] text-white/50">
              Surah {currentPara.start.surah}:{currentPara.start.ayah} — {currentPara.end.surah}:
              {currentPara.end.ayah}
            </p>
          </div>

          {/* Right: Tools (Direction, Study Reader link, Theme, Zoom, PDF Download, Fullscreen) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Reading Direction Toggle */}
            <button
              type="button"
              onClick={toggleReadingDirection}
              title={readingDirection === "rtl" ? "قرآنی انداز (پہلا صفحہ دائیں طرف)" : "کتابی انداز"}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                readingDirection === "rtl"
                  ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              <ArrowLeftRight size={14} />
              <span className="hidden xl:inline">
                {isUrdu
                  ? readingDirection === "rtl"
                    ? "قرآنی انداز"
                    : "کتابی انداز"
                  : readingDirection === "rtl"
                    ? "Quran Flow"
                    : "Book Flow"}
              </span>
            </button>

            <Link
              href={`/quran?surah=${currentPara.start.surah}&ayah=${currentPara.start.ayah}`}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
              title="Open verses in interactive Study Reader"
            >
              <BookOpenText size={15} />
              <span className="hidden xl:inline">Study Verses</span>
            </Link>

            {/* Theme switcher */}
            <div className="flex items-center rounded-xl bg-white/10 p-0.5">
              <button
                type="button"
                onClick={() => changeTheme("parchment")}
                title="Parchment Theme"
                className={`p-1.5 rounded-lg text-xs transition ${theme === "parchment" ? "bg-white/20 text-emerald-300" : "text-white/60 hover:text-white"}`}
              >
                <Sun size={15} />
              </button>
              <button
                type="button"
                onClick={() => changeTheme("sepia")}
                title="Warm Sepia Theme"
                className={`p-1.5 rounded-lg text-xs transition ${theme === "sepia" ? "bg-white/20 text-amber-300" : "text-white/60 hover:text-white"}`}
              >
                <Eye size={15} />
              </button>
              <button
                type="button"
                onClick={() => changeTheme("night")}
                title="Night Theme"
                className={`p-1.5 rounded-lg text-xs transition ${theme === "night" ? "bg-white/20 text-blue-300" : "text-white/60 hover:text-white"}`}
              >
                <Moon size={15} />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center rounded-xl bg-white/10 p-0.5">
              <button
                type="button"
                onClick={() => changeZoom(zoom - 0.1)}
                title="Zoom Out"
                disabled={zoom <= 0.8}
                className="p-1.5 rounded-lg text-white/60 hover:text-white disabled:opacity-30 transition"
              >
                <ZoomOut size={15} />
              </button>
              <span className="px-1.5 text-[0.7rem] font-mono text-white/70">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => changeZoom(zoom + 0.1)}
                title="Zoom In"
                disabled={zoom >= 1.6}
                className="p-1.5 rounded-lg text-white/60 hover:text-white disabled:opacity-30 transition"
              >
                <ZoomIn size={15} />
              </button>
            </div>

            {/* Local PDF Download */}
            <a
              href={mushafParaPdfUrl(currentPara.number)}
              download={`Para-${String(currentPara.number).padStart(2, "0")}-${currentPara.nameLatin}.pdf`}
              title={`Download Para ${currentPara.number} 15-Line PDF (${currentPara.totalMushafPages} pages)`}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
            >
              <Download size={14} />
              <span className="hidden lg:inline">PDF</span>
            </a>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen (F)"}
              className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Quick Help Guide Button */}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              title="طریقہ استعمال و رہنمائی / Quick Help Guide"
              className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition"
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN READING CANVAS WITH 3D PAGE TURN ── */}
      <main
        onWheel={handleWheel}
        className="relative flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-4 cursor-pointer select-none"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button, a, input, select")) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          if (readingDirection === "rtl") {
            // In RTL: left side advances forward (next), right side goes backward (prev)
            if (clickX < rect.width * 0.35) {
              nextPage();
            } else if (clickX > rect.width * 0.65) {
              prevPage();
            } else {
              setHudVisible((v) => !v);
            }
          } else {
            // In LTR: right side advances forward (next), left side goes backward (prev)
            if (clickX > rect.width * 0.65) {
              nextPage();
            } else if (clickX < rect.width * 0.35) {
              prevPage();
            } else {
              setHudVisible((v) => !v);
            }
          }
        }}
      >
        {/* 3D Book Presentation Container */}
        <div
          className="relative max-h-full max-w-full flex items-center justify-center select-none"
          style={{
            perspective: "2400px",
            transform: `scale(${zoom})`,
            transition: "transform 0.2s ease-out",
          }}
        >
          {/* 3D Book Frame */}
          <div
            className={`relative rounded-xl sm:rounded-2xl border ${pageFrameStyle} overflow-hidden ${bookBgColor} shadow-2xl transition-all duration-200`}
            style={{
              maxHeight: "calc(100dvh - 9.5rem)",
              aspectRatio: "1382 / 1976",
              minHeight: "min(460px, calc(100dvh - 11rem))",
              boxShadow:
                theme === "night"
                  ? "0 20px 50px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.08)"
                  : "0 20px 50px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.05)",
            }}
          >
            {/* Themed Loading Skeleton (Shown while image is fetching/decoding) */}
            {isPageLoading && !isPageError && (
              <div
                className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center ${
                  theme === "night" ? "bg-[#111613]" : theme === "sepia" ? "bg-[#f4ebd9]" : "bg-[#fcfaf5]"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="size-9 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  <p className="text-xs font-semibold text-ink">
                    {isUrdu ? `صفحہ ${currentPage} لوڈ ہو رہا ہے…` : `Loading Page ${currentPage}…`}
                  </p>
                  <p className="text-[11px] text-muted">
                    {isUrdu
                      ? `پارہ ${currentPara.number} · ${currentPara.nameArabic}`
                      : `Para ${currentPara.number} · ${currentPara.nameLatin}`}
                  </p>
                </div>
              </div>
            )}

            {/* Error Fallback with Retry */}
            {isPageError && (
              <div
                className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center ${
                  theme === "night" ? "bg-[#111613]" : theme === "sepia" ? "bg-[#f4ebd9]" : "bg-[#fcfaf5]"
                }`}
              >
                <div className="max-w-xs space-y-3">
                  <p className="text-sm font-semibold text-danger">
                    {isUrdu ? `صفحہ ${currentPage} لوڈ نہیں ہو سکا` : `Could not load page ${currentPage}`}
                  </p>
                  <p className="text-xs text-muted leading-relaxed">
                    {isUrdu
                      ? "انٹرنیٹ کنکشن چیک کریں اور دوبارہ کوشش کریں۔"
                      : "Please check your network connection and try again."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPageError(false);
                      setIsPageLoading(true);
                      setRetryKey((k) => k + 1);
                    }}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-action px-4 text-xs font-semibold text-on-action hover:bg-action-hover active:scale-95 transition-transform"
                  >
                    <RotateCcw size={14} />
                    <span>{isUrdu ? "دوبارہ کوشش کریں" : "Retry page"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Stationary Base Layer (Destination page visible underneath during turn) */}
            {isTurning && incomingPage !== null && (
              <div className="absolute inset-0 z-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mushafPageImageUrl(incomingPage)}
                  alt={`Mushaf Page ${incomingPage}`}
                  className={`block max-h-[calc(100dvh-10rem)] w-auto object-contain ${imageFilterClass}`}
                  draggable={false}
                  loading="eager"
                  decoding="async"
                />
              </div>
            )}

            {/* Active / Turning Leaf */}
            <div
              className={`relative z-10 origin-center transition-transform duration-200 ease-out transform-gpu will-change-transform ${
                isTurning
                  ? turnDirection === "next"
                    ? readingDirection === "rtl"
                      ? "-rotate-y-35 scale-[0.99]"
                      : "rotate-y-35 scale-[0.99]"
                    : readingDirection === "rtl"
                      ? "rotate-y-35 scale-[0.99]"
                      : "-rotate-y-35 scale-[0.99]"
                  : "rotate-y-0 scale-100"
              }`}
              style={{
                transformOrigin:
                  readingDirection === "rtl"
                    ? turnDirection === "next"
                      ? "left center"
                      : "right center"
                    : turnDirection === "next"
                      ? "right center"
                      : "left center",
                transformStyle: "preserve-3d",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={`${currentImageUrl}-${retryKey}`}
                src={currentImageUrl}
                alt={`15-Line Mushaf Page ${currentPage} - Para ${currentPara.number}`}
                className={`block max-h-[calc(100dvh-10rem)] w-auto object-contain transition-opacity duration-200 ${
                  isPageLoading ? "opacity-0" : "opacity-100"
                } ${imageFilterClass}`}
                draggable={false}
                loading="eager"
                decoding="async"
                onLoad={() => {
                  setIsPageLoading(false);
                  setIsPageError(false);
                }}
                onError={() => {
                  setIsPageLoading(false);
                  setIsPageError(true);
                }}
              />

              {/* Dynamic Turn Shadow during page turn */}
              <div
                className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${
                  isTurning ? "opacity-100" : "opacity-0"
                } ${
                  readingDirection === "rtl"
                    ? "bg-gradient-to-l from-black/20 via-black/5 to-transparent"
                    : "bg-gradient-to-r from-black/20 via-black/5 to-transparent"
                }`}
                aria-hidden="true"
              />
            </div>

            {/* Center Spine Crease Shadow (Authentic Quran book spine depth) */}
            <div
              className={`pointer-events-none absolute inset-y-0 z-20 w-8 ${
                currentPage % 2 === 0
                  ? "right-0 bg-gradient-to-l from-black/20 via-black/5 to-transparent"
                  : "left-0 bg-gradient-to-r from-black/20 via-black/5 to-transparent"
              }`}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Floating Side Turn Hitboxes with Explicit Destination Indicators */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (readingDirection === "rtl") nextPage();
            else prevPage();
          }}
          disabled={readingDirection === "rtl" ? currentPage >= 611 : currentPage <= 2}
          aria-label={readingDirection === "rtl" ? `Next Page (صفحہ ${currentPage + 1})` : `Previous Page (صفحہ ${currentPage - 1})`}
          title={readingDirection === "rtl" ? `صفحہ ${currentPage + 1} ←` : `← صفحہ ${currentPage - 1}`}
          className="group absolute left-2 sm:left-4 z-20 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-2 text-white/90 backdrop-blur-md hover:bg-black/75 hover:scale-105 active:scale-95 disabled:opacity-0 transition-all shadow-lg shadow-black/40"
        >
          <ArrowLeft size={20} />
          <span className="hidden md:inline-block text-[0.7rem] font-medium font-mono text-white/80 group-hover:text-white">
            {readingDirection === "rtl" ? `صفحہ ${currentPage + 1}` : `صفحہ ${currentPage - 1}`}
          </span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (readingDirection === "rtl") prevPage();
            else nextPage();
          }}
          disabled={readingDirection === "rtl" ? currentPage <= 2 : currentPage >= 611}
          aria-label={readingDirection === "rtl" ? `Previous Page (صفحہ ${currentPage - 1})` : `Next Page (صفحہ ${currentPage + 1})`}
          title={readingDirection === "rtl" ? `→ صفحہ ${currentPage - 1}` : `صفحہ ${currentPage + 1} →`}
          className="group absolute right-2 sm:right-4 z-20 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-2 text-white/90 backdrop-blur-md hover:bg-black/75 hover:scale-105 active:scale-95 disabled:opacity-0 transition-all shadow-lg shadow-black/40"
        >
          <span className="hidden md:inline-block text-[0.7rem] font-medium font-mono text-white/80 group-hover:text-white">
            {readingDirection === "rtl" ? `صفحہ ${currentPage - 1}` : `صفحہ ${currentPage + 1}`}
          </span>
          <ArrowRight size={20} />
        </button>
      </main>

      {/* ── BOTTOM HUD & SCRUBBER ── */}
      <footer
        className={`shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-md px-3 py-2.5 sm:px-6 transition-all duration-300 ${
          hudVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-2">
          {/* Page Scrubber Range */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-white/60 min-w-8 text-right">
              {readingDirection === "rtl" ? currentPara.endMushafPage : currentPara.startMushafPage}
            </span>
            <input
              type="range"
              dir={readingDirection}
              min={currentPara.startMushafPage}
              max={currentPara.endMushafPage}
              value={currentPage}
              onChange={(e) => {
                const p = Number(e.target.value);
                goToPage(p, p > currentPage ? "next" : "prev");
              }}
              aria-label="Scrub through pages of this Para"
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-emerald-400 focus:outline-none"
            />
            <span className="text-xs font-mono text-white/60 min-w-8">
              {readingDirection === "rtl" ? currentPara.startMushafPage : currentPara.endMushafPage}
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 text-xs">
            {/* Quick stats on mobile */}
            <div className="text-white/70 sm:hidden">
              صفحہ {currentPage} (پارہ {currentPara.number})
            </div>

            {/* Read in Digital Reader Link */}
            <Link
              href={`/quran?surah=${currentPara.start.surah}&ayah=${currentPara.start.ayah}`}
              className="inline-flex items-center gap-1.5 font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              <span>Switch to Ayah-by-Ayah translation reader</span>
              <ExternalLink size={12} />
            </Link>

            {/* Khatm Member Completion Confirmation */}
            {isClaimedPara && (
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <CheckCircle2 size={16} /> Completed! Alhamdu lillah
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleCompletePara}
                    disabled={completing}
                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-semibold text-white transition ${
                      isFinalPageOfPara
                        ? "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 animate-pulse"
                        : "bg-white/15 hover:bg-white/25"
                    }`}
                  >
                    <CheckCircle2 size={15} />
                    {completing
                      ? "Marking…"
                      : isFinalPageOfPara
                        ? "Mark Para Complete"
                        : `Mark Para ${currentPara.number} Complete`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* ── GO TO PAGE MODAL ── */}
      {pageJumpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-labelledby="page-jump-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-[#141d18] p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 id="page-jump-title" className="text-base font-semibold">
                Go to Mushaf Page
              </h3>
              <button
                type="button"
                onClick={() => setPageJumpOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Close page jump modal"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePageJump} className="mt-4">
              <label htmlFor="jump-page-input" className="block text-xs text-white/70">
                Enter page number (2 to 611):
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="jump-page-input"
                  type="number"
                  min={2}
                  max={611}
                  value={targetPageInput}
                  onChange={(e) => setTargetPageInput(e.target.value)}
                  className="min-h-11 flex-1 rounded-xl border border-white/20 bg-black/40 px-3 text-center text-lg font-bold text-white focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Go
                </button>
              </div>
            </form>
            <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/50">
              <p>
                Current: Page {currentPage} of 611 · Para {currentPara.number}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── BILINGUAL QUICK HELP GUIDE MODAL ── */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          role="dialog"
          aria-labelledby="reader-help-title"
        >
          <div
            dir={isUrdu ? "rtl" : "ltr"}
            className={`w-full max-w-lg rounded-3xl border border-white/20 bg-[#141d18] p-6 text-white shadow-2xl max-h-[85vh] overflow-y-auto ${
              isUrdu ? "font-urdu text-right" : "text-left"
            }`}
          >
            {/* Header with Close & Language Switcher */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 id="reader-help-title" className="text-lg font-bold text-emerald-300">
                  {isUrdu ? "مصحف استعمال کرنے کا طریقہ" : "Mushaf Reader Quick Guide"}
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  {isUrdu ? "آسان ورق گردانی اور تمام سہولیات" : "Gesture, scroll, and navigation tips"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-white/10 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setLocale("ur")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      isUrdu ? "bg-emerald-600 text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    اردو
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale("en")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      !isUrdu ? "bg-emerald-600 text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    English
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className="grid size-8 place-items-center rounded-xl bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  aria-label="Close guide modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Tips Body */}
            <div className="mt-4 space-y-3.5 text-xs sm:text-sm">
              {isUrdu ? (
                <>
                  <div className="flex gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/10">
                    <span className="text-xl">👆</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">موبائل پر ورق پلٹنا (Touch Swipe)</h4>
                      <p className="text-white/70 text-xs mt-1">
                        فون پر دائیں یا بائیں انگلی سے سوائپ کریں، یا اسکرین کے کناروں پر بنے تیر کے نشانات کو چھوئیں۔
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/10">
                    <span className="text-xl">🖱️</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">ماؤس اسکرول وہیل (Natural Scroll)</h4>
                      <p className="text-white/70 text-xs mt-1">
                        ماؤس کا پہیہ نیچے گھمانے سے اگلا صفحہ اور اوپر گھمانے سے پچھلا صفحہ کھلے گا۔
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/10">
                    <span className="text-xl">🔄</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">پڑھنے کا رخ (قرآنی انداز یا کتابی انداز)</h4>
                      <p className="text-white/70 text-xs mt-1">
                        اوپر موجود ڈائریکشن بٹن سے روایتی قرآنی انداز (پہلا صفحہ دائیں طرف) یا عام کتابی انداز منتخب کریں۔
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/10">
                    <span className="text-xl">🌙</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">آنکھوں کی راحت اور نائٹ موڈ</h4>
                      <p className="text-white/70 text-xs mt-1">
                        اوپر چاند کے نشان پر کلک کر کے اسکرین کو سیاہ (Night Theme) کر لیں تاکہ رات کو تلاوت پرسکون رہے۔
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/10">
                    <span className="text-xl">💾</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">خودکار محفوظ</h4>
                      <p className="text-white/70 text-xs mt-1">
                        آپ کا آخری پڑھا ہوا صفحہ اور پارہ خودکار محفوظ ہو جاتا ہے، اگلی بار وہیں سے تلاوت شروع ہوگی۔
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/10">
                    <span className="text-xl">👆</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">Swipe or Tap to Turn Pages</h4>
                      <p className="text-white/70 text-xs mt-1">
                        Swipe left or right across the screen on mobile, or tap the side navigation arrows.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/10">
                    <span className="text-xl">🖱️</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">Natural Mouse Wheel</h4>
                      <p className="text-white/70 text-xs mt-1">
                        Scroll wheel down advances to the next page; scroll wheel up returns to the previous page.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/10">
                    <span className="text-xl">🔄</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">Reading Flow (Quran Flow or Book Flow)</h4>
                      <p className="text-white/70 text-xs mt-1">
                        Toggle between traditional Quran flow (Page 1 on the right) and standard digital left-to-right flow.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/10">
                    <span className="text-xl">🌙</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">Themes for Eye Comfort</h4>
                      <p className="text-white/70 text-xs mt-1">
                        Select Parchment, Sepia, or Night Mode from the top bar for glare-free reading in low light.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl bg-white/5 p-3.5 border border-white/10">
                    <span className="text-xl">💾</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">Automatic Position Memory</h4>
                      <p className="text-white/70 text-xs mt-1">
                        Your exact Para and Page are automatically remembered and restored whenever you return.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Action to Full App Guide */}
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-4">
              <Link
                href="/guide"
                target="_blank"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
              >
                <span>{isUrdu ? "مکمل ایپ گائیڈ دیکھیں" : "View Full App Guide"}</span>
                <ExternalLink size={14} />
              </Link>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="w-full sm:w-auto rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/20 transition text-center"
              >
                {isUrdu ? "ٹھیک ہے، سمجھ گیا" : "Got it, thanks"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
