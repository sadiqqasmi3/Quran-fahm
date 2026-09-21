import type { MasteryDimension, RecallRating } from "@quran-feham/contracts";

export const SCHEDULER_VERSION = "qf-v2-interval-1" as const;

export interface SkillState {
  learningItemId: string;
  dimension: MasteryDimension;
  dueAt: string;
  intervalDays: number;
  ease: number;
  repetitions: number;
  lapses: number;
  lastReviewedAt: string | null;
  schedulerVersion: typeof SCHEDULER_VERSION;
}

export interface QueueItem extends SkillState {
  introduced: boolean;
}

export function createSkillState(
  learningItemId: string,
  dimension: MasteryDimension,
  now = new Date(),
): SkillState {
  return {
    learningItemId,
    dimension,
    dueAt: now.toISOString(),
    intervalDays: 0,
    ease: 2.3,
    repetitions: 0,
    lapses: 0,
    lastReviewedAt: null,
    schedulerVersion: SCHEDULER_VERSION,
  };
}

const DAY_MS = 86_400_000;

export function applyReview(
  previous: SkillState,
  rating: RecallRating,
  reviewedAt = new Date(),
): SkillState {
  let intervalDays = previous.intervalDays;
  let ease = previous.ease;
  const repetitions = previous.repetitions + 1;
  let lapses = previous.lapses;

  if (rating === "again") {
    intervalDays = 0.25;
    ease = Math.max(1.3, ease - 0.2);
    lapses += 1;
  } else if (rating === "hard") {
    intervalDays = Math.max(1, intervalDays === 0 ? 1 : intervalDays * 1.35);
    ease = Math.max(1.3, ease - 0.1);
  } else if (rating === "good") {
    intervalDays = intervalDays === 0 ? 1 : Math.max(2, intervalDays * ease);
  } else {
    intervalDays = intervalDays === 0 ? 3 : Math.max(4, intervalDays * (ease + 0.45));
    ease = Math.min(3.2, ease + 0.1);
  }

  const dueAt = new Date(reviewedAt.getTime() + intervalDays * DAY_MS);
  return {
    ...previous,
    dueAt: dueAt.toISOString(),
    intervalDays: Number(intervalDays.toFixed(2)),
    ease: Number(ease.toFixed(2)),
    repetitions,
    lapses,
    lastReviewedAt: reviewedAt.toISOString(),
    schedulerVersion: SCHEDULER_VERSION,
  };
}

export function buildReviewQueue(
  states: QueueItem[],
  now = new Date(),
  limit = 15,
  newItemLimit = 5,
): QueueItem[] {
  const nowMs = now.getTime();
  const due = states
    .filter((state) => state.introduced && Date.parse(state.dueAt) <= nowMs)
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
  const availableNew = states
    .filter((state) => !state.introduced)
    .slice(0, Math.min(newItemLimit, Math.max(0, limit - due.length)));
  return [...due, ...availableNew].slice(0, limit);
}

export function localCalendarDay(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}
