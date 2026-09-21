import { describe, expect, it } from "vitest";
import { AlQuranCloudProvider } from "./index.js";

const envelope = (data: unknown) =>
  new Response(JSON.stringify({ code: 200, status: "OK", data }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("Al Quran Cloud adapter", () => {
  it("normalizes Quran search results and caps the returned result set", async () => {
    const fetcher: typeof fetch = async (request) => {
      expect(String(request)).toContain("/search/%D8%B1%D8%AD%D9%85%D8%A9/all/quran-uthmani");
      return envelope({
        count: 1,
        matches: [
          {
            number: 1,
            numberInSurah: 1,
            text: "رَحْمَة",
            surah: {
              number: 1,
              name: "سُورَةُ ٱلْفَاتِحَةِ",
              englishName: "Al-Faatiha",
              englishNameTranslation: "The Opening",
              revelationType: "Meccan",
            },
          },
        ],
      });
    };
    const result = await new AlQuranCloudProvider({ fetcher }).search("رحمة", "quran-uthmani");
    expect(result).toEqual({
      count: 1,
      edition: "quran-uthmani",
      matches: [
        {
          globalNumber: 1,
          ayahNumber: 1,
          text: "رَحْمَة",
          surah: {
            number: 1,
            nameArabic: "سُورَةُ ٱلْفَاتِحَةِ",
            nameEnglish: "Al-Faatiha",
            nameTranslation: "The Opening",
            revelationType: "Meccan",
            ayahCount: 7,
          },
        },
      ],
    });
  });

  it("rejects an empty search before contacting the provider", async () => {
    const fetcher: typeof fetch = async () => {
      throw new Error("fetch should not run");
    };
    await expect(
      new AlQuranCloudProvider({ fetcher }).search(" ", "quran-uthmani"),
    ).rejects.toThrow("2 to 100 characters");
  });

  it("normalizes independent Arabic, translation, and audio editions", async () => {
    const fetcher: typeof fetch = async (request) => {
      const url = String(request);
      const base = {
        number: 1,
        name: "سُورَةُ ٱلْفَاتِحَةِ",
        englishName: "Al-Faatiha",
        englishNameTranslation: "The Opening",
        revelationType: "Meccan" as const,
        numberOfAyahs: 1,
      };
      if (url.includes("ur.jalandhry")) {
        return envelope({
          ...base,
          edition: { identifier: "ur.jalandhry", name: "Jalandhry" },
          ayahs: [{ number: 1, numberInSurah: 1, text: "شروع اللہ کے نام سے" }],
        });
      }
      if (url.includes("ar.alafasy")) {
        return envelope({
          ...base,
          edition: { identifier: "ar.alafasy", name: "Alafasy" },
          ayahs: [
            {
              number: 1,
              numberInSurah: 1,
              text: "",
              audio: "https://cdn.example.test/1.mp3",
            },
          ],
        });
      }
      return envelope({
        ...base,
        edition: { identifier: "quran-uthmani", name: "Uthmani" },
        ayahs: [{ number: 1, numberInSurah: 1, text: "بِسْمِ اللَّهِ" }],
      });
    };
    const provider = new AlQuranCloudProvider({ fetcher });
    const result = await provider.getSurah(1, {
      translationEdition: "ur.jalandhry",
      recitationEdition: "ar.alafasy",
    });
    expect(result.ayahs[0]).toMatchObject({
      arabic: "بِسْمِ اللَّهِ",
      translation: "شروع اللہ کے نام سے",
      audioUrl: "https://cdn.example.test/1.mp3",
    });
    expect(result.contentReleaseId).toContain("runtime-alquran-cloud");
  });

  it("omits an edition whose ayah coordinates do not align with Arabic", async () => {
    const fetcher: typeof fetch = async (request) => {
      const url = String(request);
      const base = {
        number: 1,
        name: "سُورَةُ ٱلْفَاتِحَةِ",
        englishName: "Al-Faatiha",
        englishNameTranslation: "The Opening",
        revelationType: "Meccan" as const,
        numberOfAyahs: 1,
      };
      if (url.includes("ur.jalandhry")) {
        return envelope({
          ...base,
          edition: { identifier: "ur.jalandhry" },
          ayahs: [{ number: 2, numberInSurah: 1, text: "غلط مقام" }],
        });
      }
      return envelope({
        ...base,
        edition: { identifier: url.includes("ar.alafasy") ? "ar.alafasy" : "quran-uthmani" },
        ayahs: [
          {
            number: 1,
            numberInSurah: 1,
            text: "بِسْمِ اللَّهِ",
            ...(url.includes("ar.alafasy") ? { audio: "https://cdn.example.test/1.mp3" } : {}),
          },
        ],
      });
    };
    const result = await new AlQuranCloudProvider({ fetcher }).getSurah(1, {
      translationEdition: "ur.jalandhry",
      recitationEdition: "ar.alafasy",
    });
    expect(result.translationSource).toBeUndefined();
    expect(result.ayahs[0]?.translation).toBeUndefined();
    expect(result.warnings).toContain(
      "The selected translation failed coordinate validation and was omitted.",
    );
  });
});
