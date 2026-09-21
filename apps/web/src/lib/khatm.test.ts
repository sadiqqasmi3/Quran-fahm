import type { KhatmParaSlot } from "@quran-feham/contracts";
import { describe, expect, it } from "vitest";
import {
  buildInviteLink,
  extractInviteCode,
  groupSlotsByKhatm,
  isValidInviteCode,
  summarizeSlots,
} from "./khatm";

const inviteCode = "abcdefghijklmnopqrstuvwxyzABCDEF";
const joinCode = "QF7K2M9P";

function slot(
  khatmNumber: number,
  juzNumber: number,
  status: KhatmParaSlot["status"],
): KhatmParaSlot {
  return {
    id: `00000000-0000-4000-8000-${String(khatmNumber * 100 + juzNumber).padStart(12, "0")}`,
    khatmNumber,
    juzNumber,
    status,
    claimedByUserId: null,
    claimedAt: null,
    readingStartedAt: null,
    completedAt: null,
  };
}

describe("Khatm invitation helpers", () => {
  it("accepts raw codes and both supported invitation link forms", () => {
    expect(extractInviteCode(`  ${inviteCode}  `)).toBe(inviteCode);
    expect(extractInviteCode(`https://quranfeham.app/khatm?join=${inviteCode}`)).toBe(inviteCode);
    expect(extractInviteCode(`https://quranfeham.app/join/${inviteCode}`)).toBe(inviteCode);
    expect(isValidInviteCode(inviteCode)).toBe(true);
    expect(isValidInviteCode(joinCode)).toBe(true);
    expect(isValidInviteCode("short-code")).toBe(false);
  });

  it("builds an origin-safe Khatm invitation link", () => {
    expect(buildInviteLink("https://quranfeham.app/anything", inviteCode)).toBe(
      `https://quranfeham.app/join/${inviteCode}`,
    );
    expect(buildInviteLink("http://localhost:3000", inviteCode)).toBe(
      `https://fehmequran.org/join/${inviteCode}`,
    );
    expect(buildInviteLink("http://127.0.0.1:3000", inviteCode)).toBe(
      `https://fehmequran.org/join/${inviteCode}`,
    );
    expect(buildInviteLink("", inviteCode)).toBe(
      `https://fehmequran.org/join/${inviteCode}`,
    );
  });
});

describe("Khatm campaign helpers", () => {
  const slots = [
    slot(2, 2, "reading"),
    slot(1, 2, "completed"),
    slot(1, 1, "available"),
    slot(2, 1, "claimed"),
  ];

  it("summarizes real assignment states", () => {
    expect(summarizeSlots(slots)).toEqual({
      available: 1,
      claimed: 1,
      reading: 1,
      completed: 1,
      total: 4,
    });
  });

  it("groups and sorts slots into individual Khatms", () => {
    expect(
      [...groupSlotsByKhatm(slots).entries()].map(([number, values]) => [
        number,
        values.map((value) => value.juzNumber),
      ]),
    ).toEqual([
      [2, [1, 2]],
      [1, [1, 2]],
    ]);
  });
});
