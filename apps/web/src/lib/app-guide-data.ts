import {
  Bookmark,
  BookOpen,
  Smartphone,
  WifiOff,
} from "lucide-react";

export type GuideLanguage = "ur" | "en";

export interface GuideStep {
  number: string;
  title: string;
  desc: string;
}

export interface GuideSection {
  id: string;
  category: string;
  title: string;
  summary: string;
  actionUrl: string;
  actionLabel: string;
  steps: GuideStep[];
}

export interface GuideQuickTip {
  icon: typeof Smartphone;
  title: string;
  text: string;
}

export interface GuideFaq {
  q: string;
  a: string;
}

export interface GuideCategory {
  id: string;
  label: string;
}

export interface GuideContent {
  badge: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  allCategories: string;
  faqTitle: string;
  faqSubtitle: string;
  quickTipsTitle: string;
  quickTips: GuideQuickTip[];
  categories: GuideCategory[];
  sections: GuideSection[];
  faqs: GuideFaq[];
}

export const URDU_GUIDE_CONTENT: GuideContent = {
  badge: "رہنمائے استعمال · Quran Feham Guide",
  title: "قرآن فہم پورٹل استعمال کرنے کا آسان طریقہ",
  subtitle:
    "یہ پورٹل ہر عمر کے قارئین، بالخصوص ہمارے بزرگوں اور نو آموز ساتھیوں کے لیے نہایت آسان بنایا گیا ہے۔ ذیل میں ہر فیچر کا طریقہ مرحلہ وار بیان کیا گیا ہے۔",
  searchPlaceholder: "کسی بھی فیچر یا سوال کے بارے میں تلاش کریں (مثلاً مصحف، ختم، آف لائن)...",
  allCategories: "تمام عنوانات",
  faqTitle: "اکثر پوچھے جانے والے ضروری سوالات",
  faqSubtitle: "روزمرہ پیش آنے والے چند سوالات اور ان کا فوری حل",
  quickTipsTitle: "فوری رہنمائی برائے بزرگ اور نئے صارفین",
  quickTips: [
    {
      icon: Smartphone,
      title: "بڑی اسکرین اور واضح فونٹس",
      text: "فونٹس کو بڑا کرنے کے لیے صفحے پر موجود زوم (Zoom) یا فونٹ سائز بٹن کا استعمال کریں۔",
    },
    {
      icon: Bookmark,
      title: "تلاوت کی جگہ خودکار محفوظ",
      text: "آپ نے جہاں پڑھنا چھوڑا ہوگا، اگلی بار پورٹل خود بخود وہیں سے شروع ہوگا—کوئی نشان لگانے کی فکر نہیں۔",
    },
    {
      icon: WifiOff,
      title: "بغیر انٹرنیٹ بھی دستیاب",
      text: "مصحف کے صفحات پہلے سے محفوظ رہتے ہیں، اگر انٹرنیٹ منقطع بھی ہو جائے تو تلاوت جاری رہے گی۔",
    },
  ],
  categories: [
    { id: "all", label: "سب عنوانات" },
    { id: "mushaf", label: "📖 ۱۵ سطری مصحف" },
    { id: "quran", label: "📜 تلاوت و مطالعہ" },
    { id: "khatm", label: "👥 خاندانی ختم روم" },
    { id: "learn", label: "💡 الفاظ کا فہم" },
    { id: "install", label: "📱 فون میں ایپ بنانا" },
    { id: "offline", label: "📶 بغیر انٹرنیٹ" },
  ],
  sections: [
    {
      id: "mushaf",
      category: "mushaf",
      title: "۱۵ سطری روایتی مصحف (15-Line Mushaf)",
      summary:
        "حفاظ کرام اور برصغیر پاک و ہند کے روایتی انداز میں خوبصورت، واضح اور مستند ۱۵ سطری قرآن مجید۔",
      actionUrl: "/mushaf",
      actionLabel: "۱۵ سطری مصحف کھولیں",
      steps: [
        {
          number: "۱",
          title: "ورق کیسے پلٹیں؟",
          desc: "موبائل پر اسکرین پر دائیں سے بائیں یا بائیں سے دائیں انگلی سے سوائپ (Swipe) کریں۔ کمپیوٹر پر ماؤس کے اسکرول وہیل کو نیچے یا اوپر گھما کر بھی ورق پلٹ سکتے ہیں، یا اسکرین پر بنے تیر کے نشانات کو چھو سکتے ہیں۔",
        },
        {
          number: "۲",
          title: "پڑھنے کا قرآنی یا کتابی رخ",
          desc: "اوپر موجود رخ کے بٹن سے آپ روایتی قرآنی انداز (پہلا صفحہ دائیں طرف) یا عام ڈیجیٹل کتابی انداز کا انتخاب کر سکتے ہیں۔",
        },
        {
          number: "۳",
          title: "دن اور رات کا تھیم (Theme)",
          desc: "اوپر دائیں کونے میں سورج اور چاند کے نشانات سے آپ دن کے اجالے (Parchment)، ہلکے براؤن (Sepia)، یا رات کی گہری کالی اسکرین (Night Mode) میں سے کوئی بھی چن سکتے ہیں تاکہ آنکھوں پر بوجھ نہ پڑے۔",
        },
        {
          number: "۴",
          title: "کسی بھی پارے یا صفحے پر فوری جانا",
          desc: "اوپر بائیں طرف موجود پارے کے نام پر کلک کریں تاکہ ۳۰ پاروں کی فہرست کھل جائے، یا درمیان میں صفحہ نمبر پر کلک کر کے مطلوبہ صفحہ لکھ کر فوری وہاں پہنچ جائیں۔",
        },
      ],
    },
    {
      id: "quran",
      category: "quran",
      title: "روزمرہ مطالعہ، ترجمہ اور الفاظ کا معنی",
      summary:
        "آیت بہ آیت تلاوت، نامور قراء کی آڈیو، اردو ترجمہ اور ہر ہر لفظ کا الگ معنی سمجھنے کے لیے۔",
      actionUrl: "/quran",
      actionLabel: "قرآن ریڈر پر جائیں",
      steps: [
        {
          number: "۱",
          title: "سورت اور آیت کا انتخاب",
          desc: "اوپر سورتوں کی فہرست میں سے سورت کا نام تلاش کریں اور مطلوبہ آیت پر کلک کریں۔",
        },
        {
          number: "۲",
          title: "ہر لفظ کا مطلب جاننا",
          desc: "آیت کے کسی بھی عربی لفظ پر کلک کریں تو نیچے اس کا اردو معنی، مادہ (Root) اور گرائمر کھل جائے گی جس سے ترجمہ ازخود یاد ہونے لگے گا۔",
        },
        {
          number: "۳",
          title: "تلاوت کی آڈیو سننا",
          desc: "ہر آیت کے ساتھ بنے ہوئے پلے (Play) بٹن کو دبائیں تاکہ مستند قاری کی آواز میں صحیح تلفظ سن سکیں۔",
        },
        {
          number: "۴",
          title: "نشان (بک مارک) لگانا",
          desc: "آیت کے ساتھ بنے بُک مارک کے نشان کو چھوئیں تاکہ بعد میں بک مارکس کے صفحے سے اسے ایک کلک میں دوبارہ کھول سکیں۔",
        },
      ],
    },
    {
      id: "khatm",
      category: "khatm",
      title: "خاندانی ختم القرآن رومز (Family Khatm)",
      summary:
        "اپنے اہل خانہ، رشتہ داروں یا دوستوں کے ساتھ مل کر قرآن مجید کا مشترکہ ختم مکمل کریں—بغیر کسی الجھن کے۔",
      actionUrl: "/khatm",
      actionLabel: "ختم رومز دیکھیں",
      steps: [
        {
          number: "۱",
          title: "نیا ختم روم بنانا",
          desc: "ختم کے صفحے پر جا کر 'Create Room' کا بٹن دبائیں، اپنے ختم کا عنوان رکھیں (مثلاً: رمضان المبارک ختم یا مرحوم کے لیے ایصال ثواب)۔",
        },
        {
          number: "۲",
          title: "واٹس ایپ پر دعوتی لنک بھیجنا",
          desc: "روم بننے کے بعد 'Share' کا بٹن دبائیں اور واٹس ایپ پر اہل خانہ کو لنک بھیج دیں۔ وہ بغیر اکاؤنٹ بنائے بھی اپنا نام لکھ کر شامل ہو سکتے ہیں۔",
        },
        {
          number: "۳",
          title: "پارہ چننا (کلیم کرنا)",
          desc: "جو پارہ آپ پڑھنا چاہتے ہیں، اس کے نیچے 'پارہ لیں' (Claim) پر کلک کریں۔ وہ پارہ آپ کے نام سے مخصوص ہو جائے گا تاکہ دوسرا کوئی اسے نہ پڑھے۔",
        },
        {
          number: "۴",
          title: "پڑھ لینے کے بعد مکمل قرار دینا",
          desc: "پارہ مکمل ہونے کے بعد 'مکمل ہوا' (Mark Complete) کا بٹن دبا دیں، پورے خاندان کے سامنے پروگریس بار خود بخود آگے بڑھ جائے گا۔",
        },
      ],
    },
    {
      id: "learn",
      category: "learn",
      title: "قرآنی الفاظ اور زبان فہمی (Learn)",
      summary:
        "قرآن مجید میں سب سے زیادہ بار بار آنے والے کلمات کو آسان طریقے سے ذہن نشین کریں۔",
      actionUrl: "/learn",
      actionLabel: "الفاظ سیکھنا شروع کریں",
      steps: [
        {
          number: "۱",
          title: "روزانہ کا مختصر سبق",
          desc: "روزانہ صرف ۵ سے ۱۰ منٹ دیں اور عام استعمال ہونے والے قرآنی الفاظ، ان کے معنی اور مثالیں دیکھیں۔",
        },
        {
          number: "۲",
          title: "دہرائی اور ٹیسٹ",
          desc: "سسٹم خود بخود وہ الفاظ آپ کے سامنے دوبارہ لائے گا جن میں دہرائی کی ضرورت ہوگی تاکہ وہ مستقل یاد رہیں۔",
        },
      ],
    },
    {
      id: "install",
      category: "install",
      title: "موبائل پر بغیر پلے اسٹور ایپ انسٹال کرنا",
      summary:
        "قرآن فہم کو اپنے موبائل کی ہوم اسکرین پر ایک اصلی ایپ کی طرح رکھیں تاکہ انٹرنیٹ براؤزر کھولنے کی ضرورت نہ پڑے۔",
      actionUrl: "/downloads",
      actionLabel: "ڈاؤن لوڈز اور آف لائن کی تفصیل",
      steps: [
        {
          number: "۱",
          title: "اینڈرائیڈ فون (Chrome پر)",
          desc: "گوگل کروم میں اوپر دائیں جانب تین نقطوں (⋮) کو چھوئیں، اور 'Install app' یا 'Add to Home screen' منتخب کریں۔ ایپ فوری آپ کے فون کے ڈیسک ٹاپ پر آ جائے گی۔",
        },
        {
          number: "۲",
          title: "آئی فون / آئی پیڈ (Safari پر)",
          desc: "سفاری براؤزر میں نیچے درمیان میں شیئر کے نشان (ایک تیر والا چوکور ڈبہ) کو چھوئیں، نیچے اسکرول کر کے 'Add to Home Screen' پر کلک کریں اور 'Add' دبا دیں۔",
        },
      ],
    },
    {
      id: "offline",
      category: "offline",
      title: "انٹرنیٹ کے بغیر آف لائن تلاوت",
      summary:
        "سفر کے دوران، مسجد میں یا کمزور انٹرنیٹ کے اوقات میں بغیر کسی رکاوٹ کے پڑھیں۔",
      actionUrl: "/downloads",
      actionLabel: "آف لائن مینیجر کھولیں",
      steps: [
        {
          number: "۱",
          title: "خودکار کیشنگ",
          desc: "جب آپ کوئی بھی پارہ پڑھتے ہیں، پورٹل اس کے تمام صفحات کو فون کی اندرونی میموری میں محفوظ کر لیتا ہے۔",
        },
        {
          number: "۲",
          title: "مکمل پی ڈی ایف ڈاؤن لوڈ",
          desc: "آپ کسی بھی پارے کی اصل پی ڈی ایف فائل اپنے فون یا لیپ ٹاپ میں آف لائن محفوظ کر کے بھی پڑھ سکتے ہیں۔",
        },
      ],
    },
  ],
  faqs: [
    {
      q: "کیا مجھے قرآن فہم استعمال کرنے کے لیے اکاؤنٹ بنانا لازمی ہے؟",
      a: "نہیں! آپ بغیر کسی اکاؤنٹ اور لاگ ان کے بھی پندرہ سطری مصحف، عام قرآن اور ختم رومز استعمال کر سکتے ہیں۔ البتہ اکاؤنٹ بنانے کا فائدہ یہ ہے کہ آپ کی تلاوت کا ریکارڈ، بک مارکس اور پسندیدہ ترتیبات دوسرے موبائل یا کمپیوٹر پر بھی خود بخود مل جائیں گی۔",
    },
    {
      q: "کیا ایپ کو استعمال کرتے ہوئے میری آخری تلاوت کی جگہ محفوظ رہتی ہے؟",
      a: "جی بالکل! مصحف اور عام ریڈر دونوں خود بخود یاد رکھتے ہیں کہ آپ نے کس پارے اور کس صفحے پر تلاوت روکی تھی۔ جب بھی آپ پورٹل دوبارہ کھولیں گے تو وہیں سے ورق کھلے گا۔",
    },
    {
      q: "کیا میں رات کو پڑھتے ہوئے اسکرین کا رنگ تبدیل کر سکتا ہوں تاکہ آنکھوں پر زور نہ پڑے؟",
      a: "جی ہاں! مصحف کے اوپر 'Night' (چاند والا بٹن) موجود ہے جو پس منظر کو مکمل گہرا سیاہ کر دیتا ہے جس سے رات کے وقت تلاوت نہایت پرسکون اور آنکھوں کے لیے آرام دہ ہو جاتی ہے۔",
    },
    {
      q: "خاندان کے بزرگ جنہیں موبائل زیادہ استعمال کرنا نہیں آتا، وہ ختم میں کیسے شامل ہوں؟",
      a: "آپ واٹس ایپ پر ان کو جو لنک بھیجیں گے، اس پر صرف ایک کلک کرنے سے پورا ختم روم کھل جائے گا۔ وہ آسانی سے اپنے نام کا پارہ دیکھ کر تلاوت کر سکتے ہیں اور مکمل ہونے پر ایک بٹن دبا سکتے ہیں۔",
    },
  ],
};

export const ENGLISH_GUIDE_CONTENT: GuideContent = {
  badge: "User Manual · Quran Feham Guide",
  title: "How to Use the Quran Feham Portal",
  subtitle:
    "Designed with care for everyday readers, elders, and beginners. Everything is simple, clear, and accessible step by step.",
  searchPlaceholder: "Search any feature or question (e.g., Mushaf, Khatm, offline)...",
  allCategories: "All Topics",
  faqTitle: "Frequently Asked Questions",
  faqSubtitle: "Quick, straightforward answers for everyday usage",
  quickTipsTitle: "Helpful Tips for Beginners & Elders",
  quickTips: [
    {
      icon: Smartphone,
      title: "Clear, High-Contrast Text",
      text: "Use the built-in zoom and theme controls to adjust page magnification for comfortable reading.",
    },
    {
      icon: Bookmark,
      title: "Automatic Position Memory",
      text: "The portal remembers your exact Para and Page automatically—resume anytime without losing your place.",
    },
    {
      icon: WifiOff,
      title: "Works Seamlessly Offline",
      text: "Pages and cached Paras remain accessible even when your cellular network or Wi-Fi drops.",
    },
  ],
  categories: [
    { id: "all", label: "All Topics" },
    { id: "mushaf", label: "📖 15-Line Mushaf" },
    { id: "quran", label: "📜 Study Reader" },
    { id: "khatm", label: "👥 Family Khatm" },
    { id: "learn", label: "💡 Word Vocabulary" },
    { id: "install", label: "📱 Phone App Setup" },
    { id: "offline", label: "📶 Offline Usage" },
  ],
  sections: [
    {
      id: "mushaf",
      category: "mushaf",
      title: "15-Line Traditional Mushaf",
      summary:
        "The beloved standard format used by Huffaz and traditional readers across the subcontinent with crisp, razor-sharp Arabic calligraphy.",
      actionUrl: "/mushaf",
      actionLabel: "Open 15-Line Mushaf",
      steps: [
        {
          number: "1",
          title: "Turning Pages Naturally",
          desc: "On mobile or tablet, swipe left or right across the screen. On desktop or laptop, simply scroll your mouse wheel up or down, or click the left and right navigation arrows.",
        },
        {
          number: "2",
          title: "Traditional Quran Flow vs Digital Flow",
          desc: "Use the reading flow toggle in the top toolbar to switch between traditional Quran orientation (Page 1 on the right) or standard digital book flow.",
        },
        {
          number: "3",
          title: "Themes for Eye Comfort",
          desc: "Switch between daytime Parchment (warm cream), Sepia (golden paper), or Night Mode (deep dark slate) with one click from the top header.",
        },
        {
          number: "4",
          title: "Jump to Any Para or Page Instantly",
          desc: "Click the Para title on the top left to choose any of the 30 Paras, or click the page number in the center to jump to any page between 2 and 611.",
        },
      ],
    },
    {
      id: "quran",
      category: "quran",
      title: "Everyday Quran Study & Word Meanings",
      summary:
        "Ayah-by-ayah reading with verified Urdu and English translations, world-renowned Qari recitations, and word-by-word breakdowns.",
      actionUrl: "/quran",
      actionLabel: "Open Quran Reader",
      steps: [
        {
          number: "1",
          title: "Choose Surah & Ayah",
          desc: "Select your desired Surah from the comprehensive catalog or search by Surah name in English or Arabic.",
        },
        {
          number: "2",
          title: "Word-by-Word Comprehension",
          desc: "Click on any individual Arabic word in the text to inspect its direct meaning, linguistic root, and frequency in the Quran.",
        },
        {
          number: "3",
          title: "Listen to Clear Recitation",
          desc: "Tap the audio button beside any verse to listen to the recitation and refine your tajweed and pronunciation.",
        },
        {
          number: "4",
          title: "Save Your Bookmarks",
          desc: "Click the bookmark icon on any ayah to quickly access your favorite verses from the Bookmarks section anytime.",
        },
      ],
    },
    {
      id: "khatm",
      category: "khatm",
      title: "Family Khatm Rooms (Shared Quran Completion)",
      summary:
        "Create private, invitation-based circles for your household, relatives, or community to read the 30 Paras together without conflicts.",
      actionUrl: "/khatm",
      actionLabel: "View Khatm Rooms",
      steps: [
        {
          number: "1",
          title: "Create a Room",
          desc: "Tap 'Create Room' on the Khatm dashboard and give your campaign a meaningful title (e.g. Ramadan Family Khatm or In Memory of Grandparents).",
        },
        {
          number: "2",
          title: "Share Invite on WhatsApp",
          desc: "Tap 'Share' and send the link directly to your family WhatsApp group. Participants can join and claim their Paras even as guests.",
        },
        {
          number: "3",
          title: "Claiming Your Para",
          desc: "Participants tap 'Claim' on their selected Para. The system instantly locks it so no two members read the same Para by accident.",
        },
        {
          number: "4",
          title: "Confirming Completion",
          desc: "Once finished, tap 'Mark Complete' to update the shared progress meter in real time for all family members to celebrate.",
        },
      ],
    },
    {
      id: "learn",
      category: "learn",
      title: "Quranic Vocabulary & Arabic Comprehension",
      summary:
        "Learn the high-frequency words that make up over 80% of the Quranic text with gentle, daily exercises.",
      actionUrl: "/learn",
      actionLabel: "Start Learning Words",
      steps: [
        {
          number: "1",
          title: "Bite-Sized Daily Sessions",
          desc: "Spend just 5 to 10 minutes a day reviewing common words with clear Urdu and English equivalents and context sentences.",
        },
        {
          number: "2",
          title: "Smart Spaced Review",
          desc: "Words are scheduled for review automatically right before you are likely to forget them, building long-term familiarity.",
        },
      ],
    },
    {
      id: "install",
      category: "install",
      title: "Installing as an App on Mobile (PWA)",
      summary:
        "Add Quran Feham directly to your phone's home screen for instant one-tap launch without going through app stores.",
      actionUrl: "/downloads",
      actionLabel: "View Downloads & Offline",
      steps: [
        {
          number: "1",
          title: "On Android Phones (Google Chrome)",
          desc: "Tap the three vertical dots (⋮) in the top right corner of Chrome, then select 'Install app' or 'Add to Home screen'. Confirm when prompted.",
        },
        {
          number: "2",
          title: "On iPhone & iPad (Apple Safari)",
          desc: "Tap the Share button (square with an upward arrow) at the bottom toolbar in Safari, scroll down and tap 'Add to Home Screen', then tap 'Add'.",
        },
      ],
    },
    {
      id: "offline",
      category: "offline",
      title: "Reading Offline Without Internet Data",
      summary:
        "Continue reading at the masjid, during travel, or with intermittent connectivity seamlessly.",
      actionUrl: "/downloads",
      actionLabel: "Open Downloads",
      steps: [
        {
          number: "1",
          title: "Automatic Page Caching",
          desc: "As you read pages in the 15-Line Mushaf, they are automatically preserved in your device's memory for future offline reading.",
        },
        {
          number: "2",
          title: "Standalone Para PDFs",
          desc: "Download high-resolution PDFs of individual Paras or the full Mushaf to your device files for offline backup.",
        },
      ],
    },
  ],
  faqs: [
    {
      q: "Do I need to create an account to read or join a Khatm?",
      a: "No! You can read the 15-Line Mushaf, explore the Quran, and participate in family Khatm rooms as a guest without creating an account. Creating an account allows your reading position and bookmarks to sync across your other devices.",
    },
    {
      q: "Will the app remember my reading page automatically?",
      a: "Yes! Both the 15-Line Mushaf and the Study Reader automatically store your current Para and Page. Whenever you return, it resumes exactly where you left off.",
    },
    {
      q: "Can I adjust the reading screen at night for eye comfort?",
      a: "Yes! Click the Moon icon in the Mushaf toolbar to activate Night Mode, which switches to a gentle, dark background with high-contrast Arabic calligraphy.",
    },
    {
      q: "How can elderly relatives join a family Khatm easily?",
      a: "Simply send them the invitation link via WhatsApp. When they tap the link on their phone, the Khatm room opens immediately—they only need to tap their chosen Para to claim it.",
    },
  ],
};

export function getGuideContent(lang: GuideLanguage): GuideContent {
  return lang === "ur" ? URDU_GUIDE_CONTENT : ENGLISH_GUIDE_CONTENT;
}

export function filterGuideSections(
  sections: GuideSection[],
  category: string,
  searchQuery: string,
): GuideSection[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  return sections.filter((section) => {
    const matchesCategory = category === "all" || section.category === category;
    if (!matchesCategory) return false;

    if (!normalizedQuery) return true;
    const titleMatch = section.title.toLowerCase().includes(normalizedQuery);
    const summaryMatch = section.summary.toLowerCase().includes(normalizedQuery);
    const stepMatch = section.steps.some(
      (s) =>
        s.title.toLowerCase().includes(normalizedQuery) ||
        s.desc.toLowerCase().includes(normalizedQuery),
    );
    return titleMatch || summaryMatch || stepMatch;
  });
}
