import type { Ayah, SurahSummary } from "@quran-feham/contracts";

export const PREVIEW_FATIHA_SUMMARY: SurahSummary = {
  number: 1,
  nameArabic: "الفاتحة",
  nameEnglish: "Al-Fatihah",
  nameTranslation: "The Opening",
  revelationType: "Meccan",
  ayahCount: 7,
};

export const PREVIEW_SURAHS: SurahSummary[] = [
  PREVIEW_FATIHA_SUMMARY,
  {
    number: 2,
    nameArabic: "البقرة",
    nameEnglish: "Al-Baqarah",
    nameTranslation: "The Cow",
    revelationType: "Medinan",
    ayahCount: 286,
  },
  {
    number: 36,
    nameArabic: "يس",
    nameEnglish: "Ya-Sin",
    nameTranslation: "Ya-Sin",
    revelationType: "Meccan",
    ayahCount: 83,
  },
  {
    number: 55,
    nameArabic: "الرحمن",
    nameEnglish: "Ar-Rahman",
    nameTranslation: "The Most Merciful",
    revelationType: "Medinan",
    ayahCount: 78,
  },
  {
    number: 67,
    nameArabic: "الملك",
    nameEnglish: "Al-Mulk",
    nameTranslation: "The Sovereignty",
    revelationType: "Meccan",
    ayahCount: 30,
  },
  {
    number: 112,
    nameArabic: "الإخلاص",
    nameEnglish: "Al-Ikhlas",
    nameTranslation: "Sincerity",
    revelationType: "Meccan",
    ayahCount: 4,
  },
  {
    number: 113,
    nameArabic: "الفلق",
    nameEnglish: "Al-Falaq",
    nameTranslation: "Daybreak",
    revelationType: "Meccan",
    ayahCount: 5,
  },
  {
    number: 114,
    nameArabic: "الناس",
    nameEnglish: "An-Nas",
    nameTranslation: "Mankind",
    revelationType: "Meccan",
    ayahCount: 6,
  },
];

export const PREVIEW_FATIHA: Ayah[] = [
  "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
  "الرَّحْمَٰنِ الرَّحِيمِ",
  "مَالِكِ يَوْمِ الدِّينِ",
  "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
  "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
  "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
].map((arabic, index) => ({
  surahNumber: 1,
  ayahNumber: index + 1,
  arabic,
}));

export const PREVIEW_NOTICE =
  "Interface preview: connect the versioned Quran API to load a published, source-attributed release.";
