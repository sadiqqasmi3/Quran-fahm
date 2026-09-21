import {
  BookMarked,
  Bookmark,
  BookOpenCheck,
  CircleUserRound,
  Compass,
  Download,
  Mosque,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "More Quran tools" };

const tools = [
  ["/learn", "Learn", "Daily vocabulary, phrases, roots, listening, and review.", BookMarked],
  ["/explore", "Explore", "Search Quran words, roots, and provider content.", Compass],
  ["/salah", "Salah", "Understand Al-Fatihah and familiar recitation.", Mosque],
  ["/progress", "Progress", "See bounded learning estimates and local activity.", TrendingUp],
  ["/bookmarks", "Bookmarks", "Return to ayahs saved on this device.", Bookmark],
  ["/downloads", "Downloads", "Inspect what is currently available offline.", Download],
  ["/sources", "Sources", "See content provenance and scholarly boundaries.", BookOpenCheck],
] as const;

export default function MorePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
      <header className="border-b border-line pb-7">
        <p className="text-sm font-semibold text-accent">Quran Feham</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
          More Quran tools
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-muted">
          Learning, Salah, progress, saved ayahs, offline coverage, sources, and your private
          account remain one tap away without crowding the five primary destinations.
        </p>
      </header>

      <nav className="mt-7 divide-y divide-line border-y border-line" aria-label="Quran tools">
        {tools.map(([href, label, description, Icon]) => (
          <Link
            key={href}
            href={href}
            className="grid min-h-20 grid-cols-[2.75rem_1fr] items-center gap-4 py-4 sm:grid-cols-[2.75rem_11rem_1fr]"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
              <Icon aria-hidden="true" size={21} />
            </span>
            <span className="font-semibold text-ink">{label}</span>
            <span className="col-start-2 text-sm leading-6 text-muted sm:col-start-auto">
              {description}
            </span>
          </Link>
        ))}
      </nav>

      <section className="mt-9 rounded-2xl border border-line bg-surface p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div className="flex items-start gap-3">
          <CircleUserRound className="mt-0.5 shrink-0 text-accent" aria-hidden="true" size={23} />
          <div>
            <h2 className="font-semibold">Account & settings</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Sign in to sync your reading place, preferences, and shared Khatm Rooms.
            </p>
          </div>
        </div>
        <Link
          href="/account"
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover sm:mt-0 sm:w-auto"
        >
          Open account
        </Link>
      </section>
    </div>
  );
}
