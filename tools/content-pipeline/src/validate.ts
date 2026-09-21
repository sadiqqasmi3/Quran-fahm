import { readFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import {
  type ContentReleaseManifest,
  ContentReleaseManifestSchema,
} from "@quran-feham/quran-content";
import { contentReleaseSha256, sha256Hex } from "@quran-feham/quran-content/checksum";

export interface ValidationResult {
  manifest: ContentReleaseManifest;
  checkedAssets: number;
}

export async function validateManifestFile(manifestPath: string): Promise<ValidationResult> {
  const absoluteManifestPath = resolve(manifestPath);
  const releaseRoot = dirname(absoluteManifestPath);
  const raw = await readFile(absoluteManifestPath, "utf8");
  const manifest = ContentReleaseManifestSchema.parse(JSON.parse(raw));
  const knownSources = new Set(manifest.sources.map((source) => source.sourceId));

  const computedReleaseSha256 = contentReleaseSha256(
    manifest as unknown as Record<string, unknown>,
  );
  if (computedReleaseSha256 !== manifest.releaseSha256.toLowerCase()) {
    throw new Error(
      `Release checksum mismatch: expected ${manifest.releaseSha256.toLowerCase()}, computed ${computedReleaseSha256}`,
    );
  }

  for (const asset of manifest.assets) {
    const assetPath = resolve(releaseRoot, asset.path);
    if (assetPath !== releaseRoot && !assetPath.startsWith(`${releaseRoot}${sep}`)) {
      throw new Error(`Asset escapes the release directory: ${asset.path}`);
    }
    for (const sourceId of asset.sourceIds) {
      if (!knownSources.has(sourceId)) {
        throw new Error(`Asset ${asset.path} names unknown source ${sourceId}`);
      }
    }
    const bytes = await readFile(assetPath);
    if (bytes.byteLength !== asset.byteLength) {
      throw new Error(`Asset size mismatch: ${asset.path}`);
    }
    if (sha256Hex(bytes) !== asset.sha256.toLowerCase()) {
      throw new Error(`Asset checksum mismatch: ${asset.path}`);
    }
  }

  return { manifest, checkedAssets: manifest.assets.length };
}
