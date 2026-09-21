import { describe, expect, it } from "vitest";
import {
  findLearningWord,
  LEARNING_PHRASES,
  LEARNING_WORDS,
  normalizeArabic,
  ROOT_NOTES,
} from "./prototype-learning-data";

describe("V1 prototype learner pack", () => {
  it("preserves the complete reviewed prototype scope", () => {
    expect(LEARNING_WORDS).toHaveLength(52);
    expect(LEARNING_PHRASES).toHaveLength(8);
    expect(ROOT_NOTES).toHaveLength(12);
  });

  it("matches diacritics and a single conservative Arabic clitic", () => {
    expect(normalizeArabic("ٱلرَّحْمَٰنِ")).toBe("الرحمن");
    expect(findLearningWord("ٱلرَّحْمَٰنِ")?.key).toBe("الرحمن");
    expect(findLearningWord("وَبِسْمِ")?.key).toBe("بسم");
    expect(findLearningWord("ٱلْعَٰلَمِينَ")?.key).toBe("العالمين");
    expect(findLearningWord("ٱلصِّرَٰطَ")?.key).toBe("الصراط");
    expect(findLearningWord("صِرَٰطَ")?.key).toBe("الصراط");
  });

  it("does not invent an approximate learner entry", () => {
    expect(findLearningWord("كتابات")).toBeNull();
  });
});
