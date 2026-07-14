// i18n/index.ts
import { en } from "./en";
import { fr } from "./fr";
import { es } from "./es";
import { de } from "./de";
import { it } from "./it";
import { ar } from "./ar";
import { ru } from "./ru";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const translations = { en, fr, es, de, it, ar, ru };

export type LanguageCode = keyof typeof translations;

interface SettingsState {
  language: LanguageCode;
  uiScale: "small" | "default" | "large";
  setLanguage: (lang: LanguageCode) => void;
  setUiScale: (scale: "small" | "default" | "large") => void;
  // Add a method to force sync from URL
  syncLanguageFromUrl: (urlLang: LanguageCode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: "en",
      uiScale: "default",
      setLanguage: (language) => set({ language }),
      setUiScale: (uiScale) => set({ uiScale }),
      // New method to sync language from URL
      syncLanguageFromUrl: (urlLang) => {
        const currentLang = get().language;
        // Only update if different
        if (currentLang !== urlLang) {
          set({ language: urlLang });
        }
      },
    }),
    {
      name: "exclock-settings",
      // IMPORTANT: Don't persist the language to localStorage
      // This ensures the URL always controls the language
      partialize: (state) => ({
        uiScale: state.uiScale, // Only persist UI scale
        // language is NOT persisted
      }),
    },
  ),
);

export function useTranslation() {
  const { language } = useSettingsStore();
  const t = translations[language];
  const dir = language === "ar" ? "ltr" : "rtl";
  return { t, language, dir };
}