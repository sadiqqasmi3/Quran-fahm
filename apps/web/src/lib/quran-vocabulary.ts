/**
 * Quran Feham — Learning Engine 2.0 Whole-Quran Vocabulary & Grammar Dataset
 *
 * Provides a structured, pedagogical progression covering ~50% of the Quran's
 * 77,430 word occurrences across 5 curriculum stages.
 */

export type CurriculumStage =
  | "salah"
  | "particles_pronouns"
  | "divine_attributes"
  | "core_verbs"
  | "phrases";

export interface QuranVocabItem {
  key: string;
  display: string;
  urdu: string;
  english: string;
  root: string | null;
  lemma: string;
  pos: "particle" | "pronoun" | "noun" | "verb";
  frequency: number;
  stage: CurriculumStage;
  exampleAyah: {
    surah: number;
    ayah: number;
    text: string;
    translationUrdu: string;
  };
}

export interface QuranicPhrase {
  id: string;
  arabic: string;
  urdu: string;
  english: string;
  surah: number;
  ayah: number;
  frequencyNote?: string;
  keyWords: readonly string[];
}

export interface GrammarPronounParadigm {
  person: "3rd" | "2nd" | "1st";
  number: "singular" | "plural" | "dual";
  gender: "masculine" | "feminine" | "common";
  detached: string;
  attached: string;
  meaningUrdu: string;
  meaningEnglish: string;
  example: {
    arabic: string;
    urdu: string;
    reference: string;
  };
}

export interface GrammarPrepositionItem {
  preposition: string;
  transliteration: string;
  meaningUrdu: string;
  meaningEnglish: string;
  frequency: number;
  example: {
    arabic: string;
    urdu: string;
    reference: string;
  };
}

export interface VerbConjugationPattern {
  root: string;
  past: string; // ماضي (e.g. قال)
  present: string; // مضارع (e.g. يقول)
  masdar: string; // مصدر (e.g. قَوْل)
  meaningUrdu: string;
  meaningEnglish: string;
  frequency: number;
  example: {
    pastExample: string;
    presentExample: string;
    reference: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HIGH-FREQUENCY QURAN VOCABULARY (~150 CORE LEMMAS)
// ─────────────────────────────────────────────────────────────────────────────

export const QURAN_VOCABULARY: readonly QuranVocabItem[] = [
  // ── STAGE 1: SALAH & DAILY DHIKR ──
  {
    key: "بسم",
    display: "بِسْمِ",
    urdu: "نام کے ساتھ",
    english: "In the name of",
    root: "سمو",
    lemma: "اسم",
    pos: "noun",
    frequency: 115,
    stage: "salah",
    exampleAyah: {
      surah: 1,
      ayah: 1,
      text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      translationUrdu: "شروع اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے",
    },
  },
  {
    key: "الله",
    display: "اللَّه",
    urdu: "اللہ",
    english: "Allah",
    root: "اله",
    lemma: "الله",
    pos: "noun",
    frequency: 2699,
    stage: "salah",
    exampleAyah: {
      surah: 1,
      ayah: 2,
      text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      translationUrdu: "سب تعریفیں اللہ ہی کے لیے ہیں جو تمام جہانوں کا پالنے والا ہے",
    },
  },
  {
    key: "الحمد",
    display: "الْحَمْدُ",
    urdu: "تمام تعریف و شکر",
    english: "All praise",
    root: "حمد",
    lemma: "حمد",
    pos: "noun",
    frequency: 43,
    stage: "salah",
    exampleAyah: {
      surah: 1,
      ayah: 2,
      text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      translationUrdu: "سب تعریفیں اللہ ہی کے لیے ہیں جو تمام جہانوں کا پالنے والا ہے",
    },
  },
  {
    key: "رب",
    display: "رَبّ",
    urdu: "پالنے والا / پروردگار",
    english: "Lord / Sustainer",
    root: "ربب",
    lemma: "رب",
    pos: "noun",
    frequency: 975,
    stage: "salah",
    exampleAyah: {
      surah: 1,
      ayah: 2,
      text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      translationUrdu: "سب تعریفیں اللہ ہی کے لیے ہیں جو تمام جہانوں کا پالنے والا ہے",
    },
  },
  {
    key: "الرحمن",
    display: "الرَّحْمَٰن",
    urdu: "بہت مہربان",
    english: "The Entirely Merciful",
    root: "رحم",
    lemma: "رحمن",
    pos: "noun",
    frequency: 57,
    stage: "salah",
    exampleAyah: {
      surah: 1,
      ayah: 3,
      text: "الرَّحْمَٰنِ الرَّحِيمِ",
      translationUrdu: "جو بڑا مہربان نہایت رحم فرمانے والا ہے",
    },
  },
  {
    key: "الرحيم",
    display: "الرَّحِيم",
    urdu: "نہایت رحم فرمانے والا",
    english: "The Especially Merciful",
    root: "رحم",
    lemma: "رحيم",
    pos: "noun",
    frequency: 114,
    stage: "salah",
    exampleAyah: {
      surah: 1,
      ayah: 3,
      text: "الرَّحْمَٰنِ الرَّحِيمِ",
      translationUrdu: "جو بڑا مہربان نہایت رحم فرمانے والا ہے",
    },
  },
  {
    key: "مالك",
    display: "مَالِك",
    urdu: "مالک",
    english: "Owner / Master",
    root: "ملك",
    lemma: "مالك",
    pos: "noun",
    frequency: 3,
    stage: "salah",
    exampleAyah: {
      surah: 1,
      ayah: 4,
      text: "مَالِكِ يَوْمِ الدِّينِ",
      translationUrdu: "بدلے کے دن کا مالک",
    },
  },
  {
    key: "يوم",
    display: "يَوْم",
    urdu: "دن",
    english: "Day",
    root: "يوم",
    lemma: "يوم",
    pos: "noun",
    frequency: 393,
    stage: "salah",
    exampleAyah: {
      surah: 1,
      ayah: 4,
      text: "مَالِكِ يَوْمِ الدِّينِ",
      translationUrdu: "بدلے کے دن کا مالک",
    },
  },
  {
    key: "الدين",
    display: "الدِّين",
    urdu: "جزا و سزا / دین",
    english: "Judgment / Religion",
    root: "دين",
    lemma: "دين",
    pos: "noun",
    frequency: 94,
    stage: "salah",
    exampleAyah: {
      surah: 1,
      ayah: 4,
      text: "مَالِكِ يَوْمِ الدِّينِ",
      translationUrdu: "بدلے کے دن کا مالک",
    },
  },
  {
    key: "إياك",
    display: "إِيَّاكَ",
    urdu: "صرف تجھ ہی کو",
    english: "You alone",
    root: "ايي",
    lemma: "إيا",
    pos: "pronoun",
    frequency: 24,
    stage: "salah",
    exampleAyah: {
      surah: 1,
      ayah: 5,
      text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      translationUrdu: "ہم تیری ہی عبادت کرتے ہیں اور تجھ ہی سے مدد مانگتے ہیں",
    },
  },
  {
    key: "نعبد",
    display: "نَعْبُدُ",
    urdu: "ہم عبادت کرتے ہیں",
    english: "We worship",
    root: "عبد",
    lemma: "عبد",
    pos: "verb",
    frequency: 143,
    stage: "salah",
    exampleAyah: {
      surah: 1,
      ayah: 5,
      text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      translationUrdu: "ہم تیری ہی عبادت کرتے ہیں اور تجھ ہی سے مدد مانگتے ہیں",
    },
  },
  {
    key: "نستعين",
    display: "نَسْتَعِينُ",
    urdu: "ہم مدد چاہتے ہیں",
    english: "We ask for help",
    root: "عون",
    lemma: "استعان",
    pos: "verb",
    frequency: 11,
    stage: "salah",
    exampleAyah: {
      surah: 1,
      ayah: 5,
      text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      translationUrdu: "ہم تیری ہی عبادت کرتے ہیں اور تجھ ہی سے مدد مانگتے ہیں",
    },
  },
  {
    key: "اهدنا",
    display: "اهْدِنَا",
    urdu: "ہمیں سیدھا رستہ دکھا",
    english: "Guide us",
    root: "هدي",
    lemma: "هداية",
    pos: "verb",
    frequency: 79,
    stage: "salah",
    exampleAyah: {
      surah: 1,
      ayah: 6,
      text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
      translationUrdu: "ہمیں سیدھی راہ دکھا",
    },
  },
  {
    key: "الصراط",
    display: "الصِّرَاط",
    urdu: "راستہ",
    english: "Path / Way",
    root: "صرط",
    lemma: "صراط",
    pos: "noun",
    frequency: 45,
    stage: "salah",
    exampleAyah: {
      surah: 1,
      ayah: 6,
      text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
      translationUrdu: "ہمیں سیدھی راہ دکھا",
    },
  },
  {
    key: "المستقيم",
    display: "الْمُسْتَقِيم",
    urdu: "سیدھا",
    english: "Straight",
    root: "قوم",
    lemma: "مستقيم",
    pos: "noun",
    frequency: 37,
    stage: "salah",
    exampleAyah: {
      surah: 1,
      ayah: 6,
      text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
      translationUrdu: "ہمیں سیدھی راہ دکھا",
    },
  },
  {
    key: "سبحان",
    display: "سُبْحَانَ",
    urdu: "پاک ہے",
    english: "Glory be to",
    root: "سبح",
    lemma: "سبحان",
    pos: "noun",
    frequency: 41,
    stage: "salah",
    exampleAyah: {
      surah: 17,
      ayah: 1,
      text: "سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ",
      translationUrdu: "پاک ہے وہ ذات جو لے گئی اپنے بندے کو راتوں رات",
    },
  },
  {
    key: "العظيم",
    display: "الْعَظِيم",
    urdu: "بڑی عظمت والا",
    english: "The Magnificent / Most Great",
    root: "عظم",
    lemma: "عظيم",
    pos: "noun",
    frequency: 107,
    stage: "salah",
    exampleAyah: {
      surah: 2,
      ayah: 255,
      text: "وَهُوَ الْعَلِيُّ الْعَظِيمُ",
      translationUrdu: "اور وہی بلند وبالا اور بڑی عظمت والا ہے",
    },
  },
  {
    key: "الأعلى",
    display: "الْأَعْلَىٰ",
    urdu: "سب سے بلند",
    english: "The Most High",
    root: "علو",
    lemma: "أعلى",
    pos: "noun",
    frequency: 18,
    stage: "salah",
    exampleAyah: {
      surah: 87,
      ayah: 1,
      text: "سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى",
      translationUrdu: "اپنے پروردگار کے نام کی تسبیح کیجیے جو سب سے بلند ہے",
    },
  },
  {
    key: "سمع",
    display: "سَمِعَ",
    urdu: "اس نے سنا",
    english: "He heard",
    root: "سمع",
    lemma: "سمع",
    pos: "verb",
    frequency: 185,
    stage: "salah",
    exampleAyah: {
      surah: 2,
      ayah: 181,
      text: "فَمَنْ بَدَّلَهُ بَعْدَمَا سَمِعَهُ",
      translationUrdu: "پھر جس نے اسے سننے کے بعد بدل ڈالا",
    },
  },
  {
    key: "قل",
    display: "قُلْ",
    urdu: "کہہ دیجیے / فرما دیں",
    english: "Say",
    root: "قول",
    lemma: "قال",
    pos: "verb",
    frequency: 332,
    stage: "salah",
    exampleAyah: {
      surah: 112,
      ayah: 1,
      text: "قُلْ هُوَ اللَّهُ أَحَدٌ",
      translationUrdu: "فرما دیجیے: وہ اللہ ایک ہے",
    },
  },
  {
    key: "أحد",
    display: "أَحَدٌ",
    urdu: "یکتا / اکیلا",
    english: "One / Unique",
    root: "احد",
    lemma: "أحد",
    pos: "noun",
    frequency: 85,
    stage: "salah",
    exampleAyah: {
      surah: 112,
      ayah: 1,
      text: "قُلْ هُوَ اللَّهُ أَحَدٌ",
      translationUrdu: "فرما دیجیے: وہ اللہ ایک ہے",
    },
  },
  {
    key: "الصمد",
    display: "الصَّمَدُ",
    urdu: "بے نیاز / سب کا سہارا",
    english: "The Eternal Refuge",
    root: "صمد",
    lemma: "صمد",
    pos: "noun",
    frequency: 1,
    stage: "salah",
    exampleAyah: {
      surah: 112,
      ayah: 2,
      text: "اللَّهُ الصَّمَدُ",
      translationUrdu: "اللہ سب سے بے نیاز ہے",
    },
  },
  {
    key: "أعوذ",
    display: "أَعُوذُ",
    urdu: "میں پناہ مانگتا ہوں",
    english: "I seek refuge",
    root: "عوذ",
    lemma: "عاذ",
    pos: "verb",
    frequency: 17,
    stage: "salah",
    exampleAyah: {
      surah: 113,
      ayah: 1,
      text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
      translationUrdu: "کہہ دیجیے کہ میں صبح کے رب کی پناہ مانگتا ہوں",
    },
  },
  {
    key: "الفلق",
    display: "الْفَلَق",
    urdu: "صبح / پھوٹ نکلنا",
    english: "Daybreak",
    root: "فلق",
    lemma: "فلق",
    pos: "noun",
    frequency: 1,
    stage: "salah",
    exampleAyah: {
      surah: 113,
      ayah: 1,
      text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
      translationUrdu: "کہہ دیجیے کہ میں صبح کے رب کی پناہ مانگتا ہوں",
    },
  },
  {
    key: "شر",
    display: "شَرّ",
    urdu: "برائی / شر",
    english: "Evil / Harm",
    root: "شرر",
    lemma: "شر",
    pos: "noun",
    frequency: 31,
    stage: "salah",
    exampleAyah: {
      surah: 113,
      ayah: 2,
      text: "مِنْ شَرِّ مَا خَلَقَ",
      translationUrdu: "ہر اس چیز کی برائی سے جو اس نے پیدا فرمائی",
    },
  },
  {
    key: "الناس",
    display: "النَّاس",
    urdu: "لوگ / انسان",
    english: "Mankind / People",
    root: "نوس",
    lemma: "ناس",
    pos: "noun",
    frequency: 241,
    stage: "salah",
    exampleAyah: {
      surah: 114,
      ayah: 1,
      text: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
      translationUrdu: "کہہ دیجیے کہ میں انسانوں کے رب کی پناہ مانگتا ہوں",
    },
  },

  // ── STAGE 2: CORE PARTICLES & PRONOUNS (Over 40% of Quran word tokens) ──
  {
    key: "من",
    display: "مِنْ",
    urdu: "سے",
    english: "From",
    root: null,
    lemma: "من",
    pos: "particle",
    frequency: 3226,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 20,
      text: "يَكَادُ الْبَرْقُ يَخْطَفُ أَبْصَارَهُمْ",
      translationUrdu: "قریب ہے کہ بجلی ان کی آنکھیں اچک لے",
    },
  },
  {
    key: "في",
    display: "فِي",
    urdu: "میں / اندر",
    english: "In",
    root: null,
    lemma: "في",
    pos: "particle",
    frequency: 1701,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 2,
      text: "لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِلْمُتَّقِينَ",
      translationUrdu: "اس میں کوئی شک نہیں، ہدایت ہے پرہیزگاروں کے لیے",
    },
  },
  {
    key: "على",
    display: "عَلَىٰ",
    urdu: "پر",
    english: "Upon / On",
    root: null,
    lemma: "على",
    pos: "particle",
    frequency: 1445,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 5,
      text: "أُولَٰئِكَ عَلَىٰ هُدًى مِنْ رَبِّهِمْ",
      translationUrdu: "وہی لوگ اپنے رب کی طرف سے ہدایت پر ہیں",
    },
  },
  {
    key: "إلى",
    display: "إِلَىٰ",
    urdu: "کی طرف",
    english: "To / Towards",
    root: null,
    lemma: "إلى",
    pos: "particle",
    frequency: 742,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 28,
      text: "ثُمَّ إِلَيْهِ تُرْجَعُونَ",
      translationUrdu: "پھر اسی کی طرف تم لوٹائے جاؤ گے",
    },
  },
  {
    key: "عن",
    display: "عَنْ",
    urdu: "سے / متعلق",
    english: "About / From",
    root: null,
    lemma: "عن",
    pos: "particle",
    frequency: 465,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 48,
      text: "لَا تَجْزِي نَفْسٌ عَنْ نَفْسٍ شَيْئًا",
      translationUrdu: "کوئی جان کسی جان کے کچھ کام نہ آئے گی",
    },
  },
  {
    key: "ما",
    display: "مَا",
    urdu: "جو / کیا / نہیں",
    english: "What / Not / That which",
    root: null,
    lemma: "ما",
    pos: "particle",
    frequency: 2615,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 4,
      text: "وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنْزِلَ إِلَيْكَ",
      translationUrdu: "اور وہ لوگ جو ایمان لاتے ہیں اس پر جو آپ کی طرف نازل کیا گیا",
    },
  },
  {
    key: "لا",
    display: "لَا",
    urdu: "نہیں",
    english: "No / Not",
    root: null,
    lemma: "لا",
    pos: "particle",
    frequency: 1726,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 2,
      text: "لَا رَيْبَ فِيهِ",
      translationUrdu: "اس میں کوئی شک نہیں",
    },
  },
  {
    key: "إن",
    display: "إِنَّ",
    urdu: "بے شک / یقیناً",
    english: "Indeed / Truly",
    root: null,
    lemma: "إن",
    pos: "particle",
    frequency: 1533,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 6,
      text: "إِنَّ الَّذِينَ كَفَرُوا سَوَاءٌ عَلَيْهِمْ",
      translationUrdu: "بے شک جن لوگوں نے کفر کیا ان پر برابر ہے",
    },
  },
  {
    key: "أن",
    display: "أَنَّ",
    urdu: "کہ / بے شک کہ",
    english: "That",
    root: null,
    lemma: "أن",
    pos: "particle",
    frequency: 669,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 26,
      text: "فَيَعْلَمُونَ أَنَّهُ الْحَقُّ مِنْ رَبِّهِمْ",
      translationUrdu: "تو وہ جانتے ہیں کہ بے شک یہ ان کے رب کی طرف سے حق ہے",
    },
  },
  {
    key: "إذا",
    display: "إِذَا",
    urdu: "جب / جب کبھی",
    english: "When",
    root: null,
    lemma: "إذا",
    pos: "particle",
    frequency: 414,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 110,
      ayah: 1,
      text: "إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ",
      translationUrdu: "جب اللہ کی مدد اور فتح آ پہنچے",
    },
  },
  {
    key: "هو",
    display: "هُوَ",
    urdu: "وہ (ایک مرد)",
    english: "He",
    root: null,
    lemma: "هو",
    pos: "pronoun",
    frequency: 481,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 112,
      ayah: 1,
      text: "قُلْ هُوَ اللَّهُ أَحَدٌ",
      translationUrdu: "فرما دیجیے: وہ اللہ ایک ہے",
    },
  },
  {
    key: "هم",
    display: "هُمْ",
    urdu: "وہ سب",
    english: "They",
    root: null,
    lemma: "هم",
    pos: "pronoun",
    frequency: 442,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 5,
      text: "وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ",
      translationUrdu: "اور وہی لوگ فلاح پانے والے ہیں",
    },
  },
  {
    key: "أنت",
    display: "أَنْتَ",
    urdu: "تو / آپ (ایک)",
    english: "You (singular)",
    root: null,
    lemma: "أنت",
    pos: "pronoun",
    frequency: 81,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 32,
      text: "إِنَّكَ أَنْتَ الْعَلِيمُ الْحَكِيمُ",
      translationUrdu: "بے شک تو ہی بڑا علم والا بڑی حکمت والا ہے",
    },
  },
  {
    key: "أنتم",
    display: "أَنْتُمْ",
    urdu: "تم سب",
    english: "You (plural)",
    root: null,
    lemma: "أنتم",
    pos: "pronoun",
    frequency: 135,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 22,
      text: "فَلَا تَجْعَلُوا لِلَّهِ أَنْدَادًا وَأَنْتُمْ تَعْلَمُونَ",
      translationUrdu: "پس تم اللہ کے لیے شریک نہ ٹھہراؤ جبکہ تم جانتے ہو",
    },
  },
  {
    key: "نحن",
    display: "نَحْنُ",
    urdu: "ہم",
    english: "We",
    root: null,
    lemma: "نحن",
    pos: "pronoun",
    frequency: 86,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 11,
      text: "قَالُوا إِنَّمَا نَحْنُ مُصْلِحُونَ",
      translationUrdu: "وہ کہتے ہیں: ہم تو صرف اصلاح کرنے والے ہیں",
    },
  },
  {
    key: "هذا",
    display: "هَٰذَا",
    urdu: "یہ",
    english: "This",
    root: null,
    lemma: "هذا",
    pos: "pronoun",
    frequency: 520,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 26,
      text: "مَاذَا أَرَادَ اللَّهُ بِهَٰذَا مَثَلًا",
      translationUrdu: "اللہ نے اس مثال سے کیا ارادہ فرمایا ہے",
    },
  },
  {
    key: "ذلك",
    display: "ذَٰلِكَ",
    urdu: "وہ",
    english: "That",
    root: null,
    lemma: "ذلك",
    pos: "pronoun",
    frequency: 520,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 2,
      text: "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ",
      translationUrdu: "یہ وہ کتاب ہے جس میں کوئی شک نہیں",
    },
  },
  {
    key: "أولئك",
    display: "أُولَٰئِكَ",
    urdu: "وہی لوگ",
    english: "Those (people)",
    root: null,
    lemma: "أولئك",
    pos: "pronoun",
    frequency: 205,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 5,
      text: "أُولَٰئِكَ عَلَىٰ هُدًى مِنْ رَبِّهِمْ",
      translationUrdu: "وہی لوگ اپنے رب کی طرف سے ہدایت پر ہیں",
    },
  },
  {
    key: "الذي",
    display: "الَّذِي",
    urdu: "وہ جو / جس نے",
    english: "The one who",
    root: null,
    lemma: "الذي",
    pos: "pronoun",
    frequency: 304,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 21,
      text: "اعْبُدُوا رَبَّكُمُ الَّذِي خَلَقَكُمْ",
      translationUrdu: "اپنے اس رب کی بندگی کرو جس نے تمہیں پیدا فرمایا",
    },
  },
  {
    key: "الذين",
    display: "الَّذِينَ",
    urdu: "وہ لوگ جو",
    english: "Those who",
    root: null,
    lemma: "الذين",
    pos: "pronoun",
    frequency: 1080,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 3,
      text: "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ",
      translationUrdu: "وہ لوگ جو غیب پر ایمان لاتے ہیں",
    },
  },
  {
    key: "كل",
    display: "كُلّ",
    urdu: "ہر ایک / تمام",
    english: "Every / All",
    root: "كلل",
    lemma: "كل",
    pos: "noun",
    frequency: 377,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 20,
      text: "إِنَّ اللَّهَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
      translationUrdu: "بے شک اللہ ہر چیز پر قادر ہے",
    },
  },
  {
    key: "مع",
    display: "مَعَ",
    urdu: "ساتھ",
    english: "With",
    root: null,
    lemma: "مع",
    pos: "particle",
    frequency: 161,
    stage: "particles_pronouns",
    exampleAyah: {
      surah: 2,
      ayah: 153,
      text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
      translationUrdu: "بے شک اللہ صبر کرنے والوں کے ساتھ ہے",
    },
  },

  // ── STAGE 3: DIVINE ATTRIBUTES & COMMON NOUNS ──
  {
    key: "عليم",
    display: "عَلِيم",
    urdu: "سب جاننے والا",
    english: "All-Knowing",
    root: "علم",
    lemma: "عليم",
    pos: "noun",
    frequency: 157,
    stage: "divine_attributes",
    exampleAyah: {
      surah: 2,
      ayah: 29,
      text: "وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ",
      translationUrdu: "اور وہ ہر چیز کا خوب جاننے والا ہے",
    },
  },
  {
    key: "حكيم",
    display: "حَكِيم",
    urdu: "بڑی حکمت والا",
    english: "All-Wise",
    root: "حكم",
    lemma: "حكيم",
    pos: "noun",
    frequency: 97,
    stage: "divine_attributes",
    exampleAyah: {
      surah: 2,
      ayah: 32,
      text: "إِنَّكَ أَنْتَ الْعَلِيمُ الْحَكِيمُ",
      translationUrdu: "بے شک تو ہی بڑا علم والا بڑی حکمت والا ہے",
    },
  },
  {
    key: "غفور",
    display: "غَفُور",
    urdu: "بہت بخشنے والا",
    english: "Forgiving",
    root: "غفر",
    lemma: "غفور",
    pos: "noun",
    frequency: 91,
    stage: "divine_attributes",
    exampleAyah: {
      surah: 2,
      ayah: 173,
      text: "إِنَّ اللَّهَ غَفُورٌ رَحِيمٌ",
      translationUrdu: "بے شک اللہ بڑا بخشنے والا نہایت رحم فرمانے والا ہے",
    },
  },
  {
    key: "قدير",
    display: "قَدِير",
    urdu: "بڑی قدرت والا",
    english: "All-Powerful",
    root: "قدر",
    lemma: "قدير",
    pos: "noun",
    frequency: 45,
    stage: "divine_attributes",
    exampleAyah: {
      surah: 2,
      ayah: 20,
      text: "إِنَّ اللَّهَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
      translationUrdu: "بے شک اللہ ہر چیز پر قادر ہے",
    },
  },
  {
    key: "سميع",
    display: "سَمِيع",
    urdu: "خوب سننے والا",
    english: "All-Hearing",
    root: "سمع",
    lemma: "سميع",
    pos: "noun",
    frequency: 47,
    stage: "divine_attributes",
    exampleAyah: {
      surah: 2,
      ayah: 127,
      text: "إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ",
      translationUrdu: "بے شک تو ہی خوب سننے والا خوب جاننے والا ہے",
    },
  },
  {
    key: "بصير",
    display: "بَصِير",
    urdu: "خوب دیکھنے والا",
    english: "All-Seeing",
    root: "بصر",
    lemma: "بصير",
    pos: "noun",
    frequency: 51,
    stage: "divine_attributes",
    exampleAyah: {
      surah: 2,
      ayah: 96,
      text: "وَاللَّهُ بَصِيرٌ بِمَا يَعْمَلُونَ",
      translationUrdu: "اور اللہ ان کے اعمال کو خوب دیکھ رہا ہے",
    },
  },
  {
    key: "كتاب",
    display: "كِتَاب",
    urdu: "کتاب / نوشتہ",
    english: "Book / Scripture",
    root: "كتب",
    lemma: "كتاب",
    pos: "noun",
    frequency: 261,
    stage: "divine_attributes",
    exampleAyah: {
      surah: 2,
      ayah: 2,
      text: "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ",
      translationUrdu: "یہ وہ کتاب ہے جس میں کوئی شک نہیں",
    },
  },
  {
    key: "آية",
    display: "آيَة",
    urdu: "نشانی / آیت",
    english: "Sign / Verse",
    root: "ايي",
    lemma: "آية",
    pos: "noun",
    frequency: 382,
    stage: "divine_attributes",
    exampleAyah: {
      surah: 2,
      ayah: 106,
      text: "مَا نَنْسَخْ مِنْ آيَةٍ أَوْ نُنْسِهَا",
      translationUrdu: "ہم جب کوئی آیت منسوخ کرتے ہیں یا بھلا دیتے ہیں",
    },
  },
  {
    key: "حق",
    display: "حَقّ",
    urdu: "حق / سچ",
    english: "Truth / Right",
    root: "حقق",
    lemma: "حق",
    pos: "noun",
    frequency: 247,
    stage: "divine_attributes",
    exampleAyah: {
      surah: 2,
      ayah: 26,
      text: "فَيَعْلَمُونَ أَنَّهُ الْحَقُّ مِنْ رَبِّهِمْ",
      translationUrdu: "پس وہ جانتے ہیں کہ بے شک یہ ان کے رب کی طرف سے حق ہے",
    },
  },
  {
    key: "خير",
    display: "خَيْر",
    urdu: "بھلائی / بہتر",
    english: "Good / Better",
    root: "خير",
    lemma: "خير",
    pos: "noun",
    frequency: 188,
    stage: "divine_attributes",
    exampleAyah: {
      surah: 2,
      ayah: 184,
      text: "وَأَنْ تَصُومُوا خَيْرٌ لَكُمْ",
      translationUrdu: "اور تمہارا روزہ رکھنا تمہارے لیے بہتر ہے",
    },
  },
  {
    key: "عذاب",
    display: "عَذَاب",
    urdu: "عذاب / سزا",
    english: "Punishment / Torment",
    root: "عذب",
    lemma: "عذاب",
    pos: "noun",
    frequency: 322,
    stage: "divine_attributes",
    exampleAyah: {
      surah: 2,
      ayah: 7,
      text: "وَلَهُمْ عَذَابٌ عَظِيمٌ",
      translationUrdu: "اور ان کے لیے بہت بڑا عذاب ہے",
    },
  },
  {
    key: "جنة",
    display: "جَنَّة",
    urdu: "جنت / باغ",
    english: "Paradise / Garden",
    root: "جنن",
    lemma: "جنة",
    pos: "noun",
    frequency: 147,
    stage: "divine_attributes",
    exampleAyah: {
      surah: 2,
      ayah: 25,
      text: "أَنَّ لَهُمْ جَنَّاتٍ تَجْرِي مِنْ تَحْتِهَا الْأَنْهَارُ",
      translationUrdu: "کہ ان کے لیے ایسے باغات ہیں جن کے نیچے نہریں بہتی ہیں",
    },
  },
  {
    key: "نار",
    display: "نَار",
    urdu: "آگ / دوزخ",
    english: "Fire / Hellfire",
    root: "نور",
    lemma: "نار",
    pos: "noun",
    frequency: 145,
    stage: "divine_attributes",
    exampleAyah: {
      surah: 2,
      ayah: 24,
      text: "فَاتَّقُوا النَّارَ الَّتِي وَقُودُهَا النَّاسُ وَالْحِجَارَةُ",
      translationUrdu: "پس اس آگ سے بچو جس کا ایندھن انسان اور پتھر ہیں",
    },
  },
  {
    key: "رسول",
    display: "رَسُول",
    urdu: "پیغمبر / رسول",
    english: "Messenger",
    root: "رسل",
    lemma: "رسول",
    pos: "noun",
    frequency: 332,
    stage: "divine_attributes",
    exampleAyah: {
      surah: 2,
      ayah: 101,
      text: "وَلَمَّا جَاءَهُمْ رَسُولٌ مِنْ عِنْدِ اللَّهِ",
      translationUrdu: "اور جب ان کے پاس اللہ کی طرف سے ایک رسول آیا",
    },
  },

  // ── STAGE 4: HIGH-FREQUENCY VERBS ──
  {
    key: "قال",
    display: "قَالَ",
    urdu: "اس نے کہا",
    english: "He said",
    root: "قول",
    lemma: "قال",
    pos: "verb",
    frequency: 1722,
    stage: "core_verbs",
    exampleAyah: {
      surah: 2,
      ayah: 30,
      text: "وَإِذْ قَالَ رَبُّكَ لِلْمَلَائِكَةِ",
      translationUrdu: "اور جب آپ کے رب نے فرشتوں سے فرمایا",
    },
  },
  {
    key: "كان",
    display: "كَانَ",
    urdu: "وہ تھا / وہ ہے",
    english: "He was / Is",
    root: "كون",
    lemma: "كان",
    pos: "verb",
    frequency: 1358,
    stage: "core_verbs",
    exampleAyah: {
      surah: 2,
      ayah: 34,
      text: "وَكَانَ مِنَ الْكَافِرِينَ",
      translationUrdu: "اور وہ کافروں میں سے ہو گیا",
    },
  },
  {
    key: "آمن",
    display: "آمَنَ",
    urdu: "وہ ایمان لایا",
    english: "He believed",
    root: "امن",
    lemma: "آمن",
    pos: "verb",
    frequency: 537,
    stage: "core_verbs",
    exampleAyah: {
      surah: 2,
      ayah: 13,
      text: "وَإِذَا قِيلَ لَهُمْ آمِنُوا كَمَا آمَنَ النَّاسُ",
      translationUrdu: "اور جب ان سے کہا جاتا ہے کہ ایمان لاؤ جیسے دوسرے لوگ لائے ہیں",
    },
  },
  {
    key: "علم",
    display: "عَلِمَ",
    urdu: "اس نے جانا / وہ جان گیا",
    english: "He knew",
    root: "علم",
    lemma: "علم",
    pos: "verb",
    frequency: 382,
    stage: "core_verbs",
    exampleAyah: {
      surah: 2,
      ayah: 31,
      text: "وَعَلَّمَ آدَمَ الْأَسْمَاءَ كُلَّهَا",
      translationUrdu: "اور اس نے آدم کو تمام نام سکھا دیے",
    },
  },
  {
    key: "جعل",
    display: "جَعَلَ",
    urdu: "اس نے بنایا / مقرر کیا",
    english: "He made / He set",
    root: "جعل",
    lemma: "جعل",
    pos: "verb",
    frequency: 346,
    stage: "core_verbs",
    exampleAyah: {
      surah: 2,
      ayah: 22,
      text: "الَّذِي جَعَلَ لَكُمُ الْأَرْضَ فِرَاشًا",
      translationUrdu: "جس نے تمہارے لیے زمین کو بچھونا بنایا",
    },
  },
  {
    key: "خلق",
    display: "خَلَقَ",
    urdu: "اس نے پیدا فرمایا",
    english: "He created",
    root: "خلق",
    lemma: "خلق",
    pos: "verb",
    frequency: 248,
    stage: "core_verbs",
    exampleAyah: {
      surah: 2,
      ayah: 21,
      text: "اعْبُدُوا رَبَّكُمُ الَّذِي خَلَقَكُمْ",
      translationUrdu: "اپنے رب کی عبادت کرو جس نے تمہیں پیدا کیا",
    },
  },
  {
    key: "كفر",
    display: "كَفَرَ",
    urdu: "اس نے انکار کیا / کفر کیا",
    english: "He disbelieved",
    root: "کفر",
    lemma: "كفر",
    pos: "verb",
    frequency: 461,
    stage: "core_verbs",
    exampleAyah: {
      surah: 2,
      ayah: 6,
      text: "إِنَّ الَّذِينَ كَفَرُوا سَوَاءٌ عَلَيْهِمْ",
      translationUrdu: "بے شک جن لوگوں نے کفر کیا ان پر برابر ہے",
    },
  },
  {
    key: "عمل",
    display: "عَمِلَ",
    urdu: "اس نے عمل کیا",
    english: "He did / He worked",
    root: "عمل",
    lemma: "عمل",
    pos: "verb",
    frequency: 318,
    stage: "core_verbs",
    exampleAyah: {
      surah: 2,
      ayah: 25,
      text: "وَبَشِّرِ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ",
      translationUrdu: "اور خوشخبری دے دیجیے ان لوگوں کو جو ایمان لائے اور نیک عمل کیے",
    },
  },
  {
    key: "أنزل",
    display: "أَنْزَلَ",
    urdu: "اس نے نازل فرمایا",
    english: "He sent down / Revealed",
    root: "نزل",
    lemma: "أنزل",
    pos: "verb",
    frequency: 262,
    stage: "core_verbs",
    exampleAyah: {
      surah: 2,
      ayah: 4,
      text: "وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنْزِلَ إِلَيْكَ",
      translationUrdu: "اور وہ جو ایمان لاتے ہیں اس پر جو آپ پر اتارا گیا",
    },
  },
  {
    key: "هدى",
    display: "هَدَىٰ",
    urdu: "اس نے ہدایت دی",
    english: "He guided",
    root: "هدي",
    lemma: "هدى",
    pos: "verb",
    frequency: 144,
    stage: "core_verbs",
    exampleAyah: {
      surah: 2,
      ayah: 142,
      text: "يَهْدِي مَنْ يَشَاءُ إِلَىٰ صِرَاطٍ مُسْتَقِيمٍ",
      translationUrdu: "وہ جسے چاہتا ہے سیدھے راستے کی ہدایت دیتا ہے",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. FORMULAIC QURANIC PHRASES (Recurring Sentences & Chunks)
// ─────────────────────────────────────────────────────────────────────────────

export const QURANIC_PHRASES: readonly QuranicPhrase[] = [
  {
    id: "bismillah",
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    urdu: "اللہ کے نام سے جو نہایت مہربان بہت رحم فرمانے والا ہے",
    english: "In the name of Allah, the Entirely Merciful, the Especially Merciful",
    surah: 1,
    ayah: 1,
    frequencyNote: "Recited at the start of 113 Surahs",
    keyWords: ["بسم", "الله", "الرحمن", "الرحيم"],
  },
  {
    id: "inna-allaha-ma-as-sabirin",
    arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    urdu: "بے شک اللہ صبر کرنے والوں کے ساتھ ہے",
    english: "Indeed, Allah is with the patient",
    surah: 2,
    ayah: 153,
    frequencyNote: "Repeated recurring Quranic promise",
    keyWords: ["إن", "الله", "مع", "الصابرين"],
  },
  {
    id: "ya-ayyuha-alladhina-amanu",
    arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا",
    urdu: "اے ایمان والو!",
    english: "O you who have believed!",
    surah: 2,
    ayah: 104,
    frequencyNote: "Occurs 89 times in the Quran",
    keyWords: ["الذين", "آمنوا"],
  },
  {
    id: "inna-allaha-ghafurun-rahim",
    arabic: "إِنَّ اللَّهَ غَفُورٌ رَحِيمٌ",
    urdu: "بے شک اللہ بڑا بخشنے والا نہایت رحم فرمانے والا ہے",
    english: "Indeed, Allah is Forgiving and Merciful",
    surah: 2,
    ayah: 173,
    frequencyNote: "Occurs over 70 times across the Quran",
    keyWords: ["إن", "الله", "غفور", "رحيم"],
  },
  {
    id: "wa-huwa-ala-kulli-shayin-qadir",
    arabic: "وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    urdu: "اور وہ ہر چیز پر پوری قدرت رکھنے والا ہے",
    english: "And He is over all things competent",
    surah: 5,
    ayah: 120,
    frequencyNote: "Core declaration of Allah's omnipotence",
    keyWords: ["هو", "على", "كل", "قدير"],
  },
  {
    id: "rabbana-atina-fid-dunya",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",
    urdu: "اے ہمارے رب! ہمیں دنیا میں بھی بھلائی عطا فرما اور آخرت میں بھی بھلائی",
    english: "Our Lord, give us in this world good and in the Hereafter good",
    surah: 2,
    ayah: 201,
    frequencyNote: "The comprehensive Quranic prayer",
    keyWords: ["رب", "في", "الدنيا", "حسنة"],
  },
  {
    id: "alhamdulillah-rabbil-alamin",
    arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    urdu: "تمام تعریفیں اللہ ہی کے لیے ہیں جو تمام جہانوں کا پروردگار ہے",
    english: "All praise is due to Allah, Lord of the worlds",
    surah: 1,
    ayah: 2,
    frequencyNote: "Recited in every unit of prayer",
    keyWords: ["الحمد", "الله", "رب", "العالمين"],
  },
  {
    id: "iyyaka-nabudu-wa-iyyaka-nastain",
    arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    urdu: "ہم تیری ہی عبادت کرتے ہیں اور تجھ ہی سے مدد مانگتے ہیں",
    english: "It is You we worship and You we ask for help",
    surah: 1,
    ayah: 5,
    frequencyNote: "The heart of Surah Al-Fatihah",
    keyWords: ["إياك", "نعبد", "نستعين"],
  },
  {
    id: "subhana-rabbiyal-azim",
    arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
    urdu: "پاک ہے میرا پروردگار جو بڑی عظمت والا ہے",
    english: "Glory be to my Lord, the Magnificent",
    surah: 56,
    ayah: 74,
    frequencyNote: "Salah Ruku Tasbih",
    keyWords: ["سبحان", "رب", "العظيم"],
  },
  {
    id: "subhana-rabbiyal-ala",
    arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَىٰ",
    urdu: "پاک ہے میرا پروردگار جو سب سے بلند ہے",
    english: "Glory be to my Lord, the Most High",
    surah: 87,
    ayah: 1,
    frequencyNote: "Salah Sujood Tasbih",
    keyWords: ["سبحان", "رب", "الأعلى"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. GRAMMAR DISCOVERY PARADIGMS
// ─────────────────────────────────────────────────────────────────────────────

export const PRONOUN_PARADIGMS: readonly GrammarPronounParadigm[] = [
  {
    person: "3rd",
    number: "singular",
    gender: "masculine",
    detached: "هُوَ",
    attached: "ـهُ / ـهِ",
    meaningUrdu: "وہ (ایک مرد) / اس کا",
    meaningEnglish: "He / His / Him",
    example: {
      arabic: "رَبُّهُ (اس کا رب) · لَهُ (اس کے لیے)",
      urdu: "وہ اللہ ہے / اس کا رب",
      reference: "Surah 2:255",
    },
  },
  {
    person: "3rd",
    number: "plural",
    gender: "masculine",
    detached: "هُمْ",
    attached: "ـهُمْ / ـهِمْ",
    meaningUrdu: "وہ سب / ان کا",
    meaningEnglish: "They / Their / Them",
    example: {
      arabic: "رَبُّهُمْ (ان کا رب) · عَلَيْهِمْ (ان پر)",
      urdu: "وہی لوگ ہیں / ان کا پروردگار",
      reference: "Surah 2:5",
    },
  },
  {
    person: "2nd",
    number: "singular",
    gender: "masculine",
    detached: "أَنْتَ",
    attached: "ـكَ",
    meaningUrdu: "تو / تیرا",
    meaningEnglish: "You (sing.) / Your",
    example: {
      arabic: "رَبُّكَ (تیرا رب) · إِنَّكَ (بے شک تو)",
      urdu: "تو ہی علیم ہے / تیرا رب",
      reference: "Surah 2:32",
    },
  },
  {
    person: "2nd",
    number: "plural",
    gender: "masculine",
    detached: "أَنْتُمْ",
    attached: "ـكُمْ",
    meaningUrdu: "تم سب / تمہارا",
    meaningEnglish: "You (pl.) / Your",
    example: {
      arabic: "خَلَقَكُمْ (اس نے تمہیں پیدا کیا) · دِينُكُمْ (تمہارا دین)",
      urdu: "تم جانتے ہو / تمہارا دین",
      reference: "Surah 109:6",
    },
  },
  {
    person: "1st",
    number: "singular",
    gender: "common",
    detached: "أَنَا",
    attached: "ـي / ـنِي",
    meaningUrdu: "میں / میرا / مجھے",
    meaningEnglish: "I / My / Me",
    example: {
      arabic: "رَبِّي (میرا رب) · يَهْدِينِ (وہ مجھے ہدایت دیتا ہے)",
      urdu: "میں اللہ ہوں / میرا رب",
      reference: "Surah 20:14",
    },
  },
  {
    person: "1st",
    number: "plural",
    gender: "common",
    detached: "نَحْنُ",
    attached: "ـنَا",
    meaningUrdu: "ہم / ہمارا / ہمیں",
    meaningEnglish: "We / Our / Us",
    example: {
      arabic: "رَبَّنَا (اے ہمارے رب!) · اهْدِنَا (ہمیں ہدایت فرما)",
      urdu: "ہم اصلاح کرنے والے ہیں / ہمارا رب",
      reference: "Surah 1:6",
    },
  },
];

export const PREPOSITIONS_DATA: readonly GrammarPrepositionItem[] = [
  {
    preposition: "بِـ",
    transliteration: "Bi-",
    meaningUrdu: "کے ساتھ / سے / پر",
    meaningEnglish: "With / In / By",
    frequency: 2160,
    example: {
      arabic: "بِسْمِ اللَّهِ · آمَنَّا بِاللَّهِ",
      urdu: "اللہ کے نام سے · ہم اللہ پر ایمان لائے",
      reference: "1:1, 2:8",
    },
  },
  {
    preposition: "لِـ",
    transliteration: "Li-",
    meaningUrdu: "کے لیے / واسطے",
    meaningEnglish: "For / To / Belonging to",
    frequency: 1890,
    example: {
      arabic: "الْحَمْدُ لِلَّهِ · هُدًى لِلْمُتَّقِينَ",
      urdu: "تمام تعریفیں اللہ کے لیے ہیں · پرہیزگاروں کے لیے ہدایت",
      reference: "1:2, 2:2",
    },
  },
  {
    preposition: "فِي",
    transliteration: "Fee",
    meaningUrdu: "میں / اندر",
    meaningEnglish: "In / Inside",
    frequency: 1701,
    example: {
      arabic: "فِي قُلُوبِهِمْ مَرَضٌ · فِي السَّمَاوَاتِ",
      urdu: "ان کے دلوں میں بیماری ہے · آسمانوں میں",
      reference: "2:10, 2:255",
    },
  },
  {
    preposition: "مِنْ",
    transliteration: "Min",
    meaningUrdu: "سے / طرف سے",
    meaningEnglish: "From / Out of",
    frequency: 3226,
    example: {
      arabic: "مِنْ رَبِّهِمْ · مِنَ النَّاسِ",
      urdu: "ان کے رب کی طرف سے · لوگوں میں سے",
      reference: "2:5, 2:8",
    },
  },
  {
    preposition: "عَلَىٰ",
    transliteration: "'Alaa",
    meaningUrdu: "پر / اوپر",
    meaningEnglish: "On / Upon",
    frequency: 1445,
    example: {
      arabic: "عَلَىٰ هُدًى · عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
      urdu: "ہدایت پر · ہر چیز پر قادر",
      reference: "2:5, 2:20",
    },
  },
  {
    preposition: "إِلَىٰ",
    transliteration: "Ilaa",
    meaningUrdu: "کی طرف / تک",
    meaningEnglish: "To / Towards",
    frequency: 742,
    example: {
      arabic: "إِلَى اللَّهِ تُرْجَعُ الْأُمُورُ · إِلَىٰ صِرَاطٍ مُسْتَقِيمٍ",
      urdu: "اللہ ہی کی طرف سارے امور لوٹتے ہیں · سیدھے راستے کی طرف",
      reference: "2:210, 2:142",
    },
  },
];

export const VERB_PATTERNS: readonly VerbConjugationPattern[] = [
  {
    root: "قول",
    past: "قَالَ (اس نے کہا)",
    present: "يَقُولُ (وہ کہتا ہے)",
    masdar: "قَوْل (کہنا / بات)",
    meaningUrdu: "کہنا / فرمانا",
    meaningEnglish: "To say / tell",
    frequency: 1722,
    example: {
      pastExample: "وَإِذْ قَالَ رَبُّكَ (اور جب آپ کے رب نے فرمایا)",
      presentExample: "يَقُولُونَ آمَنَّا (وہ کہتے ہیں ہم ایمان لائے)",
      reference: "2:30, 2:8",
    },
  },
  {
    root: "كون",
    past: "كَانَ (وہ تھا)",
    present: "يَكُونُ (وہ ہوتا ہے)",
    masdar: "كَوْن (ہونا)",
    meaningUrdu: "ہونا / تھا",
    meaningEnglish: "To be",
    frequency: 1358,
    example: {
      pastExample: "وَكَانَ اللَّهُ عَلِيمًا (اور اللہ خوب جاننے والا تھا/ہے)",
      presentExample: "كُنْ فَيَكُونُ (ہو جا! پس وہ ہو جاتا ہے)",
      reference: "4:17, 2:117",
    },
  },
  {
    root: "علم",
    past: "عَلِمَ (اس نے جانا)",
    present: "يَعْلَمُ (وہ جانتا ہے)",
    masdar: "عِلْم (جاننا / علم)",
    meaningUrdu: "جاننا / علم رکھنا",
    meaningEnglish: "To know",
    frequency: 382,
    example: {
      pastExample: "عَلِمَ اللَّهُ أَنَّكُمْ (اللہ نے جان لیا کہ تم)",
      presentExample: "يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ (وہ جانتا ہے جو ان کے سامنے ہے)",
      reference: "2:187, 2:255",
    },
  },
  {
    root: "امن",
    past: "آمَنَ (وہ ایمان لایا)",
    present: "يُؤْمِنُ (وہ ایمان لاتا ہے)",
    masdar: "إِيمَان (ایمان لانا)",
    meaningUrdu: "ایمان لانا",
    meaningEnglish: "To believe",
    frequency: 537,
    example: {
      pastExample: "آمَنَ الرَّسُولُ (رسول ایمان لائے)",
      presentExample: "يُؤْمِنُونَ بِالْغَيْبِ (وہ غیب پر ایمان لاتے ہیں)",
      reference: "2:285, 2:3",
    },
  },
  {
    root: "جعل",
    past: "جَعَلَ (اس نے بنایا)",
    present: "يَجْعَلُ (وہ بناتا ہے)",
    masdar: "جَعْل (بنانا)",
    meaningUrdu: "بنانا / مقرر کرنا",
    meaningEnglish: "To make / appoint",
    frequency: 346,
    example: {
      pastExample: "جَعَلَ لَكُمُ الْأَرْضَ (اس نے تمہارے لیے زمین بنائی)",
      presentExample: "يَجْعَلُونَ أَصَابِعَهُمْ (وہ اپنی انگلیاں ڈالتے ہیں)",
      reference: "2:22, 2:19",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. SURAH COMPREHENSION BENCHMARKS (Daily Salah & Frequently Recited Surahs)
// ─────────────────────────────────────────────────────────────────────────────

export interface SurahVocabularyProfile {
  surahNumber: number;
  nameEnglish: string;
  nameArabic: string;
  totalAyahs: number;
  totalWords: number;
  keyLemmas: readonly string[];
}

export const FREQUENT_SURAHS_PROFILES: readonly SurahVocabularyProfile[] = [
  {
    surahNumber: 1,
    nameEnglish: "Al-Fatihah",
    nameArabic: "الفاتحة",
    totalAyahs: 7,
    totalWords: 29,
    keyLemmas: [
      "بسم",
      "الله",
      "الرحمن",
      "الرحيم",
      "الحمد",
      "رب",
      "مالك",
      "يوم",
      "الدين",
      "إياك",
      "نعبد",
      "نستعين",
      "اهدنا",
      "الصراط",
      "المستقيم",
      "أنعمت",
    ],
  },
  {
    surahNumber: 112,
    nameEnglish: "Al-Ikhlas",
    nameArabic: "الإخلاص",
    totalAyahs: 4,
    totalWords: 15,
    keyLemmas: ["قل", "هو", "الله", "أحد", "الصمد", "لم", "يلد", "يولد", "كن", "كفوا"],
  },
  {
    surahNumber: 113,
    nameEnglish: "Al-Falaq",
    nameArabic: "الفلق",
    totalAyahs: 5,
    totalWords: 23,
    keyLemmas: ["قل", "أعوذ", "رب", "الفلق", "من", "شر", "ما", "خلق", "غاسق", "نفاثات", "حاسد"],
  },
  {
    surahNumber: 114,
    nameEnglish: "An-Nas",
    nameArabic: "الناس",
    totalAyahs: 6,
    totalWords: 20,
    keyLemmas: ["قل", "أعوذ", "رب", "الناس", "ملك", "إله", "من", "شر", "الوسواس", "الخناس", "في"],
  },
  {
    surahNumber: 108,
    nameEnglish: "Al-Kawthar",
    nameArabic: "الكوثر",
    totalAyahs: 3,
    totalWords: 10,
    keyLemmas: ["إن", "أعطيناك", "الكوثر", "صل", "ربك", "انحر", "شانئك", "هو", "الأبتر"],
  },
  {
    surahNumber: 103,
    nameEnglish: "Al-Asr",
    nameArabic: "العصر",
    totalAyahs: 3,
    totalWords: 14,
    keyLemmas: ["العصر", "إن", "الإنسان", "في", "خسر", "إلا", "الذين", "آمنوا", "عملوا", "الصالحات", "تواصوا", "بالحق", "بالصبر"],
  },
  {
    surahNumber: 110,
    nameEnglish: "An-Nasr",
    nameArabic: "النصر",
    totalAyahs: 3,
    totalWords: 19,
    keyLemmas: ["إذا", "جاء", "نصر", "الله", "الفتح", "رأيت", "الناس", "يدخلون", "في", "دين", "أفواجا", "سبح", "بحمد", "ربك", "استغفر", "إنه", "كان", "توابا"],
  },
  {
    surahNumber: 109,
    nameEnglish: "Al-Kafirun",
    nameArabic: "الكافرون",
    totalAyahs: 6,
    totalWords: 26,
    keyLemmas: ["قل", "يا", "أيها", "الكافرون", "لا", "أعبد", "ما", "تعبدون", "ولا", "أنتم", "عابدون", "لكم", "دينكم", "ولي", "ديني"],
  },
];

/**
 * Calculates the percentage of unique key vocabulary understood for a given Surah
 * based on user's current mastery map.
 */
export function calculateSurahVocabularyReadiness(
  surahNumber: number,
  knownKeys: ReadonlySet<string>,
): {
  profile: SurahVocabularyProfile;
  knownCount: number;
  totalKeyLemmas: number;
  readinessPercentage: number;
  stage: "needs_study" | "growing" | "ready";
} {
  const profile =
    FREQUENT_SURAHS_PROFILES.find((p) => p.surahNumber === surahNumber) ??
    FREQUENT_SURAHS_PROFILES[0]!;

  let knownCount = 0;
  for (const lemma of profile.keyLemmas) {
    if (knownKeys.has(lemma)) {
      knownCount += 1;
    }
  }

  const readinessPercentage =
    profile.keyLemmas.length > 0
      ? Math.round((knownCount / profile.keyLemmas.length) * 100)
      : 0;

  const stage =
    readinessPercentage >= 80 ? "ready" : readinessPercentage >= 40 ? "growing" : "needs_study";

  return {
    profile,
    knownCount,
    totalKeyLemmas: profile.keyLemmas.length,
    readinessPercentage,
    stage,
  };
}
