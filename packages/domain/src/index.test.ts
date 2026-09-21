import { describe, expect, it } from "vitest";
import { applyReview, buildReviewQueue, createSkillState, localCalendarDay } from "./index.js";

describe("learning domain", () => {
  it("keeps lapsed due items ahead of unseen material", () => {
    const now = new Date("2026-09-20T12:00:00.000Z");
    const due = {
      ...createSkillState("due", "meaning", now),
      introduced: true,
      dueAt: "2026-09-19T12:00:00.000Z",
    };
    const unseen = {
      ...createSkillState("new", "meaning", now),
      introduced: false,
    };
    expect(buildReviewQueue([unseen, due], now)[0]?.learningItemId).toBe("due");
  });

  it("moves a hard item beyond the current instant", () => {
    const now = new Date("2026-09-20T12:00:00.000Z");
    const next = applyReview(createSkillState("one", "visual", now), "hard", now);
    expect(Date.parse(next.dueAt)).toBeGreaterThan(now.getTime());
    expect(next.intervalDays).toBe(1);
  });

  it("uses the learner's local calendar day", () => {
    const instant = new Date("2026-09-20T20:30:00.000Z");
    expect(localCalendarDay(instant, "Asia/Karachi")).toBe("2026-09-21");
  });
});
