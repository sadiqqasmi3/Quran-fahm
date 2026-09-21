import { describe, expect, it, beforeEach } from "vitest";
import {
  resolveInitialMushafPosition,
  saveMushafPosition,
  MUSHAF_PAGE_STORAGE_KEY,
  MUSHAF_PARA_STORAGE_KEY,
} from "./mushaf-storage";

/**
 * In-memory Storage mock for testing without jsdom / real localStorage.
 */
function createMockStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    get length() { return data.size; },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    getItem(key: string) { return data.get(key) ?? null; },
    setItem(key: string, value: string) { data.set(key, value); },
    removeItem(key: string) { data.delete(key); },
    clear() { data.clear(); },
  };
}

describe("resolveInitialMushafPosition", () => {
  it("returns the explicit page when propPage is valid", () => {
    const pos = resolveInitialMushafPosition(undefined, 100);
    expect(pos.page).toBe(100);
    // Para should be auto-detected from page 100
    expect(pos.para).toBeGreaterThanOrEqual(1);
    expect(pos.para).toBeLessThanOrEqual(30);
  });

  it("returns start of para when only propPara is given", () => {
    const pos = resolveInitialMushafPosition(15);
    expect(pos.para).toBe(15);
    // startMushafPage of para 15
    expect(pos.page).toBeGreaterThanOrEqual(2);
  });

  it("falls back to localStorage when no props", () => {
    const storage = createMockStorage({
      [MUSHAF_PAGE_STORAGE_KEY]: "300",
    });
    const pos = resolveInitialMushafPosition(undefined, undefined, storage);
    expect(pos.page).toBe(300);
    expect(pos.para).toBeGreaterThanOrEqual(1);
  });

  it("falls back to localStorage para when no page saved", () => {
    const storage = createMockStorage({
      [MUSHAF_PARA_STORAGE_KEY]: "20",
    });
    const pos = resolveInitialMushafPosition(undefined, undefined, storage);
    expect(pos.para).toBe(20);
  });

  it("returns default when nothing is provided and storage is empty", () => {
    const storage = createMockStorage();
    const pos = resolveInitialMushafPosition(undefined, undefined, storage);
    expect(pos).toEqual({ para: 1, page: 2 });
  });

  it("ignores out-of-range page values", () => {
    const pos = resolveInitialMushafPosition(undefined, 999);
    expect(pos).toEqual({ para: 1, page: 2 });
  });

  it("ignores out-of-range para values", () => {
    const pos = resolveInitialMushafPosition(0);
    expect(pos).toEqual({ para: 1, page: 2 });
  });

  it("explicit props take priority over localStorage", () => {
    const storage = createMockStorage({
      [MUSHAF_PAGE_STORAGE_KEY]: "300",
      [MUSHAF_PARA_STORAGE_KEY]: "15",
    });
    const pos = resolveInitialMushafPosition(5, undefined, storage);
    expect(pos.para).toBe(5);
  });
});

describe("saveMushafPosition", () => {
  it("stores page and para into storage", () => {
    const storage = createMockStorage();
    saveMushafPosition(150, 8, storage);
    expect(storage.getItem(MUSHAF_PAGE_STORAGE_KEY)).toBe("150");
    expect(storage.getItem(MUSHAF_PARA_STORAGE_KEY)).toBe("8");
  });

  it("does not throw when storage is undefined", () => {
    expect(() => saveMushafPosition(150, 8, undefined)).not.toThrow();
  });
});
