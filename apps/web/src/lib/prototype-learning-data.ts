/**
 * Quran Feham V1 learner pack, carried forward unchanged for feature parity.
 *
 * Scope: 52 deliberately short learner glosses, eight phrases, and twelve
 * root notes. These are teaching aids—not a Quran translation, tafsir, or a
 * complete morphology dataset. A reviewed, position-addressed dataset must
 * replace this prototype pack before its scope is expanded.
 */

export const PROTOTYPE_LEARNING_PACK_VERSION = "v1-local-learner-pack" as const;

export interface LearningWord {
  key: string;
  display: string;
  urdu: string;
  root: string | null;
  lemma: string;
  pos: string;
  pack: "fatihah" | "core";
  aliases: readonly string[];
}

export interface LearningPhrase {
  id: string;
  arabic: string;
  urdu: string;
  words: readonly string[];
}

export interface RootNote {
  root: string;
  gloss: string;
  keys: readonly string[];
}

export const SALAH_SURAHS = [1, 112, 113, 114, 108] as const;

export const LEARNING_WORDS = [
  {
    key: "بسم",
    display: "بِسْمِ",
    urdu: "نام کے ساتھ / نام سے",
    root: null,
    lemma: "اسم",
    pos: "اسم",
    pack: "fatihah",
    aliases: ["بسم"],
  },
  {
    key: "الله",
    display: "اللّٰه",
    urdu: "اللہ",
    root: null,
    lemma: "الله",
    pos: "اسمِ جلالہ",
    pack: "fatihah",
    aliases: ["الله", "اللَّه", "لله"],
  },
  {
    key: "الرحمن",
    display: "الرَّحْمَٰن",
    urdu: "نہایت مہربان",
    root: "ر ح م",
    lemma: "رحمن",
    pos: "صفت",
    pack: "fatihah",
    aliases: ["الرحمن", "رَّحْمَٰن"],
  },
  {
    key: "الرحيم",
    display: "الرَّحِيم",
    urdu: "بہت رحم فرمانے والا",
    root: "ر ح م",
    lemma: "رحيم",
    pos: "صفت",
    pack: "fatihah",
    aliases: ["الرحيم", "رحيم"],
  },
  {
    key: "الحمد",
    display: "الْحَمْدُ",
    urdu: "تمام تعریف",
    root: "ح م د",
    lemma: "حمد",
    pos: "اسم",
    pack: "fatihah",
    aliases: ["الحمد", "حمد"],
  },
  {
    key: "رب",
    display: "رَبِّ",
    urdu: "رب، پرورش کرنے والا",
    root: "ر ب ب",
    lemma: "رب",
    pos: "اسم",
    pack: "fatihah",
    aliases: ["رب", "ربي", "ربك", "ربكم"],
  },
  {
    key: "العالمين",
    display: "الْعَالَمِينَ",
    urdu: "تمام جہان",
    root: "ع ل م",
    lemma: "عالم",
    pos: "اسم",
    pack: "fatihah",
    aliases: ["العالمين", "عالمين"],
  },
  {
    key: "مالك",
    display: "مَالِكِ",
    urdu: "مالک",
    root: "م ل ك",
    lemma: "مالك",
    pos: "اسم",
    pack: "fatihah",
    aliases: ["مالك", "الملك", "ملك"],
  },
  {
    key: "يوم",
    display: "يَوْمِ",
    urdu: "دن",
    root: "ي و م",
    lemma: "يوم",
    pos: "اسم",
    pack: "fatihah",
    aliases: ["يوم", "اليوم", "يومئذ"],
  },
  {
    key: "الدين",
    display: "الدِّينِ",
    urdu: "بدلے / جزا کا نظام",
    root: "د ي ن",
    lemma: "دين",
    pos: "اسم",
    pack: "fatihah",
    aliases: ["الدين", "دين"],
  },
  {
    key: "اياك",
    display: "إِيَّاكَ",
    urdu: "صرف تجھی کو / تجھ ہی کو",
    root: null,
    lemma: "إيا",
    pos: "ضمیر",
    pack: "fatihah",
    aliases: ["اياك", "إياك"],
  },
  {
    key: "نعبد",
    display: "نَعْبُدُ",
    urdu: "ہم عبادت کرتے ہیں",
    root: "ع ب د",
    lemma: "عبد",
    pos: "فعل",
    pack: "fatihah",
    aliases: ["نعبد", "اعبدوا", "يعبدون", "عبد"],
  },
  {
    key: "نستعين",
    display: "نَسْتَعِينُ",
    urdu: "ہم مدد مانگتے ہیں",
    root: "ع و ن",
    lemma: "استعان",
    pos: "فعل",
    pack: "fatihah",
    aliases: ["نستعين", "استعينوا"],
  },
  {
    key: "اهدنا",
    display: "اهْدِنَا",
    urdu: "ہمیں ہدایت دے",
    root: "ه د ي",
    lemma: "هدى",
    pos: "فعل",
    pack: "fatihah",
    aliases: ["اهدنا", "هدى", "يهدي", "هداهم"],
  },
  {
    key: "الصراط",
    display: "الصِّرَاطَ",
    urdu: "راستہ",
    root: "ص ر ط",
    lemma: "صراط",
    pos: "اسم",
    pack: "fatihah",
    aliases: ["الصراط", "صراط"],
  },
  {
    key: "المستقيم",
    display: "الْمُسْتَقِيمَ",
    urdu: "سیدھا / قائم",
    root: "ق و م",
    lemma: "مستقيم",
    pos: "صفت",
    pack: "fatihah",
    aliases: ["المستقيم", "مستقيم"],
  },
  {
    key: "الذين",
    display: "الَّذِينَ",
    urdu: "وہ لوگ جو",
    root: null,
    lemma: "الذي",
    pos: "اسم موصول",
    pack: "fatihah",
    aliases: ["الذين", "الذي", "اللاتي"],
  },
  {
    key: "انعمت",
    display: "أَنْعَمْتَ",
    urdu: "تو نے انعام فرمایا",
    root: "ن ع م",
    lemma: "أنعم",
    pos: "فعل",
    pack: "fatihah",
    aliases: ["انعمت", "أنعمت", "انعم"],
  },
  {
    key: "عليهم",
    display: "عَلَيْهِمْ",
    urdu: "ان پر",
    root: null,
    lemma: "على",
    pos: "جار + ضمیر",
    pack: "fatihah",
    aliases: ["عليهم", "عليه", "عليكم", "على"],
  },
  {
    key: "غير",
    display: "غَيْرِ",
    urdu: "سوا / علاوہ / نہ",
    root: "غ ي ر",
    lemma: "غير",
    pos: "اسم",
    pack: "fatihah",
    aliases: ["غير"],
  },
  {
    key: "المغضوب",
    display: "الْمَغْضُوبِ",
    urdu: "جن پر غضب ہوا",
    root: "غ ض ب",
    lemma: "مغضوب",
    pos: "اسم مفعول",
    pack: "fatihah",
    aliases: ["المغضوب", "غضب"],
  },
  {
    key: "ولا",
    display: "وَلَا",
    urdu: "اور نہ",
    root: null,
    lemma: "لا",
    pos: "حرف",
    pack: "fatihah",
    aliases: ["ولا", "لا"],
  },
  {
    key: "الضالين",
    display: "الضَّالِّينَ",
    urdu: "گمراہ لوگ",
    root: "ض ل ل",
    lemma: "ضال",
    pos: "اسم فاعل",
    pack: "fatihah",
    aliases: ["الضالين", "ضالين", "ضل", "يضل"],
  },
  {
    key: "كتاب",
    display: "كِتَاب",
    urdu: "کتاب",
    root: "ك ت ب",
    lemma: "كتاب",
    pos: "اسم",
    pack: "core",
    aliases: ["كتاب", "الكتاب", "كتب"],
  },
  {
    key: "امن",
    display: "آمَنُوا",
    urdu: "ایمان لائے",
    root: "أ م ن",
    lemma: "آمن",
    pos: "فعل",
    pack: "core",
    aliases: ["امنوا", "آمنوا", "امن", "ايمان", "إيمان"],
  },
  {
    key: "عمل",
    display: "عَمِلُوا",
    urdu: "عمل کیے",
    root: "ع م ل",
    lemma: "عمل",
    pos: "فعل",
    pack: "core",
    aliases: ["عملوا", "عمل", "اعملوا", "يعملون"],
  },
  {
    key: "صالح",
    display: "الصَّالِحَات",
    urdu: "نیک / درست اعمال",
    root: "ص ل ح",
    lemma: "صالح",
    pos: "صفت",
    pack: "core",
    aliases: ["الصالحات", "صالحات", "صالح"],
  },
  {
    key: "تقوى",
    display: "تَقْوَى",
    urdu: "تقویٰ، اللہ سے بچتے ہوئے شعور",
    root: "و ق ي",
    lemma: "تقوى",
    pos: "اسم",
    pack: "core",
    aliases: ["تقوى", "المتقين", "متقين"],
  },
  {
    key: "صبر",
    display: "صَبْر",
    urdu: "صبر / ثابت قدمی",
    root: "ص ب ر",
    lemma: "صبر",
    pos: "اسم",
    pack: "core",
    aliases: ["صبر", "الصابرين", "صابرين", "اصبروا"],
  },
  {
    key: "غفر",
    display: "غَفُور",
    urdu: "بہت بخشنے والا / بخشش",
    root: "غ ف ر",
    lemma: "غفر",
    pos: "اسم/فعل",
    pack: "core",
    aliases: ["غفور", "غفر", "يغفر", "مغفرة"],
  },
  {
    key: "رزق",
    display: "رِزْق",
    urdu: "رزق / عطا",
    root: "ر ز ق",
    lemma: "رزق",
    pos: "اسم",
    pack: "core",
    aliases: ["رزق", "رزقناهم", "يرزق"],
  },
  {
    key: "خلق",
    display: "خَلَقَ",
    urdu: "پیدا کیا",
    root: "خ ل ق",
    lemma: "خلق",
    pos: "فعل",
    pack: "core",
    aliases: ["خلق", "خلقكم", "يخلق"],
  },
  {
    key: "قوم",
    display: "قَوْم",
    urdu: "قوم / لوگ",
    root: "ق و م",
    lemma: "قوم",
    pos: "اسم",
    pack: "core",
    aliases: ["قوم", "القوم"],
  },
  {
    key: "رسول",
    display: "رَسُول",
    urdu: "رسول / پیغام لانے والا",
    root: "ر س ل",
    lemma: "رسول",
    pos: "اسم",
    pack: "core",
    aliases: ["رسول", "الرسول", "رسل"],
  },
  {
    key: "حق",
    display: "الْحَقّ",
    urdu: "حق / سچ",
    root: "ح ق ق",
    lemma: "حق",
    pos: "اسم",
    pack: "core",
    aliases: ["حق", "الحق"],
  },
  {
    key: "نفس",
    display: "نَفْس",
    urdu: "جان / نفس",
    root: "ن ف س",
    lemma: "نفس",
    pos: "اسم",
    pack: "core",
    aliases: ["نفس", "انفسكم", "أنفسكم", "الانفس"],
  },
  {
    key: "قلب",
    display: "قَلْب",
    urdu: "دل",
    root: "ق ل ب",
    lemma: "قلب",
    pos: "اسم",
    pack: "core",
    aliases: ["قلب", "قلوب", "قلوبهم"],
  },
  {
    key: "ارض",
    display: "أَرْض",
    urdu: "زمین",
    root: "أ ر ض",
    lemma: "أرض",
    pos: "اسم",
    pack: "core",
    aliases: ["ارض", "الأرض", "الارض"],
  },
  {
    key: "سماء",
    display: "سَمَاء",
    urdu: "آسمان",
    root: "س م و",
    lemma: "سماء",
    pos: "اسم",
    pack: "core",
    aliases: ["سماء", "السماء", "السماوات"],
  },
  {
    key: "جنة",
    display: "جَنَّة",
    urdu: "جنت / باغ",
    root: "ج ن ن",
    lemma: "جنة",
    pos: "اسم",
    pack: "core",
    aliases: ["جنة", "الجنة", "جنات"],
  },
  {
    key: "عذاب",
    display: "عَذَاب",
    urdu: "عذاب",
    root: "ع ذ ب",
    lemma: "عذاب",
    pos: "اسم",
    pack: "core",
    aliases: ["عذاب", "العذاب"],
  },
  {
    key: "علم",
    display: "عِلْم",
    urdu: "علم / جاننا",
    root: "ع ل م",
    lemma: "علم",
    pos: "اسم/فعل",
    pack: "core",
    aliases: ["علم", "يعلم", "تعلمون", "عليم"],
  },
  {
    key: "قال",
    display: "قَالَ",
    urdu: "کہا",
    root: "ق و ل",
    lemma: "قال",
    pos: "فعل",
    pack: "core",
    aliases: ["قال", "قالوا", "قل", "يقول"],
  },
  {
    key: "سمع",
    display: "سَمِعَ",
    urdu: "سنا / سننا",
    root: "س م ع",
    lemma: "سمع",
    pos: "فعل",
    pack: "core",
    aliases: ["سمع", "يسمع", "سميع"],
  },
  {
    key: "بصر",
    display: "بَصَر",
    urdu: "دیکھنا / نگاہ",
    root: "ب ص ر",
    lemma: "بصر",
    pos: "اسم/فعل",
    pack: "core",
    aliases: ["بصر", "بصير", "ابصارهم", "أبصارهم"],
  },
  {
    key: "شكر",
    display: "شُكْر",
    urdu: "شکر",
    root: "ش ك ر",
    lemma: "شكر",
    pos: "اسم",
    pack: "core",
    aliases: ["شكر", "اشكروا", "شاكر"],
  },
  {
    key: "كفر",
    display: "كَفَرَ",
    urdu: "کفر / انکار کیا",
    root: "ك ف ر",
    lemma: "كفر",
    pos: "فعل",
    pack: "core",
    aliases: ["كفر", "كفروا", "الكافرين", "كافر"],
  },
  {
    key: "رحمة",
    display: "رَحْمَة",
    urdu: "رحمت",
    root: "ر ح م",
    lemma: "رحمة",
    pos: "اسم",
    pack: "core",
    aliases: ["رحمة", "رحمته"],
  },
  {
    key: "خير",
    display: "خَيْر",
    urdu: "بھلائی / بہتر",
    root: "خ ي ر",
    lemma: "خير",
    pos: "اسم",
    pack: "core",
    aliases: ["خير", "الخير"],
  },
  {
    key: "شر",
    display: "شَرّ",
    urdu: "برائی",
    root: "ش ر ر",
    lemma: "شر",
    pos: "اسم",
    pack: "core",
    aliases: ["شر", "الشر"],
  },
  {
    key: "دنيا",
    display: "الدُّنْيَا",
    urdu: "دنیا / قریب کی زندگی",
    root: "د ن و",
    lemma: "دنيا",
    pos: "صفت/اسم",
    pack: "core",
    aliases: ["دنيا", "الدنيا"],
  },
  {
    key: "اخرة",
    display: "الْآخِرَة",
    urdu: "آخرت",
    root: "أ خ ر",
    lemma: "آخرة",
    pos: "اسم",
    pack: "core",
    aliases: ["اخرة", "آخرة", "الآخرة", "الاخره"],
  },
] as const satisfies readonly LearningWord[];

export const LEARNING_PHRASES = [
  {
    id: "fatihah-1",
    arabic: "الْحَمْدُ لِلَّهِ",
    urdu: "تمام تعریف اللہ کے لیے ہے",
    words: ["الحمد", "الله"],
  },
  { id: "fatihah-2", arabic: "رَبِّ الْعَالَمِينَ", urdu: "تمام جہانوں کا رب", words: ["رب", "العالمين"] },
  {
    id: "fatihah-3",
    arabic: "إِيَّاكَ نَعْبُدُ",
    urdu: "ہم صرف تیری عبادت کرتے ہیں",
    words: ["اياك", "نعبد"],
  },
  {
    id: "fatihah-4",
    arabic: "وَإِيَّاكَ نَسْتَعِينُ",
    urdu: "اور صرف تجھ ہی سے مدد مانگتے ہیں",
    words: ["اياك", "نستعين"],
  },
  {
    id: "fatihah-5",
    arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
    urdu: "ہمیں سیدھے راستے کی ہدایت دے",
    words: ["اهدنا", "الصراط", "المستقيم"],
  },
  { id: "core-1", arabic: "الَّذِينَ آمَنُوا", urdu: "وہ لوگ جو ایمان لائے", words: ["الذين", "امن"] },
  { id: "core-2", arabic: "وَعَمِلُوا الصَّالِحَاتِ", urdu: "اور نیک عمل کیے", words: ["عمل", "صالح"] },
  { id: "core-3", arabic: "يَوْمِ الْقِيَامَةِ", urdu: "قیامت کے دن", words: ["يوم"] },
] as const satisfies readonly LearningPhrase[];

export const ROOT_NOTES = [
  { root: "ر ح م", gloss: "رحمت، شفقت", keys: ["الرحمن", "الرحيم", "رحمة"] },
  { root: "ح م د", gloss: "تعریف، حمد", keys: ["الحمد"] },
  { root: "ع ب د", gloss: "عبادت، بندگی", keys: ["نعبد"] },
  { root: "ه د ي", gloss: "ہدایت، راستہ دکھانا", keys: ["اهدنا"] },
  { root: "غ ف ر", gloss: "ڈھانپنا، بخشنا", keys: ["غفر"] },
  { root: "ص ب ر", gloss: "ثابت رہنا، صبر", keys: ["صبر"] },
  { root: "ك ت ب", gloss: "لکھنا، مقرر کرنا", keys: ["كتاب"] },
  { root: "أ م ن", gloss: "امن، اطمینان، ایمان", keys: ["امن"] },
  { root: "ع ل م", gloss: "علم، جاننا", keys: ["العالمين", "علم"] },
  { root: "ق و ل", gloss: "کہنا، قول", keys: ["قال"] },
  { root: "ر ز ق", gloss: "رزق دینا", keys: ["رزق"] },
  { root: "خ ل ق", gloss: "پیدا کرنا", keys: ["خلق"] },
] as const satisfies readonly RootNote[];

export const TUTOR_PRESETS = [
  "اس آیت کو آسان اردو میں سمجھائیں",
  "اس لفظ کا root کیا ہے؟",
  "Word by word سمجھائیں",
  "Grammar بہت آسان طریقے سے سمجھائیں",
] as const;

export function normalizeArabic(value = ""): string {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[ـ۝۞﴾﴿0-9٠-٩]/g, "")
    .replace(/[^\u0621-\u064A]/g, "")
    .trim();
}

export function tokenizeArabic(text = ""): Array<{ raw: string; normalized: string }> {
  return String(text)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((raw) => ({ raw, normalized: normalizeArabic(raw) }));
}

const aliasIndex = (() => {
  const map = new Map<string, LearningWord>();
  for (const item of LEARNING_WORDS) {
    const aliases = new Set([item.key, item.display, ...item.aliases]);
    for (const alias of aliases) map.set(normalizeArabic(alias), item);
  }
  return map;
})();

export function findLearningWord(raw: string): LearningWord | null {
  const candidates = [
    normalizeArabic(raw),
    raw.includes("\u0670") ? normalizeArabic(raw.replace(/\u0670/g, "ا")) : null,
  ].filter(Boolean) as string[];

  for (const normalized of candidates) {
    if (!normalized) continue;
    const exact = aliasIndex.get(normalized);
    if (exact) return exact;
    // Deliberately conservative: strip only one common leading clitic.
    for (const prefix of ["و", "ف", "ب", "ل", "ك"]) {
      if (!normalized.startsWith(prefix)) continue;
      const match = aliasIndex.get(normalized.slice(1));
      if (match) return match;
    }
  }
  return null;
}
