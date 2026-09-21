"use client";

import type { ReadingPosition } from "@quran-feham/contracts";
import { BookOpenText, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { parseReadingPositionResponse } from "@/lib/reading-position";

export function ContinueReadingCard() {
  const [position, setPosition] = useState<ReadingPosition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest("/users/reading-position")
      .then((value) => {
        if (active) setPosition(parseReadingPositionResponse(value));
      })
      .catch(() => {
        if (active) setPosition(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const href = position
    ? `/quran?surah=${position.surahNumber}&ayah=${position.ayahNumber}`
    : "/quran";

  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-hero p-6 text-on-hero sm:p-8">
      <div
        className="absolute right-[-4rem] top-[-5rem] size-64 rounded-full border border-white/10"
        aria-hidden="true"
      />
      <p className="text-sm text-on-hero/70">Continue reading</p>
      <h2
        id="continue-heading"
        className="mt-3 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl"
      >
        {position ? `Surah ${position.surahNumber}, ayah ${position.ayahNumber}` : "Choose a surah"}
      </h2>
      <p className="mt-3 max-w-lg leading-7 text-on-hero/70">
        {loading ? (
          <span className="inline-flex items-center gap-2" role="status">
            <LoaderCircle className="animate-spin" aria-hidden="true" size={18} /> Loading your
            reading position…
          </span>
        ) : position ? (
          `Last opened in ${position.mode} mode. Your position is synced to this account.`
        ) : (
          "Your synced position will appear here after you study or listen to an ayah."
        )}
      </p>
      <Link
        href={href}
        className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-on-hero px-4 font-semibold text-hero hover:bg-[#e1efe9]"
      >
        {position ? "Resume reading" : "Open the Quran"}{" "}
        <BookOpenText aria-hidden="true" size={18} />
      </Link>
    </article>
  );
}
