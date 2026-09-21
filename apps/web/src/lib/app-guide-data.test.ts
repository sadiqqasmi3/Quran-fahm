import { describe, expect, it } from "vitest";
import {
  ENGLISH_GUIDE_CONTENT,
  URDU_GUIDE_CONTENT,
  filterGuideSections,
  getGuideContent,
} from "./app-guide-data";

describe("app-guide-data", () => {
  it("provides comprehensive Urdu guide content with 6 core sections", () => {
    const urdu = getGuideContent("ur");
    expect(urdu.sections.length).toBeGreaterThanOrEqual(6);
    expect(urdu.title).toContain("قرآن فہم");

    const categories = urdu.sections.map((s) => s.category);
    expect(categories).toContain("mushaf");
    expect(categories).toContain("quran");
    expect(categories).toContain("khatm");
    expect(categories).toContain("learn");
    expect(categories).toContain("install");
    expect(categories).toContain("offline");

    for (const section of urdu.sections) {
      expect(section.title).toBeTruthy();
      expect(section.summary).toBeTruthy();
      expect(section.actionUrl).toBeTruthy();
      expect(section.steps.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("provides comprehensive English guide content with matching sections", () => {
    const english = getGuideContent("en");
    expect(english.sections.length).toBeGreaterThanOrEqual(6);
    expect(english.title).toContain("Quran Feham");

    for (const section of english.sections) {
      expect(section.title).toBeTruthy();
      expect(section.summary).toBeTruthy();
      expect(section.actionUrl).toBeTruthy();
      expect(section.steps.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("filters guide sections by category correctly", () => {
    const all = URDU_GUIDE_CONTENT.sections;
    const mushafOnly = filterGuideSections(all, "mushaf", "");
    expect(mushafOnly.length).toBe(1);
    expect(mushafOnly[0]?.category).toBe("mushaf");

    const allCategories = filterGuideSections(all, "all", "");
    expect(allCategories.length).toBe(all.length);
  });

  it("searches guide sections by query in title, summary, or step descriptions", () => {
    const all = URDU_GUIDE_CONTENT.sections;

    // Search for Khatm / ختم
    const khatmSearch = filterGuideSections(all, "all", "ختم");
    expect(khatmSearch.length).toBeGreaterThanOrEqual(1);
    expect(khatmSearch.some((s) => s.id === "khatm")).toBe(true);

    // Search for non-existent keyword
    const emptySearch = filterGuideSections(all, "all", "nonexistentquery12345");
    expect(emptySearch.length).toBe(0);

    // English search in English content
    const englishAll = ENGLISH_GUIDE_CONTENT.sections;
    const offlineSearch = filterGuideSections(englishAll, "all", "offline");
    expect(offlineSearch.length).toBeGreaterThanOrEqual(1);
  });

  it("has valid FAQs in both Urdu and English", () => {
    expect(URDU_GUIDE_CONTENT.faqs.length).toBeGreaterThanOrEqual(4);
    expect(ENGLISH_GUIDE_CONTENT.faqs.length).toBeGreaterThanOrEqual(4);

    for (const faq of URDU_GUIDE_CONTENT.faqs) {
      expect(faq.q).toBeTruthy();
      expect(faq.a).toBeTruthy();
    }
    for (const faq of ENGLISH_GUIDE_CONTENT.faqs) {
      expect(faq.q).toBeTruthy();
      expect(faq.a).toBeTruthy();
    }
  });
});
