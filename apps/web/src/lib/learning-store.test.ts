import { describe, expect, it } from "vitest";
import {
  applyLegacyReview,
  currentStreak,
  dueWords,
  exportProgress,
  importProgress,
  isMastered,
  isUnderstood,
  LEARNING_STORAGE_KEYS,
  localDayKey,
  masteryStats,
  rateWord,
  readMasteryMap,
  recordActivity,
  recordDimensionEvidence,
  type StorageLike,
} from "./learning-store";
import { LEARNING_WORDS } from "./prototype-learning-data";

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

class OneShotFailingStorage extends MemoryStorage {
  private failed = false;

  override setItem(key: string, value: string) {
    if (key === LEARNING_STORAGE_KEYS.settings && !this.failed) {
      this.failed = true;
      throw new Error("simulated quota failure");
    }
    super.setItem(key, value);
  }
}

describe("V1-compatible learning store", () => {
  it("keeps the complete prototype learner pack in the initial queue", () => {
    expect(LEARNING_WORDS).toHaveLength(52);
    expect(dueWords({}, 7).map((word) => word.key)).toEqual(
      LEARNING_WORDS.slice(0, 7).map((word) => word.key),
    );
    expect(masteryStats({}).due).toBe(52);
  });

  it("preserves the V1 Good rating behavior and storage key", () => {
    const storage = new MemoryStorage();
    const now = Date.parse("2026-09-20T08:00:00.000Z");
    const record = rateWord(storage, "رب", "good", now);

    expect(record.strength).toBe(12);
    expect(record.intervalDays).toBe(2);
    expect(record.dueAt).toBe(now + 2 * 86_400_000);
    expect(readMasteryMap(storage).رب?.reviews).toBe(1);
    expect(storage.getItem(LEARNING_STORAGE_KEYS.mastery)).not.toBeNull();
    expect(storage.getItem(LEARNING_STORAGE_KEYS.activity)).not.toBeNull();
  });

  it("moves repeated recall through the preserved learning stages", () => {
    const now = Date.parse("2026-09-20T08:00:00.000Z");
    const recognized = applyLegacyReview({ strength: 55 }, "الحمد", "good", now);
    const mastered = applyLegacyReview({ strength: 80 }, "الحمد", "easy", now);
    expect(recognized.stage).toBe("audio-ready");
    expect(mastered.stage).toBe("mastered");
  });

  it("uses the learner's local calendar day for activity", () => {
    expect(localDayKey(new Date(2026, 8, 20, 23, 45))).toBe("2026-09-20");
  });

  it("does not count opening the app as a learning streak", () => {
    const storage = new MemoryStorage();
    recordActivity(storage, "open", new Date(2026, 8, 20, 10));
    expect(currentStreak(storage, new Date(2026, 8, 20, 12))).toBe(0);

    recordActivity(storage, "review", new Date(2026, 8, 20, 13));
    expect(currentStreak(storage, new Date(2026, 8, 20, 14))).toBe(1);
  });

  it("round-trips the V1 export without importing cached Quran content", () => {
    const source = new MemoryStorage();
    rateWord(source, "رب", "easy", Date.parse("2026-09-20T08:00:00.000Z"));
    source.setItem(
      LEARNING_STORAGE_KEYS.settings,
      JSON.stringify({ translation: "ur.jalandhry", showTranslation: true, arabicSize: 1 }),
    );
    source.setItem(LEARNING_STORAGE_KEYS.listen, JSON.stringify({ correct: 3, total: 4 }));
    source.setItem("qf_cache_surah-1", JSON.stringify({ shouldNotMove: true }));

    const payload = exportProgress(source, new Date("2026-09-20T09:00:00.000Z"));
    const destination = new MemoryStorage();
    const summary = importProgress(destination, payload);

    expect(payload.format).toBe("quran-feham-progress");
    expect(summary).toMatchObject({ masteryRecords: 1, listeningAnswers: 4 });
    expect(readMasteryMap(destination).رب?.strength).toBe(20);
    expect(destination.getItem("qf_cache_surah-1")).toBeNull();
  });

  it("rejects malformed imports before changing browser progress", () => {
    const storage = new MemoryStorage();
    storage.setItem(LEARNING_STORAGE_KEYS.mastery, JSON.stringify({ رب: { strength: 40 } }));
    const before = storage.getItem(LEARNING_STORAGE_KEYS.mastery);

    expect(() =>
      importProgress(storage, {
        format: "quran-feham-progress",
        version: 1,
        mastery: { رب: { strength: "not-a-number" } },
        settings: {},
        activity: [],
        listen: { correct: 0, total: 0 },
      }),
    ).toThrow(/invalid strength/i);
    expect(storage.getItem(LEARNING_STORAGE_KEYS.mastery)).toBe(before);
  });

  it("rolls back earlier writes when browser storage rejects an import", () => {
    const storage = new OneShotFailingStorage();
    const original = JSON.stringify({ رب: { strength: 40 } });
    storage.values.set(LEARNING_STORAGE_KEYS.mastery, original);

    expect(() =>
      importProgress(storage, {
        format: "quran-feham-progress",
        version: 1,
        mastery: { الحمد: { strength: 20 } },
        settings: { translation: "ur.jalandhry" },
        activity: [],
        listen: { correct: 0, total: 0 },
      }),
    ).toThrow(/could not store/i);
    expect(storage.getItem(LEARNING_STORAGE_KEYS.mastery)).toBe(original);
  });

  it("records separate visual, meaning, context and audio evidence", () => {
    const storage = new MemoryStorage();
    const now = Date.parse("2026-09-20T10:00:00.000Z");

    const record = rateWord(storage, "الله", "good", now);
    expect(record.meaning?.reviews).toBe(1);
    expect(record.meaning?.successCount).toBe(1);
    expect(record.visual?.reviews).toBe(1);

    // Record audio evidence
    const audioUpdated = recordDimensionEvidence(storage, "الله", "audio", true, now + 1000);
    expect(audioUpdated.audio?.reviews).toBe(1);
    expect(audioUpdated.audio?.successCount).toBe(1);

    // Record context evidence
    const contextUpdated = recordDimensionEvidence(storage, "الله", "context", true, now + 2000);
    expect(contextUpdated.context?.reviews).toBe(1);
    expect(contextUpdated.context?.successCount).toBe(1);

    expect(isUnderstood({ strength: 65 })).toBe(true);
    expect(isUnderstood({ strength: 20 })).toBe(false);
    expect(isMastered({ strength: 90 })).toBe(true);
    expect(isMastered({ strength: 65 })).toBe(false);
  });
});
