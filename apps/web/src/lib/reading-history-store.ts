import { z } from "zod";

export const READING_HISTORY_STORAGE_KEY = "qf_reading_history_v2";
export const READING_HISTORY_CHANGED_EVENT = "qf:reading-history-changed";

export const ReadingHistoryEntrySchema = z.object({
  id: z.string(),
  surahNumber: z.number().int().min(1).max(114),
  ayahNumber: z.number().int().positive(),
  surahNameArabic: z.string().min(1),
  surahNameEnglish: z.string().min(1),
  visitedAt: z.string().datetime(),
  mode: z.enum(["read", "study", "listen", "mushaf"]),
  mushafPage: z.number().int().min(1).max(611).optional(),
});

export type ReadingHistoryEntry = z.infer<typeof ReadingHistoryEntrySchema>;

const MAX_HISTORY_ENTRIES = 60;

export function readReadingHistory(storage: Storage): ReadingHistoryEntry[] {
  try {
    const raw = storage.getItem(READING_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        const result = ReadingHistoryEntrySchema.safeParse(item);
        return result.success ? result.data : null;
      })
      .filter((item): item is ReadingHistoryEntry => item !== null)
      .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime());
  } catch {
    return [];
  }
}

export function recordReadingHistory(
  storage: Storage,
  entry: Omit<ReadingHistoryEntry, "id" | "visitedAt"> & { visitedAt?: string },
): ReadingHistoryEntry {
  const current = readReadingHistory(storage);
  const now = entry.visitedAt ?? new Date().toISOString();
  const id = `${entry.surahNumber}:${entry.ayahNumber}:${entry.mode}`;

  // Filter out any duplicate for the same surah, ayah to keep history fresh and de-duplicated
  const filtered = current.filter(
    (item) => !(item.surahNumber === entry.surahNumber && item.ayahNumber === entry.ayahNumber),
  );

  const newEntry: ReadingHistoryEntry = {
    id,
    surahNumber: entry.surahNumber,
    ayahNumber: entry.ayahNumber,
    surahNameArabic: entry.surahNameArabic,
    surahNameEnglish: entry.surahNameEnglish,
    visitedAt: now,
    mode: entry.mode,
    ...(entry.mushafPage ? { mushafPage: entry.mushafPage } : {}),
  };

  const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY_ENTRIES);

  try {
    storage.setItem(READING_HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage quota or restriction handled gracefully
  }

  return newEntry;
}

export function clearReadingHistory(storage: Storage): void {
  try {
    storage.removeItem(READING_HISTORY_STORAGE_KEY);
  } catch {
    // Graceful error handling
  }
}
