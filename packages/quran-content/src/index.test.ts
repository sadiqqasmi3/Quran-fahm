import { describe, expect, it } from "vitest";
import { ayahKey, ContentReleaseManifestSchema, tokenKey } from "./index.js";

describe("Quran content coordinates", () => {
  it("uses stable ayah and token positions", () => {
    expect(ayahKey(1, 7)).toBe("1:7");
    expect(tokenKey("2026.09-reviewed", 1, 7, 9)).toBe("2026.09-reviewed:1:7:9");
  });

  it("does not allow an unreviewed release to call itself published", () => {
    const result = ContentReleaseManifestSchema.safeParse({
      schemaVersion: 1,
      releaseId: "2026.09",
      status: "published",
      createdAt: new Date().toISOString(),
      sources: [],
      assets: [],
      releaseSha256: "0".repeat(64),
      reviewedBy: [],
    });
    expect(result.success).toBe(false);
  });
});
