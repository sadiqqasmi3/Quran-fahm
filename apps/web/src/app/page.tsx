import {
  ArrowRight,
  BookOpenText,
  Headphones,
  Languages,
  Mic2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/public-chrome";

const pillars = [
  {
    icon: Languages,
    number: "01",
    title: "Understand",
    description:
      "Learn Quranic Arabic through Urdu meanings, high-frequency vocabulary, phrases, roots, listening, and spaced review.",
    link: "/learn",
  },
  {
    icon: BookOpenText,
    number: "02",
    title: "Read",
    description:
      "Use Quran Feham as your everyday Quran—with named translation, Qari audio, word learning, and your saved place.",
    link: "/quran",
  },
  {
    icon: Mic2,
    number: "03",
    title: "Recite",
    description:
      "Build listening comprehension now. Quran-specific live correction and Hifz assistance remain clearly staged work.",
    link: "/recite",
  },
  {
    icon: UsersRound,
    number: "04",
    title: "Together",
    description:
      "Create private family Khatms with invitations, conflict-safe Para assignments, and member-confirmed progress.",
    link: "/khatm",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <PublicHeader />
      <main id="main-content">
        <section className="border-b border-line">
          <div className="mx-auto grid max-w-[100rem] gap-12 px-4 py-14 sm:px-7 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-10 lg:py-24">
            <div>
              <p className="text-sm font-semibold text-accent">Quran Feham · قرآن فہم</p>
              <h1 className="mt-5 max-w-4xl text-[clamp(2.9rem,6vw,6.3rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-ink">
                Read the Quran.
                <br />
                Understand more of it.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
                A personal Quran comprehension, reading, recitation, and family-learning platform
                for people who can read Quranic Arabic and want its meaning to become familiar. Urdu
                is the first bridge.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
                >
                  Begin your journey <ArrowRight aria-hidden="true" size={19} />
                </Link>
                <Link
                  href="/quran"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 font-semibold text-ink hover:border-accent"
                >
                  <BookOpenText aria-hidden="true" size={19} /> Open Quran
                </Link>
              </div>
              <p className="mt-5 flex max-w-xl items-start gap-2 text-sm leading-6 text-muted">
                <ShieldCheck className="mt-0.5 shrink-0 text-accent" aria-hidden="true" size={18} />
                Quran, translation, teaching notes, and future AI explanations remain visibly
                separate and source-labelled.
              </p>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_28px_90px_rgb(24_37_31/0.12)]">
                <div className="border-b border-line px-6 py-5 sm:px-8">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                    One connected Quran journey
                  </p>
                </div>
                <ol className="divide-y divide-line">
                  {[
                    [Languages, "Morning", "Review 8 words", "Meaning becomes familiar"],
                    [BookOpenText, "Afternoon", "Continue Para 17", "Read with understanding"],
                    [Headphones, "Evening", "Practise Al-Mulk", "Listen, recall, recite"],
                    [UsersRound, "Together", "Family Khatm", "One shared completion"],
                  ].map(([Icon, time, action, outcome]) => {
                    const RowIcon = Icon as typeof Languages;
                    return (
                      <li
                        key={String(time)}
                        className="grid grid-cols-[2.75rem_1fr] gap-4 px-6 py-5 sm:grid-cols-[2.75rem_7rem_1fr] sm:items-center sm:px-8"
                      >
                        <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
                          <RowIcon aria-hidden="true" size={21} />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                          {String(time)}
                        </span>
                        <span>
                          <strong className="block text-lg">{String(action)}</strong>
                          <span className="mt-0.5 block text-sm text-muted">{String(outcome)}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <div className="bg-accent-soft px-6 py-7 text-center sm:px-8">
                  <p
                    className="font-quran text-4xl leading-[1.9] text-accent sm:text-5xl"
                    lang="ar"
                    dir="rtl"
                  >
                    وَقُل رَّبِّ زِدْنِي عِلْمًا
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    “My Lord, increase me in knowledge.” · 20:114
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface">
          <div className="mx-auto max-w-[100rem] px-4 py-16 sm:px-7 sm:py-24 lg:px-10">
            <div className="grid gap-8 border-b border-line pb-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                  The platform
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                  Four jobs. One mission.
                </h2>
              </div>
              <p className="max-w-3xl text-lg leading-8 text-muted">
                Every module should help the learner build a deeper and more direct relationship
                with the Quran. Features that do not serve understanding, reading, recitation, or
                shared completion do not belong in the core product.
              </p>
            </div>
            <ol className="divide-y divide-line">
              {pillars.map(({ icon: Icon, number, title, description, link }) => (
                <li
                  key={title}
                  className="grid gap-4 py-7 sm:grid-cols-[3rem_5rem_1fr_auto] sm:items-center lg:py-9"
                >
                  <Icon className="text-accent" aria-hidden="true" size={25} strokeWidth={1.7} />
                  <span className="text-sm font-semibold text-muted">{number}</span>
                  <div>
                    <h3 className="text-2xl font-semibold tracking-[-0.025em]">{title}</h3>
                    <p className="mt-2 max-w-3xl leading-7 text-muted">{description}</p>
                  </div>
                  <Link
                    href={link}
                    className="inline-flex min-h-11 items-center gap-2 font-semibold text-accent hover:underline"
                  >
                    Open {title} <ArrowRight aria-hidden="true" size={18} />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-line bg-canvas">
          <div className="mx-auto grid max-w-[100rem] gap-12 px-4 py-16 sm:px-7 sm:py-24 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-20 lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                Working today
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Keep the real product visible while the platform grows.
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted">
                The complete reader, prototype daily lessons, spaced review, listening practice,
                Explore, Salah, the deterministic tutor, and an authenticated Khatm Rooms beta are
                working paths. Advanced speech, 15-line Mushaf, and realtime push remain explicitly
                staged.
              </p>
              <Link
                href="/login"
                className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
              >
                Sign in <ArrowRight aria-hidden="true" size={18} />
              </Link>
            </div>
            <div className="divide-y divide-line border-y border-line">
              {[
                ["Live", "Read, learn, listen, Explore, Salah, and grounded Ask"],
                [
                  "Foundation",
                  "Accounts, secure sessions, reading sync, and transaction-safe Khatm Rooms",
                ],
                ["In development", "Khatm push updates, reminders, and cloud learning sync"],
                ["Planned", "15-line Mushaf, Quran ASR, Hifz hints, and Tajweed feedback"],
              ].map(([status, text]) => (
                <div key={status} className="grid gap-2 py-5 sm:grid-cols-[9rem_1fr] sm:gap-5">
                  <p className="text-sm font-semibold text-accent">{status}</p>
                  <p className="leading-7 text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-hero text-on-hero">
          <div className="mx-auto grid max-w-[100rem] gap-12 px-4 py-16 sm:px-7 sm:py-24 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9ed1bd]">
                Source hierarchy
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Know what came from where.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#c8d2cd]">
                Quran is not AI copy. Translation is not tafsir. A teaching explanation is not a
                scholarly ruling. Quran Feham keeps every authority layer named and traceable.
              </p>
              <Link
                href="/sources"
                className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-on-hero px-5 font-semibold text-hero hover:bg-[#e3efe8]"
              >
                Review sources <ArrowRight aria-hidden="true" size={18} />
              </Link>
            </div>
            <ol className="divide-y divide-white/15 border-y border-white/15">
              {[
                "Canonical Quran",
                "Named verified translation",
                "Approved tafsir",
                "Separate Hanafi note",
                "Quran Feham teaching explanation",
                "AI personalisation only when approved",
              ].map((label, index) => (
                <li key={label} className="flex min-h-14 items-center gap-4 py-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-white/25 text-xs">
                    {index + 1}
                  </span>
                  <span className="flex-1">{label}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
