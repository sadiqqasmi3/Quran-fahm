import {
  BookMarked,
  Bookmark,
  BookOpenCheck,
  Compass,
  Download,
  Mosque,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AccountSettings } from "@/components/account-settings";
import { PageHeading } from "@/components/page-heading";

export const metadata: Metadata = { title: "Account and settings" };

export default function AccountPage() {
  return (
    <>
      <PageHeading
        title="Account & settings"
        description="Manage your reading preferences, private account, and signed-in devices."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:px-10 lg:py-12">
        <AccountSettings />
        <section className="mt-12 border-t border-line pt-8 lg:hidden" aria-labelledby="more-tools">
          <h2 id="more-tools" className="text-2xl font-semibold tracking-[-0.025em]">
            More Quran tools
          </h2>
          <nav
            className="mt-4 divide-y divide-line border-y border-line"
            aria-label="Secondary modules"
          >
            {[
              ["/learn", "Learn", BookMarked],
              ["/explore", "Explore", Compass],
              ["/salah", "Salah", Mosque],
              ["/progress", "Progress", TrendingUp],
              ["/bookmarks", "Bookmarks", Bookmark],
              ["/downloads", "Downloads", Download],
              ["/sources", "Sources", BookOpenCheck],
            ].map(([href, label, Icon]) => {
              const ToolIcon = Icon as typeof Compass;
              return (
                <Link
                  key={String(href)}
                  href={String(href)}
                  className="flex min-h-16 items-center gap-3 py-3 font-semibold text-ink"
                >
                  <ToolIcon aria-hidden="true" className="text-accent" size={20} />
                  {String(label)}
                </Link>
              );
            })}
          </nav>
        </section>
      </div>
    </>
  );
}
