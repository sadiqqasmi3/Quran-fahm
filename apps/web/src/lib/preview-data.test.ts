import { describe, expect, it } from "vitest";
import { PREVIEW_FATIHA, PREVIEW_SURAHS } from "./preview-data";

describe("reader preview data", () => {
  it("never presents invented translation, morphology, or audio", () => {
    expect(PREVIEW_FATIHA).toHaveLength(7);
    expect(
      PREVIEW_FATIHA.every(
        (ayah) => !ayah.translation && !ayah.audioUrl && Object.keys(ayah).length === 3,
      ),
    ).toBe(true);
  });

  it("keeps preview navigation within valid surah coordinates", () => {
    expect(PREVIEW_SURAHS.every((surah) => surah.number >= 1 && surah.number <= 114)).toBe(true);
  });
});
