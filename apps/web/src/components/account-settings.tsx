"use client";

import {
  type AuthSession,
  AuthSessionSchema,
  type User,
  UserSchema,
  UserSettingsSchema,
} from "@quran-feham/contracts";
import { CheckCircle2, LoaderCircle, LogIn, LogOut, MonitorSmartphone, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { z } from "zod";
import { apiRequest, getCurrentUser, logout } from "@/lib/api";
import { applyThemePreference } from "@/lib/theme";

interface LocalPreferences {
  locale: "ur" | "en";
  translationEditionId: string;
  recitationEditionId: string;
  dailyMinutes: "5" | "10" | "15";
  arabicScale: string;
  theme: "light" | "dark" | "system";
}

const defaults: LocalPreferences = {
  locale: "ur",
  translationEditionId: "ur.jalandhry",
  recitationEditionId: "ar.alafasy",
  dailyMinutes: "10",
  arabicScale: "1",
  theme: "light",
};

export function AccountSettings() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [preferences, setPreferences] = useState<LocalPreferences>(defaults);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const stored = window.localStorage.getItem("qf:web-preferences");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<LocalPreferences>;
        setPreferences({
          ...defaults,
          ...parsed,
          theme: parsed.theme === "dark" ? "dark" : "light",
        });
        if (["light", "dark", "system"].includes(String(parsed.theme))) {
          applyThemePreference(parsed.theme);
        }
      } catch {
        window.localStorage.removeItem("qf:web-preferences");
      }
    }

    Promise.allSettled([
      getCurrentUser(),
      apiRequest("/auth/sessions"),
      apiRequest("/users/settings"),
    ]).then((results) => {
      if (!active) return;
      const userResult = results[0];
      const sessionResult = results[1];
      if (userResult.status === "fulfilled") setUser(UserSchema.parse(userResult.value));
      if (sessionResult.status === "fulfilled") {
        const parsed = z
          .object({ sessions: z.array(AuthSessionSchema) })
          .safeParse(sessionResult.value);
        if (parsed.success) setSessions(parsed.data.sessions);
      }
      const settingsResult = results[2];
      if (settingsResult.status === "fulfilled") {
        const parsed = UserSettingsSchema.safeParse(settingsResult.value);
        if (parsed.success) {
          setPreferences({
            locale: parsed.data.locale,
            translationEditionId: parsed.data.translationEditionId,
            recitationEditionId: parsed.data.recitationEditionId,
            dailyMinutes: String(parsed.data.dailyMinutes) as LocalPreferences["dailyMinutes"],
            arabicScale: String(parsed.data.arabicScale),
            theme: parsed.data.theme === "dark" ? "dark" : "light",
          });
          const localSettings = {
            ...parsed.data,
            theme: parsed.data.theme === "dark" ? "dark" : "light",
          };
          applyThemePreference(localSettings.theme);
          window.localStorage.setItem("qf:web-preferences", JSON.stringify(localSettings));
        }
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  function updatePreference<Key extends keyof LocalPreferences>(
    key: Key,
    value: LocalPreferences[Key],
  ) {
    setPreferences((current) => ({ ...current, [key]: value }));
    if (key === "theme") applyThemePreference(value);
  }

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    window.localStorage.setItem("qf:web-preferences", JSON.stringify(preferences));
    try {
      await apiRequest("/users/settings", {
        method: "PUT",
        body: JSON.stringify({
          locale: preferences.locale,
          translationEditionId: preferences.translationEditionId,
          recitationEditionId: preferences.recitationEditionId,
          dailyMinutes: Number(preferences.dailyMinutes),
          theme: preferences.theme,
          arabicScale: Number(preferences.arabicScale),
        }),
      });
      setMessage("Settings saved and synced.");
    } catch {
      setMessage("Settings saved on this device. Sync is currently unavailable.");
    } finally {
      setPending(false);
    }
  }

  async function endSession(sessionId: string) {
    setMessage(null);
    try {
      await apiRequest(`/auth/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      setMessage("Session ended.");
    } catch {
      setMessage("That session could not be ended. Try again.");
    }
  }

  async function signOut() {
    setPending(true);
    setMessage(null);
    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } catch {
      setMessage("Sign out could not be confirmed. You are still signed in on this device.");
      setPending(false);
    }
  }

  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_0.8fr]">
      <section aria-labelledby="preferences-heading">
        <h2 id="preferences-heading" className="text-2xl font-semibold tracking-[-0.025em]">
          Reading preferences
        </h2>
        <p className="mt-1 text-muted">
          These apply on this device immediately and sync when the settings service is available.
        </p>
        <form
          onSubmit={savePreferences}
          className="mt-6 space-y-6 rounded-2xl border border-line bg-surface p-5 sm:p-7"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="locale" className="mb-2 block text-sm font-semibold">
                Learning language
              </label>
              <select
                id="locale"
                value={preferences.locale}
                onChange={(event) => updatePreference("locale", event.target.value as "ur" | "en")}
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-ink"
              >
                <option value="ur">Urdu</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label htmlFor="translationEditionId" className="mb-2 block text-sm font-semibold">
                Translation
              </label>
              <select
                id="translationEditionId"
                value={preferences.translationEditionId}
                onChange={(event) => updatePreference("translationEditionId", event.target.value)}
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-ink"
              >
                <option value="ur.jalandhry">Urdu · Jalandhry</option>
                <option value="ur.junagarhi">Urdu · Junagarhi</option>
                <option value="ur.maududi">Urdu · Maududi</option>
                <option value="en.sahih">English · Saheeh International</option>
              </select>
            </div>
            <div>
              <label htmlFor="dailyMinutes" className="mb-2 block text-sm font-semibold">
                Daily session
              </label>
              <select
                id="dailyMinutes"
                value={preferences.dailyMinutes}
                onChange={(event) =>
                  updatePreference("dailyMinutes", event.target.value as "5" | "10" | "15")
                }
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-ink"
              >
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
              </select>
            </div>
            <div>
              <label htmlFor="recitationEditionId" className="mb-2 block text-sm font-semibold">
                Reciter
              </label>
              <select
                id="recitationEditionId"
                value={preferences.recitationEditionId}
                onChange={(event) => updatePreference("recitationEditionId", event.target.value)}
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-ink"
              >
                <option value="ar.alafasy">Mishary Rashid Alafasy</option>
                <option value="ar.abdurrahmaansudais">Abdur-Rahman as-Sudais</option>
                <option value="ar.hudhaify">Ali al-Hudhaify</option>
                <option value="ar.mahermuaiqly">Maher al-Muaiqly</option>
              </select>
            </div>
            <div>
              <label htmlFor="theme" className="mb-2 block text-sm font-semibold">
                Appearance
              </label>
              <select
                id="theme"
                value={preferences.theme}
                onChange={(event) =>
                  updatePreference("theme", event.target.value as LocalPreferences["theme"])
                }
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-ink"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
          <div>
            <label
              htmlFor="arabicScale"
              className="mb-2 flex justify-between gap-3 text-sm font-semibold"
            >
              Arabic size{" "}
              <span className="font-normal text-muted">
                {Math.round(Number(preferences.arabicScale) * 100)}%
              </span>
            </label>
            <input
              id="arabicScale"
              type="range"
              min="0.8"
              max="1.6"
              step="0.1"
              value={preferences.arabicScale}
              onChange={(event) => updatePreference("arabicScale", event.target.value)}
              className="min-h-11 w-full accent-accent"
            />
          </div>
          {message && (
            <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-ink" role="status">
              <CheckCircle2 className="mr-2 inline text-accent" aria-hidden="true" size={18} />
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover disabled:opacity-60"
          >
            {pending && <LoaderCircle className="animate-spin" aria-hidden="true" size={18} />} Save
            settings
          </button>
        </form>
      </section>

      <div className="space-y-10">
        <section aria-labelledby="account-heading">
          <h2 id="account-heading" className="text-2xl font-semibold tracking-[-0.025em]">
            Account
          </h2>
          <div className="mt-5 rounded-2xl border border-line bg-surface p-5 sm:p-6">
            {loading ? (
              <p className="flex items-center gap-2 text-sm text-muted" role="status">
                <LoaderCircle className="animate-spin" aria-hidden="true" size={18} /> Loading
                account…
              </p>
            ) : user ? (
              <>
                <dl>
                  <div className="border-b border-line pb-4">
                    <dt className="text-sm text-muted">Name</dt>
                    <dd className="mt-1 font-semibold">{user.displayName ?? "Not set"}</dd>
                  </div>
                  <div className="py-4">
                    <dt className="text-sm text-muted">Email</dt>
                    <dd className="mt-1 break-all font-semibold">{user.email}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={signOut}
                  className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 font-semibold text-ink hover:border-danger hover:text-danger"
                >
                  <LogOut aria-hidden="true" size={18} /> Sign out
                </button>
              </>
            ) : (
              <div>
                <p className="text-sm leading-6 text-muted">
                  You are currently browsing as a guest. Sign in to sync your reading position, preferences, and joined Khatms across devices.
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Link
                    href="/login"
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-action px-4 text-xs font-semibold text-on-action hover:bg-action-hover"
                  >
                    <LogIn aria-hidden="true" size={15} /> Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-xs font-semibold text-ink hover:border-accent"
                  >
                    Create free account
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="sessions-heading">
          <h2 id="sessions-heading" className="text-2xl font-semibold tracking-[-0.025em]">
            Signed-in devices
          </h2>
          <div className="mt-5 divide-y divide-line rounded-2xl border border-line bg-surface px-5">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <div key={session.id} className="flex min-h-20 items-center gap-3 py-3">
                  <MonitorSmartphone className="shrink-0 text-muted" aria-hidden="true" size={22} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{session.deviceName}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {session.current
                        ? "This device"
                        : `Last used ${new Date(session.lastUsedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  {!session.current && (
                    <button
                      type="button"
                      onClick={() => endSession(session.id)}
                      className="grid size-11 place-items-center rounded-xl text-muted hover:bg-red-50 hover:text-danger"
                      aria-label={`End session on ${session.deviceName}`}
                    >
                      <Trash2 aria-hidden="true" size={19} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="py-5 text-sm leading-6 text-muted">
                Session details are unavailable. They will appear when the authentication service is
                connected.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
