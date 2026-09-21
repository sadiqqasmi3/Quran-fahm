export const BOOKMARK_STORAGE_KEY = "qf_bookmarks_v1";
export const BOOKMARKS_CHANGED_EVENT = "qf:bookmarks";

const MAX_BOOKMARKS = 500;

export interface BookmarkStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface QuranBookmark {
  key: string;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  surahNameArabic?: string;
  arabicText?: string;
  translationText?: string;
  translationLanguage?: string;
  translationDirection?: "ltr" | "rtl";
  createdAt: string;
}

export interface BookmarkInput {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  surahNameArabic?: string;
  arabicText?: string;
  translationText?: string;
  translationLanguage?: string;
  translationDirection?: "ltr" | "rtl";
}

interface BookmarkEnvelope {
  version: 1;
  items: QuranBookmark[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCoordinate(value: unknown, minimum: number, maximum: number): value is number {
  return Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum;
}

function cleanText(value: unknown, maximum: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim().slice(0, maximum);
  return text || undefined;
}

function parseBookmark(value: unknown): QuranBookmark | null {
  if (!isObject(value)) return null;
  if (!isCoordinate(value.surahNumber, 1, 114)) return null;
  if (!isCoordinate(value.ayahNumber, 1, 286)) return null;

  const surahName = cleanText(value.surahName, 100);
  const createdAt = cleanText(value.createdAt, 40);
  if (!surahName || !createdAt || Number.isNaN(Date.parse(createdAt))) return null;
  const surahNameArabic = cleanText(value.surahNameArabic, 100);
  const arabicText = cleanText(value.arabicText, 1_500);
  const translationText = cleanText(value.translationText, 2_000);
  const translationLanguage = cleanText(value.translationLanguage, 12);
  const translationDirection = value.translationDirection === "ltr" ? "ltr" : "rtl";

  const key = bookmarkKey(value.surahNumber, value.ayahNumber);
  return {
    key,
    surahNumber: value.surahNumber,
    ayahNumber: value.ayahNumber,
    surahName,
    ...(surahNameArabic ? { surahNameArabic } : {}),
    ...(arabicText ? { arabicText } : {}),
    ...(translationText ? { translationText } : {}),
    ...(translationLanguage ? { translationLanguage } : {}),
    ...(translationText ? { translationDirection } : {}),
    createdAt: new Date(createdAt).toISOString(),
  };
}

function saveBookmarks(storage: BookmarkStorage, bookmarks: QuranBookmark[]): void {
  const payload: BookmarkEnvelope = {
    version: 1,
    items: bookmarks.slice(0, MAX_BOOKMARKS),
  };
  storage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(payload));
}

export function bookmarkKey(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}:${ayahNumber}`;
}

export function readBookmarks(storage: BookmarkStorage): QuranBookmark[] {
  let parsed: unknown;
  try {
    const stored = storage.getItem(BOOKMARK_STORAGE_KEY);
    parsed = stored ? JSON.parse(stored) : null;
  } catch {
    return [];
  }

  if (!isObject(parsed) || parsed.version !== 1 || !Array.isArray(parsed.items)) return [];

  const seen = new Set<string>();
  const bookmarks: QuranBookmark[] = [];
  for (const value of parsed.items) {
    const bookmark = parseBookmark(value);
    if (!bookmark || seen.has(bookmark.key)) continue;
    seen.add(bookmark.key);
    bookmarks.push(bookmark);
    if (bookmarks.length === MAX_BOOKMARKS) break;
  }

  return bookmarks.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export function addBookmark(
  storage: BookmarkStorage,
  input: BookmarkInput,
  now = new Date(),
): QuranBookmark {
  if (!isCoordinate(input.surahNumber, 1, 114) || !isCoordinate(input.ayahNumber, 1, 286)) {
    throw new Error("Bookmark Quran coordinates are invalid.");
  }

  const surahName = cleanText(input.surahName, 100);
  if (!surahName) throw new Error("A surah name is required for a bookmark.");
  const surahNameArabic = cleanText(input.surahNameArabic, 100);
  const arabicText = cleanText(input.arabicText, 1_500);
  const translationText = cleanText(input.translationText, 2_000);
  const translationLanguage = cleanText(input.translationLanguage, 12);
  const translationDirection = input.translationDirection === "ltr" ? "ltr" : "rtl";

  const bookmark: QuranBookmark = {
    key: bookmarkKey(input.surahNumber, input.ayahNumber),
    surahNumber: input.surahNumber,
    ayahNumber: input.ayahNumber,
    surahName,
    ...(surahNameArabic ? { surahNameArabic } : {}),
    ...(arabicText ? { arabicText } : {}),
    ...(translationText ? { translationText } : {}),
    ...(translationLanguage ? { translationLanguage } : {}),
    ...(translationText ? { translationDirection } : {}),
    createdAt: now.toISOString(),
  };

  const next = [bookmark, ...readBookmarks(storage).filter((item) => item.key !== bookmark.key)];
  saveBookmarks(storage, next);
  return bookmark;
}

export function removeBookmark(
  storage: BookmarkStorage,
  surahNumber: number,
  ayahNumber: number,
): boolean {
  const key = bookmarkKey(surahNumber, ayahNumber);
  const current = readBookmarks(storage);
  const next = current.filter((bookmark) => bookmark.key !== key);
  if (next.length === current.length) return false;
  saveBookmarks(storage, next);
  return true;
}

export function toggleBookmark(
  storage: BookmarkStorage,
  input: BookmarkInput,
  now = new Date(),
): { bookmarked: boolean; bookmark?: QuranBookmark } {
  const key = bookmarkKey(input.surahNumber, input.ayahNumber);
  if (readBookmarks(storage).some((bookmark) => bookmark.key === key)) {
    removeBookmark(storage, input.surahNumber, input.ayahNumber);
    return { bookmarked: false };
  }
  return { bookmarked: true, bookmark: addBookmark(storage, input, now) };
}
