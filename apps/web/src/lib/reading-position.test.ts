import { describe, expect, it } from "vitest";
import { parseReadingPositionResponse } from "./reading-position";

describe("reading position API response", () => {
  it("reads the position from the API wrapper", () => {
    expect(
      parseReadingPositionResponse({
        position: {
          surahNumber: 67,
          ayahNumber: 12,
          mode: "read",
          updatedAt: "2026-09-20T18:00:00.000Z",
        },
      }),
    ).toMatchObject({ surahNumber: 67, ayahNumber: 12 });
  });

  it("returns null for no saved position or a malformed response", () => {
    expect(parseReadingPositionResponse({ position: null })).toBeNull();
    expect(parseReadingPositionResponse({ surahNumber: 67, ayahNumber: 12 })).toBeNull();
  });
});
