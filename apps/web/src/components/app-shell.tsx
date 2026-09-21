"use client";

import {
  BookMarked,
  Bookmark,
  BookOpen,
  BookOpenCheck,
  BookOpenText,
  CircleUserRound,
  Compass,
  Download,
  HelpCircle,
  Home,
  LogIn,
  LogOut,
  MessageCircleQuestion,
  Mic2,
  Mosque,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import type { User } from "@quran-feham/contracts";
import { getCurrentUser, logout } from "@/lib/api";
import { useLocale } from "@/lib/i18n/locale-context";
import { Brand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNavigation() {
  const pathname = usePathname();
  const { t } = useLocale();

  const primaryNavigation = useMemo(
    () => [
      { href: "/home", label: t("navHome"), icon: Home },
      { href: "/quran", label: t("navQuran"), icon: BookOpenText },
      { href: "/recite", label: t("navRecite"), icon: Mic2 },
      { href: "/khatm", label: t("navKhatm"), icon: UsersRound },
      { href: "/ask", label: t("navAsk"), icon: MessageCircleQuestion },
    ],
    [t],
  );

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 grid h-[4.75rem] grid-cols-5 border-t border-line bg-surface/97 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgb(19_35_28/0.06)] lg:hidden"
      data-no-print
    >
      {primaryNavigation.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-1 text-xs font-semibold ${active ? "text-accent" : "text-muted hover:text-ink"}`}
          >
            <Icon aria-hidden="true" size={21} strokeWidth={active ? 2.2 : 1.8} />
            <span className="truncate max-w-[4rem] text-[0.7rem]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { t, isUrdu } = useLocale();

  const primaryNavigation = useMemo(
    () => [
      { href: "/home", label: t("navHome"), icon: Home },
      { href: "/quran", label: t("navQuran"), icon: BookOpenText },
      { href: "/recite", label: t("navRecite"), icon: Mic2 },
      { href: "/khatm", label: t("navKhatm"), icon: UsersRound },
      { href: "/ask", label: t("navAsk"), icon: MessageCircleQuestion },
    ],
    [t],
  );

  const secondaryNavigation = useMemo(
    () => [
      { href: "/mushaf", label: t("navMushaf"), icon: BookOpen },
      { href: "/guide", label: t("navGuide"), icon: HelpCircle },
      { href: "/learn", label: t("navLearn"), icon: BookMarked },
      { href: "/explore", label: t("navExplore"), icon: Compass },
      { href: "/salah", label: t("navSalah"), icon: Mosque },
      { href: "/progress", label: t("navProgress"), icon: TrendingUp },
      { href: "/bookmarks", label: t("navBookmarks"), icon: Bookmark },
      { href: "/downloads", label: t("navDownloads"), icon: Download },
      { href: "/sources", label: t("navSources"), icon: BookOpenCheck },
    ],
    [t],
  );

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((u) => {
        if (active) setUser(u);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  async function handleSignOut() {
    try {
      await logout();
      setUser(null);
      router.replace("/login");
      router.refresh();
    } catch {
      router.replace("/login");
    }
  }

  return (
    <aside
      className="sticky top-0 hidden h-dvh w-64 shrink-0 overflow-y-auto border-r rtl:border-r-0 rtl:border-l border-line bg-surface px-4 py-5 lg:flex lg:flex-col xl:w-72"
      data-no-print
    >
      <div className="px-2 flex items-center justify-between">
        <Brand href="/home" />
      </div>

      {/* Language Switcher in Sidebar */}
      <div className="mt-4 px-2">
        <LanguageSwitcher className="w-full justify-center" />
      </div>

      <nav aria-label="Primary navigation" className="mt-6 space-y-1">
        {primaryNavigation.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-soft hover:text-ink"}`}
            >
              <Icon aria-hidden="true" size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mx-3 mt-8 border-t border-line pt-5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted">
        {t("navJourneyHeader")}
      </div>
      <nav aria-label="Learning and account tools" className="mt-2 space-y-1">
        {secondaryNavigation.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-soft hover:text-ink"}`}
            >
              <Icon aria-hidden="true" size={19} strokeWidth={active ? 2.2 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-1.5 border-t border-line pt-4">
        <Link
          href="/account"
          className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${isActive(pathname, "/account") ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-soft hover:text-ink"}`}
        >
          <CircleUserRound aria-hidden="true" size={20} />
          <div className="min-w-0 flex-1 text-left rtl:text-right">
            <p className="truncate font-semibold text-ink">
              {user ? user.displayName || user.email.split("@")[0] : t("navAccount")}
            </p>
            {user ? (
              <p className="flex items-center gap-1.5 text-[0.68rem] font-medium text-accent">
                <span className="inline-block size-1.5 rounded-full bg-accent" /> {t("synced")}
              </p>
            ) : (
              <p className="text-[0.68rem] font-medium text-muted">{t("navGuestMode")}</p>
            )}
          </div>
        </Link>
        {user ? (
          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-9 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold text-muted hover:bg-surface-soft hover:text-danger text-left rtl:text-right transition-colors"
          >
            <LogOut aria-hidden="true" size={16} />
            <span>{t("navSignOut")}</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="flex min-h-9 items-center gap-3 rounded-xl px-3 text-xs font-semibold text-accent hover:bg-accent-soft transition-colors"
          >
            <LogIn aria-hidden="true" size={16} />
            <span>{t("navSignIn")}</span>
          </Link>
        )}
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:flex">
      <DesktopSidebar />
      <main id="main-content" className="min-w-0 flex-1 pb-24 lg:pb-0">
        <header
          className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-surface/97 px-4 lg:hidden"
          data-no-print
        >
          <Brand href="/home" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher showIcon={false} />
            <Link
              href="/more"
              className="grid size-11 place-items-center rounded-xl text-muted hover:bg-surface-soft hover:text-ink"
              aria-label="More Quran tools and account"
            >
              <CircleUserRound aria-hidden="true" size={22} />
            </Link>
          </div>
        </header>
        {children}
      </main>
      <MobileNavigation />
    </div>
  );
}
