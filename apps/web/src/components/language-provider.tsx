"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import type { Locale, TranslationKey } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "pt-PT";
    return localStorage.getItem("language") === "EN" ? "en" : "pt-PT";
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem("language", locale === "en" ? "EN" : "PT");
  }, [locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={translations[locale]}>
      <LanguageContextProvider locale={locale} setLocale={setLocaleState}>
        {children}
      </LanguageContextProvider>
    </NextIntlClientProvider>
  );
}

function LanguageContextProvider({
  children,
  locale,
  setLocale,
}: {
  children: React.ReactNode;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}) {
  const translate = useTranslations();
  const value = useMemo(
    () => ({ locale, setLocale, t: (key: TranslationKey) => translate(key) }),
    [locale, setLocale, translate],
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
