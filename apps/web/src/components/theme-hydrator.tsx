"use client";

import { useEffect } from "react";
import { applyThemePreference } from "@/lib/theme";

export function ThemeHydrator() {
  useEffect(() => {
    const stored = window.localStorage.getItem("qf:web-preferences");
    if (!stored) {
      applyThemePreference("light");
      return;
    }
    try {
      const value = JSON.parse(stored) as { theme?: unknown };
      // V2 previously treated `system` as an instruction to force the OS colour
      // scheme. That made the product appear permanently dark for many users.
      // Quran Feham now starts light; dark is applied only when it was selected
      // explicitly.
      applyThemePreference(value.theme);
    } catch {
      window.localStorage.removeItem("qf:web-preferences");
      applyThemePreference("light");
    }
  }, []);
  return null;
}
