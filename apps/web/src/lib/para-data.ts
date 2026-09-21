import { khatmJuzMetadata } from "@quran-feham/contracts";

export interface QuranReference {
  surah: number;
  ayah: number;
}

export interface ParaMetadata {
  number: number;
  nameArabic: string;
  nameLatin: string;
  start: QuranReference;
  end: QuranReference;
  startMushafPage: number;
  endMushafPage: number;
  totalMushafPages: number;
  pdfUrl: string;
}

export function getMushafPageRangeForPara(paraNumber: number): { startPage: number; endPage: number; totalPages: number } {
  if (paraNumber === 1) {
    return { startPage: 2, endPage: 22, totalPages: 21 };
  }
  if (paraNumber >= 2 && paraNumber <= 29) {
    const startPage = 23 + (paraNumber - 2) * 20;
    const endPage = startPage + 19;
    return { startPage, endPage, totalPages: 20 };
  }
  if (paraNumber === 30) {
    return { startPage: 583, endPage: 611, totalPages: 29 };
  }
  throw new RangeError(`Invalid Para number: ${paraNumber}`);
}

export function mushafParaPdfUrl(paraNumber: number): string {
  const padded = String(paraNumber).padStart(2, "0");
  return `/mushaf-15-lines/pdf/para-${padded}.pdf`;
}

export function mushafPageImageUrl(mushafPageNumber: number): string {
  const padded = String(mushafPageNumber).padStart(3, "0");
  return `/mushaf-15-lines/pages/page-${padded}.webp`;
}

export function paraMushafViewerHref(paraNumber: number, initialPage?: number): string {
  const query = new URLSearchParams({ para: String(paraNumber) });
  if (initialPage) query.set("page", String(initialPage));
  return `/mushaf?${query.toString()}`;
}

/**
 * Common South Asian Para names and standard 30-Juz boundaries.
 */
export const PARAS: readonly ParaMetadata[] = Array.from({ length: 30 }, (_, index) => {
  const juz = khatmJuzMetadata(index + 1);
  const { startPage, endPage, totalPages } = getMushafPageRangeForPara(juz.number);
  return {
    number: juz.number,
    nameArabic: juz.nameArabic,
    nameLatin: juz.nameTransliteration,
    start: { surah: juz.startSurahNumber, ayah: juz.startAyahNumber },
    end: { surah: juz.endSurahNumber, ayah: juz.endAyahNumber },
    startMushafPage: startPage,
    endMushafPage: endPage,
    totalMushafPages: totalPages,
    pdfUrl: mushafParaPdfUrl(juz.number),
  };
});

/** Local 15-line King Fahad Complex Mushaf. */
export const FIFTEEN_LINE_MUSHAF_URL = "/mushaf-15-lines/pdf/para-01.pdf";
export const EXTERNAL_FIFTEEN_LINE_MUSHAF_URL = FIFTEEN_LINE_MUSHAF_URL;

export function getPara(number: number): ParaMetadata {
  const para = PARAS[number - 1];
  if (!para || para.number !== number) throw new RangeError(`Unknown Para ${number}`);
  return para;
}

export function paraReaderHref(number: number): string {
  return khatmJuzMetadata(number).readerPath;
}

export function paraExternalReaderHref(number: number): string {
  return `https://quran.com/juz/${getPara(number).number}`;
}

export function formatReference(reference: QuranReference): string {
  return `${reference.surah}:${reference.ayah}`;
}

export function getParaForAyah(surahNumber: number, ayahNumber: number): ParaMetadata | undefined {
  return PARAS.find((para) => {
    const afterStart =
      surahNumber > para.start.surah ||
      (surahNumber === para.start.surah && ayahNumber >= para.start.ayah);
    const beforeEnd =
      surahNumber < para.end.surah ||
      (surahNumber === para.end.surah && ayahNumber <= para.end.ayah);
    return afterStart && beforeEnd;
  });
}

export function getParaStartingAt(surahNumber: number, ayahNumber: number): ParaMetadata | undefined {
  return PARAS.find(
    (para) => para.start.surah === surahNumber && para.start.ayah === ayahNumber,
  );
}
