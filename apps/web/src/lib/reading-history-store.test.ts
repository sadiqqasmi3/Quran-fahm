import { beforeEach, describe, expect, it } from "vitest";
import {
  clearReadingHistory,
  readReadingHistory,
  recordReadingHistory,
} from "./reading-history-store";

describe("reading-history-store", () => {
  let mockStorage: Storage;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    mockStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        store = {};
      },
      key: (i: number) => Object.keys(store)[i] ?? null,
      get length() {
        return Object.keys(store).length;
      },
    };
  });

  it("reads empty history when nothing is stored", () => {
    expect(readReadingHistory(mockStorage)).toEqual([]);
  });

  it("records and retrieves reading history items sorted by visitedAt descending", () => {
    recordReadingHistory(mockStorage, {
      surahNumber: 1,
      ayahNumber: 2,
      surahNameArabic: "الفاتحة",
      surahNameEnglish: "Al-Fatihah",
      mode: "read",
      visitedAt: "2026-09-20T10:00:00.000Z",
    });

    recordReadingHistory(mockStorage, {
      surahNumber: 2,
      ayahNumber: 255,
      surahNameArabic: "البقرة",
      surahNameEnglish: "Al-Baqarah",
      mode: "study",
      visitedAt: "2026-09-21T10:00:00.000Z",
    });

    const history = readReadingHistory(mockStorage);
    expect(history).toHaveLength(2);
    expect(history[0]?.surahNumber).toBe(2);
    expect(history[0]?.ayahNumber).toBe(255);
    expect(history[1]?.surahNumber).toBe(1);
    expect(history[1]?.ayahNumber).toBe(2);
  });

  it("de-duplicates identical surah and ayah updates, bringing the latest visit to the top", () => {
    recordReadingHistory(mockStorage, {
      surahNumber: 36,
      ayahNumber: 1,
      surahNameArabic: "يس",
      surahNameEnglish: "Yaseen",
      mode: "read",
      visitedAt: "2026-09-20T08:00:00.000Z",
    });

    recordReadingHistory(mockStorage, {
      surahNumber: 1,
      ayahNumber: 1,
      surahNameArabic: "الفاتحة",
      surahNameEnglish: "Al-Fatihah",
      mode: "read",
      visitedAt: "2026-09-20T09:00:00.000Z",
    });

    // Re-visit Surah 36, Ayah 1 later
    recordReadingHistory(mockStorage, {
      surahNumber: 36,
      ayahNumber: 1,
      surahNameArabic: "يس",
      surahNameEnglish: "Yaseen",
      mode: "study",
      visitedAt: "2026-09-21T12:00:00.000Z",
    });

    const history = readReadingHistory(mockStorage);
    expect(history).toHaveLength(2);
    expect(history[0]?.surahNumber).toBe(36);
    expect(history[0]?.mode).toBe("study");
  });

  it("clears reading history correctly", () => {
    recordReadingHistory(mockStorage, {
      surahNumber: 1,
      ayahNumber: 1,
      surahNameArabic: "الفاتحة",
      surahNameEnglish: "Al-Fatihah",
      mode: "read",
    });

    expect(readReadingHistory(mockStorage)).toHaveLength(1);
    clearReadingHistory(mockStorage);
    expect(readReadingHistory(mockStorage)).toHaveLength(0);
  });
});
