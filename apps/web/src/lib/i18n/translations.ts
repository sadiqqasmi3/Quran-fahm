export type Locale = "ur" | "en";

export interface Translations {
  // Brand & Common
  appName: string;
  brandTagline: string;
  loading: string;
  error: string;
  retry: string;
  close: string;
  back: string;
  next: string;
  previous: string;
  save: string;
  cancel: string;
  search: string;
  clear: string;
  share: string;
  copied: string;
  copyLink: string;
  offline: string;
  online: string;
  guest: string;
  synced: string;
  open: string;
  viewAll: string;
  completed: string;
  inProgress: string;

  // Navigation
  navHome: string;
  navQuran: string;
  navRecite: string;
  navKhatm: string;
  navAsk: string;
  navMushaf: string;
  navGuide: string;
  navLearn: string;
  navExplore: string;
  navSalah: string;
  navProgress: string;
  navBookmarks: string;
  navDownloads: string;
  navSources: string;
  navAccount: string;
  navSignIn: string;
  navSignOut: string;
  navGuestMode: string;
  navJourneyHeader: string;

  // Home Dashboard
  homeGreeting: string;
  homeSubGreeting: string;
  homeContinueReading: string;
  homeContinueDesc: string;
  homeMushafCardTitle: string;
  homeMushafCardDesc: string;
  homeKhatmCardTitle: string;
  homeKhatmCardDesc: string;
  homeLearnCardTitle: string;
  homeLearnCardDesc: string;
  homeSalahCardTitle: string;
  homeSalahCardDesc: string;
  homeReciteCardTitle: string;
  homeReciteCardDesc: string;
  homeDueWords: string;
  homeReviewedWords: string;
  homeListeningAccuracy: string;

  // 15-Line Mushaf Reader
  mushafTitle: string;
  mushafJumpToPage: string;
  mushafJumpToPara: string;
  mushafPageLabel: string;
  mushafParaLabel: string;
  mushafOfPages: string;
  mushafThemeParchment: string;
  mushafThemeSepia: string;
  mushafThemeNight: string;
  mushafDirectionQuran: string;
  mushafDirectionDigital: string;
  mushafFullscreen: string;
  mushafExitFullscreen: string;
  mushafMarkParaComplete: string;
  mushafParaCompletedBadge: string;
  mushafDownloadPdf: string;
  mushafStudyVerses: string;
  mushafQuickHelp: string;

  // Khatm Rooms
  khatmTitle: string;
  khatmSubtitle: string;
  khatmCreateRoom: string;
  khatmJoinRoom: string;
  khatmActiveRooms: string;
  khatmInviteCode: string;
  khatmClaimPara: string;
  khatmClaimedBy: string;
  khatmMarkComplete: string;
  khatmCompletedStatus: string;
  khatmAvailableStatus: string;
  khatmOverallProgress: string;
  khatmShareWhatsApp: string;
  khatmDownloadReport: string;

  // Quran Study Reader
  readerChooseSurah: string;
  readerSurahCatalog: string;
  readerAyahLabel: string;
  readerTranslationLabel: string;
  readerWordMeaning: string;
  readerRootAnalysis: string;
  readerPlayAudio: string;
  readerPauseAudio: string;
  readerBookmarkAyah: string;

  // Learn & Vocabulary
  learnTitle: string;
  learnSubtitle: string;
  learnDailyWords: string;
  learnStartPractice: string;
  learnRoots: string;
  learnNextWord: string;
  learnMasteryLevel: string;

  // More Tools Page
  moreTitle: string;
  moreSubtitle: string;
  moreOpenAccount: string;

  // Account & Settings
  accountTitle: string;
  accountPreferences: string;
  accountLanguage: string;
  accountLearningLang: string;
  accountTheme: string;
  accountThemeLight: string;
  accountThemeDark: string;
  accountThemeSepia: string;
  accountSaveButton: string;
}

export const URDU_TRANSLATIONS: Translations = {
  // Brand & Common
  appName: "قرآن فہم",
  brandTagline: "فہمِ قرآن کا آسان اور مستند پلیٹ فارم",
  loading: "لوڈ ہو رہا ہے…",
  error: "کوئی خرابی پیش آ گئی",
  retry: "دوبارہ کوشش کریں",
  close: "بند کریں",
  back: "واپس",
  next: "اگلا",
  previous: "پچھلا",
  save: "محفوظ کریں",
  cancel: "منسوخ",
  search: "تلاش کریں...",
  clear: "صاف کریں",
  share: "شیئر کریں",
  copied: "کاپی ہو گیا!",
  copyLink: "لنک کاپی کریں",
  offline: "آف لائن",
  online: "آن لائن",
  guest: "مہمان",
  synced: "ہم آہنگ شدہ",
  open: "کھولیں",
  viewAll: "سب دیکھیں",
  completed: "مکمل",
  inProgress: "جاری ہے",

  // Navigation
  navHome: "صفحۂ اول",
  navQuran: "قرآن ریڈر",
  navRecite: "تلاوت",
  navKhatm: "ختم رومز",
  navAsk: "سوال و فہم",
  navMushaf: "۱۵ سطری مصحف",
  navGuide: "رہنمائے استعمال",
  navLearn: "فہم و لغت",
  navExplore: "تلاش و تحقیق",
  navSalah: "نماز و اذکار",
  navProgress: "پیشرفت",
  navBookmarks: "محفوظ شدہ",
  navDownloads: "ڈاؤن لوڈز",
  navSources: "مآخذ و اسناد",
  navAccount: "اکاؤنٹ اور ترتیبات",
  navSignIn: "سائن ان",
  navSignOut: "سائن آؤٹ",
  navGuestMode: "مہمان موڈ",
  navJourneyHeader: "آپ کا سفرِ قرآن",

  // Home Dashboard
  homeGreeting: "السلام علیکم ورحمۃ اللہ",
  homeSubGreeting: "آج کے بابرکت سفر کا آغاز کریں اور قرآن مجید کو سمجھ کر پڑھیں۔",
  homeContinueReading: "تلاوت جاری رکھیں",
  homeContinueDesc: "جہاں آپ نے تلاوت چھوڑی تھی، وہیں سے دوبارہ شروع کریں۔",
  homeMushafCardTitle: "۱۵ سطری روایتی مصحف",
  homeMushafCardDesc: "حفاظ کرام کا روایتی انداز، واضح صفحات اور آسان ورق گردانی۔",
  homeKhatmCardTitle: "خاندانی ختم القرآن رومز",
  homeKhatmCardDesc: "اہل خانہ اور دوستوں کے ساتھ مل کر قرآن مجید مکمل کریں۔",
  homeLearnCardTitle: "قرآنی الفاظ کا فہم",
  homeLearnCardDesc: "قرآن میں بار بار آنے والے اہم کلمات اور ان کے معنی سیکھیں۔",
  homeSalahCardTitle: "نماز کا فہم اور اذکار",
  homeSalahCardDesc: "سورۃ الفاتحہ، التحیات اور روزمرہ دعاؤں کی تفہیم۔",
  homeReciteCardTitle: "تلاوت اور سماعت",
  homeReciteCardDesc: "نامور قراء کی آواز سنیں اور درست تلفظ سیکھیں۔",
  homeDueWords: "زیرِ دہرائی الفاظ",
  homeReviewedWords: "مکمل شدہ الفاظ",
  homeListeningAccuracy: "سماعت کی درستگی",

  // 15-Line Mushaf Reader
  mushafTitle: "۱۵ سطری روایتی مصحف",
  mushafJumpToPage: "صفحہ پر جائیں",
  mushafJumpToPara: "پارہ منتخب کریں",
  mushafPageLabel: "صفحہ",
  mushafParaLabel: "پارہ",
  mushafOfPages: "کا صفحہ",
  mushafThemeParchment: "دن (Parchment)",
  mushafThemeSepia: "ہلکا براؤن (Sepia)",
  mushafThemeNight: "نائٹ موڈ (Night)",
  mushafDirectionQuran: "روایتی رخ",
  mushafDirectionDigital: "ڈیجیٹل رخ",
  mushafFullscreen: "پوری اسکرین",
  mushafExitFullscreen: "عام اسکرین",
  mushafMarkParaComplete: "پارہ مکمل قرار دیں",
  mushafParaCompletedBadge: "پارہ مکمل ہوا",
  mushafDownloadPdf: "پی ڈی ایف ڈاؤن لوڈ",
  mushafStudyVerses: "مطالعہ اور ترجمہ",
  mushafQuickHelp: "رہنمائی",

  // Khatm Rooms
  khatmTitle: "خاندانی ختم القرآن رومز",
  khatmSubtitle: "مشترکہ تلاوتِ قرآن، دعوتی لنکس اور شفاف تقسیم",
  khatmCreateRoom: "نیا ختم روم بنائیں",
  khatmJoinRoom: "روم میں شامل ہوں",
  khatmActiveRooms: "آپ کے ختم رومز",
  khatmInviteCode: "دعوتی کوڈ",
  khatmClaimPara: "پارہ لیں",
  khatmClaimedBy: "مخصوص برائے",
  khatmMarkComplete: "مکمل ہوا",
  khatmCompletedStatus: "مکمل شدہ",
  khatmAvailableStatus: "دستیاب",
  khatmOverallProgress: "مجموعی پیشرفت",
  khatmShareWhatsApp: "واٹس ایپ پر بھیجیں",
  khatmDownloadReport: "رپورٹ ڈاؤن لوڈ کریں",

  // Quran Study Reader
  readerChooseSurah: "سورت منتخب کریں",
  readerSurahCatalog: "فہرست سورتیں",
  readerAyahLabel: "آیت",
  readerTranslationLabel: "اردو ترجمہ",
  readerWordMeaning: "لفظی معنی",
  readerRootAnalysis: "مادہ اور گرائمر",
  readerPlayAudio: "تلاوت سنیں",
  readerPauseAudio: "وقفہ",
  readerBookmarkAyah: "نشان لگائیں",

  // Learn & Vocabulary
  learnTitle: "قرآنی الفاظ اور لغت کا فہم",
  learnSubtitle: "قرآن مجید کے بار بار آنے والے کلمات کو آسان طریقے سے یاد کریں۔",
  learnDailyWords: "روزانہ کا سبق",
  learnStartPractice: "مشق شروع کریں",
  learnRoots: "بنیادی مادے (Roots)",
  learnNextWord: "اگلا لفظ",
  learnMasteryLevel: "مہارت کا درجہ",

  // More Tools Page
  moreTitle: "تمام قرآنی ٹولز اور سہولیات",
  moreSubtitle: "تلاوت، فہم، نماز، پیشرفت اور اکاؤنٹ کی ترتیبات ایک جگہ۔",
  moreOpenAccount: "اکاؤنٹ کھولیں",

  // Account & Settings
  accountTitle: "اکاؤنٹ اور ترتیبات",
  accountPreferences: "پسندیدہ ترتیبات",
  accountLanguage: "پورٹل کی زبان",
  accountLearningLang: "سیکھنے کی زبان",
  accountTheme: "تھیم (رنگت)",
  accountThemeLight: "روشن (Light)",
  accountThemeDark: "تاریک (Dark)",
  accountThemeSepia: "ہلکا براؤن (Sepia)",
  accountSaveButton: "ترتیبات محفوظ کریں",
};

export const ENGLISH_TRANSLATIONS: Translations = {
  // Brand & Common
  appName: "Quran Feham",
  brandTagline: "Comprehension, Reading, and Shared Quran Completion",
  loading: "Loading…",
  error: "An error occurred",
  retry: "Try Again",
  close: "Close",
  back: "Back",
  next: "Next",
  previous: "Previous",
  save: "Save",
  cancel: "Cancel",
  search: "Search...",
  clear: "Clear",
  share: "Share",
  copied: "Copied!",
  copyLink: "Copy Link",
  offline: "Offline",
  online: "Online",
  guest: "Guest",
  synced: "Synced",
  open: "Open",
  viewAll: "View All",
  completed: "Completed",
  inProgress: "In Progress",

  // Navigation
  navHome: "Home",
  navQuran: "Quran",
  navRecite: "Recite",
  navKhatm: "Khatm",
  navAsk: "Ask",
  navMushaf: "15-Line Mushaf",
  navGuide: "App Guide",
  navLearn: "Learn",
  navExplore: "Explore",
  navSalah: "Salah",
  navProgress: "Progress",
  navBookmarks: "Bookmarks",
  navDownloads: "Downloads",
  navSources: "Sources",
  navAccount: "Account & Settings",
  navSignIn: "Sign In",
  navSignOut: "Sign Out",
  navGuestMode: "Guest Mode",
  navJourneyHeader: "Your Quran Journey",

  // Home Dashboard
  homeGreeting: "As-salamu alaykum",
  homeSubGreeting: "Start today's blessed journey of Quran reading and understanding.",
  homeContinueReading: "Continue Reading",
  homeContinueDesc: "Resume smoothly from where you last paused your recitation.",
  homeMushafCardTitle: "15-Line Mushaf",
  homeMushafCardDesc: "Traditional subcontinent layout with crisp calligraphy and natural page turning.",
  homeKhatmCardTitle: "Family Khatm Rooms",
  homeKhatmCardDesc: "Read and complete the 30 Paras together with family and circles.",
  homeLearnCardTitle: "Quranic Vocabulary",
  homeLearnCardDesc: "Build vocabulary with high-frequency words and spaced review.",
  homeSalahCardTitle: "Salah Comprehension",
  homeSalahCardDesc: "Understand Surah Al-Fatihah, Tashahhud, and daily prayers.",
  homeReciteCardTitle: "Recitation & Audio",
  homeReciteCardDesc: "Listen to world-renowned Qaris and polish pronunciation.",
  homeDueWords: "Words Due",
  homeReviewedWords: "Words Mastered",
  homeListeningAccuracy: "Listening Accuracy",

  // 15-Line Mushaf Reader
  mushafTitle: "15-Line Traditional Mushaf",
  mushafJumpToPage: "Go to Page",
  mushafJumpToPara: "Choose Para",
  mushafPageLabel: "Page",
  mushafParaLabel: "Para",
  mushafOfPages: "page of",
  mushafThemeParchment: "Parchment",
  mushafThemeSepia: "Sepia",
  mushafThemeNight: "Night",
  mushafDirectionQuran: "Quran Flow",
  mushafDirectionDigital: "Digital Flow",
  mushafFullscreen: "Fullscreen",
  mushafExitFullscreen: "Exit Fullscreen",
  mushafMarkParaComplete: "Mark Para Complete",
  mushafParaCompletedBadge: "Para Completed",
  mushafDownloadPdf: "Download PDF",
  mushafStudyVerses: "Study Verses",
  mushafQuickHelp: "Help",

  // Khatm Rooms
  khatmTitle: "Family Khatm Rooms",
  khatmSubtitle: "Shared Quran completion circles with conflict-safe assignments",
  khatmCreateRoom: "Create Room",
  khatmJoinRoom: "Join Room",
  khatmActiveRooms: "Your Active Khatm Rooms",
  khatmInviteCode: "Invite Code",
  khatmClaimPara: "Claim",
  khatmClaimedBy: "Claimed by",
  khatmMarkComplete: "Mark Complete",
  khatmCompletedStatus: "Completed",
  khatmAvailableStatus: "Available",
  khatmOverallProgress: "Overall Progress",
  khatmShareWhatsApp: "Share to WhatsApp",
  khatmDownloadReport: "Download Report",

  // Quran Study Reader
  readerChooseSurah: "Choose Surah",
  readerSurahCatalog: "Surah Catalog",
  readerAyahLabel: "Ayah",
  readerTranslationLabel: "Translation",
  readerWordMeaning: "Word Meaning",
  readerRootAnalysis: "Root & Grammar",
  readerPlayAudio: "Play Audio",
  readerPauseAudio: "Pause Audio",
  readerBookmarkAyah: "Bookmark",

  // Learn & Vocabulary
  learnTitle: "Quranic Vocabulary & Comprehension",
  learnSubtitle: "Learn high-frequency Quranic words through bite-sized daily practice.",
  learnDailyWords: "Daily Practice",
  learnStartPractice: "Start Practice",
  learnRoots: "Roots & Grammar",
  learnNextWord: "Next Word",
  learnMasteryLevel: "Mastery Level",

  // More Tools Page
  moreTitle: "All Quran Tools",
  moreSubtitle: "Learning, recitation, progress, bookmarks, and settings in one place.",
  moreOpenAccount: "Open Account",

  // Account & Settings
  accountTitle: "Account & Settings",
  accountPreferences: "Preferences",
  accountLanguage: "Portal Language",
  accountLearningLang: "Learning Language",
  accountTheme: "Theme",
  accountThemeLight: "Light",
  accountThemeDark: "Dark",
  accountThemeSepia: "Sepia",
  accountSaveButton: "Save Preferences",
};

export function getTranslations(locale: Locale): Translations {
  return locale === "ur" ? URDU_TRANSLATIONS : ENGLISH_TRANSLATIONS;
}
