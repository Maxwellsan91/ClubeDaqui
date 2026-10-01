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
      className="border-cream-50/20 text-cream-50 flex min-h-10 items-center justify-center rounded-full border px-3 py-2 text-xs font-semibold sm:px-4"
    >
      <span aria-hidden="true">{dark ? "☀" : "☾"}</span>
      <span className="ml-1.5 hidden sm:inline">
        {dark ? "Modo claro" : "Modo escuro"}
      </span>
    </button>
  );
}
