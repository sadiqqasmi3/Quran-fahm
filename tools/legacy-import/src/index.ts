import { z } from "zod";

const LegacyMasterySchema = z.object({
  key: z.string().max(120).optional(),
  strength: z.number().finite().optional(),
  reviews: z.number().int().finite().optional(),
  lapses: z.number().int().finite().optional(),
  intervalDays: z.number().finite().optional(),
  dueAt: z.number().finite().optional(),
  lastReviewedAt: z.number().finite().optional(),
  lastRating: z.enum(["again", "hard", "good", "easy"]).optional(),
  stage: z.string().max(60).optional(),
  updatedAt: z.number().finite().optional(),
});

const LegacyExportSchema = z.object({
  format: z.literal("quran-feham-progress"),
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  mastery: z.record(z.string().max(120), LegacyMasterySchema).default({}),
  settings: z
    .object({
      language: z.enum(["english", "urdu"]).optional(),
      translationEdition: z.string().max(80).optional(),
      reciter: z.string().max(80).optional(),
      theme: z.enum(["system", "light", "dark"]).optional(),
      dailyGoal: z.number().finite().optional(),
    })
    .passthrough()
    .default({}),
  activity: z.array(z.unknown()).max(366).default([]),
  listen: z.unknown().optional(),
});

export interface PlacementHint {
  learningItemId: string;
  legacyStrength: number;
  legacyReviews: number;
  legacyLapses: number;
  verifyBeforeScheduling: true;
  source: "legacy_v1";
}

export interface LegacyConversion {
  placementHints: PlacementHint[];
  settings: {
    locale?: "en" | "ur";
    translationEditionId?: string;
    recitationEditionId?: string;
    theme?: "system" | "light" | "dark";
    dailyMinutes?: 5 | 10 | 15;
  };
  discarded: {
    unknownMasteryKeys: string[];
    unverifiedListeningScore: true;
    activityHistory: true;
  };
}

export function convertLegacyExport(
  input: unknown,
  allowedLearningItemIds: ReadonlySet<string>,
): LegacyConversion {
  const legacy = LegacyExportSchema.parse(input);
  const unknownMasteryKeys: string[] = [];
  const placementHints: PlacementHint[] = [];

  for (const [key, record] of Object.entries(legacy.mastery)) {
    if (!allowedLearningItemIds.has(key)) {
      unknownMasteryKeys.push(key);
      continue;
    }
    placementHints.push({
      learningItemId: key,
      legacyStrength: clamp(record.strength ?? 0, 0, 100),
      legacyReviews: Math.round(clamp(record.reviews ?? 0, 0, 100_000)),
      legacyLapses: Math.round(clamp(record.lapses ?? 0, 0, 100_000)),
      verifyBeforeScheduling: true,
      source: "legacy_v1",
    });
  }

  const settings: LegacyConversion["settings"] = {};
  if (legacy.settings.language) {
    settings.locale = legacy.settings.language === "urdu" ? "ur" : "en";
  }
  if (legacy.settings.translationEdition) {
    settings.translationEditionId = legacy.settings.translationEdition;
  }
  if (legacy.settings.reciter) settings.recitationEditionId = legacy.settings.reciter;
  if (legacy.settings.theme) settings.theme = legacy.settings.theme;
  if (legacy.settings.dailyGoal) {
    const goal = legacy.settings.dailyGoal;
    settings.dailyMinutes = goal <= 5 ? 5 : goal <= 10 ? 10 : 15;
  }

  return {
    placementHints,
    settings,
    discarded: {
      unknownMasteryKeys,
      unverifiedListeningScore: true,
      activityHistory: true,
    },
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
