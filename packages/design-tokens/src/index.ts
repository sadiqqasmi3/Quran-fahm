export const colors = {
  canvas: "#F5F6F2",
  surface: "#FFFFFF",
  surfaceSoft: "#EDF1EC",
  ink: "#13231C",
  muted: "#586961",
  line: "#D6DDD8",
  accent: "#0D6247",
  accentHover: "#094C38",
  accentSoft: "#E1EFE9",
  source: "#315F86",
  warning: "#8A5A00",
  danger: "#B42318",
  focus: "#176B9B",
} as const;

export const spacing = [4, 8, 12, 16, 24, 32, 48, 64] as const;

export const layout = {
  mobileGutter: 16,
  tabletGutter: 24,
  desktopGutter: 40,
  maxCanvas: 1600,
  maxReadingLine: 760,
  surahRail: 288,
  studyMargin: 360,
} as const;

export const typography = {
  ui: '"Atkinson Hyperlegible Next", system-ui, sans-serif',
  quran: '"Amiri Quran", "Noto Naskh Arabic", serif',
  urdu: '"Noto Nastaliq Urdu", "Noto Naskh Arabic", serif',
} as const;
