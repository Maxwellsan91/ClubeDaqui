"use client";
import { useLanguage } from "./language-provider";
export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  const language = locale === "en" ? "EN" : "PT";
  return (
    <div className="border-cream-50/20 flex items-center gap-1 rounded-full border p-1 text-xs font-semibold">
      <button
        onClick={() => setLocale("pt-PT")}
        className={`rounded-full px-2 py-1 ${language === "PT" ? "bg-cream-50 text-olive-900" : "text-cream-50"}`}
      >
        PT
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`rounded-full px-2 py-1 ${language === "EN" ? "bg-cream-50 text-olive-900" : "text-cream-50"}`}
      >
        EN
      </button>
    </div>
  );
}
