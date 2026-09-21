import { CheckCircle2, FileCheck2, Fingerprint, Scale, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { PublicFooter, PublicHeader } from "@/components/public-chrome";

export const metadata: Metadata = { title: "Sources" };

const sourceLayers = [
  [
    "Canonical Arabic",
    "Immutable text release with riwayah, orthography, ayah numbering, and checksum.",
  ],
  [
    "Translation",
    "A named translator and edition. Translation is never presented as the Quran itself.",
  ],
  [
    "Morphology",
    "Exact analysis by surah, ayah, and word position. No prefix guessing or loose alias matching.",
  ],
  ["Recitation", "A named reciter, recording edition, licence, and stable media source."],
  [
    "Tafsir and teaching",
    "A specific work or reviewed note, visibly separated from translation and canonical text.",
  ],
];

export default function SourcesPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <PublicHeader />
      <main id="main-content">
        <section className="border-b border-line bg-surface">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-10">
            <p className="text-sm font-semibold text-source">Content integrity</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-6xl">
              Every layer should be traceable.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              Quran Feham does not treat a provider name as sufficient provenance. A published
              content release records exactly what was used, when it was retrieved, how it was
              reviewed, and whether it may be redistributed.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
          <div
            className="rounded-2xl border border-warning/30 bg-[#fff8e7] p-5 sm:flex sm:items-start sm:gap-4 sm:p-6"
            role="status"
          >
            <ShieldAlert
              className="mb-3 shrink-0 text-warning sm:mb-0"
              aria-hidden="true"
              size={24}
            />
            <div>
              <h2 className="font-semibold text-ink">
                Runtime Quran access is live; the immutable V2 content release is not yet bundled.
              </h2>
              <p className="mt-1 leading-7 text-[#694300]">
                The reader currently fetches labelled Quran, translation, and recitation data from
                its configured provider and can reuse successfully cached responses. That working
                runtime path is not being presented as a reviewed redistributable release;
                whole-Quran morphology and tafsir remain unavailable until exact sources are
                licensed and validated.
              </p>
            </div>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.035em]">
                Five distinct evidence layers
              </h2>
              <p className="mt-4 leading-7 text-muted">
                Keeping these layers separate prevents an explanatory note from looking like
                translation, or a third-party API response from becoming canonical silently.
              </p>
            </div>
            <ol className="divide-y divide-line border-y border-line">
              {sourceLayers.map(([title, description], index) => (
                <li key={title} className="grid gap-3 py-6 sm:grid-cols-[2.5rem_1fr]">
                  <span className="text-sm font-semibold text-muted">{index + 1}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="mt-2 leading-7 text-muted">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Fingerprint,
                title: "Pinned",
                text: "Commit identifiers and SHA-256 checksums prevent silent upstream changes.",
              },
              {
                icon: FileCheck2,
                title: "Reviewed",
                text: "Published releases require a named reviewer and publication time.",
              },
              {
                icon: Scale,
                title: "Licensed",
                text: "Redistribution and modification permissions are stored per source.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="border-t-2 border-accent px-1 py-5">
                <Icon className="text-accent" aria-hidden="true" size={24} />
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 leading-7 text-muted">{text}</p>
              </article>
            ))}
          </div>

          <section
            className="mt-16 rounded-2xl border border-line bg-surface p-6 sm:p-8"
            aria-labelledby="manifest-title"
          >
            <div className="flex items-start gap-4">
              <CheckCircle2 className="mt-1 shrink-0 text-accent" aria-hidden="true" size={24} />
              <div>
                <h2 id="manifest-title" className="text-xl font-semibold">
                  Minimum publication record
                </h2>
                <p className="mt-2 leading-7 text-muted">
                  Each release records provider, edition, upstream version or commit, checksum,
                  retrieval time, licence, included assets, review status, and reviewer identity.
                </p>
              </div>
            </div>
          </section>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
