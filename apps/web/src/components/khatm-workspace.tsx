"use client";

import type { KhatmParaSlot, KhatmRoom, KhatmRoomSummary, User } from "@quran-feham/contracts";
import {
  BookOpenCheck,
  BookOpenText,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  ClipboardCheck,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Info,
  KeyRound,
  Link2,
  LoaderCircle,
  LogIn,
  MessageCircle,
  Plus,
  Printer,
  RefreshCw,
  Repeat,
  RotateCcw,
  Share2,
  ShieldCheck,
  UserPlus,
  UsersRound,
  WifiOff,
  X,
  ChevronDown,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { KhatmRoomManagement } from "@/components/khatm-room-management";
import { ApiFailure, getCurrentUser } from "@/lib/api";
import {
  buildInviteLink,
  createKhatmRoom,
  getKhatmRoom,
  groupSlotsByKhatm,
  isValidInviteCode,
  joinKhatmRoom,
  type KhatmSlotAction,
  listKhatmRooms,
  mutateKhatmSlot,
  summarizeSlots,
} from "@/lib/khatm";
import { downloadKhatmReport, printKhatmSummary } from "@/lib/khatm-report";
import { sendTestNotification } from "@/lib/native-notifications";
import {
  formatReference,
  getPara,
  mushafParaPdfUrl,
  paraExternalReaderHref,
  paraMushafViewerHref,
  paraReaderHref,
} from "@/lib/para-data";
import { Mushaf15Reader } from "./mushaf-15-reader";

type WorkspaceState = "checking" | "guest" | "offline" | "ready";
type FormMode = "create" | "join" | null;
type Notice = { tone: "success" | "error" | "info"; text: string };

const initialRoomDraft = {
  name: "",
  targetKhatms: 1,
  startDate: "",
  deadline: "",
  recurrence: "none" as "none" | "three_days" | "weekly" | "biweekly" | "monthly",
  autoRestartOnComplete: false,
  intention: "",
  maxActiveParasPerMember: 4,
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

function formatDate(value: string | null): string {
  if (!value) return "No deadline";
  return dateFormatter.format(new Date(value));
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiFailure) return error.message;
  return "That change could not be completed. Try again.";
}

function progressPercent(completed: number, total: number): number {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function GuestKhatm({ invitationWaiting }: { invitationWaiting: boolean }) {
  const next = invitationWaiting
    ? `${window.location.pathname}${window.location.search}`
    : "/khatm";

  return (
    <div className="mx-auto w-full max-w-[92rem] px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
      <header className="grid gap-6 border-b border-line pb-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-accent">Together · Khatm Rooms</p>
          <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Complete Quran together, with every Para accounted for.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">
            Create one family room, share its invitation on WhatsApp, and let each member choose and
            confirm their own Para.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
          >
            <LogIn aria-hidden="true" size={19} />
            {invitationWaiting ? "Sign in to join this room" : "Sign in to use Khatm Rooms"}
          </Link>
          <Link
            href={`/register?next=${encodeURIComponent(next)}`}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-surface px-5 font-semibold text-ink hover:bg-surface-soft"
          >
            Create an account
          </Link>
        </div>
      </header>

      {invitationWaiting && (
        <div className="mt-6 flex gap-3 rounded-2xl border border-warning/35 bg-[#fff8e7] p-5 text-[#694300]">
          <Link2 className="mt-0.5 shrink-0" aria-hidden="true" size={21} />
          <div>
            <p className="font-semibold">A Khatm invitation is waiting.</p>
            <p className="mt-1 leading-6">
              Sign in first; Quran Feham will bring you back here to join.
            </p>
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-10 xl:grid-cols-[0.78fr_1.22fr] xl:gap-16">
        <section aria-labelledby="guest-khatm-flow">
          <h2 id="guest-khatm-flow" className="text-2xl font-semibold tracking-[-0.025em]">
            One familiar family practice, clearly coordinated
          </h2>
          <ol className="mt-5 divide-y divide-line border-y border-line">
            {[
              [
                Share2,
                "Invite the family",
                "Share one private room link through WhatsApp or any app.",
              ],
              [
                ShieldCheck,
                "Choose without clashes",
                "A Para can be claimed by only one member at a time.",
              ],
              [
                BookOpenCheck,
                "Read and confirm",
                "The member marks their own Para as reading, then completed.",
              ],
            ].map(([Icon, title, body]) => {
              const ItemIcon = Icon as typeof Share2;
              return (
                <li key={String(title)} className="grid gap-3 py-5 sm:grid-cols-[2.75rem_1fr]">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                    <ItemIcon aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <h3 className="font-semibold">{String(title)}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{String(body)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="guest-board-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="guest-board-title" className="text-2xl font-semibold tracking-[-0.025em]">
                One Khatm · Paras 1–30
              </h2>
              <p className="mt-1 text-sm text-muted">A preview of the shared assignment sheet</p>
            </div>
            <span className="rounded-full bg-surface-soft px-3 py-1.5 text-xs font-semibold text-muted">
              Preview
            </span>
          </div>
          <ol
            className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-10 xl:grid-cols-6 2xl:grid-cols-10"
            aria-label="Preview of thirty Para assignment slots"
          >
            {Array.from({ length: 30 }, (_, index) => (
              <li
                key={index + 1}
                className="grid aspect-square min-h-12 place-items-center rounded-xl border border-line bg-surface text-sm font-semibold text-muted"
              >
                {index + 1}
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm leading-6 text-muted">
            Shared room data is private to signed-in members. Completion is a member confirmation,
            not an automated judgment of recitation.
          </p>
        </section>
      </div>
    </div>
  );
}

function OfflineKhatm({ retry }: { retry: () => void }) {
  return (
    <div className="mx-auto grid min-h-[65dvh] w-full max-w-3xl place-items-center px-4 py-12">
      <section className="w-full rounded-2xl border border-line bg-surface p-6 text-center sm:p-10">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-surface-soft text-muted">
          <WifiOff aria-hidden="true" size={23} />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.025em]">
          Shared rooms need a connection
        </h1>
        <p className="mx-auto mt-3 max-w-lg leading-7 text-muted">
          Quran reading and device-based learning can continue offline. Khatm assignments need the
          service so two family members cannot claim the same Para.
        </p>
        <button
          type="button"
          onClick={retry}
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
        >
          <RefreshCw aria-hidden="true" size={18} />
          Try again
        </button>
      </section>
    </div>
  );
}

function RoomSummaryButton({
  summary,
  active,
  onSelect,
}: {
  summary: KhatmRoomSummary;
  active: boolean;
  onSelect: () => void;
}) {
  const percent = progressPercent(summary.completedSlots, summary.totalSlots);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={`w-full rounded-xl border p-4 text-left ${
        active
          ? "border-accent bg-accent-soft"
          : "border-line bg-surface hover:border-accent hover:bg-surface-soft"
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate font-semibold text-ink">{summary.name}</span>
          <span className="mt-1 block text-xs text-muted">
            {summary.memberCount} {summary.memberCount === 1 ? "member" : "members"} · {percent}%
            complete
          </span>
        </span>
        <ChevronRight className="mt-0.5 shrink-0 text-muted" aria-hidden="true" size={18} />
      </span>
      <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </span>
    </button>
  );
}

function RoomForms({
  mode,
  inviteInput,
  onInviteInput,
  onClose,
  onCreate,
  onJoin,
  pending,
}: {
  mode: Exclude<FormMode, null>;
  inviteInput: string;
  onInviteInput: (value: string) => void;
  onClose: () => void;
  onCreate: (input: typeof initialRoomDraft) => Promise<void>;
  onJoin: () => Promise<void>;
  pending: boolean;
}) {
  const [draft, setDraft] = useState(initialRoomDraft);

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onCreate(draft);
  }

  async function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onJoin();
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {mode === "create" ? "Create a room" : "Join a room"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-lg px-3 text-sm font-semibold text-muted hover:bg-surface-soft hover:text-ink"
        >
          Close
        </button>
      </div>

      {mode === "join" ? (
        <form onSubmit={submitJoin} className="mt-4 space-y-4" noValidate>
          <div className="rounded-xl bg-surface-soft p-4">
            <p className="text-sm font-semibold text-ink">How to join</p>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-muted">
              <li className="flex gap-2">
                <span className="font-semibold text-accent">1.</span>
                Open the private link sent by the room owner, or copy its room code.
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-accent">2.</span>
                Sign in, paste the link or code below, then select Join room.
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-accent">3.</span>
                Choose an available Para and begin reading from its exact starting ayah.
              </li>
            </ol>
          </div>
          <div>
            <label htmlFor="khatm-invitation" className="mb-2 block text-sm font-semibold">
              Private room link or room code
            </label>
            <textarea
              id="khatm-invitation"
              autoFocus
              rows={3}
              required
              value={inviteInput}
              onChange={(event) => onInviteInput(event.target.value)}
              placeholder="Paste the shared link or 8-character room code (e.g. QF7K2M9P)"
              aria-invalid={inviteInput.length > 0 && !isValidInviteCode(inviteInput)}
              aria-describedby="khatm-invite-help"
              className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink placeholder:text-muted/70"
            />
            <p id="khatm-invite-help" className="mt-2 text-xs leading-5 text-muted">
              Enter the 8-character room code (like{" "}
              <code className="rounded bg-surface-soft px-1.5 py-0.5 font-mono font-semibold text-ink">
                QF7K2M9P
              </code>
              ) or the full private link.
            </p>
          </div>
          <button
            type="submit"
            disabled={pending || !isValidInviteCode(inviteInput)}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-action px-4 font-semibold text-on-action hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-55"
          >
            {pending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" size={18} />
            ) : (
              <UserPlus aria-hidden="true" size={18} />
            )}
            Join room
          </button>
        </form>
      ) : (
        <form onSubmit={submitCreate} className="mt-4 space-y-4">
          <div>
            <label htmlFor="khatm-name" className="mb-2 block text-sm font-semibold">
              Room name
            </label>
            <input
              id="khatm-name"
              autoFocus
              required
              minLength={2}
              maxLength={100}
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Qasmi Family Khatm"
              className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-ink placeholder:text-muted/70"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <label htmlFor="khatm-target" className="mb-2 block text-sm font-semibold">
                Number of Khatms
              </label>
              <select
                id="khatm-target"
                value={draft.targetKhatms}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    targetKhatms: Number(event.target.value),
                  }))
                }
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-ink"
              >
                {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="khatm-max-active" className="mb-2 block text-sm font-semibold">
                Active Paras limit per person
              </label>
              <select
                id="khatm-max-active"
                value={draft.maxActiveParasPerMember}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    maxActiveParasPerMember: Number(event.target.value),
                  }))
                }
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-ink"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((count) => (
                  <option key={count} value={count}>
                    {count} {count === 4 ? "Paras (Default: up to 4)" : "Paras"}
                  </option>
                ))}
                <option value={30}>No limit (all 30 Paras)</option>
              </select>
            </div>
            <div>
              <label htmlFor="khatm-start-date" className="mb-2 block text-sm font-semibold">
                Start date <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="khatm-start-date"
                type="date"
                value={draft.startDate}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, startDate: event.target.value }))
                }
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-ink"
              />
            </div>
            <div>
              <label htmlFor="khatm-deadline" className="mb-2 block text-sm font-semibold">
                Target date (Deadline) <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="khatm-deadline"
                type="date"
                value={draft.deadline}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, deadline: event.target.value }))
                }
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-ink"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor="khatm-recurrence" className="mb-2 block text-sm font-semibold">
                Daurah Mode & Cycle
              </label>
              <select
                id="khatm-recurrence"
                value={draft.recurrence}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    recurrence: event.target.value as typeof draft.recurrence,
                  }))
                }
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-ink"
              >
                <option value="none">One-time Daurah (دورة لمرة واحدة)</option>
                <option value="three_days">3-Day cycle (كل 3 أيام)</option>
                <option value="weekly">Weekly cycle (أسبوعية - مثلاً من الأحد إلى الأحد)</option>
                <option value="biweekly">Bi-weekly cycle (كل أسبوعين - 14 يوماً)</option>
                <option value="monthly">Monthly cycle (شهرية)</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-1 rounded-xl border border-line bg-surface-soft/60 p-3 flex items-start justify-between gap-3">
              <div>
                <label
                  htmlFor="khatm-loop-toggle"
                  className="text-xs font-semibold text-ink flex items-center gap-1.5 cursor-pointer"
                >
                  <Repeat size={14} className="text-accent" />
                  Continuous Loop / Repeat Mode (التكرار المستمر للدورات)
                </label>
                <p className="mt-0.5 text-[11px] text-muted leading-relaxed">
                  Automatically start next Daurah when all 30 Paras are completed.
                </p>
              </div>
              <input
                id="khatm-loop-toggle"
                type="checkbox"
                checked={draft.autoRestartOnComplete}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, autoRestartOnComplete: event.target.checked }))
                }
                className="mt-0.5 size-4 rounded border-line text-accent accent-accent cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label htmlFor="khatm-intention" className="mb-2 block text-sm font-semibold">
              Intention / Isal-e-Sawab <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="khatm-intention"
              rows={3}
              maxLength={300}
              value={draft.intention}
              onChange={(event) =>
                setDraft((current) => ({ ...current, intention: event.target.value }))
              }
              placeholder="For our late grandfather"
              className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-ink placeholder:text-muted/70"
            />
            <p className="mt-2 text-xs leading-5 text-muted">
              This records the family’s stated intention; Quran Feham does not make a theological
              claim about reward.
            </p>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-action px-4 font-semibold text-on-action hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-55"
          >
            {pending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" size={18} />
            ) : (
              <Plus aria-hidden="true" size={18} />
            )}
            Create room
          </button>
        </form>
      )}
    </div>
  );
}

function StatusLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted" aria-label="Para status key">
      {[
        ["bg-surface border-line", "Available"],
        ["bg-[#fff8e7] border-warning/50", "Claimed"],
        ["bg-accent-soft border-accent", "Reading"],
        ["bg-accent border-accent", "Completed"],
      ].map(([classes, label]) => (
        <li key={label} className="flex items-center gap-2">
          <span className={`size-3 rounded-sm border ${classes}`} aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}

function ParaAssignmentRow({
  slot,
  userId,
  selected,
  claimantName,
  onSelect,
  mobileDetail,
}: {
  slot: KhatmParaSlot;
  userId: string;
  selected: boolean;
  claimantName: string | null;
  onSelect: () => void;
  mobileDetail?: ReactNode;
}) {
  const own = slot.claimedByUserId === userId;
  const para = getPara(slot.juzNumber);
  const statusLabel =
    slot.status === "available"
      ? "Available"
      : own
        ? slot.status === "completed"
          ? "Completed by you"
          : slot.status === "reading"
            ? "You are reading"
            : "Chosen by you"
        : slot.status === "completed"
          ? claimantName
            ? `Completed by ${claimantName}`
            : "Completed"
          : claimantName
            ? `With ${claimantName}`
            : "With a room member";
  const statusClass =
    slot.status === "completed"
      ? "bg-accent text-on-action"
      : slot.status === "reading"
        ? "bg-accent-soft text-accent"
        : slot.status === "claimed"
          ? "bg-[#fff3cf] text-[#694300]"
          : "bg-surface-soft text-muted";

  return (
    <li className={`border-b border-line last:border-b-0 ${selected ? "bg-surface-soft/70" : ""}`}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Para ${slot.juzNumber}, ${statusLabel}`}
        className="group grid min-h-[5rem] w-full grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 px-2 py-3 text-left sm:grid-cols-[3rem_minmax(0,1fr)_auto_auto] sm:px-3"
      >
        <span
          className={`relative grid size-11 place-items-center rounded-xl border text-sm font-semibold ${
            slot.status === "completed"
              ? "border-accent bg-accent text-on-action"
              : selected
                ? "border-accent bg-surface text-accent"
                : "border-line bg-surface text-ink"
          }`}
        >
          {slot.juzNumber}
          {slot.status === "completed" && (
            <Check
              className="absolute -right-1 -top-1 rounded-full bg-surface text-accent"
              aria-hidden="true"
              size={16}
              strokeWidth={3}
            />
          )}
        </span>
        <span className="min-w-0">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="truncate font-semibold text-ink">{para.nameLatin}</span>
            <span className="font-quran shrink-0 text-lg text-ink" lang="ar" dir="rtl">
              {para.nameArabic}
            </span>
          </span>
          <span className="mt-1 block text-xs text-muted">
            Para {para.number} · {formatReference(para.start)}–{formatReference(para.end)}
          </span>
        </span>
        <span
          className={`hidden max-w-[11rem] truncate rounded-full px-2.5 py-1 text-xs font-semibold sm:block ${statusClass}`}
        >
          {statusLabel}
        </span>
        <span className="flex items-center gap-2">
          <span
            className={`max-w-[7rem] truncate rounded-full px-2.5 py-1 text-xs font-semibold sm:hidden ${statusClass}`}
          >
            {own && slot.status !== "completed"
              ? "Yours"
              : slot.status === "available"
                ? "Open"
                : slot.status === "completed"
                  ? "Done"
                  : "Taken"}
          </span>
          <ChevronRight
            className={`shrink-0 text-muted ${selected ? "rotate-90 text-accent xl:rotate-0" : ""}`}
            aria-hidden="true"
            size={18}
          />
        </span>
      </button>
      {selected && mobileDetail ? <div className="px-2 pb-4 xl:hidden">{mobileDetail}</div> : null}
    </li>
  );
}

function SelectedPara({
  slot,
  user,
  claimantName,
  pending,
  onAction,
  onOpenMushaf,
}: {
  slot: KhatmParaSlot;
  user: User;
  claimantName: string | null;
  pending: boolean;
  onAction: (action: KhatmSlotAction) => Promise<boolean>;
  onOpenMushaf?: ((paraNumber: number) => void) | undefined;
}) {
  const own = slot.claimedByUserId === user.id;
  const para = getPara(slot.juzNumber);

  async function startReading(destination: string) {
    if (slot.status === "claimed") {
      const updated = await onAction("reading");
      if (!updated) return;
    }
    window.location.assign(destination);
  }

  const readingActions = own && (slot.status === "claimed" || slot.status === "reading");

  return (
    <section
      aria-labelledby="selected-para-title"
      className="rounded-2xl border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(31,45,37,0.06)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Para {para.number}</p>
          <h3 id="selected-para-title" className="mt-1 text-xl font-semibold">
            {para.nameLatin}
          </h3>
          <p className="font-quran mt-1 text-2xl leading-relaxed text-ink" lang="ar" dir="rtl">
            {para.nameArabic}
          </p>
        </div>
        <span className="rounded-full bg-surface-soft px-3 py-1.5 text-xs font-semibold text-muted">
          {slot.status === "available"
            ? "Available"
            : own
              ? slot.status === "completed"
                ? "Completed by you"
                : "Your Para"
              : slot.status === "completed"
                ? "Completed"
                : "Assigned"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-surface-soft p-3 text-sm">
        <div>
          <p className="text-xs text-muted">Begins</p>
          <p className="mt-1 font-semibold">Ayah {formatReference(para.start)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Ends</p>
          <p className="mt-1 font-semibold">Ayah {formatReference(para.end)}</p>
        </div>
      </div>

      {slot.status === "available" && (
        <div className="mt-4">
          <p className="text-sm leading-6 text-muted">
            No one has chosen this Para yet. You can claim it and start reading immediately in the
            15-line Digital Mushaf or Study Reader.
          </p>
          <div className="mt-4 space-y-2.5">
            <button
              type="button"
              onClick={async () => {
                const claimed = await onAction("claim");
                if (claimed) {
                  await onAction("reading");
                  if (onOpenMushaf) {
                    onOpenMushaf(para.number);
                  } else {
                    window.location.assign(paraMushafViewerHref(para.number));
                  }
                }
              }}
              disabled={pending}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action shadow-sm hover:bg-action-hover disabled:opacity-55"
            >
              {pending ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" size={18} />
              ) : (
                <BookOpenCheck aria-hidden="true" size={18} />
              )}
              Claim & Open 15-Line Mushaf
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={async () => {
                  const claimed = await onAction("claim");
                  if (claimed) {
                    await startReading(paraReaderHref(slot.juzNumber));
                  }
                }}
                disabled={pending}
                className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink hover:bg-surface-soft disabled:opacity-55"
              >
                <BookOpenText aria-hidden="true" size={15} />
                <span>Translation Reader</span>
              </button>
              <button
                type="button"
                onClick={() => onAction("claim")}
                disabled={pending}
                className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-muted hover:bg-surface-soft hover:text-ink disabled:opacity-55"
              >
                <Clipboard aria-hidden="true" size={15} />
                <span>Claim only</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {!own && slot.status !== "available" && (
        <p className="mt-4 text-sm leading-6 text-muted">
          {slot.status === "completed" ? "Completed" : "This Para is being read"}
          {claimantName ? ` by ${claimantName}` : " by another room member"}.
        </p>
      )}

      {readingActions && (
        <div className="mt-5 space-y-4">
          <p className="text-sm leading-6 text-muted">
            {slot.status === "claimed"
              ? `Choose how you would like to read Para ${slot.juzNumber}. Starting marks this Para as in-progress:`
              : `Continue reading Para ${slot.juzNumber} using either format below:`}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                if (slot.status === "claimed") void onAction("reading");
                if (onOpenMushaf) {
                  onOpenMushaf(para.number);
                } else {
                  window.location.assign(paraMushafViewerHref(para.number));
                }
              }}
              className="flex min-h-[4.75rem] flex-col justify-center rounded-xl bg-action px-4 py-3 text-left font-semibold text-on-action shadow-sm transition hover:bg-action-hover"
            >
              <span className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <BookOpenCheck aria-hidden="true" size={18} />
                  <span>Open 15-Line Mushaf</span>
                </span>
                <span className="rounded-md bg-white/20 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider text-white">
                  Page {para.startMushafPage}
                </span>
              </span>
              <span className="mt-1 text-xs font-normal text-on-action/85">
                Traditional Indo-Pak print · Pages {para.startMushafPage}–{para.endMushafPage}
              </span>
            </button>

            <button
              type="button"
              onClick={() => void startReading(paraReaderHref(slot.juzNumber))}
              disabled={pending}
              className="flex min-h-[4.75rem] flex-col justify-center rounded-xl border border-line bg-surface px-4 py-3 text-left font-semibold text-ink transition hover:bg-surface-soft disabled:opacity-55"
            >
              <span className="flex items-center gap-2 text-sm text-ink">
                <BookOpenText aria-hidden="true" size={18} />
                <span>Word-by-Word Translation Reader</span>
              </span>
              <span className="mt-1 text-xs font-normal text-muted">
                Urdu translation & audio recitation · Ayah {formatReference(para.start)}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/50 pt-2 text-xs">
            <a
              href={mushafParaPdfUrl(para.number)}
              download={`Para-${String(para.number).padStart(2, "0")}-${para.nameLatin}.pdf`}
              className="inline-flex items-center gap-1.5 text-muted hover:text-ink hover:underline"
            >
              <Download aria-hidden="true" size={13} />
              <span>
                Download Para {para.number} PDF ({para.totalMushafPages} pages)
              </span>
            </a>

            <button
              type="button"
              onClick={() => onAction("release")}
              disabled={pending}
              className="inline-flex items-center gap-1.5 font-medium text-danger hover:underline disabled:opacity-55"
            >
              <RotateCcw aria-hidden="true" size={14} />
              Release Para
            </button>
          </div>
        </div>
      )}

      {own && slot.status === "reading" && (
        <div className="mt-5 border-t border-line pt-5">
          <p className="text-sm leading-6 text-muted">
            Reached the end at {formatReference(para.end)}? Confirm completion yourself:
          </p>
          <button
            type="button"
            onClick={() => onAction("complete")}
            disabled={pending}
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent bg-accent-soft px-4 font-semibold text-accent hover:bg-surface-soft disabled:opacity-55"
          >
            <CheckCircle2 aria-hidden="true" size={18} />
            Mark Para {slot.juzNumber} as completed
          </button>
        </div>
      )}

      {own && slot.status === "completed" && (
        <div className="mt-5 space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-accent">
            <CheckCircle2 aria-hidden="true" size={18} />
            You confirmed Para {slot.juzNumber} ({para.nameArabic}) as completed. Alhamdu lillah.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href={paraReaderHref(slot.juzNumber)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-soft"
            >
              <BookOpenText aria-hidden="true" size={17} /> Read in Quran Feham
            </Link>
            <button
              type="button"
              onClick={() => {
                if (onOpenMushaf) {
                  onOpenMushaf(para.number);
                } else {
                  window.location.assign(paraMushafViewerHref(para.number));
                }
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-soft text-accent"
            >
              <BookOpenCheck aria-hidden="true" size={17} /> 15-Line Mushaf (In-App)
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function RoomInfoModal({
  open,
  onClose,
  room,
  user,
  campaignSummary,
  percent,
  inviteLink,
  whatsappMessage,
  copyInvite,
  copyCode,
  shareInvite,
  memberAssignments,
}: {
  open: boolean;
  onClose: () => void;
  room: KhatmRoom;
  user: User;
  campaignSummary: {
    total: number;
    available: number;
    claimed: number;
    reading: number;
    completed: number;
  };
  percent: number;
  inviteLink: string;
  whatsappMessage: string;
  copyInvite: () => Promise<boolean>;
  copyCode: () => Promise<boolean>;
  shareInvite: () => Promise<void>;
  memberAssignments: Map<string, KhatmParaSlot[]>;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-info-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-line bg-surface shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
              <Info aria-hidden="true" size={20} />
            </span>
            <div>
              <h2 id="room-info-modal-title" className="text-base font-bold text-ink sm:text-lg">
                Room Details & Invitation
              </h2>
              <p className="text-xs text-muted">
                {room.viewerRole === "owner" ? "You own this room" : "You are a room member"} ·
                Daurah #{room.activeCampaign.number} (دورة #{room.activeCampaign.number})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-soft hover:text-ink transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Room Overview & Intention */}
          <div className="rounded-xl border border-line bg-surface-soft/60 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-bold tracking-tight text-ink">{room.name}</h3>
              <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
                {room.viewerRole === "owner" ? "Owner" : "Member"}
              </span>
            </div>
            {room.intention ? (
              <p className="mt-2 text-sm leading-6 text-muted">
                <span className="font-semibold text-ink">Intention / Isal-e-Sawab:</span>{" "}
                {room.intention}
              </p>
            ) : null}

            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-line/60 pt-3">
              <div>
                <dt className="text-xs font-semibold text-muted flex items-center gap-1.5">
                  <UsersRound size={14} /> Members
                </dt>
                <dd className="mt-0.5 text-sm font-bold text-ink">{room.members.length}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted flex items-center gap-1.5">
                  <CalendarDays size={14} /> Deadline
                </dt>
                <dd className="mt-0.5 text-xs font-semibold text-ink">
                  {formatDate(room.activeCampaign.deadline)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Completed
                </dt>
                <dd className="mt-0.5 text-sm font-bold text-ink">
                  {campaignSummary.completed} / {campaignSummary.total}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted flex items-center gap-1.5">
                  <BookOpenCheck size={14} /> Target
                </dt>
                <dd className="mt-0.5 text-xs font-semibold text-ink">
                  {room.targetKhatms} {room.targetKhatms === 1 ? "Khatm" : "Khatms"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 pt-3 border-t border-line/60">
              <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                <span>Overall Daurah progress (تقدم الدورة)</span>
                <span className="font-bold text-accent">{percent}%</span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-line"
                role="progressbar"
                aria-label="Daurah progress"
                aria-valuenow={percent}
              >
                <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span>
                  <strong className="text-ink">{campaignSummary.available}</strong> available
                </span>
                <span>
                  <strong className="text-ink">{campaignSummary.claimed}</strong> chosen
                </span>
                <span>
                  <strong className="text-ink">{campaignSummary.reading}</strong> reading
                </span>
                <span>
                  <strong className="text-ink">{campaignSummary.completed}</strong> completed
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions: Reports & Notifications */}
          <div className="rounded-xl border border-line bg-surface p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <FileSpreadsheet size={15} className="text-accent" /> Daurah Reports & Alerts
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                Download Para status audit or trigger a test notification.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadKhatmReport(room)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold hover:bg-surface-soft"
              >
                <Download size={14} /> CSV Report
              </button>
              <button
                type="button"
                onClick={() => printKhatmSummary(room)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold hover:bg-surface-soft"
              >
                <Printer size={14} /> Print Summary
              </button>
              <button
                type="button"
                onClick={() => void sendTestNotification(room.name)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent-soft text-accent px-3 text-xs font-semibold hover:bg-accent/20"
              >
                <Bell size={14} /> Test Alert
              </button>
            </div>
          </div>

          {/* Invite Family & Friends */}
          <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-ink text-sm flex items-center gap-2">
                  <UserPlus size={16} className="text-accent" /> Invite Family & Friends
                </h4>
                <p className="mt-0.5 text-xs text-muted">
                  Share the link or code for family members to join and pick a Para.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#25D366]/15 text-[#128C7E] px-3 text-xs font-semibold hover:bg-[#25D366]/25"
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
                <button
                  type="button"
                  onClick={shareInvite}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-action text-on-action px-3 text-xs font-semibold hover:bg-action-hover"
                >
                  <Share2 size={15} /> Share
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label
                  htmlFor="modal-invite-link"
                  className="text-xs font-semibold text-muted flex items-center gap-1.5"
                >
                  <Link2 size={13} /> Private room link
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    id="modal-invite-link"
                    readOnly
                    value={inviteLink}
                    onFocus={(event) => event.currentTarget.select()}
                    className="min-h-10 flex-1 rounded-xl border border-line bg-surface-soft px-3 text-xs text-ink"
                  />
                  <button
                    type="button"
                    onClick={() => void copyInvite()}
                    className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-line px-3 text-xs font-semibold hover:bg-surface-soft"
                  >
                    <Copy size={14} /> Copy link
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="modal-invite-code"
                  className="text-xs font-semibold text-muted flex items-center gap-1.5"
                >
                  <KeyRound size={13} /> Room joining code
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    id="modal-invite-code"
                    readOnly
                    value={room.joinCode}
                    onFocus={(event) => event.currentTarget.select()}
                    className="min-h-10 flex-1 rounded-xl border border-line bg-surface-soft px-3 font-mono text-xs tracking-wider text-ink"
                  />
                  <button
                    type="button"
                    onClick={() => void copyCode()}
                    className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-line px-3 text-xs font-semibold hover:bg-surface-soft"
                  >
                    <ClipboardCheck size={14} /> Copy code
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-surface-soft p-3 text-xs text-muted space-y-1">
              <p className="font-semibold text-ink">How members join:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] leading-relaxed">
                <li>Open the invite link and sign in or create an account.</li>
                <li>
                  Tap <strong>Join room</strong> when prompted.
                </li>
                <li>
                  Choose any available Para (up to {room.maxActiveParasPerMember} active) and start
                  reading!
                </li>
              </ol>
            </div>
          </div>

          {/* How Shared Progress Updates */}
          <div className="rounded-xl border border-line bg-surface-soft/60 p-4 text-xs leading-5 text-muted">
            <p className="flex items-center gap-1.5 font-semibold text-ink">
              <Info size={14} className="text-accent" /> How shared progress updates
            </p>
            <p className="mt-1">
              The room refreshes automatically while open. Tap <strong>Refresh</strong> if
              coordinating in real-time.
            </p>
            <p className="mt-2">
              Completion is always confirmed by the reader. It is not inferred from microphone or
              recitation.
            </p>
          </div>

          {/* Members List */}
          <div className="rounded-xl border border-line bg-surface p-4">
            <h4 className="font-semibold text-ink text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UsersRound size={16} className="text-accent" /> Members & Roles
              </span>
              <span className="text-xs font-normal text-muted">{room.members.length} members</span>
            </h4>
            <ul className="mt-3 divide-y divide-line border-t border-line text-xs">
              {room.members.map((member) => {
                const assigned = memberAssignments.get(member.userId) ?? [];
                return (
                  <li
                    key={member.userId}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">
                        {member.userId === user.id ? "You" : member.displayName || "Room member"}
                      </span>
                      <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[10px] text-muted font-medium">
                        {member.role === "owner" ? "Owner" : "Member"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {assigned.length > 0 ? (
                        assigned.map((slot) => (
                          <span
                            key={slot.id}
                            className="rounded bg-surface-soft px-1.5 py-0.5 text-[10px] text-muted"
                          >
                            Para {slot.juzNumber} (
                            {slot.status === "completed"
                              ? "Done"
                              : slot.status === "reading"
                                ? "Reading"
                                : "Chosen"}
                            )
                          </span>
                        ))
                      ) : (
                        <span className="text-muted text-[10px]">No active Para</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-line px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-surface border border-line px-4 text-xs font-semibold hover:bg-surface-soft"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomDetail({
  room,
  user,
  selectedKhatm,
  onSelectKhatm,
  selectedJuz,
  onSelectJuz,
  mutationPending,
  refreshing,
  lastSyncedAt,
  onRefresh,
  onMutation,
  onRoomChange,
  onNotice,
  onOpenMushaf,
}: {
  room: KhatmRoom;
  user: User;
  selectedKhatm: number;
  onSelectKhatm: (number: number) => void;
  selectedJuz: number | null;
  onSelectJuz: (number: number) => void;
  mutationPending: boolean;
  refreshing: boolean;
  lastSyncedAt: Date | null;
  onRefresh: () => Promise<void>;
  onMutation: (slot: KhatmParaSlot, action: KhatmSlotAction) => Promise<boolean>;
  onRoomChange: (room: KhatmRoom) => void;
  onNotice: (notice: Notice) => void;
  onOpenMushaf?: ((paraNumber: number) => void) | undefined;
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  const grouped = useMemo(() => groupSlotsByKhatm(room.activeCampaign.slots), [room]);
  const campaignSummary = useMemo(() => summarizeSlots(room.activeCampaign.slots), [room]);
  const slots = grouped.get(selectedKhatm) ?? [];
  const selectedSlot = slots.find((slot) => slot.juzNumber === selectedJuz) ?? null;
  const names = new Map(
    room.members.map((member) => [
      member.userId,
      member.displayName || (member.userId === user.id ? "You" : "Room member"),
    ]),
  );
  const completedInKhatm = slots.filter((slot) => slot.status === "completed").length;
  const mySlots = slots.filter((slot) => slot.claimedByUserId === user.id);
  const percent = progressPercent(campaignSummary.completed, campaignSummary.total);
  const rawOrigin =
    process.env.NEXT_PUBLIC_APP_ORIGIN?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const inviteOrigin =
    !rawOrigin || rawOrigin.includes("localhost") || rawOrigin.includes("127.0.0.1")
      ? "https://fehmequran.org"
      : rawOrigin;
  const inviteLink = buildInviteLink(inviteOrigin, room.inviteCode ?? room.joinCode);
  const whatsappMessage = [
    "Assalamu alaikum,",
    `Please join “${room.name}” on Quran Feham for Khatm #${room.activeCampaign.number}.`,
    room.intention ? `Intention / Isal-e-Sawab: ${room.intention}` : "",
    `🔗 Tap this private link to join:\n${inviteLink}`,
    `🔑 Room Code: ${room.joinCode}`,
    "Once you join, select any available Para. You can read it directly in Quran Feham or open the 15-line Mushaf PDF.",
  ]
    .filter(Boolean)
    .join("\n\n");

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      onNotice({ tone: "success", text: successMessage });
      return true;
    } catch {
      onNotice({
        tone: "error",
        text: "Copy was blocked. Select the link or room code and copy it manually.",
      });
      return false;
    }
  }

  const copyInvite = () => copyText(inviteLink, "Private room link copied.");
  const copyCode = () => copyText(room.joinCode, "Room code copied.");

  async function shareInvite() {
    const shareData = {
      title: room.name,
      text: `Join ${room.name} on Quran Feham, enter room code ${room.joinCode}, and choose a Para to read.`,
      url: inviteLink,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyInvite();
  }

  const selectedClaimantName = selectedSlot?.claimedByUserId
    ? (names.get(selectedSlot.claimedByUserId) ?? null)
    : null;
  const memberAssignments = new Map(
    room.members.map((member) => [
      member.userId,
      room.activeCampaign.slots.filter((slot) => slot.claimedByUserId === member.userId),
    ]),
  );
  const selectedDetail = selectedSlot ? (
    <SelectedPara
      slot={selectedSlot}
      user={user}
      claimantName={selectedClaimantName}
      pending={mutationPending}
      onAction={(action) => onMutation(selectedSlot, action)}
      onOpenMushaf={onOpenMushaf}
    />
  ) : (
    <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-5">
      <BookOpenCheck className="text-muted" aria-hidden="true" size={22} />
      <p className="mt-3 font-semibold">Choose a Para</p>
      <p className="mt-1 text-sm leading-6 text-muted">
        Select any row to see its reader link, assignment status and available actions.
      </p>
    </div>
  );

  return (
    <article className="min-w-0">
      {/* Streamlined Compact Header */}
      <header className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
                {room.viewerRole === "owner" ? "Room owner" : "Room member"}
              </span>
              <span className="text-xs text-muted">Daurah #{room.activeCampaign.number} (دورة #{room.activeCampaign.number})</span>
              {room.activeCampaign.deadline && (
                <span className="hidden text-xs text-muted sm:inline">
                  · Due {formatDate(room.activeCampaign.deadline)}
                </span>
              )}
            </div>
            <h2 className="mt-1 truncate text-xl font-bold tracking-tight sm:text-2xl text-ink">
              {room.name}
            </h2>
            {room.intention && (
              <p className="mt-0.5 truncate text-xs text-muted" title={room.intention}>
                <span className="font-semibold text-ink">Intention:</span> {room.intention}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={shareInvite}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink hover:bg-surface-soft active:scale-95 transition-transform"
              title="Share room invitation"
            >
              <Share2 aria-hidden="true" size={15} />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink hover:bg-surface-soft active:scale-95 transition-transform"
              title="Room information, members and guide"
            >
              <Info aria-hidden="true" size={15} className="text-accent" />
              <span>Details & Info</span>
            </button>
            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={refreshing}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink hover:bg-surface-soft active:scale-95 transition-transform disabled:opacity-55"
              title={
                lastSyncedAt
                  ? `Last refreshed ${timeFormatter.format(lastSyncedAt)}`
                  : "Refresh assignments"
              }
            >
              <RefreshCw
                className={refreshing ? "animate-spin text-accent" : undefined}
                aria-hidden="true"
                size={15}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Compact Progress Line */}
        <div className="mt-3.5 pt-3 border-t border-line/60">
          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
            <span>
              Khatm #{selectedKhatm} ·{" "}
              <strong className="text-ink">{completedInKhatm} of 30</strong> completed
            </span>
            <span className="font-bold text-accent">{percent}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-line/60"
            role="progressbar"
            aria-label="Daurah completion"
            aria-valuenow={percent}
          >
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </header>

      {infoOpen && (
        <RoomInfoModal
          open={infoOpen}
          onClose={() => setInfoOpen(false)}
          room={room}
          user={user}
          campaignSummary={campaignSummary}
          percent={percent}
          inviteLink={inviteLink}
          whatsappMessage={whatsappMessage}
          copyInvite={copyInvite}
          copyCode={copyCode}
          shareInvite={shareInvite}
          memberAssignments={memberAssignments}
        />
      )}

      <section aria-labelledby="assignment-heading" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 id="assignment-heading" className="text-2xl font-semibold tracking-[-0.025em]">
              Para assignments
            </h3>
            <p className="mt-1 text-sm text-muted">
              Khatm #{selectedKhatm} · {completedInKhatm} of 30 completed
            </p>
          </div>
          <StatusLegend />
        </div>

        {grouped.size > 1 && (
          <div
            className="mt-5 flex gap-2 overflow-x-auto pb-2"
            role="tablist"
            aria-label="Khatm cycle"
          >
            {[...grouped.keys()]
              .sort((a, b) => a - b)
              .map((number) => {
                const group = grouped.get(number) ?? [];
                const complete = group.filter((slot) => slot.status === "completed").length;
                return (
                  <button
                    key={number}
                    type="button"
                    role="tab"
                    aria-selected={selectedKhatm === number}
                    onClick={() => onSelectKhatm(number)}
                    className={`min-h-11 shrink-0 rounded-xl border px-4 text-sm font-semibold ${selectedKhatm === number ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-muted hover:border-accent hover:text-ink"}`}
                  >
                    Khatm #{number} <span className="font-normal">· {complete}/30</span>
                  </button>
                );
              })}
          </div>
        )}

        {mySlots.length > 0 && (
          <div className="mt-5 rounded-2xl border border-accent/35 bg-accent-soft p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-accent shadow-xs">
                  <BookOpenCheck aria-hidden="true" size={20} />
                </span>
                <div>
                  <p className="font-semibold text-ink">
                    Your assigned Paras in Khatm #{selectedKhatm}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Quickly continue reading in Quran Feham, open the 15-line Mushaf PDF, or manage
                    your assignment.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mySlots.map((slot) => {
                const myPara = getPara(slot.juzNumber);
                const isReading = slot.status === "reading";
                const isCompleted = slot.status === "completed";
                return (
                  <div
                    key={slot.id}
                    className="flex flex-col justify-between rounded-xl border border-line bg-surface p-3.5 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-muted">Para {slot.juzNumber}</p>
                        <p className="font-semibold text-ink">{myPara.nameLatin}</p>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {formatReference(myPara.start)}–{formatReference(myPara.end)}
                        </p>
                      </div>
                      <span className="font-quran text-xl text-ink" lang="ar" dir="rtl">
                        {myPara.nameArabic}
                      </span>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-line/60 pt-2.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          isCompleted
                            ? "bg-accent text-on-action"
                            : isReading
                              ? "bg-accent-soft text-accent"
                              : "bg-[#fff3cf] text-[#694300]"
                        }`}
                      >
                        {isCompleted ? "Completed" : isReading ? "Reading" : "Chosen"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (slot.status === "claimed") void onMutation(slot, "reading");
                            if (onOpenMushaf) {
                              onOpenMushaf(slot.juzNumber);
                            } else {
                              window.location.assign(paraMushafViewerHref(slot.juzNumber));
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-action px-3 py-1.5 text-xs font-semibold text-on-action shadow-xs hover:bg-action-hover"
                          title="Open 15-Line Mushaf"
                        >
                          <BookOpenCheck aria-hidden="true" size={14} />
                          <span>Open Mushaf</span>
                        </button>
                        <Link
                          href={paraReaderHref(slot.juzNumber)}
                          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs font-medium text-muted hover:bg-surface-soft hover:text-ink"
                          title="Word-by-word translation reader"
                        >
                          Translation
                        </Link>
                        <button
                          type="button"
                          onClick={() => onSelectJuz(slot.juzNumber)}
                          className="rounded-lg px-2 py-1.5 text-xs font-medium text-muted hover:bg-surface-soft hover:text-ink"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
          <ol
            className="overflow-hidden rounded-2xl border border-line bg-surface"
            aria-label={`Khatm ${selectedKhatm} Para assignments`}
          >
            {slots.map((slot) => {
              const selected = selectedJuz === slot.juzNumber;
              return (
                <ParaAssignmentRow
                  key={slot.id}
                  slot={slot}
                  userId={user.id}
                  selected={selected}
                  claimantName={
                    slot.claimedByUserId ? (names.get(slot.claimedByUserId) ?? null) : null
                  }
                  onSelect={() => onSelectJuz(slot.juzNumber)}
                  mobileDetail={selected ? selectedDetail : undefined}
                />
              );
            })}
          </ol>

          <aside className="hidden xl:sticky xl:top-6 xl:block" aria-label="Selected Para">
            {selectedDetail}
          </aside>
        </div>
      </section>

      <details className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface">
        <summary className="cursor-pointer px-5 py-4 font-semibold sm:px-6">
          Members and responsibilities ({room.members.length})
        </summary>
        <ul className="divide-y divide-line border-t border-line px-5 sm:px-6">
          {room.members.map((member) => (
            <li
              key={member.userId}
              className="grid gap-2 py-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div>
                <span className="font-semibold">
                  {member.userId === user.id ? "You" : member.displayName || "Room member"}
                </span>
                <span className="ml-2 rounded-full bg-surface-soft px-2 py-0.5 text-xs text-muted">
                  {member.role === "owner" ? "Owner" : "Member"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs text-muted">
                {(memberAssignments.get(member.userId) ?? []).length > 0 ? (
                  (memberAssignments.get(member.userId) ?? []).map((slot) => (
                    <span key={slot.id} className="rounded-md bg-surface-soft px-2 py-1">
                      K{slot.khatmNumber} · Para {slot.juzNumber} ·{" "}
                      {slot.status === "completed"
                        ? "Done"
                        : slot.status === "reading"
                          ? "Reading"
                          : "Chosen"}
                    </span>
                  ))
                ) : (
                  <span>No active Para</span>
                )}
              </div>
            </li>
          ))}
        </ul>
        {room.viewerRole === "owner" && (
          <p className="border-t border-line bg-surface-soft px-5 py-3 text-xs leading-5 text-muted sm:px-6">
            You own this room. Share invitations carefully and use Refresh before coordinating a
            reassignment with another member.
          </p>
        )}
      </details>

      <KhatmRoomManagement
        room={room}
        currentUserId={user.id}
        onRoomChange={onRoomChange}
        onNotice={onNotice}
      />
    </article>
  );
}

export function KhatmWorkspace() {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<KhatmRoomSummary[]>([]);
  const [room, setRoom] = useState<KhatmRoom | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [inviteInput, setInviteInput] = useState("");
  const [invitationWaiting, setInvitationWaiting] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [formPending, setFormPending] = useState(false);
  const [mutationPending, setMutationPending] = useState(false);
  const [selectedKhatm, setSelectedKhatm] = useState(1);
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const [activeMushafPara, setActiveMushafPara] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [roomMenuOpen, setRoomMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams(window.location.search);
    const joinValue = query.get("join") ?? "";
    const requestedRoomId = query.get("room");
    if (joinValue) {
      setInviteInput(joinValue);
      setInvitationWaiting(true);
    }

    async function load() {
      setWorkspaceState("checking");
      try {
        const currentUser = await getCurrentUser();
        if (!active) return;
        setUser(currentUser);
        setWorkspaceState("ready");
        setRoomsLoading(true);
        try {
          const roomList = await listKhatmRooms();
          if (!active) return;
          setRooms(roomList);
          setLastSyncedAt(new Date());
          const roomId = roomList.some((item) => item.id === requestedRoomId)
            ? requestedRoomId
            : roomList[0]?.id;
          if (joinValue) setFormMode("join");
          else if (roomList.length === 0) setFormMode("create");
          if (roomId) {
            const detail = await getKhatmRoom(roomId);
            if (!active) return;
            setRoom(detail);
          }
        } catch (innerError) {
          if (!active) return;
          setNotice({ tone: "error", text: errorMessage(innerError) });
        }
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiFailure && (error.status === 401 || error.status === 403)) {
          setWorkspaceState("guest");
        } else if (
          (typeof navigator !== "undefined" && !navigator.onLine) ||
          (error instanceof ApiFailure && error.status === 0)
        ) {
          setWorkspaceState("offline");
        } else {
          setWorkspaceState("guest");
        }
      } finally {
        if (active) setRoomsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [retryToken]);

  useEffect(() => {
    if (workspaceState !== "ready" || !user) return;
    let active = true;

    async function refreshQuietly() {
      try {
        const nextRooms = await listKhatmRooms();
        if (!active) return;
        setRooms(nextRooms);
        const activeRoomId = room?.id;
        if (activeRoomId && nextRooms.some((item) => item.id === activeRoomId)) {
          const detail = await getKhatmRoom(activeRoomId);
          if (active) setRoom(detail);
        }
        if (active) setLastSyncedAt(new Date());
      } catch {
        // Quiet refreshes never replace a usable room with an error state.
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") void refreshQuietly();
    }

    const interval = window.setInterval(refreshWhenVisible, 30_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
    };
  }, [room?.id, user, workspaceState]);

  async function refreshSummaries(preferredRoomId?: string) {
    const nextRooms = await listKhatmRooms();
    setRooms(nextRooms);
    const roomId = preferredRoomId ?? room?.id ?? nextRooms[0]?.id;
    if (roomId) setRoom(await getKhatmRoom(roomId));
    else setRoom(null);
    setLastSyncedAt(new Date());
  }

  async function selectRoom(roomId: string) {
    setRoomsLoading(true);
    setNotice(null);
    setSelectedKhatm(1);
    setSelectedJuz(null);
    try {
      const detail = await getKhatmRoom(roomId);
      setRoom(detail);
      window.history.replaceState({}, "", `/khatm?room=${encodeURIComponent(roomId)}`);
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
    } finally {
      setRoomsLoading(false);
    }
  }

  async function handleCreate(draft: typeof initialRoomDraft) {
    setFormPending(true);
    setNotice(null);
    try {
      const created = await createKhatmRoom({
        name: draft.name,
        targetKhatms: draft.targetKhatms,
        maxActiveParasPerMember: draft.maxActiveParasPerMember ?? 4,
        ...(draft.intention.trim() ? { intention: draft.intention.trim() } : {}),
        ...(draft.startDate
          ? { startDate: new Date(`${draft.startDate}T00:00:00`).toISOString() }
          : {}),
        ...(draft.deadline
          ? { deadline: new Date(`${draft.deadline}T23:59:59`).toISOString() }
          : {}),
        recurrence: draft.recurrence,
        autoRestartOnComplete: draft.autoRestartOnComplete,
      });
      setRoom(created);
      setSelectedKhatm(1);
      setSelectedJuz(null);
      setFormMode(null);
      setNotice({
        tone: "success",
        text: `${created.name} was created. Share its invitation when you are ready.`,
      });
      await refreshSummaries(created.id);
      window.history.replaceState({}, "", `/khatm?room=${encodeURIComponent(created.id)}`);
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
    } finally {
      setFormPending(false);
    }
  }

  async function handleJoin() {
    setFormPending(true);
    setNotice(null);
    try {
      const joined = await joinKhatmRoom(inviteInput);
      setRoom(joined);
      setSelectedKhatm(1);
      setSelectedJuz(null);
      setFormMode(null);
      setInvitationWaiting(false);
      setNotice({
        tone: "success",
        text: `You joined ${joined.name}. Choose an available Para when ready.`,
      });
      await refreshSummaries(joined.id);
      window.history.replaceState({}, "", `/khatm?room=${encodeURIComponent(joined.id)}`);
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
    } finally {
      setFormPending(false);
    }
  }

  async function handleMutation(slot: KhatmParaSlot, action: KhatmSlotAction) {
    if (!room) return false;
    setMutationPending(true);
    setNotice(null);
    try {
      const updated = await mutateKhatmSlot(
        room.id,
        room.activeCampaign.id,
        slot.khatmNumber,
        slot.juzNumber,
        action,
      );
      setRoom((current) =>
        current
          ? {
              ...current,
              activeCampaign: {
                ...current.activeCampaign,
                slots: current.activeCampaign.slots.map((item) =>
                  item.id === updated.id ? updated : item,
                ),
              },
            }
          : current,
      );
      setRooms((current) =>
        current.map((summary) =>
          summary.id === room.id
            ? {
                ...summary,
                completedSlots: summary.completedSlots + (action === "complete" ? 1 : 0),
              }
            : summary,
        ),
      );
      const messages: Record<KhatmSlotAction, string> = {
        claim: `Para ${slot.juzNumber} is now yours.`,
        reading: `Para ${slot.juzNumber} is marked as reading.`,
        complete: `Para ${slot.juzNumber} is marked completed.`,
        release: `Para ${slot.juzNumber} is available again.`,
      };
      setNotice({ tone: "success", text: messages[action] });
      void refreshSummaries(room.id).catch(() => undefined);
      return true;
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
      if (error instanceof ApiFailure && error.status === 409) {
        void refreshSummaries(room.id).catch(() => undefined);
      }
      return false;
    } finally {
      setMutationPending(false);
    }
  }

  async function refreshCurrentRoom() {
    if (!room) return;
    setRoomsLoading(true);
    setNotice(null);
    try {
      await refreshSummaries(room.id);
      setNotice({ tone: "success", text: "Room assignments are up to date." });
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
    } finally {
      setRoomsLoading(false);
    }
  }

  if (workspaceState === "checking") {
    return (
      <div className="grid min-h-[65dvh] place-items-center px-4" role="status">
        <div className="flex items-center gap-3 text-sm text-muted">
          <LoaderCircle className="animate-spin" aria-hidden="true" size={20} /> Loading your Khatm
          rooms…
        </div>
      </div>
    );
  }
  if (workspaceState === "guest") return <GuestKhatm invitationWaiting={invitationWaiting} />;
  if (workspaceState === "offline") {
    return <OfflineKhatm retry={() => setRetryToken((value) => value + 1)} />;
  }
  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-[100rem] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
      {room ? (
        <>
          {/* Active Room Top Bar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                Together · Khatm
              </span>
              {rooms.length > 1 ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setRoomMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-sm font-semibold text-ink hover:bg-surface-soft active:scale-98 transition-transform"
                    aria-expanded={roomMenuOpen}
                    aria-label="Switch room"
                  >
                    <span className="truncate max-w-[180px] sm:max-w-[280px]">{room.name}</span>
                    <ChevronDown
                      size={14}
                      className={`text-muted transition-transform ${roomMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {roomMenuOpen && (
                    <div className="absolute left-0 top-full z-40 mt-1.5 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-2.5 py-1 text-[11px] font-semibold text-muted uppercase tracking-wider">
                        Your Rooms ({rooms.length})
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-0.5">
                        {rooms.map((summary) => (
                          <button
                            key={summary.id}
                            type="button"
                            onClick={() => {
                              setRoomMenuOpen(false);
                              void selectRoom(summary.id);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold ${
                              summary.id === room.id
                                ? "bg-accent-soft text-accent"
                                : "text-ink hover:bg-surface-soft"
                            }`}
                          >
                            <span className="truncate">{summary.name}</span>
                            {summary.id === room.id && (
                              <Check size={14} className="shrink-0 text-accent" />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="my-1 border-t border-line" />
                      <button
                        type="button"
                        onClick={() => {
                          setRoomMenuOpen(false);
                          setFormMode("join");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface-soft"
                      >
                        <UserPlus size={14} className="text-muted" /> Join another room
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRoomMenuOpen(false);
                          setFormMode("create");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent-soft"
                      >
                        <Plus size={14} /> Create new room
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-sm font-semibold text-ink truncate max-w-[240px] sm:max-w-none">
                  {room.name}
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setFormMode("join")}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-ink hover:bg-surface-soft"
                title="Join another room"
              >
                <UserPlus size={14} />
                <span className="hidden sm:inline">Join room</span>
                <span className="sm:hidden">Join</span>
              </button>
              <button
                type="button"
                onClick={() => setFormMode("create")}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-action px-2.5 text-xs font-semibold text-on-action hover:bg-action-hover"
                title="Create new room"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">New room</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>

          {notice && (
            <div
              role={notice.tone === "error" ? "alert" : "status"}
              className={`mb-4 flex gap-3 rounded-xl border p-3.5 text-sm ${
                notice.tone === "error"
                  ? "border-danger/35 bg-danger/5 text-danger"
                  : notice.tone === "success"
                    ? "border-accent/35 bg-accent-soft text-ink"
                    : "border-line bg-surface text-ink"
              }`}
            >
              {notice.tone === "error" ? (
                <Clock3 className="shrink-0" aria-hidden="true" size={18} />
              ) : (
                <CheckCircle2 className="shrink-0 text-accent" aria-hidden="true" size={18} />
              )}
              <span>{notice.text}</span>
            </div>
          )}

          <main className="min-w-0">
            <RoomDetail
              room={room}
              user={user}
              selectedKhatm={selectedKhatm}
              onSelectKhatm={(number) => {
                setSelectedKhatm(number);
                setSelectedJuz(null);
              }}
              selectedJuz={selectedJuz}
              onSelectJuz={setSelectedJuz}
              mutationPending={mutationPending}
              refreshing={roomsLoading}
              lastSyncedAt={lastSyncedAt}
              onRefresh={refreshCurrentRoom}
              onMutation={handleMutation}
              onRoomChange={(updated) => {
                setRoom(updated);
                setSelectedKhatm(1);
                setSelectedJuz(null);
                void refreshSummaries(updated.id).catch(() => undefined);
              }}
              onNotice={setNotice}
              onOpenMushaf={(paraNum) => setActiveMushafPara(paraNum)}
            />
          </main>
        </>
      ) : (
        <>
          <header className="flex flex-col gap-6 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-accent">Together · Khatm Rooms</p>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                  Shared beta
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Read together. Know what remains.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
                Create or join a family room, choose a Para, and keep one trustworthy shared
                completion record.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                onClick={() => setFormMode("join")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 font-semibold hover:bg-surface-soft"
              >
                <UserPlus aria-hidden="true" size={18} /> Join room
              </button>
              <button
                type="button"
                onClick={() => setFormMode("create")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action px-4 font-semibold text-on-action hover:bg-action-hover"
              >
                <Plus aria-hidden="true" size={18} /> Create room
              </button>
            </div>
          </header>

          {notice && (
            <div
              role={notice.tone === "error" ? "alert" : "status"}
              className={`mt-5 flex gap-3 rounded-xl border p-4 text-sm ${
                notice.tone === "error"
                  ? "border-danger/35 bg-danger/5 text-danger"
                  : notice.tone === "success"
                    ? "border-accent/35 bg-accent-soft text-ink"
                    : "border-line bg-surface text-ink"
              }`}
            >
              {notice.tone === "error" ? (
                <Clock3 className="shrink-0" aria-hidden="true" size={18} />
              ) : (
                <CheckCircle2 className="shrink-0 text-accent" aria-hidden="true" size={18} />
              )}
              <span>{notice.text}</span>
            </div>
          )}

          <div className="mt-6 grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)] xl:gap-12">
            <aside aria-label="Your Khatm rooms" className="space-y-6">
              <section aria-labelledby="your-rooms-heading">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="your-rooms-heading" className="text-lg font-semibold">
                    Your rooms
                  </h2>
                  {roomsLoading && (
                    <LoaderCircle
                      className="animate-spin text-muted"
                      aria-label="Refreshing rooms"
                      size={18}
                    />
                  )}
                </div>
                {rooms.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {rooms.map((summary) => (
                      <RoomSummaryButton
                        key={summary.id}
                        summary={summary}
                        active={false}
                        onSelect={() => void selectRoom(summary.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-dashed border-line bg-surface/60 p-5">
                    <UsersRound className="text-muted" aria-hidden="true" size={23} />
                    <p className="mt-3 font-semibold">No rooms yet</p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      Create a family Khatm or paste an invitation you received.
                    </p>
                  </div>
                )}
              </section>

              <div className="rounded-xl border border-line bg-surface-soft p-4 text-xs leading-5 text-muted">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <Info aria-hidden="true" size={16} /> How shared progress updates
                </p>
                <p className="mt-1">
                  The room refreshes automatically while this page is open and whenever you return
                  to it. Refresh manually if you are coordinating with someone at the same moment.
                </p>
                <p className="mt-3">
                  Completion is always confirmed by the reader. It is not inferred from an open
                  reader, PDF, microphone or recitation.
                </p>
              </div>
            </aside>

            <section aria-label="Khatm room selection" className="min-w-0">
              {roomsLoading ? (
                <div
                  className="grid min-h-[24rem] place-items-center rounded-2xl border border-line bg-surface"
                  role="status"
                >
                  <span className="flex items-center gap-3 text-sm text-muted">
                    <LoaderCircle className="animate-spin" aria-hidden="true" size={20} /> Opening
                    room…
                  </span>
                </div>
              ) : (
                <section className="grid min-h-[26rem] place-items-center rounded-2xl border border-line bg-surface p-6 text-center">
                  <div className="max-w-md">
                    <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
                      <UsersRound aria-hidden="true" size={23} />
                    </span>
                    <h2 className="mt-5 text-2xl font-semibold tracking-[-0.025em]">
                      Begin a shared Khatm
                    </h2>
                    <p className="mt-3 leading-7 text-muted">
                      Create a room for your family or join one with an invitation. Every Daurah
                      starts with 30 available Paras per Khatm.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormMode("create")}
                      className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
                    >
                      <Plus aria-hidden="true" size={18} /> Create your first room
                    </button>
                  </div>
                </section>
              )}
            </section>
          </div>
        </>
      )}

      {/* Modal Dialog for RoomForms */}
      {formMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) setFormMode(null);
          }}
        >
          <div className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-150">
            <RoomForms
              key={formMode}
              mode={formMode}
              inviteInput={inviteInput}
              onInviteInput={setInviteInput}
              onClose={() => setFormMode(null)}
              onCreate={handleCreate}
              onJoin={handleJoin}
              pending={formPending}
            />
          </div>
        </div>
      )}

      {activeMushafPara !== null && (
        <Mushaf15Reader
          initialPara={activeMushafPara}
          isClaimedPara={Boolean(
            room?.activeCampaign.slots.some(
              (s) => s.juzNumber === activeMushafPara && s.claimedByUserId === user?.id,
            ),
          )}
          onClose={() => setActiveMushafPara(null)}
          onCompletePara={async (paraNum) => {
            if (room && user) {
              const mySlot = room.activeCampaign.slots.find(
                (s) => s.juzNumber === paraNum && s.claimedByUserId === user.id,
              );
              if (mySlot) {
                await handleMutation(mySlot, "complete");
              }
            }
          }}
        />
      )}
    </div>
  );
}
