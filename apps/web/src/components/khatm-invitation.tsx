"use client";

import type { KhatmInvitePreview, User } from "@quran-feham/contracts";
import {
  CalendarDays,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  LogIn,
  Repeat2,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiFailure, getCurrentUser } from "@/lib/api";
import {
  getKhatmInvitePreview,
  isValidInviteCode,
  joinKhatmRoom,
} from "@/lib/khatm";

type SessionState = "checking" | "guest" | "authenticated";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function deadlineLabel(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : "No fixed deadline";
}

function recurrenceLabel(value: KhatmInvitePreview["recurrence"]): string {
  if (value === "weekly") return "Repeats weekly";
  if (value === "monthly") return "Repeats monthly";
  return "One campaign";
}

export function KhatmInvitation({ credential }: { credential: string }) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<KhatmInvitePreview | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!isValidInviteCode(credential)) {
        setError("This room invitation is not valid. Ask the room owner for a new link or code.");
        setLoading(false);
        setSessionState("guest");
        return;
      }
      const [previewResult, userResult] = await Promise.allSettled([
        getKhatmInvitePreview(credential),
        getCurrentUser(),
      ]);
      if (!active) return;

      if (previewResult.status === "fulfilled") setInvitation(previewResult.value);
      else if (previewResult.reason instanceof ApiFailure && previewResult.reason.status === 404) {
        setError("This room invitation has expired or was replaced. Ask the room owner for a new one.");
      } else {
        setError("The invitation could not be loaded. Check your connection and try again.");
      }

      if (userResult.status === "fulfilled") {
        setUser(userResult.value);
        setSessionState("authenticated");
      } else {
        setSessionState("guest");
      }
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [credential]);

  async function joinRoom() {
    setJoining(true);
    setError(null);
    try {
      const room = await joinKhatmRoom(credential);
      router.push(`/khatm?room=${encodeURIComponent(room.id)}`);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof ApiFailure
          ? cause.message
          : "The room could not be joined. Check the code and try again.",
      );
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[60dvh] place-items-center px-4" role="status">
        <span className="flex items-center gap-3 text-sm text-muted">
          <LoaderCircle className="animate-spin" aria-hidden="true" size={20} /> Checking the room
          invitation…
        </span>
      </div>
    );
  }

  if (!invitation) {
    return (
      <section className="mx-auto grid min-h-[60dvh] max-w-2xl place-items-center px-4 py-12 text-center">
        <div>
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-surface-soft text-muted">
            <KeyRound aria-hidden="true" size={22} />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em]">Invitation unavailable</h1>
          <p className="mx-auto mt-3 max-w-lg leading-7 text-muted">{error}</p>
          <Link
            href="/khatm"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
          >
            Enter another room code
          </Link>
        </div>
      </section>
    );
  }

  const nextPath = `/join/${encodeURIComponent(credential)}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-7 sm:py-12 lg:px-10 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_22rem] lg:items-start lg:gap-14">
        <main id="main-content" className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-accent">
            <UsersRound aria-hidden="true" size={18} /> Private Khatm invitation
          </div>
          <h1 className="mt-3 break-words text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
            {invitation.name}
          </h1>
          {invitation.intention && (
            <blockquote className="mt-6 border-l-2 border-accent pl-5 text-lg leading-8 text-muted">
              <span className="font-semibold text-ink">Intention:</span> {invitation.intention}
            </blockquote>
          )}

          <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
            <div className="bg-surface p-4 sm:p-5">
              <dt className="flex items-center gap-2 text-xs font-semibold text-muted">
                <UsersRound aria-hidden="true" size={15} /> Taking part
              </dt>
              <dd className="mt-2 text-lg font-semibold">
                {invitation.memberCount} {invitation.memberCount === 1 ? "member" : "members"}
              </dd>
            </div>
            <div className="bg-surface p-4 sm:p-5">
              <dt className="flex items-center gap-2 text-xs font-semibold text-muted">
                <CalendarDays aria-hidden="true" size={15} /> Target date
              </dt>
              <dd className="mt-2 text-lg font-semibold">{deadlineLabel(invitation.deadline)}</dd>
            </div>
            <div className="bg-surface p-4 sm:p-5">
              <dt className="flex items-center gap-2 text-xs font-semibold text-muted">
                <Repeat2 aria-hidden="true" size={15} /> Plan
              </dt>
              <dd className="mt-2 text-lg font-semibold">
                {invitation.targetKhatms} {invitation.targetKhatms === 1 ? "Khatm" : "Khatms"}
              </dd>
              <dd className="mt-1 text-xs text-muted">{recurrenceLabel(invitation.recurrence)}</dd>
            </div>
          </dl>

          <section className="mt-10" aria-labelledby="join-steps-heading">
            <h2 id="join-steps-heading" className="text-2xl font-semibold tracking-[-0.025em]">
              What happens next
            </h2>
            <ol className="mt-5 divide-y divide-line border-y border-line">
              {[
                ["Join this private room", "Your name appears only to room members."],
                ["Choose an available Para", "Every Para can belong to one member at a time."],
                ["Read, then confirm", "Open the exact start or 15-line PDF and mark it complete yourself."],
              ].map(([title, body], index) => (
                <li key={title} className="grid grid-cols-[2.75rem_1fr] gap-3 py-5">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent-soft font-semibold text-accent">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </main>

        <aside className="rounded-2xl border border-line bg-surface p-5 shadow-[0_16px_45px_rgba(31,45,37,0.07)] sm:p-6 lg:sticky lg:top-8">
          <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
            <ShieldCheck aria-hidden="true" size={22} />
          </span>
          <h2 className="mt-5 text-xl font-semibold">Join {invitation.name}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            This is a private coordination room. Joining does not post anything publicly.
          </p>

          <div className="mt-5 rounded-xl bg-surface-soft p-4">
            <p className="text-xs font-semibold text-muted">Room code</p>
            <p className="mt-1 font-mono text-xl font-semibold tracking-[0.16em] text-ink">
              {invitation.joinCode}
            </p>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm leading-6 text-danger" role="alert">
              {error}
            </p>
          )}

          {sessionState === "authenticated" && user ? (
            <>
              <p className="mt-5 text-sm text-muted">
                Joining as <span className="font-semibold text-ink">{user.displayName || user.email}</span>
              </p>
              <button
                type="button"
                onClick={() => void joinRoom()}
                disabled={joining}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-55"
              >
                {joining ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" size={19} />
                ) : (
                  <CheckCircle2 aria-hidden="true" size={19} />
                )}
                Join room
              </button>
            </>
          ) : (
            <div className="mt-5 space-y-2">
              <Link
                href={`/login?next=${encodeURIComponent(nextPath)}`}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
              >
                <LogIn aria-hidden="true" size={18} /> Sign in to join
              </Link>
              <Link
                href={`/register?next=${encodeURIComponent(nextPath)}`}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line px-5 font-semibold hover:bg-surface-soft"
              >
                <UserPlus aria-hidden="true" size={18} /> Create an account
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
