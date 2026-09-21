import { LEARNING_WORDS } from "./prototype-learning-data";

export const LEARNING_STORAGE_KEYS = {
  mastery: "qf_mastery_v1",
  settings: "qf_settings_v1",
  activity: "qf_activity_v1",
  listen: "qf_listen_v1",
} as const;

export type RecallRating = "again" | "hard" | "good" | "easy";
export type LearningStage = "learning" | "recognized" | "audio-ready" | "mastered";
export type LearningWord = (typeof LEARNING_WORDS)[number];

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type MasteryDimension = "visual" | "meaning" | "context" | "audio";

export interface DimensionEvidence {
  reviews: number;
  successCount: number;
  lastReviewedAt: number;
}

export interface MasteryRecord {
  key?: string;
  reviews?: number;
  lapses?: number;
  strength?: number;
  intervalDays?: number;
  dueAt?: number;
  lastRating?: RecallRating;
  lastReviewedAt?: number;
  updatedAt?: number;
  stage?: LearningStage;
  visual?: DimensionEvidence;
  meaning?: DimensionEvidence;
  context?: DimensionEvidence;
  audio?: DimensionEvidence;
  [field: string]: unknown;
}

export type MasteryMap = Record<string, MasteryRecord>;

export interface ActivityRecord {
  day: string;
  count: number;
  type: string;
}

export interface ListenStats {
  correct: number;
  total: number;
}

export interface LearningStats {
  total: number;
  reviewed: number;
  recognized: number;
  mastered: number;
  due: number;
  estimate: number;
}

export interface ProgressExport {
  format: "quran-feham-progress";
  version: 1;
  exportedAt: string;
  mastery: MasteryMap;
  settings: Record<string, string | number | boolean>;
  activity: ActivityRecord[];
  listen: ListenStats;
}

export interface ProgressImportSummary {
  masteryRecords: number;
  activityDays: number;
  listeningAnswers: number;
  settingsImported: boolean;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeJsonParse(value: string | null): unknown {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function finiteNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeWrite(storage: StorageLike, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // A full or privacy-restricted browser store must not make a lesson unusable.
  }
}

export function readMasteryMap(storage: StorageLike): MasteryMap {
  const parsed = safeJsonParse(storage.getItem(LEARNING_STORAGE_KEYS.mastery));
  if (!isObject(parsed)) return {};

  const result: MasteryMap = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (isObject(value)) result[key] = value as MasteryRecord;
  }
  return result;
}

export function getMastery(storage: StorageLike, key: string): MasteryRecord | null {
  return readMasteryMap(storage)[key] ?? null;
}

export function readActivity(storage: StorageLike): ActivityRecord[] {
  const parsed = safeJsonParse(storage.getItem(LEARNING_STORAGE_KEYS.activity));
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((value): ActivityRecord[] => {
    if (!isObject(value) || typeof value.day !== "string") return [];
    return [
      {
        day: value.day,
        count: Math.max(0, finiteNumber(value.count)),
        type: typeof value.type === "string" ? value.type : "review",
      },
    ];
  });
}

export function getListenStats(storage: StorageLike): ListenStats {
  const parsed = safeJsonParse(storage.getItem(LEARNING_STORAGE_KEYS.listen));
  if (!isObject(parsed)) return { correct: 0, total: 0 };
  const total = Math.max(0, Math.floor(finiteNumber(parsed.total)));
  const correct = Math.min(total, Math.max(0, Math.floor(finiteNumber(parsed.correct))));
  return { correct, total };
}

export function recordListen(storage: StorageLike, correct: boolean): ListenStats {
  const previous = getListenStats(storage);
  const next = {
    correct: previous.correct + (correct ? 1 : 0),
    total: previous.total + 1,
  };
  safeWrite(storage, LEARNING_STORAGE_KEYS.listen, next);
  recordActivity(storage, "listen");
  return next;
}

export function listenPercent(stats: ListenStats): number {
  return stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
}

export function recordActivity(
  storage: StorageLike,
  type = "review",
  now = new Date(),
): ActivityRecord[] {
  const activity = readActivity(storage);
  const day = localDayKey(now);
  const existing = activity.find((item) => item.day === day);
  if (existing) {
    existing.count += 1;
    existing.type = type;
  } else {
    activity.push({ day, count: 1, type });
  }
  const trimmed = activity.slice(-90);
  safeWrite(storage, LEARNING_STORAGE_KEYS.activity, trimmed);
  return trimmed;
}

export function currentStreak(storage: StorageLike, now = new Date()): number {
  const days = new Set(
    readActivity(storage)
      .filter((item) => item.type !== "open")
      .map((item) => item.day),
  );
  const cursor = new Date(now);
  let streak = 0;
  for (let index = 0; index < 365; index += 1) {
    const day = localDayKey(cursor);
    if (days.has(day)) {
      streak += 1;
    } else if (index !== 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function localDayKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isDue(record: MasteryRecord | undefined, now: number): boolean {
  return !record?.dueAt || finiteNumber(record.dueAt) <= now;
}

export function dueWords(mastery: MasteryMap, limit = 12, now = Date.now()): LearningWord[] {
  return LEARNING_WORDS.map((word, index) => {
    const record = mastery[word.key];
    const due = isDue(record, now);
    const priority = record ? 100 - finiteNumber(record.strength) + (due ? 500 : 0) : 1_000 - index;
    return { word, due, priority };
  })
    .filter((item) => item.due)
    .sort((left, right) => right.priority - left.priority)
    .slice(0, Math.max(0, limit))
    .map((item) => item.word);
}

export function masteryStats(mastery: MasteryMap, now = Date.now()): LearningStats {
  const records = Object.values(mastery);
  const total = LEARNING_WORDS.length;
  const weighted = records.reduce(
    (sum, record) => sum + Math.min(100, Math.max(0, finiteNumber(record.strength))),
    0,
  );
  return {
    total,
    reviewed: records.filter((record) => finiteNumber(record.reviews) > 0).length,
    recognized: records.filter((record) => finiteNumber(record.strength) >= 60).length,
    mastered: records.filter((record) => finiteNumber(record.strength) >= 85).length,
    due: dueWords(mastery, Number.POSITIVE_INFINITY, now).length,
    estimate: total > 0 ? Math.round((weighted / (total * 100)) * 100) : 0,
  };
}

function nextIntervalDays(rating: RecallRating, previous: MasteryRecord): number {
  const oldInterval = Math.max(0, finiteNumber(previous.intervalDays));
  if (rating === "again") return 0;
  if (rating === "hard") return oldInterval < 1 ? 1 : Math.max(1, Math.round(oldInterval * 1.35));
  if (rating === "good") return oldInterval < 1 ? 2 : Math.max(2, Math.round(oldInterval * 2.15));
  return oldInterval < 1 ? 4 : Math.max(4, Math.round(oldInterval * 3.2));
}

export function applyLegacyReview(
  previous: MasteryRecord | undefined,
  key: string,
  rating: RecallRating,
  now = Date.now(),
): MasteryRecord {
  const old = previous ?? {};
  const intervalDays = nextIntervalDays(rating, old);
  const delta = { again: -18, hard: 4, good: 12, easy: 20 }[rating];
  const strength = Math.max(0, Math.min(100, finiteNumber(old.strength) + delta));
  const dueAt = now + (rating === "again" ? 10 * 60 * 1_000 : intervalDays * 86_400_000);
  const stage: LearningStage =
    strength >= 85
      ? "mastered"
      : strength >= 60
        ? "audio-ready"
        : strength >= 35
          ? "recognized"
          : "learning";

  const oldMeaning = (old.meaning as DimensionEvidence | undefined) ?? {
    reviews: 0,
    successCount: 0,
    lastReviewedAt: 0,
  };
  const isSuccess = rating === "good" || rating === "easy";
  const meaning: DimensionEvidence = {
    reviews: oldMeaning.reviews + 1,
    successCount: oldMeaning.successCount + (isSuccess ? 1 : 0),
    lastReviewedAt: now,
  };
  const oldVisual = (old.visual as DimensionEvidence | undefined) ?? {
    reviews: 0,
    successCount: 0,
    lastReviewedAt: 0,
  };
  const visual: DimensionEvidence = {
    reviews: oldVisual.reviews + 1,
    successCount: oldVisual.successCount + 1,
    lastReviewedAt: now,
  };

  return {
    ...old,
    key,
    reviews: finiteNumber(old.reviews) + 1,
    lapses: finiteNumber(old.lapses) + (rating === "again" ? 1 : 0),
    strength,
    intervalDays,
    dueAt,
    lastRating: rating,
    lastReviewedAt: now,
    updatedAt: now,
    stage,
    meaning,
    visual,
  };
}

export function recordDimensionEvidence(
  storage: StorageLike,
  key: string,
  dimension: MasteryDimension,
  success: boolean,
  now = Date.now(),
): MasteryRecord {
  const mastery = readMasteryMap(storage);
  const old = mastery[key] ?? {};
  const currentEvidence = (old[dimension] as DimensionEvidence | undefined) ?? {
    reviews: 0,
    successCount: 0,
    lastReviewedAt: 0,
  };
  const updatedEvidence: DimensionEvidence = {
    reviews: currentEvidence.reviews + 1,
    successCount: currentEvidence.successCount + (success ? 1 : 0),
    lastReviewedAt: now,
  };

  const next: MasteryRecord = {
    ...old,
    key,
    [dimension]: updatedEvidence,
    updatedAt: now,
  };
  mastery[key] = next;
  safeWrite(storage, LEARNING_STORAGE_KEYS.mastery, mastery);
  return next;
}

export function isUnderstood(record: MasteryRecord | null | undefined): boolean {
  if (!record) return false;
  return (
    finiteNumber(record.strength) >= 60 ||
    record.stage === "audio-ready" ||
    record.stage === "mastered" ||
    Boolean(record.meaning && record.meaning.successCount >= 2)
  );
}

export function isMastered(record: MasteryRecord | null | undefined): boolean {
  if (!record) return false;
  return (
    finiteNumber(record.strength) >= 85 ||
    record.stage === "mastered" ||
    Boolean(
      record.meaning &&
        record.meaning.successCount >= 4 &&
        (!record.lapses || record.lapses === 0),
    )
  );
}

export function rateWord(
  storage: StorageLike,
  key: string,
  rating: RecallRating,
  now = Date.now(),
): MasteryRecord {
  const mastery = readMasteryMap(storage);
  const next = applyLegacyReview(mastery[key], key, rating, now);
  mastery[key] = next;
  safeWrite(storage, LEARNING_STORAGE_KEYS.mastery, mastery);
  recordActivity(storage, "review", new Date(now));
  return next;
}

export function markKnown(storage: StorageLike, key: string, now = Date.now()): MasteryRecord {
  const mastery = readMasteryMap(storage);
  const previous = mastery[key] ?? {};
  const next: MasteryRecord = {
    ...previous,
    key,
    strength: Math.max(70, finiteNumber(previous.strength)),
    dueAt: now + 4 * 86_400_000,
    stage: "recognized",
    reviews: finiteNumber(previous.reviews) + 1,
    updatedAt: now,
  };
  mastery[key] = next;
  safeWrite(storage, LEARNING_STORAGE_KEYS.mastery, mastery);
  recordActivity(storage, "review", new Date(now));
  return next;
}

export function reviewLater(storage: StorageLike, key: string, now = Date.now()): MasteryRecord {
  const mastery = readMasteryMap(storage);
  const previous = mastery[key] ?? {};
  const next: MasteryRecord = {
    ...previous,
    key,
    strength: Math.max(5, finiteNumber(previous.strength)),
    dueAt: now,
    stage: "learning",
    updatedAt: now,
  };
  mastery[key] = next;
  safeWrite(storage, LEARNING_STORAGE_KEYS.mastery, mastery);
  recordActivity(storage, "review", new Date(now));
  return next;
}

export function clearLearningProgress(storage: StorageLike): void {
  storage.removeItem(LEARNING_STORAGE_KEYS.mastery);
  storage.removeItem(LEARNING_STORAGE_KEYS.activity);
  storage.removeItem(LEARNING_STORAGE_KEYS.listen);
}

function readSettings(storage: StorageLike): Record<string, string | number | boolean> {
  const parsed = safeJsonParse(storage.getItem(LEARNING_STORAGE_KEYS.settings));
  if (!isObject(parsed)) return {};
  return Object.fromEntries(
    Object.entries(parsed).filter((entry): entry is [string, string | number | boolean] =>
      ["string", "number", "boolean"].includes(typeof entry[1]),
    ),
  );
}

export function exportProgress(storage: StorageLike, now = new Date()): ProgressExport {
  return {
    format: "quran-feham-progress",
    version: 1,
    exportedAt: now.toISOString(),
    mastery: readMasteryMap(storage),
    settings: readSettings(storage),
    activity: readActivity(storage),
    listen: getListenStats(storage),
  };
}

function validateImportedMastery(value: unknown): MasteryMap {
  if (!isObject(value)) throw new Error("The progress file has an invalid mastery section.");
  const entries = Object.entries(value);
  if (entries.length > 500) throw new Error("The progress file contains too many mastery records.");

  const mastery: MasteryMap = {};
  const ratings: RecallRating[] = ["again", "hard", "good", "easy"];
  const stages: LearningStage[] = ["learning", "recognized", "audio-ready", "mastered"];
  for (const [key, candidate] of entries) {
    if (!key || key.length > 180 || !isObject(candidate)) {
      throw new Error("The progress file contains an invalid mastery record.");
    }
    const record: MasteryRecord = { key };
    for (const field of [
      "reviews",
      "lapses",
      "strength",
      "intervalDays",
      "dueAt",
      "lastReviewedAt",
      "updatedAt",
    ] as const) {
      if (candidate[field] === undefined) continue;
      const numeric = Number(candidate[field]);
      if (!Number.isFinite(numeric) || numeric < 0) {
        throw new Error(`The progress file contains an invalid ${field} value.`);
      }
      record[field] =
        field === "strength"
          ? Math.min(100, numeric)
          : field === "reviews" || field === "lapses"
            ? Math.min(1_000_000, Math.floor(numeric))
            : numeric;
    }
    if (candidate.lastRating !== undefined) {
      if (!ratings.includes(candidate.lastRating as RecallRating)) {
        throw new Error("The progress file contains an invalid recall rating.");
      }
      record.lastRating = candidate.lastRating as RecallRating;
    }
    if (candidate.stage !== undefined) {
      if (!stages.includes(candidate.stage as LearningStage)) {
        throw new Error("The progress file contains an invalid learning stage.");
      }
      record.stage = candidate.stage as LearningStage;
    }
    mastery[key] = record;
  }
  return mastery;
}

function validateImportedSettings(value: unknown): Record<string, string | number | boolean> {
  if (value === undefined) return {};
  if (!isObject(value)) throw new Error("The progress file has an invalid settings section.");
  const settings: Record<string, string | number | boolean> = {};
  const stringFields = ["translation", "reciter"] as const;
  const booleanFields = ["showTranslation", "showWordOverlay"] as const;
  for (const field of stringFields) {
    const candidate = value[field];
    if (candidate === undefined) continue;
    if (typeof candidate !== "string" || candidate.length > 120) {
      throw new Error(`The progress file contains an invalid ${field} setting.`);
    }
    settings[field] = candidate;
  }
  for (const field of booleanFields) {
    const candidate = value[field];
    if (candidate === undefined) continue;
    if (typeof candidate !== "boolean") {
      throw new Error(`The progress file contains an invalid ${field} setting.`);
    }
    settings[field] = candidate;
  }
  if (value.arabicSize !== undefined) {
    const size = Number(value.arabicSize);
    if (!Number.isFinite(size) || size < 0.8 || size > 1.6) {
      throw new Error("The progress file contains an invalid Arabic text size.");
    }
    settings.arabicSize = size;
  }
  if (value.cacheDays !== undefined) {
    const days = Number(value.cacheDays);
    if (!Number.isInteger(days) || days < 1 || days > 90) {
      throw new Error("The progress file contains an invalid cache duration.");
    }
    settings.cacheDays = days;
  }
  return settings;
}

function validateImportedActivity(value: unknown): ActivityRecord[] {
  if (!Array.isArray(value) || value.length > 90) {
    throw new Error("The progress file has an invalid activity section.");
  }
  return value.map((candidate) => {
    if (
      !isObject(candidate) ||
      typeof candidate.day !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(candidate.day) ||
      !Number.isFinite(Number(candidate.count)) ||
      Number(candidate.count) < 0 ||
      typeof candidate.type !== "string" ||
      candidate.type.length > 40
    ) {
      throw new Error("The progress file contains an invalid activity record.");
    }
    return {
      day: candidate.day,
      count: Math.min(1_000_000, Math.floor(Number(candidate.count))),
      type: candidate.type,
    };
  });
}

function validateImportedListen(value: unknown): ListenStats {
  if (!isObject(value)) throw new Error("The progress file has an invalid listening section.");
  const total = Number(value.total);
  const correct = Number(value.correct);
  if (
    !Number.isInteger(total) ||
    !Number.isInteger(correct) ||
    total < 0 ||
    total > 1_000_000 ||
    correct < 0 ||
    correct > total
  ) {
    throw new Error("The progress file contains invalid listening totals.");
  }
  return { correct, total };
}

export function importProgress(storage: StorageLike, payload: unknown): ProgressImportSummary {
  let serialized: string;
  try {
    const encoded = JSON.stringify(payload);
    if (typeof encoded !== "string") throw new Error("Unsupported JSON value");
    serialized = encoded;
  } catch {
    throw new Error("The progress file is not valid JSON data.");
  }
  if (serialized.length > 512_000) throw new Error("The progress file is too large.");
  if (!isObject(payload) || payload.format !== "quran-feham-progress" || payload.version !== 1) {
    throw new Error("This is not a supported Quran Feham progress file.");
  }

  const mastery = validateImportedMastery(payload.mastery);
  const settings = validateImportedSettings(payload.settings);
  const activity = validateImportedActivity(payload.activity);
  const listen = validateImportedListen(payload.listen);
  const values = new Map<string, string>([
    [LEARNING_STORAGE_KEYS.mastery, JSON.stringify(mastery)],
    [LEARNING_STORAGE_KEYS.settings, JSON.stringify(settings)],
    [LEARNING_STORAGE_KEYS.activity, JSON.stringify(activity)],
    [LEARNING_STORAGE_KEYS.listen, JSON.stringify(listen)],
  ]);
  const previous = new Map<string, string | null>();
  for (const key of values.keys()) previous.set(key, storage.getItem(key));

  try {
    for (const [key, value] of values) storage.setItem(key, value);
  } catch {
    for (const [key, value] of previous) {
      try {
        if (value === null) storage.removeItem(key);
        else storage.setItem(key, value);
      } catch {
        // Best-effort rollback for quota-restricted browser stores.
      }
    }
    throw new Error("The browser could not store the imported progress safely.");
  }

  if (typeof window !== "undefined") window.dispatchEvent(new Event("qf:data-imported"));
  return {
    masteryRecords: Object.keys(mastery).length,
    activityDays: activity.length,
    listeningAnswers: listen.total,
    settingsImported: Object.keys(settings).length > 0,
  };
}
