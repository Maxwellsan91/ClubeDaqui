"use client";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { useLanguage } from "./language-provider";

export function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="text-cream-50 bg-olive-900 px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl">{t("brand")}</p>
          <p className="text-cream-100/70 mt-4 max-w-xs text-sm leading-6">
            {t("footerDescription")}
          </p>
        </div>
        <div>
          <p className="text-gold-500 text-xs font-semibold tracking-[0.2em] uppercase">
            {t("explore")}
          </p>
          <nav className="text-cream-100/80 mt-4 flex flex-col gap-3 text-sm">
            <Link href="/explorar">{t("places")}</Link>
            <Link href="/ofertas">{t("offers")}</Link>
            <Link href="/conta">{t("membersArea")}</Link>
          </nav>
        </div>
        <div>
          <p className="text-gold-500 text-xs font-semibold tracking-[0.2em] uppercase">
            {t("join")}
          </p>
          <nav className="text-cream-100/80 mt-4 flex flex-col gap-3 text-sm">
            <Link href="/parceiros">{t("partner")}</Link>
            <Link href="/registar">{t("signUp")}</Link>
            <Link href="/entrar">{t("signIn")}</Link>
          </nav>
        </div>
      </div>
      <div className="border-cream-50/15 text-cream-100/50 mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Clube Ribatejo</p>
        <div className="flex items-center gap-4">
          <p>{t("localContent")}</p>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
