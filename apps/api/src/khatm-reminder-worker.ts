import type { QuranFehamRepository } from "@quran-feham/database";
import type { AuthMailer } from "./mailer.js";
import { renderKhatmReminderTemplate } from "./email-templates.js";

export interface ReminderWorkerOptions {
  repository: QuranFehamRepository;
  mailer?: AuthMailer;
  intervalMs?: number;
  now?: () => Date;
}

export interface ProcessRemindersResult {
  processedCount: number;
  reminderIds: string[];
}

/**
 * Checks for and dispatches all due Khatm reminders.
 */
export async function processDueKhatmReminders(
  repository: QuranFehamRepository,
  mailer?: AuthMailer,
  now: Date = new Date(),
): Promise<ProcessRemindersResult> {
  const dueReminders = await repository.findDueKhatmReminders(now);
  const reminderIds: string[] = [];

  for (const reminder of dueReminders) {
    try {
      await repository.markKhatmReminderSent(reminder.id, now);
      reminderIds.push(reminder.id);

      if (mailer?.sendNotification && reminder.createdByUserId) {
        const creator = await repository.findUserById(reminder.createdByUserId);
        if (creator?.email) {
          const room = await repository
            .findKhatmRoomForMember(reminder.roomId, reminder.createdByUserId)
            .catch(() => null);

          const rendered = renderKhatmReminderTemplate({
            roomName: room?.name ?? "Khatm Room",
            message: reminder.message,
            email: creator.email,
            daurahNumber: room?.activeCampaign?.number,
            intention: room?.intention,
            roomUrl: "https://fehmequran.org/khatm",
          });

          await mailer.sendNotification({
            email: creator.email,
            subject: rendered.subject,
            body: rendered.text,
            html: rendered.html,
          });
        }
      }
    } catch (error) {
      console.error(`Failed to process Khatm reminder ${reminder.id}:`, error);
    }
  }

  return {
    processedCount: reminderIds.length,
    reminderIds,
  };
}

/**
 * Starts a background interval worker that processes due Khatm reminders.
 * Returns a teardown function to stop the worker.
 */
export function startKhatmReminderWorker(options: ReminderWorkerOptions): () => void {
  const intervalMs = Math.max(5000, options.intervalMs ?? 60_000);
  const getNow = options.now ?? (() => new Date());

  let running = false;

  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await processDueKhatmReminders(options.repository, options.mailer, getNow());
    } catch (error) {
      console.error("Khatm reminder worker tick error:", error);
    } finally {
      running = false;
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
}
