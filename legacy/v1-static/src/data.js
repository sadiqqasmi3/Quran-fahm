export const APP_VERSION = '1.0.0';

export const TRANSLATIONS = [
  { id: 'ur.jalandhry', name: 'Fateh Muhammad Jalandhry', short: 'Jalandhry', language: 'Urdu', provider: 'Al Quran Cloud' },
  { id: 'ur.junagarhi', name: 'Muhammad Junagarhi', short: 'Junagarhi', language: 'Urdu', provider: 'Al Quran Cloud' },
  { id: 'ur.maududi', name: 'Abul Ala Maududi', short: 'Maududi', language: 'Urdu', provider: 'Al Quran Cloud' }
];

export const RECITERS = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy' },
  { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary' },
  { id: 'ar.minshawi', name: 'Mohamed Siddiq Al-Minshawi' },
  { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit Abdus Samad (Murattal)' }
];

export const SALAH_SURAHS = [1, 112, 113, 114, 108];

export const SOURCE_REGISTRY = [
  {
    id: 'alquran-cloud',
    type: 'Runtime Quran/translation/audio provider',
    name: 'Al Quran Cloud / Islamic Network',
    url: 'https://alquran.cloud/api',
    status: 'active',
    license: 'Provider terms; edition/reciter rights remain source-specific',
    usage: 'Runtime API only; recitation is streamed, not bundled.'
  },
  {
    id: 'tanzil',
    type: 'Canonical Arabic reference',
    name: 'Tanzil Quran Text',
    url: 'https://tanzil.net/docs/Text_License',
    status: 'reference',
    license: 'CC BY 3.0; text must not be modified',
    usage: 'Canonical verification/reference. Production import must preserve attribution and exact text.'
  },
  {
    id: 'quranenc',
    type: 'Translation source candidate',
    name: 'QuranEnc',
    url: 'https://quranenc.com',
    status: 'integration-ready',
    license: 'Reuse permitted under QuranEnc publication conditions',
    usage: 'Useful for approved translation editions; keep edition/version attribution.'
  },
  {
    id: 'quranmorph',
    type: 'Morphology/lemma pack candidate',
    name: 'QuranMorph',
    url: 'https://github.com/taziksh/quran-frequencies',
    status: 'integration-ready',
    license: 'CC BY 4.0 for QuranMorph dataset; upstream bundled datasets differ',
    usage: 'Use only QuranMorph-attributed data pack, not GPL morphology unless isolated appropriately.'
  },
  {
    id: 'qul',
    type: 'Architecture/resource reference',
    name: 'Tarteel Quranic Universal Library',
    url: 'https://github.com/TarteelAI/quranic-universal-library',
    status: 'reference',
    license: 'MIT for application code; individual resource rights vary',
    usage: 'Reference content modeling and resource provenance; do not scrape resources without their licenses.'
  },
  {
    id: 'quran-json',
    type: 'Open data pipeline reference',
    name: 'risan/quran-json',
    url: 'https://github.com/risan/quran-json',
    status: 'reference',
    license: 'CC BY-SA 4.0 code/frozen dist; current resources retain source-specific attribution',
    usage: 'Reference licensing-aware import patterns and provenance catalog.'
  },
  {
    id: 'quranwbw',
    type: 'Word-by-word architecture reference',
    name: 'QuranWBW',
    url: 'https://github.com/marwan/quranwbw',
    status: 'permission-needed',
    license: 'Repository/data rights not sufficiently explicit for redistribution',
    usage: 'Do not bundle its private CDN data unless permission or explicit resource licenses are confirmed.'
  }
];

// These are learner glosses, not a Quran translation or tafsir. They are deliberately short.
export const LEARNING_WORDS = [
  { key:'بسم', display:'بِسْمِ', urdu:'نام کے ساتھ / نام سے', root:null, lemma:'اسم', pos:'اسم', pack:'fatihah', aliases:['بسم'] },
  { key:'الله', display:'اللّٰه', urdu:'اللہ', root:null, lemma:'الله', pos:'اسمِ جلالہ', pack:'fatihah', aliases:['الله','اللَّه','لله'] },
  { key:'الرحمن', display:'الرَّحْمَٰن', urdu:'نہایت مہربان', root:'ر ح م', lemma:'رحمن', pos:'صفت', pack:'fatihah', aliases:['الرحمن','رَّحْمَٰن'] },
  { key:'الرحيم', display:'الرَّحِيم', urdu:'بہت رحم فرمانے والا', root:'ر ح م', lemma:'رحيم', pos:'صفت', pack:'fatihah', aliases:['الرحيم','رحيم'] },
  { key:'الحمد', display:'الْحَمْدُ', urdu:'تمام تعریف', root:'ح م د', lemma:'حمد', pos:'اسم', pack:'fatihah', aliases:['الحمد','حمد'] },
  { key:'رب', display:'رَبِّ', urdu:'رب، پرورش کرنے والا', root:'ر ب ب', lemma:'رب', pos:'اسم', pack:'fatihah', aliases:['رب','ربي','ربك','ربكم'] },
  { key:'العالمين', display:'الْعَالَمِينَ', urdu:'تمام جہان', root:'ع ل م', lemma:'عالم', pos:'اسم', pack:'fatihah', aliases:['العالمين','عالمين'] },
  { key:'مالك', display:'مَالِكِ', urdu:'مالک', root:'م ل ك', lemma:'مالك', pos:'اسم', pack:'fatihah', aliases:['مالك','الملك','ملك'] },
  { key:'يوم', display:'يَوْمِ', urdu:'دن', root:'ي و م', lemma:'يوم', pos:'اسم', pack:'fatihah', aliases:['يوم','اليوم','يومئذ'] },
  { key:'الدين', display:'الدِّينِ', urdu:'بدلے / جزا کا نظام', root:'د ي ن', lemma:'دين', pos:'اسم', pack:'fatihah', aliases:['الدين','دين'] },
  { key:'اياك', display:'إِيَّاكَ', urdu:'صرف تجھی کو / تجھ ہی کو', root:null, lemma:'إيا', pos:'ضمیر', pack:'fatihah', aliases:['اياك','إياك'] },
  { key:'نعبد', display:'نَعْبُدُ', urdu:'ہم عبادت کرتے ہیں', root:'ع ب د', lemma:'عبد', pos:'فعل', pack:'fatihah', aliases:['نعبد','اعبدوا','يعبدون','عبد'] },
  { key:'نستعين', display:'نَسْتَعِينُ', urdu:'ہم مدد مانگتے ہیں', root:'ع و ن', lemma:'استعان', pos:'فعل', pack:'fatihah', aliases:['نستعين','استعينوا'] },
  { key:'اهدنا', display:'اهْدِنَا', urdu:'ہمیں ہدایت دے', root:'ه د ي', lemma:'هدى', pos:'فعل', pack:'fatihah', aliases:['اهدنا','هدى','يهدي','هداهم'] },
  { key:'الصراط', display:'الصِّرَاطَ', urdu:'راستہ', root:'ص ر ط', lemma:'صراط', pos:'اسم', pack:'fatihah', aliases:['الصراط','صراط'] },
  { key:'المستقيم', display:'الْمُسْتَقِيمَ', urdu:'سیدھا / قائم', root:'ق و م', lemma:'مستقيم', pos:'صفت', pack:'fatihah', aliases:['المستقيم','مستقيم'] },
  { key:'الذين', display:'الَّذِينَ', urdu:'وہ لوگ جو', root:null, lemma:'الذي', pos:'اسم موصول', pack:'fatihah', aliases:['الذين','الذي','اللاتي'] },
  { key:'انعمت', display:'أَنْعَمْتَ', urdu:'تو نے انعام فرمایا', root:'ن ع م', lemma:'أنعم', pos:'فعل', pack:'fatihah', aliases:['انعمت','أنعمت','انعم'] },
  { key:'عليهم', display:'عَلَيْهِمْ', urdu:'ان پر', root:null, lemma:'على', pos:'جار + ضمیر', pack:'fatihah', aliases:['عليهم','عليه','عليكم','على'] },
  { key:'غير', display:'غَيْرِ', urdu:'سوا / علاوہ / نہ', root:'غ ي ر', lemma:'غير', pos:'اسم', pack:'fatihah', aliases:['غير'] },
  { key:'المغضوب', display:'الْمَغْضُوبِ', urdu:'جن پر غضب ہوا', root:'غ ض ب', lemma:'مغضوب', pos:'اسم مفعول', pack:'fatihah', aliases:['المغضوب','غضب'] },
  { key:'ولا', display:'وَلَا', urdu:'اور نہ', root:null, lemma:'لا', pos:'حرف', pack:'fatihah', aliases:['ولا','لا'] },
  { key:'الضالين', display:'الضَّالِّينَ', urdu:'گمراہ لوگ', root:'ض ل ل', lemma:'ضال', pos:'اسم فاعل', pack:'fatihah', aliases:['الضالين','ضالين','ضل','يضل'] },

  { key:'كتاب', display:'كِتَاب', urdu:'کتاب', root:'ك ت ب', lemma:'كتاب', pos:'اسم', pack:'core', aliases:['كتاب','الكتاب','كتب'] },
  { key:'امن', display:'آمَنُوا', urdu:'ایمان لائے', root:'أ م ن', lemma:'آمن', pos:'فعل', pack:'core', aliases:['امنوا','آمنوا','امن','ايمان','إيمان'] },
  { key:'عمل', display:'عَمِلُوا', urdu:'عمل کیے', root:'ع م ل', lemma:'عمل', pos:'فعل', pack:'core', aliases:['عملوا','عمل','اعملوا','يعملون'] },
  { key:'صالح', display:'الصَّالِحَات', urdu:'نیک / درست اعمال', root:'ص ل ح', lemma:'صالح', pos:'صفت', pack:'core', aliases:['الصالحات','صالحات','صالح'] },
  { key:'تقوى', display:'تَقْوَى', urdu:'تقویٰ، اللہ سے بچتے ہوئے شعور', root:'و ق ي', lemma:'تقوى', pos:'اسم', pack:'core', aliases:['تقوى','المتقين','متقين'] },
  { key:'صبر', display:'صَبْر', urdu:'صبر / ثابت قدمی', root:'ص ب ر', lemma:'صبر', pos:'اسم', pack:'core', aliases:['صبر','الصابرين','صابرين','اصبروا'] },
  { key:'غفر', display:'غَفُور', urdu:'بہت بخشنے والا / بخشش', root:'غ ف ر', lemma:'غفر', pos:'اسم/فعل', pack:'core', aliases:['غفور','غفر','يغفر','مغفرة'] },
  { key:'رزق', display:'رِزْق', urdu:'رزق / عطا', root:'ر ز ق', lemma:'رزق', pos:'اسم', pack:'core', aliases:['رزق','رزقناهم','يرزق'] },
  { key:'خلق', display:'خَلَقَ', urdu:'پیدا کیا', root:'خ ل ق', lemma:'خلق', pos:'فعل', pack:'core', aliases:['خلق','خلقكم','يخلق'] },
  { key:'قوم', display:'قَوْم', urdu:'قوم / لوگ', root:'ق و م', lemma:'قوم', pos:'اسم', pack:'core', aliases:['قوم','القوم'] },
  { key:'رسول', display:'رَسُول', urdu:'رسول / پیغام لانے والا', root:'ر س ل', lemma:'رسول', pos:'اسم', pack:'core', aliases:['رسول','الرسول','رسل'] },
  { key:'حق', display:'الْحَقّ', urdu:'حق / سچ', root:'ح ق ق', lemma:'حق', pos:'اسم', pack:'core', aliases:['حق','الحق'] },
  { key:'نفس', display:'نَفْس', urdu:'جان / نفس', root:'ن ف س', lemma:'نفس', pos:'اسم', pack:'core', aliases:['نفس','انفسكم','أنفسكم','الانفس'] },
  { key:'قلب', display:'قَلْب', urdu:'دل', root:'ق ل ب', lemma:'قلب', pos:'اسم', pack:'core', aliases:['قلب','قلوب','قلوبهم'] },
  { key:'ارض', display:'أَرْض', urdu:'زمین', root:'أ ر ض', lemma:'أرض', pos:'اسم', pack:'core', aliases:['ارض','الأرض','الارض'] },
  { key:'سماء', display:'سَمَاء', urdu:'آسمان', root:'س م و', lemma:'سماء', pos:'اسم', pack:'core', aliases:['سماء','السماء','السماوات'] },
  { key:'جنة', display:'جَنَّة', urdu:'جنت / باغ', root:'ج ن ن', lemma:'جنة', pos:'اسم', pack:'core', aliases:['جنة','الجنة','جنات'] },
  { key:'عذاب', display:'عَذَاب', urdu:'عذاب', root:'ع ذ ب', lemma:'عذاب', pos:'اسم', pack:'core', aliases:['عذاب','العذاب'] },
  { key:'علم', display:'عِلْم', urdu:'علم / جاننا', root:'ع ل م', lemma:'علم', pos:'اسم/فعل', pack:'core', aliases:['علم','يعلم','تعلمون','عليم'] },
  { key:'قال', display:'قَالَ', urdu:'کہا', root:'ق و ل', lemma:'قال', pos:'فعل', pack:'core', aliases:['قال','قالوا','قل','يقول'] },
  { key:'سمع', display:'سَمِعَ', urdu:'سنا / سننا', root:'س م ع', lemma:'سمع', pos:'فعل', pack:'core', aliases:['سمع','يسمع','سميع'] },
  { key:'بصر', display:'بَصَر', urdu:'دیکھنا / نگاہ', root:'ب ص ر', lemma:'بصر', pos:'اسم/فعل', pack:'core', aliases:['بصر','بصير','ابصارهم','أبصارهم'] },
  { key:'شكر', display:'شُكْر', urdu:'شکر', root:'ش ك ر', lemma:'شكر', pos:'اسم', pack:'core', aliases:['شكر','اشكروا','شاكر'] },
  { key:'كفر', display:'كَفَرَ', urdu:'کفر / انکار کیا', root:'ك ف ر', lemma:'كفر', pos:'فعل', pack:'core', aliases:['كفر','كفروا','الكافرين','كافر'] },
  { key:'رحمة', display:'رَحْمَة', urdu:'رحمت', root:'ر ح م', lemma:'رحمة', pos:'اسم', pack:'core', aliases:['رحمة','رحمته'] },
  { key:'خير', display:'خَيْر', urdu:'بھلائی / بہتر', root:'خ ي ر', lemma:'خير', pos:'اسم', pack:'core', aliases:['خير','الخير'] },
  { key:'شر', display:'شَرّ', urdu:'برائی', root:'ش ر ر', lemma:'شر', pos:'اسم', pack:'core', aliases:['شر','الشر'] },
  { key:'دنيا', display:'الدُّنْيَا', urdu:'دنیا / قریب کی زندگی', root:'د ن و', lemma:'دنيا', pos:'صفت/اسم', pack:'core', aliases:['دنيا','الدنيا'] },
  { key:'اخرة', display:'الْآخِرَة', urdu:'آخرت', root:'أ خ ر', lemma:'آخرة', pos:'اسم', pack:'core', aliases:['اخرة','آخرة','الآخرة','الاخره'] }
];

export const LEARNING_PHRASES = [
  { id:'fatihah-1', arabic:'الْحَمْدُ لِلَّهِ', urdu:'تمام تعریف اللہ کے لیے ہے', words:['الحمد','الله'] },
  { id:'fatihah-2', arabic:'رَبِّ الْعَالَمِينَ', urdu:'تمام جہانوں کا رب', words:['رب','العالمين'] },
  { id:'fatihah-3', arabic:'إِيَّاكَ نَعْبُدُ', urdu:'ہم صرف تیری عبادت کرتے ہیں', words:['اياك','نعبد'] },
  { id:'fatihah-4', arabic:'وَإِيَّاكَ نَسْتَعِينُ', urdu:'اور صرف تجھ ہی سے مدد مانگتے ہیں', words:['اياك','نستعين'] },
  { id:'fatihah-5', arabic:'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', urdu:'ہمیں سیدھے راستے کی ہدایت دے', words:['اهدنا','الصراط','المستقيم'] },
  { id:'core-1', arabic:'الَّذِينَ آمَنُوا', urdu:'وہ لوگ جو ایمان لائے', words:['الذين','امن'] },
  { id:'core-2', arabic:'وَعَمِلُوا الصَّالِحَاتِ', urdu:'اور نیک عمل کیے', words:['عمل','صالح'] },
  { id:'core-3', arabic:'يَوْمِ الْقِيَامَةِ', urdu:'قیامت کے دن', words:['يوم'] }
];

export const ROOT_NOTES = [
  { root:'ر ح م', gloss:'رحمت، شفقت', keys:['الرحمن','الرحيم','رحمة'] },
  { root:'ح م د', gloss:'تعریف، حمد', keys:['الحمد'] },
  { root:'ع ب د', gloss:'عبادت، بندگی', keys:['نعبد'] },
  { root:'ه د ي', gloss:'ہدایت، راستہ دکھانا', keys:['اهدنا'] },
  { root:'غ ف ر', gloss:'ڈھانپنا، بخشنا', keys:['غفر'] },
  { root:'ص ب ر', gloss:'ثابت رہنا، صبر', keys:['صبر'] },
  { root:'ك ت ب', gloss:'لکھنا، مقرر کرنا', keys:['كتاب'] },
  { root:'أ م ن', gloss:'امن، اطمینان، ایمان', keys:['امن'] },
  { root:'ع ل م', gloss:'علم، جاننا', keys:['العالمين','علم'] },
  { root:'ق و ل', gloss:'کہنا، قول', keys:['قال'] },
  { root:'ر ز ق', gloss:'رزق دینا', keys:['رزق'] },
  { root:'خ ل ق', gloss:'پیدا کرنا', keys:['خلق'] }
];

export const TUTOR_PRESETS = [
  'اس آیت کو آسان اردو میں سمجھائیں',
  'اس لفظ کا root کیا ہے؟',
  'Word by word سمجھائیں',
  'Grammar بہت آسان طریقے سے سمجھائیں'
];
