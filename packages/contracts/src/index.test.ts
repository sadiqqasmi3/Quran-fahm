import { describe, expect, it } from "vitest";
import {
  CreateKhatmRoomInputSchema,
  KhatmInviteCodeSchema,
  KhatmJoinCodeSchema,
  KhatmSlotParamsSchema,
  khatmJuzMetadata,
  PasswordSchema,
  ReviewBatchInputSchema,
} from "./index.js";

describe("shared contracts", () => {
  it("requires a production-strength password", () => {
    expect(PasswordSchema.safeParse("weak").success).toBe(false);
    expect(PasswordSchema.safeParse("TwelveChars9!").success).toBe(true);
  });

  it("rejects review batches without stable idempotency keys", () => {
    const result = ReviewBatchInputSchema.safeParse({
      events: [
        {
          idempotencyKey: "not-a-uuid",
          learningItemId: "fatihah:1:1",
          dimension: "meaning",
          rating: "good",
          occurredAt: new Date().toISOString(),
          contentReleaseId: "draft-v2",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("bounds Khatm creation and Para coordinates", () => {
    expect(
      CreateKhatmRoomInputSchema.safeParse({ name: "Family Khatm", targetKhatms: 10 }).success,
    ).toBe(true);
    expect(
      CreateKhatmRoomInputSchema.safeParse({ name: "Family Khatm", targetKhatms: 11 }).success,
    ).toBe(false);
    expect(KhatmInviteCodeSchema.safeParse("short-code").success).toBe(false);
    expect(KhatmJoinCodeSchema.parse("ab2cdefg")).toBe("AB2CDEFG");
    expect(KhatmJoinCodeSchema.safeParse("ROOM10IO").success).toBe(false);
    expect(
      KhatmSlotParamsSchema.safeParse({
        roomId: "00000000-0000-4000-8000-000000000001",
        campaignId: "00000000-0000-4000-8000-000000000002",
        khatmNumber: "1",
        juzNumber: "30",
      }).success,
    ).toBe(true);
  });

  it("provides complete Para boundaries and a supported reader deep link", () => {
    expect(khatmJuzMetadata(11)).toMatchObject({
      number: 11,
      startSurahNumber: 9,
      startAyahNumber: 93,
      endSurahNumber: 11,
      endAyahNumber: 5,
      readerPath: "/quran?surah=9&ayah=93",
    });
    expect(khatmJuzMetadata(30)).toMatchObject({ endSurahNumber: 114, endAyahNumber: 6 });
  });
});
