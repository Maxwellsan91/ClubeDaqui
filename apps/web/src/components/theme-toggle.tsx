"use client";
import { useEffect, useState } from "react";
export function ThemeToggle() {
  const [dark, setDark] = useState(
    () => typeof window !== "undefined" && localStorage.theme === "dark",
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.theme = next ? "dark" : "light";
  }
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      className="border-cream-50/20 text-cream-50 rounded-full border px-4 py-2 text-xs font-semibold"
    >
      {dark ? "☀ Modo claro" : "☾ Modo escuro"}
    </button>
  );
}
