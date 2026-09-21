import { describe, expect, it } from "vitest";
import { convertLegacyExport } from "./index.js";

describe("legacy V1 import", () => {
  it("keeps only allowed placement hints and never migrates listening accuracy", () => {
    const converted = convertLegacyExport(
      {
        format: "quran-feham-progress",
        version: 1,
        exportedAt: "2026-09-20T00:00:00.000Z",
        mastery: {
          reviewed: { strength: 120, reviews: 3, lapses: 1 },
          injected: { strength: 100 },
        },
        settings: { language: "urdu", dailyGoal: 12 },
        activity: [{ day: "2026-09-20", count: 99, type: "open" }],
        listen: { correct: 99, total: 100 },
      },
      new Set(["reviewed"]),
    );
    expect(converted.placementHints).toEqual([
      expect.objectContaining({ learningItemId: "reviewed", legacyStrength: 100 }),
    ]);
    expect(converted.discarded.unknownMasteryKeys).toEqual(["injected"]);
    expect(converted.discarded.unverifiedListeningScore).toBe(true);
    expect(converted.settings).toMatchObject({ locale: "ur", dailyMinutes: 15 });
  });
});
