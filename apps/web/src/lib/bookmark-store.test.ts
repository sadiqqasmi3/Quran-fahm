import { describe, expect, it } from "vitest";
import {
  addBookmark,
  BOOKMARK_STORAGE_KEY,
  type BookmarkStorage,
  bookmarkKey,
  readBookmarks,
  removeBookmark,
  toggleBookmark,
} from "./bookmark-store";

class MemoryStorage implements BookmarkStorage {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const fatihah = {
  surahNumber: 1,
  ayahNumber: 5,
  surahName: "Al-Fatihah",
  surahNameArabic: "الفاتحة",
  arabicText: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
  translationText: "ہم تیری ہی عبادت کرتے ہیں",
};

describe("local bookmark store", () => {
  it("stores a typed ayah bookmark and deduplicates its coordinate", () => {
    const storage = new MemoryStorage();
    addBookmark(storage, fatihah, new Date("2026-09-20T08:00:00.000Z"));
    addBookmark(
      storage,
      { ...fatihah, translationText: "Updated" },
      new Date("2026-09-20T09:00:00.000Z"),
    );

    expect(readBookmarks(storage)).toEqual([
      expect.objectContaining({
        key: "1:5",
        translationText: "Updated",
        createdAt: "2026-09-20T09:00:00.000Z",
      }),
    ]);
  });

  it("toggles and removes the exact ayah", () => {
    const storage = new MemoryStorage();
    expect(toggleBookmark(storage, fatihah).bookmarked).toBe(true);
    expect(toggleBookmark(storage, fatihah).bookmarked).toBe(false);
    expect(readBookmarks(storage)).toHaveLength(0);

    addBookmark(storage, fatihah);
    expect(removeBookmark(storage, 1, 5)).toBe(true);
    expect(removeBookmark(storage, 1, 5)).toBe(false);
  });

  it("ignores malformed or duplicated browser records", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      BOOKMARK_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        items: [
          { ...fatihah, key: "untrusted", createdAt: "2026-09-20T08:00:00.000Z" },
          { ...fatihah, key: "duplicate", createdAt: "2026-09-19T08:00:00.000Z" },
          { ...fatihah, surahNumber: 115, createdAt: "2026-09-20T08:00:00.000Z" },
        ],
      }),
    );

    expect(readBookmarks(storage)).toHaveLength(1);
    expect(readBookmarks(storage)[0]?.key).toBe(bookmarkKey(1, 5));
  });

  it("returns an empty collection for unreadable local data", () => {
    const storage = new MemoryStorage();
    storage.setItem(BOOKMARK_STORAGE_KEY, "{not-json");
    expect(readBookmarks(storage)).toEqual([]);
  });
});
