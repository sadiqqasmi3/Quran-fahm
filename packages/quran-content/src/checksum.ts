import { createHash } from "node:crypto";

export function sha256Hex(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

/**
 * Hashes the normalized release manifest while deliberately excluding the
 * self-referential `releaseSha256` field. Object keys are sorted recursively;
 * array order remains significant.
 */
export function contentReleaseSha256(manifest: Record<string, unknown>): string {
  const { releaseSha256: _declaredDigest, ...payload } = manifest;
  return sha256Hex(JSON.stringify(canonicalize(payload)));
}
