import {
  type Ayah,
  type SourceAttribution,
  SURAH_AYAH_COUNTS,
  type SurahResponse,
  type SurahSummary,
} from "@quran-feham/contracts";
import { sha256Hex } from "@quran-feham/quran-content/checksum";
import { z } from "zod";

const BASE_URL = "https://api.alquran.cloud/v1";

const EditionSchema = z.object({
  identifier: z.string(),
  language: z.string().optional(),
  name: z.string().optional(),
  englishName: z.string().optional(),
  format: z.string().optional(),
  type: z.string().optional(),
});

const ProviderAyahSchema = z.object({
  number: z.number().int().positive(),
  numberInSurah: z.number().int().positive(),
  text: z.string(),
  audio: z.string().url().optional(),
});

const ProviderSurahSchema = z.object({
  number: z.number().int().min(1).max(114),
  name: z.string(),
  englishName: z.string(),
  englishNameTranslation: z.string(),
  revelationType: z.enum(["Meccan", "Medinan"]),
  numberOfAyahs: z.number().int().positive(),
  ayahs: z.array(ProviderAyahSchema).optional(),
  edition: EditionSchema.optional(),
});

const ProviderResponseSchema = z.object({
  code: z.number(),
  status: z.string(),
  data: z.unknown(),
});

const ProviderSearchSurahSchema = ProviderSurahSchema.pick({
  number: true,
  name: true,
  englishName: true,
  englishNameTranslation: true,
  revelationType: true,
});

const ProviderSearchMatchSchema = z.object({
  number: z.number().int().positive(),
  numberInSurah: z.number().int().positive(),
  text: z.string(),
  surah: ProviderSearchSurahSchema,
});

const ProviderSearchResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  matches: z.array(ProviderSearchMatchSchema),
});

type ProviderSurah = z.infer<typeof ProviderSurahSchema>;
type ParsedProviderSurah = ReturnType<typeof ProviderSurahSchema.safeParse>;

export interface QuranProviderOptions {
  baseUrl?: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
}

export class QuranProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "QuranProviderError";
  }
}

export interface QuranSearchMatch {
  globalNumber: number;
  ayahNumber: number;
  text: string;
  surah: SurahSummary;
}

export interface QuranSearchResponse {
  count: number;
  edition: string;
  matches: QuranSearchMatch[];
}

export class AlQuranCloudProvider {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetcher: typeof fetch;

  constructor(options: QuranProviderOptions = {}) {
    this.baseUrl = options.baseUrl ?? BASE_URL;
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.fetcher = options.fetcher ?? fetch;
  }

  private async request(path: string): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(`${this.baseUrl}${path}`, {
        headers: { accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new QuranProviderError("The Quran provider request failed", response.status);
      }
      const envelope = ProviderResponseSchema.parse(await response.json());
      if (envelope.code !== 200) {
        throw new QuranProviderError("The Quran provider returned an unsuccessful response");
      }
      return envelope.data;
    } catch (error) {
      if (error instanceof QuranProviderError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new QuranProviderError("The Quran provider timed out");
      }
      throw new QuranProviderError("The Quran provider response was invalid");
    } finally {
      clearTimeout(timeout);
    }
  }

  async listSurahs(): Promise<SurahSummary[]> {
    const rows = z.array(ProviderSurahSchema).parse(await this.request("/surah"));
    return rows.map(toSurahSummary);
  }

  async search(query: string, edition: string): Promise<QuranSearchResponse> {
    const term = query.trim();
    if (term.length < 2 || term.length > 100) {
      throw new RangeError("Search query must contain 2 to 100 characters");
    }
    const result = ProviderSearchResponseSchema.parse(
      await this.request(`/search/${encodeURIComponent(term)}/all/${encodeURIComponent(edition)}`),
    );
    return {
      count: result.count,
      edition,
      matches: result.matches.slice(0, 50).map((match) => ({
        globalNumber: match.number,
        ayahNumber: match.numberInSurah,
        text: match.text,
        surah: {
          number: match.surah.number,
          nameArabic: match.surah.name,
          nameEnglish: match.surah.englishName,
          nameTranslation: match.surah.englishNameTranslation,
          revelationType: match.surah.revelationType,
          ayahCount: SURAH_AYAH_COUNTS[match.surah.number - 1] ?? 1,
        },
      })),
    };
  }

  async getSurah(
    surahNumber: number,
    options: { translationEdition: string; recitationEdition: string },
  ): Promise<SurahResponse> {
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      throw new RangeError("Surah must be an integer from 1 to 114");
    }

    const [arabicResult, translationResult, recitationResult] = await Promise.allSettled([
      this.request(`/surah/${surahNumber}/quran-uthmani`),
      this.request(`/surah/${surahNumber}/${encodeURIComponent(options.translationEdition)}`),
      this.request(`/surah/${surahNumber}/${encodeURIComponent(options.recitationEdition)}`),
    ] as const);

    if (arabicResult.status === "rejected") {
      throw new QuranProviderError("Canonical Arabic could not be loaded");
    }

    const arabic = ProviderSurahSchema.parse(arabicResult.value);
    validateSurahCoordinates(arabic, surahNumber, "Arabic", true);
    const parsedTranslation =
      translationResult.status === "fulfilled"
        ? ProviderSurahSchema.safeParse(translationResult.value)
        : null;
    const parsedRecitation =
      recitationResult.status === "fulfilled"
        ? ProviderSurahSchema.safeParse(recitationResult.value)
        : null;
    const warnings: string[] = [];
    const translation = validateOptionalEdition(
      parsedTranslation,
      arabic,
      surahNumber,
      "translation",
      true,
      warnings,
    );
    const recitation = validateOptionalEdition(
      parsedRecitation,
      arabic,
      surahNumber,
      "recitation",
      false,
      warnings,
    );

    const translationByAyah = new Map(
      translation?.ayahs?.map((ayah) => [ayah.numberInSurah, ayah.text]),
    );
    const audioByAyah = new Map(recitation?.ayahs?.map((ayah) => [ayah.numberInSurah, ayah.audio]));
    const ayahs: Ayah[] = (arabic.ayahs ?? []).map((ayah) => {
      const normalized: Ayah = {
        surahNumber,
        ayahNumber: ayah.numberInSurah,
        globalNumber: ayah.number,
        arabic: ayah.text,
      };
      const translated = translationByAyah.get(ayah.numberInSurah);
      const audio = audioByAyah.get(ayah.numberInSurah);
      if (translated) normalized.translation = translated;
      if (audio) normalized.audioUrl = audio;
      return normalized;
    });

    const arabicHash = sha256Hex(JSON.stringify(arabic));
    const translationHash = translation ? sha256Hex(JSON.stringify(translation)) : null;
    const recitationHash = recitation ? sha256Hex(JSON.stringify(recitation)) : null;
    const runtimeFingerprint = sha256Hex(
      JSON.stringify({
        surahNumber,
        arabicHash,
        translationEdition: options.translationEdition,
        translationHash,
        recitationEdition: options.recitationEdition,
        recitationHash,
      }),
    );
    return {
      contentReleaseId: `runtime-alquran-cloud:${runtimeFingerprint.slice(0, 24)}`,
      surah: toSurahSummary(arabic),
      ayahs,
      arabicSource: sourceAttribution(arabic.edition, "quran-uthmani", arabicHash),
      ...(translation
        ? {
            translationSource: sourceAttribution(
              translation.edition,
              options.translationEdition,
              translationHash as string,
            ),
          }
        : {}),
      ...(recitation
        ? {
            recitationSource: sourceAttribution(
              recitation.edition,
              options.recitationEdition,
              recitationHash as string,
            ),
          }
        : {}),
      warnings,
    };
  }
}

function validateSurahCoordinates(
  surah: ProviderSurah,
  expectedSurahNumber: number,
  label: string,
  requireText: boolean,
): void {
  const ayahs = surah.ayahs;
  if (surah.number !== expectedSurahNumber || !ayahs || ayahs.length !== surah.numberOfAyahs) {
    throw new QuranProviderError(`${label} response did not match the requested surah`);
  }
  for (const [index, ayah] of ayahs.entries()) {
    if (ayah.numberInSurah !== index + 1 || (requireText && ayah.text.trim().length === 0)) {
      throw new QuranProviderError(`${label} response has incomplete ayah coordinates`);
    }
  }
}

function validateOptionalEdition(
  parsed: ParsedProviderSurah | null,
  arabic: ProviderSurah,
  expectedSurahNumber: number,
  label: "translation" | "recitation",
  requireText: boolean,
  warnings: string[],
): ProviderSurah | null {
  if (!parsed?.success) {
    warnings.push(`The selected ${label} is temporarily unavailable.`);
    return null;
  }
  try {
    validateSurahCoordinates(parsed.data, expectedSurahNumber, label, requireText);
    const arabicAyahs = arabic.ayahs ?? [];
    const candidateAyahs = parsed.data.ayahs ?? [];
    const aligned = candidateAyahs.every(
      (ayah, index) =>
        ayah.numberInSurah === arabicAyahs[index]?.numberInSurah &&
        ayah.number === arabicAyahs[index]?.number,
    );
    if (!aligned) throw new QuranProviderError(`${label} coordinates do not align with Arabic`);
    return parsed.data;
  } catch {
    warnings.push(`The selected ${label} failed coordinate validation and was omitted.`);
    return null;
  }
}

function toSurahSummary(surah: z.infer<typeof ProviderSurahSchema>): SurahSummary {
  return {
    number: surah.number,
    nameArabic: surah.name,
    nameEnglish: surah.englishName,
    nameTranslation: surah.englishNameTranslation,
    revelationType: surah.revelationType,
    ayahCount: surah.numberOfAyahs,
  };
}

function sourceAttribution(
  edition: z.infer<typeof EditionSchema> | undefined,
  fallbackEdition: string,
  sha256: string,
): SourceAttribution {
  return {
    sourceId: `alquran-cloud:${edition?.identifier ?? fallbackEdition}`,
    provider: "Al Quran Cloud",
    edition: edition?.englishName ?? edition?.name ?? edition?.identifier ?? fallbackEdition,
    upstreamVersion: "runtime response; immutable import pending",
    sha256,
    license: "See https://alquran.cloud/terms-and-conditions",
  };
}
