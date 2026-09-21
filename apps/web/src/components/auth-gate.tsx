"use client";

import { UserSettingsSchema } from "@quran-feham/contracts";
import { LoaderCircle, WifiOff } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { ApiFailure, apiRequest, getCurrentUser } from "@/lib/api";
import { applyThemePreference } from "@/lib/theme";

type GateState = "checking" | "authenticated" | "guest" | "offline";

export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("checking");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    const fallbackTimer = setTimeout(() => {
      if (active) setState((prev) => (prev === "checking" ? "guest" : prev));
    }, 2500);

    getCurrentUser()
      .then(async () => {
        try {
          const parsed = UserSettingsSchema.safeParse(await apiRequest("/users/settings"));
          if (parsed.success) {
            applyThemePreference(parsed.data.theme);
            window.localStorage.setItem("qf:web-preferences", JSON.stringify(parsed.data));
          }
        } catch {
          // Preferences should not turn a valid account session into an outage.
        }
        if (active) setState("authenticated");
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiFailure && (error.status === 401 || error.status === 403)) {
          if (pathname.startsWith("/account")) {
            router.replace(`/login?next=${encodeURIComponent(pathname)}`);
            return;
          }
          setState("guest");
          return;
        }
        setState("offline");
      });
    return () => {
      active = false;
      clearTimeout(fallbackTimer);
    };
  }, [pathname, router]);

  if (state === "checking") {
    return (
      <div className="grid min-h-[70dvh] place-items-center px-4" role="status">
        <div className="flex items-center gap-3 text-sm text-muted">
          <LoaderCircle className="animate-spin" aria-hidden="true" size={20} />
          Checking your session…
        </div>
      </div>
    );
  }

  if (state === "offline") {
    return (
      <>
        <div
          className="flex min-h-11 items-center justify-center gap-2 border-b border-warning/30 bg-[#fff8e7] px-4 py-2 text-center text-sm text-[#694300]"
          role="status"
        >
          <WifiOff className="shrink-0" aria-hidden="true" size={17} />
          Working from this device. Account sync is temporarily unavailable.
        </div>
        {children}
      </>
    );
  }

  if (state === "guest") {
    return (
      <>
        <div className="flex min-h-11 items-center justify-center gap-2 border-b border-line bg-accent-soft px-4 py-2 text-center text-sm text-ink">
          Progress is saved on this device.{" "}
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="font-semibold text-accent hover:underline"
          >
            Sign in to sync
          </Link>
        </div>
        {children}
      </>
    );
  }

  return children;
}
