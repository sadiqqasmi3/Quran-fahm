"use client";

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
import { useLocale } from "@/lib/i18n/locale-context";

const PILLARS_EN = [
  {
    icon: Languages,
    number: "01",
    title: "Understand",
    description:
      "Learn Quranic Arabic through Urdu meanings, high-frequency vocabulary, phrases, roots, listening, and spaced review.",
    link: "/learn",
    buttonText: "Open Learn",
  },
  {
    icon: BookOpenText,
    number: "02",
    title: "Read",
    description:
      "Use Quran Feham as your everyday Quran—with named translation, Qari audio, word learning, and your saved place.",
    link: "/quran",
    buttonText: "Open Quran",
  },
  {
    icon: Mic2,
    number: "03",
    title: "Recite",
    description:
      "Build listening comprehension now. Quran-specific live correction and Hifz assistance remain clearly staged work.",
    link: "/recite",
    buttonText: "Open Recite",
  },
  {
    icon: UsersRound,
    number: "04",
    title: "Together",
    description:
      "Create private family Khatms with invitations, conflict-safe Para assignments, and member-confirmed progress.",
    link: "/khatm",
    buttonText: "Open Khatm",
  },
];

const PILLARS_UR = [
  {
    icon: Languages,
    number: "۰۱",
    title: "فہم و لغت",
    description:
      "قرآن مجید میں کثرت سے آنے والے الفاظ، ان کے معنی، مادے (Roots) اور دہرائی کے ذریعے قرآنی عربی کا فہم حاصل کریں۔",
    link: "/learn",
    buttonText: "فہم و لغت کھولیں",
  },
  {
    icon: BookOpenText,
    number: "۰۲",
    title: "تلاوت و مطالعہ",
    description:
      "مستند اردو تراجم، قاری کی تلاوت، لفظی تفہیم اور اپنے آخری پڑھے ہوئے مقام سے تسلسل کے ساتھ تلاوت کریں۔",
    link: "/quran",
    buttonText: "قرآن ریڈر کھولیں",
  },
  {
    icon: Mic2,
    number: "۰۳",
    title: "سماعت و ترتیل",
    description:
      "نامور قراء کی آواز میں آیات سنیں، تلفظ درست کریں اور سماعت کے ذریعے قرآنی آیات کا ادراک پیدا کریں۔",
    link: "/recite",
    buttonText: "تلاوت کھولیں",
  },
  {
    icon: UsersRound,
    number: "۰۴",
    title: "مشترکہ ختم رومز",
    description:
      "اہل خانہ اور دوستوں کے لیے نجی ختم رومز بنائیں، پاروں کی شفاف تقسیم کریں اور مل کر قرآن مکمل کریں۔",
    link: "/khatm",
    buttonText: "ختم رومز کھولیں",
  },
];

export function LandingView() {
  const { locale } = useLocale();
  const isUr = locale === "ur";
  const pillars = isUr ? PILLARS_UR : PILLARS_EN;

  return (
    <div className="min-h-dvh bg-canvas">
      <PublicHeader />
      <main id="main-content">
        {/* Hero Section */}
        <section className="border-b border-line">
          <div className="mx-auto grid max-w-[100rem] gap-12 px-4 py-14 sm:px-7 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-10 lg:py-24">
            <div>
              <p className="text-sm font-semibold text-accent">
                {isUr ? "قرآن فہم · فہمِ قرآن کا آسان پلیٹ فارم" : "Quran Feham · قرآن فہم"}
              </p>
              <h1 className="mt-5 max-w-4xl text-[clamp(2.5rem,5.5vw,5.8rem)] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
                {isUr ? (
                  <>
                    قرآن مجید پڑھیں،
                    <br />
                    سمجھیں اور زندگی میں لائیں۔
                  </>
                ) : (
                  <>
                    Read the Quran.
                    <br />
                    Understand more of it.
                  </>
                )}
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
                {isUr
                  ? "ایک جامع، آسان اور مستند قرآنی پلیٹ فارم—جو روایتی تلاوت، لفظی تفہیم، ۱۵ سطری مصحف اور خاندانی ختم رومز کو ایک لڑی میں پروتا ہے۔ اردو زبان اس سفر کا سب سے مضبوط زینہ ہے۔"
                  : "A personal Quran comprehension, reading, recitation, and family-learning platform for people who can read Quranic Arabic and want its meaning to become familiar. Urdu is the first bridge."}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
                >
                  {isUr ? "اپنا سفر شروع کریں" : "Begin your journey"}{" "}
                  <ArrowRight aria-hidden="true" size={19} className={isUr ? "rotate-180" : ""} />
                </Link>
                <Link
                  href="/mushaf"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 font-semibold text-ink hover:border-accent"
                >
                  <BookOpenText aria-hidden="true" size={19} />
                  {isUr ? "۱۵ سطری مصحف کھولیں" : "Open 15-Line Mushaf"}
                </Link>
              </div>
              <p className="mt-5 flex max-w-xl items-start gap-2 text-sm leading-6 text-muted">
                <ShieldCheck
                  className="mt-0.5 shrink-0 text-accent"
                  aria-hidden="true"
                  size={18}
                />
                {isUr
                  ? "اصل کلامِ الٰہی، مستند اردو تراجم اور تعلیمی نکات مکمل سند کے ساتھ واضح درج ہیں۔"
                  : "Quran, translation, teaching notes, and explanations remain visibly separate and source-labelled."}
              </p>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_28px_90px_rgb(24_37_31/0.12)]">
                <div className="border-b border-line px-6 py-5 sm:px-8">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                    {isUr ? "روزمرہ سفرِ قرآن کا ایک مربوط نظام" : "One connected Quran journey"}
                  </p>
                </div>
                <ol className="divide-y divide-line">
                  {(isUr
                    ? [
                        [Languages, "صبح کا وقت", "۸ قرآنی الفاظ کی دہرائی", "معانی ذہن نشین ہوں گے"],
                        [BookOpenText, "دوپہر کا وقت", "پارہ ۱۷ جاری رکھیں", "بامعنی تلاوت کا لطف"],
                        [Headphones, "شام کا وقت", "سورۃ الملک کی سماعت", "سنیں، دہرائیں اور یاد کریں"],
                        [UsersRound, "اہل خانہ کے ساتھ", "خاندانی ختم روم", "ایک مشترکہ تکمیل کی سعادت"],
                      ]
                    : [
                        [Languages, "Morning", "Review 8 words", "Meaning becomes familiar"],
                        [BookOpenText, "Afternoon", "Continue Para 17", "Read with understanding"],
                        [Headphones, "Evening", "Practise Al-Mulk", "Listen, recall, recite"],
                        [UsersRound, "Together", "Family Khatm", "One shared completion"],
                      ]
                  ).map(([Icon, time, action, outcome]) => {
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
                    {isUr
                      ? "”اور دعا کیجیے کہ اے میرے رب، میرے علم میں اضافہ فرما۔“ · طٰہٰ: ۱۱۴"
                      : "“My Lord, increase me in knowledge.” · 20:114"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pillars Section */}
        <section className="bg-surface">
          <div className="mx-auto max-w-[100rem] px-4 py-16 sm:px-7 sm:py-24 lg:px-10">
            <div className="grid gap-8 border-b border-line pb-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                  {isUr ? "بنیادی ستون" : "The platform"}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                  {isUr ? "چار اہم مقاصد۔ ایک پلیٹ فارم۔" : "Four jobs. One mission."}
                </h2>
              </div>
              <p className="max-w-3xl text-lg leading-8 text-muted">
                {isUr
                  ? "پلیٹ فارم کا ہر فیچر قرآن مجید کے ساتھ سچے تعلق اور فہم کو گہرا کرنے کے لیے تیار کیا گیا ہے۔ تلاوت، حفظ، فہم اور مشترکہ تکمیل کے لیے ایک پرسکون اور اشتہار سے پاک ماحول۔"
                  : "Every module should help the learner build a deeper and more direct relationship with the Quran. Features that do not serve understanding, reading, recitation, or shared completion do not belong in the core product."}
              </p>
            </div>
            <ol className="divide-y divide-line">
              {pillars.map(({ icon: Icon, number, title, description, link, buttonText }) => (
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
                    {buttonText}{" "}
                    <ArrowRight
                      aria-hidden="true"
                      size={18}
                      className={isUr ? "rotate-180" : ""}
                    />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Live Features Section */}
        <section className="border-y border-line bg-canvas">
          <div className="mx-auto grid max-w-[100rem] gap-12 px-4 py-16 sm:px-7 sm:py-24 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-20 lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                {isUr ? "دسترس اور سہولیات" : "Working today"}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                {isUr
                  ? "آج ہی مستند اور رواں انداز میں تلاوت شروع کریں۔"
                  : "Keep the real product visible while the platform grows."}
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted">
                {isUr
                  ? "۱۵ سطری روایتی مصحف، روزانہ کے اسباق، لغت کی دہرائی، سمعی مشق، نماز کی دعاؤں کی تفہیم اور باہمی خاندانی ختم رومز اس وقت مکمل طور پر دستیاب ہیں۔"
                  : "The complete reader, 15-line traditional Mushaf, prototype daily lessons, spaced review, listening practice, Explore, Salah, and an authenticated Khatm Rooms beta are active working paths."}
              </p>
              <Link
                href="/login"
                className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
              >
                {isUr ? "سائن ان کریں" : "Sign in"}{" "}
                <ArrowRight aria-hidden="true" size={18} className={isUr ? "rotate-180" : ""} />
              </Link>
            </div>
            <div className="divide-y divide-line border-y border-line">
              {(isUr
                ? [
                    ["فعال", "۱۵ سطری مصحف، روزمرہ ریڈر، لغت، تلاش اور نماز کا فہم"],
                    ["بنیاد", "محفوظ لاگ ان، تلاوت کی پوزیشن کا بیک اپ اور شفاف ختم رومز"],
                    ["آف لائن", "انٹرنیٹ کے بغیر صفحات اور آخری پوزیشن کا محفوظ رہنا"],
                    ["رہنمائی", "پورٹل کے تمام ٹولز کے لیے تصویری و مرحلہ وار رہنمائی"],
                  ]
                : [
                    ["Live", "15-Line Mushaf, daily reader, vocabulary, Explore, and Salah"],
                    ["Foundation", "Accounts, secure sessions, reading sync, and Khatm Rooms"],
                    ["Offline", "PWA offline reading and local position caching without dropouts"],
                    ["Guide", "Step-by-step pictorial guides for all portal tools"],
                  ]
              ).map(([status, text]) => (
                <div key={status} className="grid gap-2 py-5 sm:grid-cols-[9rem_1fr] sm:gap-5">
                  <p className="text-sm font-semibold text-accent">{status}</p>
                  <p className="leading-7 text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sources Section */}
        <section className="bg-hero text-on-hero">
          <div className="mx-auto grid max-w-[100rem] gap-12 px-4 py-16 sm:px-7 sm:py-24 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9ed1bd]">
                {isUr ? "مآخذ اور اسناد کی شفافیت" : "Source hierarchy"}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                {isUr ? "ہر ماخذ اپنی سند کے ساتھ محفوظ۔" : "Know what came from where."}
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#c8d2cd]">
                {isUr
                  ? "کلامِ ربانی اور انسانی تراجم و تفاسیر کے مابین فرق کو ہمیشہ برقرار رکھا گیا ہے۔ ہر ترجمہ اور تفسیری نکتہ اپنے معتبر ماخذ سے منسوب ہے۔"
                  : "Quran is not AI copy. Translation is not tafsir. A teaching explanation is not a scholarly ruling. Quran Feham keeps every authority layer named and traceable."}
              </p>
              <Link
                href="/sources"
                className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-on-hero px-5 font-semibold text-hero hover:bg-[#e3efe8]"
              >
                {isUr ? "مآخذ و اسناد دیکھیں" : "Review sources"}{" "}
                <ArrowRight aria-hidden="true" size={18} className={isUr ? "rotate-180" : ""} />
              </Link>
            </div>
            <ol className="divide-y divide-white/15 border-y border-white/15">
              {(isUr
                ? [
                    "اصل کلامِ الٰہی (مصحفِ عثمانی)",
                    "معروف و مستند اردو تراجم (مولانا جالندھری، جوناگڑھی وغیرہ)",
                    "معتبر تفاسیر کا خلاصہ",
                    "حنفی فقہی نکات و احکام",
                    "قرآن فہم تعلیمی نوٹس اور لغوی وضاحتیں",
                    "مستند اور تصدیق شدہ علمی مواد",
                  ]
                : [
                    "Canonical Quran text",
                    "Named verified translations",
                    "Approved tafsir",
                    "Separate Hanafi notes",
                    "Quran Feham teaching explanations",
                    "Scholarly vetted and verified materials",
                  ]
              ).map((label, index) => (
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
