import { describe, expect, it } from "vitest";
import {
  formatReference,
  getPara,
  getParaForAyah,
  getParaStartingAt,
  getPdfCoordinateForMushafPage,
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

  it("maps Mushaf page coordinates to the exact Para PDF and 1-based page index", () => {
    // Para 1: pages 2 to 22
    expect(getPdfCoordinateForMushafPage(2)).toEqual({
      paraNumber: 1,
      pdfPageNumber: 1,
      pdfUrl: "/mushaf-15-lines/pdf/para-01.pdf",
    });
    expect(getPdfCoordinateForMushafPage(22)).toEqual({
      paraNumber: 1,
      pdfPageNumber: 21,
      pdfUrl: "/mushaf-15-lines/pdf/para-01.pdf",
    });

    // Para 2: pages 23 to 42
    expect(getPdfCoordinateForMushafPage(23)).toEqual({
      paraNumber: 2,
      pdfPageNumber: 1,
      pdfUrl: "/mushaf-15-lines/pdf/para-02.pdf",
    });

    // Para 30: pages 583 to 611
    expect(getPdfCoordinateForMushafPage(611)).toEqual({
      paraNumber: 30,
      pdfPageNumber: 29,
      pdfUrl: "/mushaf-15-lines/pdf/para-30.pdf",
    });

    expect(() => getPdfCoordinateForMushafPage(1)).toThrow(RangeError);
    expect(() => getPdfCoordinateForMushafPage(612)).toThrow(RangeError);
  });
});
