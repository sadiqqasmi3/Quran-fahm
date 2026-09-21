import { z } from "zod";

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/i);

export const ContentSourceSchema = z.object({
  sourceId: z.string().min(1),
  kind: z.enum([
    "canonical_arabic",
    "translation",
    "morphology",
    "recitation",
    "tafsir",
    "teaching_note",
    "mushaf_layout",
  ]),
  provider: z.string().min(1),
  edition: z.string().min(1),
  language: z.string().min(2).max(12).optional(),
  riwayah: z.string().optional(),
  orthography: z.string().optional(),
  ayahNumbering: z.string().optional(),
  upstreamVersion: z.string().min(1),
  upstreamCommit: z.string().optional(),
  sourceUrl: z.string().url(),
  retrievedAt: z.string().datetime(),
  sha256: Sha256Schema,
  licenseName: z.string().min(1),
  licenseUrl: z.string().url(),
  redistributionAllowed: z.boolean(),
  modificationAllowed: z.boolean(),
});
export type ContentSource = z.infer<typeof ContentSourceSchema>;

export const ContentAssetSchema = z.object({
  path: z.string().min(1),
  mediaType: z.string().min(1),
  byteLength: z.number().int().nonnegative(),
  sha256: Sha256Schema,
  sourceIds: z.array(z.string().min(1)).min(1),
});
export type ContentAsset = z.infer<typeof ContentAssetSchema>;

export const ContentReleaseManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    releaseId: z.string().regex(/^[a-z0-9][a-z0-9._-]+$/),
    status: z.enum(["draft", "validated", "reviewed", "published"]),
    createdAt: z.string().datetime(),
    publishedAt: z.string().datetime().optional(),
    supersedes: z.string().optional(),
    sources: z.array(ContentSourceSchema).min(1),
    assets: z.array(ContentAssetSchema).min(1),
    releaseSha256: Sha256Schema,
    reviewedBy: z.array(z.string().min(1)).default([]),
  })
  .superRefine((manifest, context) => {
    if (manifest.status === "published" && !manifest.publishedAt) {
      context.addIssue({
        code: "custom",
        path: ["publishedAt"],
        message: "Published releases require a publication time",
      });
    }
    if (manifest.status === "published" && manifest.reviewedBy.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["reviewedBy"],
        message: "Published releases require at least one reviewer",
      });
    }
  });
export type ContentReleaseManifest = z.infer<typeof ContentReleaseManifestSchema>;

export function ayahKey(surah: number, ayah: number): string {
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    throw new RangeError("Surah must be an integer from 1 to 114");
  }
  if (!Number.isInteger(ayah) || ayah < 1) {
    throw new RangeError("Ayah must be a positive integer");
  }
  return `${surah}:${ayah}`;
}

export function tokenKey(
  releaseId: string,
  surah: number,
  ayah: number,
  wordPosition: number,
): string {
  if (!Number.isInteger(wordPosition) || wordPosition < 1) {
    throw new RangeError("Word position must be a positive integer");
  }
  return `${releaseId}:${ayahKey(surah, ayah)}:${wordPosition}`;
}
