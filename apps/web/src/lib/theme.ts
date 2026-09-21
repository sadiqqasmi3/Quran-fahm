export type ThemePreference = "light" | "dark" | "system";

/**
 * Quran Feham is light-first. Historical `system` preferences are deliberately
 * interpreted as light so an operating-system setting can no longer change the
 * product without an explicit choice inside the app.
 */
export function applyThemePreference(theme: unknown): "light" | "dark" {
  const applied = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = applied;
  return applied;
}
