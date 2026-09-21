import Link from "next/link";
import { Brand } from "./brand";

export function PublicHeader() {
  return (
    <header className="border-b border-line bg-canvas/95" data-no-print>
      <div className="mx-auto flex h-16 max-w-[100rem] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Brand />
        <nav aria-label="Public navigation" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/quran"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-ink hover:bg-surface-soft"
          >
            Read
          </Link>
          <Link
            href="/sources"
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-ink hover:bg-surface-soft sm:inline-flex"
          >
            Sources
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink hover:border-accent"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-surface" data-no-print>
      <div className="mx-auto grid max-w-[100rem] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] lg:px-10">
        <div className="max-w-xl">
          <Brand />
          <p className="mt-4 text-sm leading-6 text-muted">
            Understand, read, recite, and complete the Quran together—with every source layer kept
            visible and distinct.
          </p>
        </div>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-start gap-x-6 gap-y-3 text-sm"
        >
          <Link className="min-h-11 content-center text-muted hover:text-ink" href="/quran">
            Quran reader
          </Link>
          <Link className="min-h-11 content-center text-muted hover:text-ink" href="/sources">
            Sources
          </Link>
          <Link className="min-h-11 content-center text-muted hover:text-ink" href="/register">
            Create account
          </Link>
        </nav>
      </div>
    </footer>
  );
}
