import { MemoryRepository } from "@quran-feham/database";
import { describe, expect, it } from "vitest";
import { processDueKhatmReminders, startKhatmReminderWorker } from "./khatm-reminder-worker.js";
import { MemoryAuthMailer } from "./mailer.js";

describe("Khatm Reminder Worker", () => {
  it("processes due reminders, marks them as sent, and sends notifications", async () => {
    const repository = new MemoryRepository();
    const mailer = new MemoryAuthMailer();

    const user = await repository.createUser({
      email: "khatm-owner@quranfeham.app",
      displayName: "Khatm Owner",
      passwordHash: "dummy",
      locale: "en",
    });

    const room = await repository.createKhatmRoom({
      ownerUserId: user.id,
      name: "Family Ramadan Khatm",
      intention: "For family blessings",
      targetKhatms: 1,
      maxActiveParasPerMember: 2,
      inviteCode: "test-invite-code-family",
    });

    const pastDate = new Date("2026-09-21T08:00:00.000Z");
    const futureDate = new Date("2026-09-21T12:00:00.000Z");
    const testNow = new Date("2026-09-21T09:00:00.000Z");

    // 1 due reminder (scheduled in the past)
    const dueReminder = await repository.scheduleKhatmReminder({
      roomId: room.id,
      actorUserId: user.id,
      scheduledFor: pastDate,
      message: "Reminder: Please complete your assigned Para by tonight.",
    });

    // 1 future reminder
    const futureReminder = await repository.scheduleKhatmReminder({
      roomId: room.id,
      actorUserId: user.id,
      scheduledFor: futureDate,
      message: "Upcoming reminder for tomorrow.",
    });

    // Process reminders at testNow
    const result = await processDueKhatmReminders(repository, mailer, testNow);

    expect(result.processedCount).toBe(1);
    expect(result.reminderIds).toContain(dueReminder.id);

    // Verify due reminder status updated to SENT
    const updatedReminders = await repository.listKhatmReminders(room.id, user.id);
    const sentReminder = updatedReminders.find((r) => r.id === dueReminder.id);
    const pendingReminder = updatedReminders.find((r) => r.id === futureReminder.id);

    expect(sentReminder?.status).toBe("SENT");
    expect(sentReminder?.sentAt).toBeTruthy();
    expect(pendingReminder?.status).toBe("PENDING");
    expect(pendingReminder?.sentAt).toBeNull();

    // Verify notification was sent
    expect(mailer.notifications).toHaveLength(1);
    expect(mailer.notifications[0]?.email).toBe("khatm-owner@quranfeham.app");
    expect(mailer.notifications[0]?.subject).toContain("Family Ramadan Khatm");
    expect(mailer.notifications[0]?.body).toContain(
      "Reminder: Please complete your assigned Para by tonight.",
    );
    expect(mailer.notifications[0]?.html).toContain("Family Ramadan Khatm");
    expect(mailer.notifications[0]?.html).toContain("For family blessings");
    expect(mailer.notifications[0]?.html).toContain("QURAN FEHAM");
  });

  it("starts and cleanly stops without unhandled errors", () => {
    const repository = new MemoryRepository();
    const mailer = new MemoryAuthMailer();

    const stop = startKhatmReminderWorker({
      repository,
      mailer,
      intervalMs: 5000,
    });

    expect(typeof stop).toBe("function");
    stop(); // should tear down without error
  });
});
