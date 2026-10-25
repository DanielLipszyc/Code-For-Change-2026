"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { esES, ptBR } from "@clerk/localizations";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Language, TranslationKey } from "@/lib/translation";
import { isLanguage, translate } from "@/lib/translation";

const LANGUAGE_STORAGE_KEY = "swamp-spotter-language";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isLanguage(savedLanguage)) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error("Unable to read the saved language preference.", error);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch (error) {
      console.error("Unable to save the language preference.", error);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: Record<string, string | number>) =>
      translate(language, key, values),
    [language]
  );
  const contextValue = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  const localization = language === "es" ? esES : language === "pt" ? ptBR : undefined;

  return (
    <LanguageContext.Provider value={contextValue}>
      <ClerkProvider localization={localization}>{children}</ClerkProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider.");
  }
  return context;
}
