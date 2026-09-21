"use client";

import type {
  KhatmCampaignSummary,
  KhatmReminder,
  KhatmRoom,
  KhatmRoomMemberRole,
} from "@quran-feham/contracts";
import {
  Bell,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  KeyRound,
  LoaderCircle,
  Printer,
  RefreshCw,
  Repeat,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  UserMinus,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { ApiFailure } from "@/lib/api";
import {
  cancelKhatmReminder,
  listKhatmCampaigns,
  listKhatmReminders,
  removeKhatmMember,
  rotateKhatmInvitation,
  scheduleKhatmReminder,
  startNextKhatmCampaign,
  updateKhatmRoom,
} from "@/lib/khatm";
import { downloadKhatmReport, printKhatmSummary } from "@/lib/khatm-report";
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
} from "@/lib/native-notifications";

export type ManagementNotice = { tone: "success" | "error" | "info"; text: string };

interface RoomSettingsDraft {
  name: string;
  intention: string;
  targetKhatms: number;
  startDate: string;
  deadline: string;
  recurrence: KhatmRoom["recurrence"];
  autoRestartOnComplete: boolean;
  maxActiveParasPerMember: number;
  reminderCadence: KhatmRoom["reminderCadence"];
}

function dateInputValue(value: string | null): string {
  return value?.slice(0, 10) ?? "";
}

function draftFromRoom(room: KhatmRoom): RoomSettingsDraft {
  return {
    name: room.name,
    intention: room.intention ?? "",
    targetKhatms: room.targetKhatms,
    startDate: dateInputValue(room.startDate ?? room.activeCampaign.startDate ?? null),
    deadline: dateInputValue(room.deadline ?? room.activeCampaign.deadline ?? null),
    recurrence: room.recurrence,
    autoRestartOnComplete: room.autoRestartOnComplete ?? false,
    maxActiveParasPerMember: room.maxActiveParasPerMember,
    reminderCadence: room.reminderCadence,
  };
}

function failureMessage(error: unknown): string {
  return error instanceof ApiFailure ? error.message : "That change could not be saved. Try again.";
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function roleLabel(role: KhatmRoomMemberRole): string {
  return role === "owner" ? "Owner" : "Member";
}

function SectionHeading({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Settings2;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
        <Icon aria-hidden="true" size={20} />
      </span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
      </div>
    </div>
  );
}

export function KhatmRoomManagement({
  room,
  currentUserId,
  onRoomChange,
  onNotice,
}: {
  room: KhatmRoom;
  currentUserId: string;
  onRoomChange: (room: KhatmRoom) => void;
  onNotice: (notice: ManagementNotice) => void;
}) {
  const [draft, setDraft] = useState<RoomSettingsDraft>(() => draftFromRoom(room));
  const [settingsPending, setSettingsPending] = useState(false);
  const [rotateConfirm, setRotateConfirm] = useState(false);
  const [rotatePending, setRotatePending] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [memberPending, setMemberPending] = useState(false);
  const [campaigns, setCampaigns] = useState<KhatmCampaignSummary[]>(room.recentCampaigns ?? []);
  const [campaignPending, setCampaignPending] = useState(false);
  const [nextStartDate, setNextStartDate] = useState("");
  const [nextDeadline, setNextDeadline] = useState("");
  const [reminders, setReminders] = useState<KhatmReminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [reminderPending, setReminderPending] = useState(false);
  const [reminderAt, setReminderAt] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");

  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [notificationTesting, setNotificationTesting] = useState(false);

  useEffect(() => {
    setDraft(draftFromRoom(room));
    setCampaigns(room.recentCampaigns ?? []);
  }, [room]);

  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
  }, []);

  async function handleEnableNotifications() {
    const granted = await requestNotificationPermission();
    setNotificationPermission(getNotificationPermission());
    if (granted) {
      onNotice({
        tone: "success",
        text: "Device notifications enabled! You will receive native mobile and desktop alerts.",
      });
    } else {
      onNotice({
        tone: "info",
        text: "Notifications were not granted or are blocked by browser settings.",
      });
    }
  }

  async function handleTestNotification() {
    setNotificationTesting(true);
    try {
      const delivered = await sendTestNotification(room.name);
      if (delivered) {
        onNotice({
          tone: "success",
          text: "Test notification sent! Check your device notification tray or banner.",
        });
      } else {
        onNotice({
          tone: "info",
          text: "Notification triggered. If no banner appeared, check system permission settings.",
        });
      }
    } catch {
      onNotice({
        tone: "error",
        text: "Could not trigger notification. Please check browser permissions.",
      });
    } finally {
      setNotificationTesting(false);
    }
  }

  function handleDownloadCsv() {
    try {
      downloadKhatmReport(room);
      onNotice({ tone: "success", text: "Detailed CSV report downloaded." });
    } catch {
      onNotice({ tone: "error", text: "Could not download CSV report." });
    }
  }

  function handlePrintSummary() {
    try {
      printKhatmSummary(room);
    } catch {
      onNotice({ tone: "error", text: "Could not open printable summary." });
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsPending(true);
    try {
      const updated = await updateKhatmRoom(room.id, {
        name: draft.name.trim(),
        intention: draft.intention.trim() || null,
        targetKhatms: draft.targetKhatms,
        startDate: draft.startDate ? new Date(`${draft.startDate}T00:00:00`).toISOString() : null,
        deadline: draft.deadline ? new Date(`${draft.deadline}T23:59:59`).toISOString() : null,
        recurrence: draft.recurrence,
        autoRestartOnComplete: draft.autoRestartOnComplete,
        maxActiveParasPerMember: draft.maxActiveParasPerMember,
        reminderCadence: draft.reminderCadence,
      });
      onRoomChange(updated);
      onNotice({ tone: "success", text: "Room settings and cycle schedule saved." });
    } catch (error) {
      onNotice({ tone: "error", text: failureMessage(error) });
    } finally {
      setSettingsPending(false);
    }
  }

  async function rotateInvitation() {
    if (!rotateConfirm) {
      setRotateConfirm(true);
      return;
    }
    setRotatePending(true);
    try {
      const updated = await rotateKhatmInvitation(room.id);
      onRoomChange(updated);
      setRotateConfirm(false);
      onNotice({
        tone: "success",
        text: "A new invitation link and room code were created. The old ones no longer work.",
      });
    } catch (error) {
      onNotice({ tone: "error", text: failureMessage(error) });
    } finally {
      setRotatePending(false);
    }
  }

  async function removeMember(userId: string) {
    if (memberToRemove !== userId) {
      setMemberToRemove(userId);
      return;
    }
    setMemberPending(true);
    try {
      await removeKhatmMember(room.id, userId);
      setMemberToRemove(null);
      onNotice({
        tone: "success",
        text: "Member removed. Their unfinished Paras are available again.",
      });
      onRoomChange({
        ...room,
        members: room.members.filter((member) => member.userId !== userId),
        activeCampaign: {
          ...room.activeCampaign,
          slots: room.activeCampaign.slots.map((slot) =>
            slot.claimedByUserId === userId
              ? {
                  ...slot,
                  status: "available",
                  claimedByUserId: null,
                  claimedAt: null,
                  readingStartedAt: null,
                  completedAt: null,
                }
              : slot,
          ),
        },
      });
    } catch (error) {
      onNotice({ tone: "error", text: failureMessage(error) });
    } finally {
      setMemberPending(false);
    }
  }

  async function loadCampaigns() {
    setCampaignPending(true);
    try {
      setCampaigns(await listKhatmCampaigns(room.id));
    } catch (error) {
      onNotice({ tone: "error", text: failureMessage(error) });
    } finally {
      setCampaignPending(false);
    }
  }

  async function startNextCampaign() {
    setCampaignPending(true);
    const currentComplete = room.activeCampaign.slots.every((slot) => slot.status === "completed");
    try {
      const updated = await startNextKhatmCampaign(room.id, {
        cancelCurrent: !currentComplete,
        ...(nextStartDate ? { startDate: new Date(`${nextStartDate}T00:00:00`).toISOString() } : {}),
        ...(nextDeadline ? { deadline: new Date(`${nextDeadline}T23:59:59`).toISOString() } : {}),
      });
      onRoomChange(updated);
      setNextStartDate("");
      setNextDeadline("");
      onNotice({
        tone: "success",
        text: `Daurah #${updated.activeCampaign.number} (دورة #${updated.activeCampaign.number}) started with fresh Para assignments.`,
      });
      void loadCampaigns();
    } catch (error) {
      onNotice({ tone: "error", text: failureMessage(error) });
    } finally {
      setCampaignPending(false);
    }
  }

  async function loadReminders() {
    setRemindersLoading(true);
    try {
      setReminders(await listKhatmReminders(room.id));
    } catch (error) {
      onNotice({ tone: "error", text: failureMessage(error) });
    } finally {
      setRemindersLoading(false);
    }
  }

  async function createReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReminderPending(true);
    try {
      const reminder = await scheduleKhatmReminder(room.id, {
        scheduledFor: new Date(reminderAt).toISOString(),
        message: reminderMessage.trim(),
      });
      setReminders((current) => [...current, reminder]);
      setReminderAt("");
      setReminderMessage("");
      onNotice({ tone: "success", text: "Reminder added to the room schedule." });
    } catch (error) {
      onNotice({ tone: "error", text: failureMessage(error) });
    } finally {
      setReminderPending(false);
    }
  }

  async function cancelReminder(reminderId: string) {
    setReminderPending(true);
    try {
      const updated = await cancelKhatmReminder(room.id, reminderId);
      setReminders((current) =>
        current.map((reminder) => (reminder.id === updated.id ? updated : reminder)),
      );
      onNotice({ tone: "success", text: "Reminder cancelled." });
    } catch (error) {
      onNotice({ tone: "error", text: failureMessage(error) });
    } finally {
      setReminderPending(false);
    }
  }

  if (room.viewerRole !== "owner") return null;

  return (
    <details className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 sm:px-6 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
            <Settings2 aria-hidden="true" size={20} />
          </span>
          <div>
            <h2 className="font-semibold">Room & Daurah Management (إدارة الختمة والدورات)</h2>
            <p className="mt-0.5 text-xs text-muted">Owner controls, Daurah cycles, CSV reports & notifications</p>
          </div>
        </div>
        <ChevronDown aria-hidden="true" className="text-muted" size={20} />
      </summary>

      <div className="space-y-8 border-t border-line p-5 sm:p-6">
        {/* Section 1: Room & Daurah Cycle Settings */}
        <section aria-labelledby="room-settings-heading">
          <SectionHeading
            icon={Settings2}
            title="Daurah Cycle & Schedule Settings (جدول دورات الختمة والتكرار)"
            body="Set whether this Khatm runs as a one-time Daurah or recurring loop (weekly, 3-day, bi-weekly, or monthly), pick start and end dates, and configure continuous auto-restart."
          />
          <form onSubmit={saveSettings} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Room name
              <input
                required
                minLength={2}
                maxLength={100}
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-3 font-normal text-ink"
              />
            </label>

            <label className="text-sm font-semibold">
              Daurah Mode & Recurrence Cycle
              <select
                value={draft.recurrence}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    recurrence: event.target.value as KhatmRoom["recurrence"],
                  }))
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-3 font-normal text-ink"
              >
                <option value="none">One-time Daurah (دورة لمرة واحدة - لا تتكرر)</option>
                <option value="three_days">3-Day cycle (كل 3 أيام)</option>
                <option value="weekly">Weekly cycle (أسبوعية - مثلاً من الأحد إلى الأحد)</option>
                <option value="biweekly">Bi-weekly cycle (كل أسبوعين - 14 يوماً)</option>
                <option value="monthly">Monthly cycle (شهرية)</option>
              </select>
            </label>

            <label className="text-sm font-semibold">
              Start date
              <input
                type="date"
                value={draft.startDate}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, startDate: event.target.value }))
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-3 font-normal text-ink"
              />
            </label>

            <label className="text-sm font-semibold">
              Target date / End date (Deadline)
              <input
                type="date"
                value={draft.deadline}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, deadline: event.target.value }))
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-3 font-normal text-ink"
              />
            </label>

            {/* Continuous Loop Toggle */}
            <div className="rounded-xl border border-line bg-surface-soft/60 p-4 sm:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <label
                    htmlFor="auto-restart-toggle"
                    className="text-sm font-semibold text-ink flex items-center gap-2 cursor-pointer"
                  >
                    <Repeat size={16} className="text-accent" />
                    Continuous Loop / Repeat Mode (التكرار المستمر للدورات)
                  </label>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    When all 30 Paras are completed (or the cycle window ends), automatically close the current Daurah and immediately start the next cycle (Daurah #2, #3, ...) in repeated mode without losing any member history or requiring manual restart.
                  </p>
                </div>
                <input
                  id="auto-restart-toggle"
                  type="checkbox"
                  checked={draft.autoRestartOnComplete}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, autoRestartOnComplete: event.target.checked }))
                  }
                  className="mt-1 size-5 rounded border-line text-accent accent-accent cursor-pointer"
                />
              </div>
            </div>

            <label className="text-sm font-semibold sm:col-span-2">
              Intention / Isal-e-Sawab (نية الختمة وإيصال الثواب)
              <textarea
                rows={2}
                maxLength={300}
                value={draft.intention}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, intention: event.target.value }))
                }
                placeholder="e.g. Dedicated for parents / family barakah / deceased loved ones"
                className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-3 font-normal text-ink"
              />
            </label>

            <label className="text-sm font-semibold">
              Target Khatms per Daurah
              <select
                value={draft.targetKhatms}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, targetKhatms: Number(event.target.value) }))
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-3 font-normal text-ink"
              >
                {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>
                    {value} {value === 1 ? "Khatm (30 Paras)" : `Khatms (${value * 30} Paras)`}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold">
              Max active Paras per member
              <select
                value={draft.maxActiveParasPerMember}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    maxActiveParasPerMember: Number(event.target.value),
                  }))
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-3 font-normal text-ink"
              >
                {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>
                    {value} {value === 4 ? "Paras (Standard: up to 4)" : "Paras"}
                  </option>
                ))}
                <option value={30}>No limit (all 30 Paras)</option>
              </select>
            </label>

            <label className="text-sm font-semibold sm:col-span-2">
              Automated reminder cadence
              <select
                value={draft.reminderCadence}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    reminderCadence: event.target.value as KhatmRoom["reminderCadence"],
                  }))
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-3 font-normal text-ink"
              >
                <option value="none">No automatic preference</option>
                <option value="daily">Daily notification</option>
                <option value="deadline_3_days">Three days before deadline</option>
                <option value="deadline_1_day">One day before deadline</option>
              </select>
            </label>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={settingsPending || draft.name.trim().length < 2}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover disabled:opacity-55"
              >
                {settingsPending ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" size={18} />
                ) : (
                  <Save aria-hidden="true" size={18} />
                )}
                Save room & cycle settings
              </button>
            </div>
          </form>
        </section>

        {/* Section 2: Daurah Reports & Exports */}
        <section className="border-t border-line pt-8" aria-labelledby="reports-heading">
          <SectionHeading
            icon={FileSpreadsheet}
            title="Daurah Reports & Exports (تقارير الختمة)"
            body="Download full audit reports of reader assignments, completion times, and Para statuses across all 30 Paras, or print an executive summary."
          />
          <div className="mt-5 rounded-2xl border border-line bg-surface-soft/50 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-ink text-sm">
                  Daurah #{room.activeCampaign.number} (دورة #{room.activeCampaign.number}) Report
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {room.activeCampaign.slots.filter((s) => s.status === "completed").length} of{" "}
                  {room.activeCampaign.slots.length} Paras completed (
                  {Math.round(
                    (room.activeCampaign.slots.filter((s) => s.status === "completed").length /
                      Math.max(1, room.activeCampaign.slots.length)) *
                      100,
                  )}
                  %) · {room.members.length} members joined
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-action px-4 text-sm font-semibold text-on-action hover:bg-action-hover"
                >
                  <Download aria-hidden="true" size={17} />
                  Download CSV Report
                </button>
                <button
                  type="button"
                  onClick={handlePrintSummary}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface-soft"
                >
                  <Printer aria-hidden="true" size={17} />
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Device & Mobile Native Notifications */}
        <section className="border-t border-line pt-8" aria-labelledby="notifications-heading">
          <SectionHeading
            icon={BellRing}
            title="Device & Mobile Native Notifications (إشعارات الهاتف والمتصفح)"
            body="Trigger real device alerts (lock screen, status bar, banner) for assignments, reader milestones, and deadline reminders."
          />
          <div className="mt-5 rounded-2xl border border-line bg-surface-soft/50 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ink text-sm">Device Notification Status</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      notificationPermission === "granted"
                        ? "bg-success/15 text-success"
                        : notificationPermission === "denied"
                          ? "bg-danger/15 text-danger"
                          : "bg-warning/20 text-warning-text"
                    }`}
                  >
                    {notificationPermission === "granted"
                      ? "Active & Enabled"
                      : notificationPermission === "denied"
                        ? "Blocked in Browser"
                        : "Needs Permission"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted max-w-lg">
                  Real-time push alerts notify participants on Android, iOS (PWA), macOS, and Windows when a Para is claimed or completed, or when a Daurah cycle deadline is near.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {notificationPermission !== "granted" && (
                  <button
                    type="button"
                    onClick={() => void handleEnableNotifications()}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface-soft"
                  >
                    <Bell aria-hidden="true" size={17} />
                    Enable Notifications
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleTestNotification()}
                  disabled={notificationTesting}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-soft px-4 text-sm font-semibold text-accent hover:bg-accent/20 disabled:opacity-55"
                >
                  {notificationTesting ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" size={17} />
                  ) : (
                    <Sparkles aria-hidden="true" size={17} />
                  )}
                  Send Test Notification
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Daurāt / Cycle History & Advance */}
        <section className="border-t border-line pt-8" aria-labelledby="campaign-admin-heading">
          <SectionHeading
            icon={CheckCircle2}
            title="Daurāt / Quran Cycles (الدورات وسجل الختمات)"
            body="Start the next Daurah round for your family when ready, or review previous completed Khatm cycles."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <label className="text-sm font-semibold">
              Next start date <span className="font-normal text-muted">(optional)</span>
              <input
                type="date"
                value={nextStartDate}
                onChange={(event) => setNextStartDate(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface px-3 font-normal text-ink"
              />
            </label>
            <label className="text-sm font-semibold">
              Next target date / deadline <span className="font-normal text-muted">(optional)</span>
              <input
                type="date"
                value={nextDeadline}
                onChange={(event) => setNextDeadline(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface px-3 font-normal text-ink"
              />
            </label>
            <button
              type="button"
              onClick={() => void startNextCampaign()}
              disabled={campaignPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface-soft disabled:opacity-55"
            >
              {campaignPending ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" size={17} />
              ) : (
                <CheckCircle2 aria-hidden="true" size={17} />
              )}
              Start next Daurah (بدء دورة جديدة)
            </button>
          </div>
          {!room.activeCampaign.slots.every((slot) => slot.status === "completed") && (
            <p className="mt-3 text-xs leading-5 text-muted">
              Starting now will close the current incomplete Daurah as cancelled. Its history remains preserved.
            </p>
          )}
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Daurah history (سجل الدورات السابقة)</p>
            <button
              type="button"
              onClick={() => void loadCampaigns()}
              disabled={campaignPending}
              className="min-h-10 rounded-lg px-3 text-xs font-semibold text-accent hover:bg-accent-soft disabled:opacity-55"
            >
              Refresh history
            </button>
          </div>
          {campaigns.length > 0 ? (
            <ul className="mt-2 divide-y divide-line border-y border-line text-sm">
              {campaigns.map((campaign) => (
                <li key={campaign.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <span className="font-semibold">Daurah #{campaign.number} (دورة #{campaign.number})</span>
                    {campaign.startDate && (
                      <span className="ml-2 text-xs text-muted">
                        Started: {dateTimeFormatter.format(new Date(campaign.startDate))}
                      </span>
                    )}
                  </div>
                  <span className="text-muted text-xs">
                    {campaign.completedSlots}/{campaign.totalSlots} Paras · {campaign.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No earlier Daurah records yet.</p>
          )}
        </section>

        {/* Section 5: Invitation security */}
        <section
          className="border-t border-line pt-8"
          aria-labelledby="invitation-security-heading"
        >
          <SectionHeading
            icon={KeyRound}
            title="Invitation security"
            body="Replace both the private link and eight-character room code if either was shared too widely."
          />
          {rotateConfirm && (
            <p className="mt-4 rounded-xl border border-warning/40 bg-[#fff8e7] p-3 text-sm leading-6 text-[#694300]">
              Existing links and room codes will stop working. Current members remain in the room.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void rotateInvitation()}
              disabled={rotatePending}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface-soft disabled:opacity-55"
            >
              {rotatePending ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" size={17} />
              ) : (
                <RefreshCw aria-hidden="true" size={17} />
              )}
              {rotateConfirm ? "Confirm new invitation" : "Create new invitation"}
            </button>
            {rotateConfirm && (
              <button
                type="button"
                onClick={() => setRotateConfirm(false)}
                className="min-h-11 rounded-xl px-4 text-sm font-semibold text-muted hover:bg-surface-soft"
              >
                Keep current invitation
              </button>
            )}
          </div>
        </section>

        {/* Section 6: Members */}
        <section className="border-t border-line pt-8" aria-labelledby="member-admin-heading">
          <SectionHeading
            icon={UserMinus}
            title="Members"
            body="Removing a member releases their unfinished assignments. Completed Paras stay in the Daurah record."
          />
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {room.members.map((member) => (
              <li
                key={member.userId}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold">
                    {member.userId === currentUserId ? "You" : member.displayName || "Room member"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {roleLabel(member.role)} · {member.activeParaCount ?? 0} active{" "}
                    {(member.activeParaCount ?? 0) === 1 ? "Para" : "Paras"}
                  </p>
                </div>
                {member.role !== "owner" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void removeMember(member.userId)}
                      disabled={memberPending}
                      className="min-h-10 rounded-lg border border-line px-3 text-xs font-semibold text-danger hover:border-danger disabled:opacity-55"
                    >
                      {memberToRemove === member.userId ? "Confirm removal" : "Remove"}
                    </button>
                    {memberToRemove === member.userId && (
                      <button
                        type="button"
                        onClick={() => setMemberToRemove(null)}
                        className="min-h-10 rounded-lg px-3 text-xs font-semibold text-muted hover:bg-surface-soft"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Section 7: Reminder schedule */}
        <section className="border-t border-line pt-8" aria-labelledby="reminders-heading">
          <SectionHeading
            icon={CalendarClock}
            title="Reminder schedule"
            body="Keep a dated room reminder record for scheduled group notifications."
          />
          <form
            onSubmit={createReminder}
            className="mt-5 grid gap-3 sm:grid-cols-[minmax(12rem,0.65fr)_minmax(0,1fr)_auto] sm:items-end"
          >
            <label className="text-sm font-semibold">
              Date and time
              <input
                required
                type="datetime-local"
                value={reminderAt}
                onChange={(event) => setReminderAt(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface px-3 font-normal text-ink"
              />
            </label>
            <label className="text-sm font-semibold">
              Message
              <input
                required
                maxLength={280}
                value={reminderMessage}
                onChange={(event) => setReminderMessage(event.target.value)}
                placeholder="Please complete your chosen Para"
                className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface px-3 font-normal text-ink placeholder:text-muted/70"
              />
            </label>
            <button
              type="submit"
              disabled={reminderPending || !reminderAt || !reminderMessage.trim()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface-soft disabled:opacity-55"
            >
              {reminderPending ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" size={17} />
              ) : (
                <CalendarClock aria-hidden="true" size={17} />
              )}
              Schedule
            </button>
          </form>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Scheduled reminders</p>
            <button
              type="button"
              onClick={() => void loadReminders()}
              disabled={remindersLoading}
              className="min-h-10 rounded-lg px-3 text-xs font-semibold text-accent hover:bg-accent-soft disabled:opacity-55"
            >
              {remindersLoading ? "Loading…" : "Load reminders"}
            </button>
          </div>
          {reminders.length > 0 ? (
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {reminders.map((reminder) => (
                <li
                  key={reminder.id}
                  className="grid gap-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div>
                    <p className="font-semibold">{reminder.message}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {dateTimeFormatter.format(new Date(reminder.scheduledFor))} ·{" "}
                      {reminder.status}
                    </p>
                  </div>
                  {reminder.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => void cancelReminder(reminder.id)}
                      disabled={reminderPending}
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-danger hover:bg-danger/5 disabled:opacity-55"
                    >
                      <Trash2 aria-hidden="true" size={15} /> Cancel
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No reminder records loaded.</p>
          )}
        </section>
      </div>
    </details>
  );
}
