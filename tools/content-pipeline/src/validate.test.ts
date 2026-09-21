import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { contentReleaseSha256, sha256Hex } from "@quran-feham/quran-content/checksum";
import { describe, expect, it } from "vitest";
import { validateManifestFile } from "./validate.js";

describe("content manifest validator", () => {
  it("checks every asset byte length and checksum", async () => {
    const directory = await mkdtemp(join(tmpdir(), "qf-content-"));
    const asset = new TextEncoder().encode("immutable Quran Feham test asset");
    await writeFile(join(directory, "surah-001.json"), asset);
    const sourceId = "test-source";
    const manifest = {
      schemaVersion: 1,
      releaseId: "test.release",
      status: "validated",
      createdAt: "2026-09-20T00:00:00.000Z",
      sources: [
        {
          sourceId,
          kind: "canonical_arabic",
          provider: "Test fixture",
          edition: "Fixture",
          upstreamVersion: "1",
          sourceUrl: "https://example.test/source",
          retrievedAt: "2026-09-20T00:00:00.000Z",
          sha256: "1".repeat(64),
          licenseName: "Test only",
          licenseUrl: "https://example.test/license",
          redistributionAllowed: false,
          modificationAllowed: false,
        },
      ],
      assets: [
        {
          path: "surah-001.json",
          mediaType: "application/json",
          byteLength: asset.byteLength,
          sha256: sha256Hex(asset),
          sourceIds: [sourceId],
        },
      ],
      releaseSha256: "0".repeat(64),
      reviewedBy: [],
    };
    manifest.releaseSha256 = contentReleaseSha256(manifest);
    const manifestPath = join(directory, "manifest.json");
    await writeFile(manifestPath, JSON.stringify(manifest));
    await expect(validateManifestFile(manifestPath)).resolves.toMatchObject({ checkedAssets: 1 });

    manifest.releaseSha256 = "2".repeat(64);
    await writeFile(manifestPath, JSON.stringify(manifest));
    await expect(validateManifestFile(manifestPath)).rejects.toThrow("Release checksum mismatch");
  });
});
