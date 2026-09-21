import { describe, expect, it } from "vitest";
import {
  formatReference,
  getPara,
  getParaForAyah,
  getParaStartingAt,
  PARAS,
  paraExternalReaderHref,
  paraReaderHref,
} from "./para-data";

describe("Para metadata", () => {
  it("contains all 30 Paras in order", () => {
    expect(PARAS).toHaveLength(30);
    expect(PARAS.map((para) => para.number)).toEqual(
      Array.from({ length: 30 }, (_, index) => index + 1),
    );
  });

  it("keeps every boundary inside the Quran", () => {
    for (const para of PARAS) {
      expect(para.start.surah).toBeGreaterThanOrEqual(1);
      expect(para.start.surah).toBeLessThanOrEqual(114);
      expect(para.end.surah).toBeGreaterThanOrEqual(para.start.surah);
      expect(para.nameArabic).not.toHaveLength(0);
      expect(para.nameLatin).not.toHaveLength(0);
    }
  });

  it("builds exact in-app and external Juz reading links", () => {
    expect(paraReaderHref(17)).toBe("/quran?surah=21&ayah=1");
    expect(paraExternalReaderHref(30)).toBe("https://quran.com/juz/30");
    expect(formatReference(getPara(2).start)).toBe("2:142");
  });

  it("rejects an invalid Para number", () => {
    expect(() => getPara(0)).toThrow(RangeError);
    expect(() => getPara(31)).toThrow(RangeError);
  });

  it("finds the correct Para for any Ayah and detects exact Para boundaries", () => {
    expect(getParaForAyah(1, 1)?.number).toBe(1);
    expect(getParaForAyah(2, 141)?.number).toBe(1);
    expect(getParaForAyah(2, 142)?.number).toBe(2);
    expect(getParaForAyah(114, 6)?.number).toBe(30);

    expect(getParaStartingAt(1, 1)?.number).toBe(1);
    expect(getParaStartingAt(2, 142)?.number).toBe(2);
    expect(getParaStartingAt(2, 143)).toBeUndefined();
  });
});
