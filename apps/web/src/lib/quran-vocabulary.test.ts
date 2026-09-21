import { describe, expect, it } from "vitest";
import {
  calculateSurahVocabularyReadiness,
  FREQUENT_SURAHS_PROFILES,
  PREPOSITIONS_DATA,
  PRONOUN_PARADIGMS,
  QURAN_VOCABULARY,
  QURANIC_PHRASES,
  VERB_PATTERNS,
} from "./quran-vocabulary";

describe("Learning Engine 2.0 Vocabulary & Grammar Dataset", () => {
  it("provides comprehensive high-frequency vocabulary across curriculum stages", () => {
    expect(QURAN_VOCABULARY.length).toBeGreaterThan(45);

    const stages = new Set(QURAN_VOCABULARY.map((item) => item.stage));
    expect(stages.has("salah")).toBe(true);
    expect(stages.has("particles_pronouns")).toBe(true);
    expect(stages.has("divine_attributes")).toBe(true);
    expect(stages.has("core_verbs")).toBe(true);

    // Verify all keys are unique non-empty strings
    const keys = new Set<string>();
    for (const item of QURAN_VOCABULARY) {
      expect(item.key.length).toBeGreaterThan(0);
      expect(keys.has(item.key)).toBe(false);
      keys.add(item.key);
      expect(item.frequency).toBeGreaterThan(0);
      expect(item.urdu.length).toBeGreaterThan(0);
      expect(item.exampleAyah.surah).toBeGreaterThanOrEqual(1);
      expect(item.exampleAyah.ayah).toBeGreaterThanOrEqual(1);
    }
  });

  it("contains major formulaic phrases with valid Ayah references", () => {
    expect(QURANIC_PHRASES.length).toBeGreaterThanOrEqual(10);
    for (const phrase of QURANIC_PHRASES) {
      expect(phrase.arabic.length).toBeGreaterThan(0);
      expect(phrase.urdu.length).toBeGreaterThan(0);
      expect(phrase.surah).toBeGreaterThanOrEqual(1);
      expect(phrase.ayah).toBeGreaterThanOrEqual(1);
      expect(phrase.keyWords.length).toBeGreaterThan(0);
    }
  });

  it("defines comprehensive pronoun and preposition paradigms for grammar discovery", () => {
    expect(PRONOUN_PARADIGMS.length).toBe(6);
    expect(PREPOSITIONS_DATA.length).toBeGreaterThanOrEqual(6);
    expect(VERB_PATTERNS.length).toBe(5);

    // Check pronoun paradigm properties
    for (const pronoun of PRONOUN_PARADIGMS) {
      expect(pronoun.detached).toBeTruthy();
      expect(pronoun.attached).toBeTruthy();
      expect(pronoun.meaningUrdu).toBeTruthy();
      expect(pronoun.example.reference).toBeTruthy();
    }

    // Check verb patterns
    for (const verb of VERB_PATTERNS) {
      expect(verb.past).toBeTruthy();
      expect(verb.present).toBeTruthy();
      expect(verb.masdar).toBeTruthy();
    }
  });

  it("accurately calculates Surah comprehension readiness", () => {
    expect(FREQUENT_SURAHS_PROFILES.length).toBe(8);

    // Surah 1 (Al-Fatihah) test with 0 known words
    const emptyReadiness = calculateSurahVocabularyReadiness(1, new Set());
    expect(emptyReadiness.knownCount).toBe(0);
    expect(emptyReadiness.readinessPercentage).toBe(0);
    expect(emptyReadiness.stage).toBe("needs_study");

    // Surah 1 with partial known words
    const partialKnown = new Set(["بسم", "الله", "الرحمن", "الرحيم", "الحمد", "رب", "يوم"]);
    const partialReadiness = calculateSurahVocabularyReadiness(1, partialKnown);
    expect(partialReadiness.knownCount).toBe(7);
    expect(partialReadiness.readinessPercentage).toBeGreaterThanOrEqual(40);
    expect(partialReadiness.stage).toBe("growing");

    // Surah 1 with all key lemmas known
    const allFatihah = new Set(emptyReadiness.profile.keyLemmas);
    const fullReadiness = calculateSurahVocabularyReadiness(1, allFatihah);
    expect(fullReadiness.knownCount).toBe(emptyReadiness.totalKeyLemmas);
    expect(fullReadiness.readinessPercentage).toBe(100);
    expect(fullReadiness.stage).toBe("ready");
  });
});
