export type CapabilityStatus = "live" | "foundation" | "preview" | "planned";

export interface ProductCapability {
  id: string;
  label: string;
  status: CapabilityStatus;
  evidence: string;
}

/**
 * Product copy should derive from this registry rather than implying that a
 * visible screen equals a completed capability.
 */
export const PRODUCT_CAPABILITIES = [
  {
    id: "quran-reader",
    label: "Complete Quran reader",
    status: "live",
    evidence: "runtime source-labelled provider",
  },
  {
    id: "learning-v1",
    label: "Daily learning and spaced review",
    status: "live",
    evidence: "52-word prototype teaching pack",
  },
  {
    id: "listening",
    label: "Listening comprehension",
    status: "live",
    evidence: "named recitation and selected translation",
  },
  {
    id: "explore",
    label: "Words, roots, and Quran search",
    status: "live",
    evidence: "prototype pack plus runtime provider search",
  },
  {
    id: "salah",
    label: "Salah comprehension",
    status: "live",
    evidence: "Al-Fatihah and short-Surah first slice",
  },
  {
    id: "tutor",
    label: "Deterministic grounded tutor",
    status: "live",
    evidence: "exact verse bundle and prototype teaching pack",
  },
  {
    id: "offline-cache",
    label: "Offline shell and opened Quran cache",
    status: "live",
    evidence: "service worker excludes private API data and reports device coverage",
  },
  {
    id: "accounts",
    label: "Accounts and reading sync",
    status: "foundation",
    evidence: "auth, sessions, settings, reading position",
  },
  {
    id: "khatm",
    label: "Khatm Rooms beta",
    status: "foundation",
    evidence: "authenticated rooms, invitations, and transaction-guarded Para states",
  },
  {
    id: "khatm-realtime",
    label: "Realtime Khatm updates and reminders",
    status: "planned",
    evidence: "HTTP refresh works; push transport, recurrence, and reminders are not active",
  },
  {
    id: "mushaf",
    label: "15-line Indo-Pak Mushaf",
    status: "planned",
    evidence: "edition and dataset not selected",
  },
  {
    id: "recitation-assist",
    label: "Live recitation correction",
    status: "planned",
    evidence: "ASR/alignment not selected or benchmarked",
  },
  {
    id: "tajweed",
    label: "Tajweed practice feedback",
    status: "planned",
    evidence: "separate later evaluation",
  },
  {
    id: "ai-tutor",
    label: "External AI tutor",
    status: "planned",
    evidence: "approved retrieval/governance integration required",
  },
] as const satisfies readonly ProductCapability[];

export function capability(id: (typeof PRODUCT_CAPABILITIES)[number]["id"]) {
  return PRODUCT_CAPABILITIES.find((item) => item.id === id);
}
