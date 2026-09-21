import { describe, expect, it } from "vitest";
import { PRODUCT_CAPABILITIES } from "./capabilities";

describe("product capability truth", () => {
  it("keeps unverified advanced capabilities out of the live set", () => {
    for (const id of ["khatm", "khatm-realtime", "recitation-assist", "tajweed", "ai-tutor"]) {
      expect(PRODUCT_CAPABILITIES.find((item) => item.id === id)?.status).not.toBe("live");
    }
  });

  it("retains every proven V1 learning surface as live", () => {
    for (const id of ["learning-v1", "listening", "explore", "salah", "tutor"]) {
      expect(PRODUCT_CAPABILITIES.find((item) => item.id === id)?.status).toBe("live");
    }
  });
});
