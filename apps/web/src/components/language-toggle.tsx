"use client";
import { useState } from "react";
export function LanguageToggle() {
  const [language, setLanguage] = useState(() =>
    typeof window !== "undefined" ? (localStorage.language ?? "PT") : "PT",
  );
  function change(next: string) {
    setLanguage(next);
    localStorage.language = next;
    document.documentElement.lang = next === "EN" ? "en" : "pt-PT";
  }
  return (
    <div className="border-cream-50/20 flex items-center gap-1 rounded-full border p-1 text-xs font-semibold">
      <button
        onClick={() => change("PT")}
        className={`rounded-full px-2 py-1 ${language === "PT" ? "bg-cream-50 text-olive-900" : "text-cream-50"}`}
      >
        PT
      </button>
      <button
        onClick={() => change("EN")}
        className={`rounded-full px-2 py-1 ${language === "EN" ? "bg-cream-50 text-olive-900" : "text-cream-50"}`}
      >
        EN
      </button>
    </div>
  );
}
