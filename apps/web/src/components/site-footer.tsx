"use client";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { useLanguage } from "./language-provider";

export function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="text-cream-50 bg-olive-900 px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl">{t("brand")}</p>
            <p className="text-cream-100/60 mt-4 max-w-xs text-sm leading-6">
              {t("footerDescription")}
            </p>
          </div>
          <div>
            <p className="text-gold-500 text-[10px] font-bold tracking-[0.22em] uppercase">
              {t("explore")}
            </p>
            <nav className="mt-4 flex flex-col gap-3">
              <Link
                href="/explorar"
                className="text-cream-100/70 hover:text-cream-50 text-sm transition-colors"
              >
                {t("places")}
              </Link>
              <Link
                href="/clube"
                className="text-cream-100/70 hover:text-cream-50 text-sm transition-colors"
              >
                Clube
              </Link>
              <Link
                href="/conta"
                className="text-cream-100/70 hover:text-cream-50 text-sm transition-colors"
              >
                {t("membersArea")}
              </Link>
            </nav>
          </div>
          <div>
            <p className="text-gold-500 text-[10px] font-bold tracking-[0.22em] uppercase">
              {t("join")}
            </p>
            <nav className="mt-4 flex flex-col gap-3">
              <Link
                href="/parceiros"
                className="text-cream-100/70 hover:text-cream-50 text-sm transition-colors"
              >
                {t("partner")}
              </Link>
              <Link
                href="/registar"
                className="text-cream-100/70 hover:text-cream-50 text-sm transition-colors"
              >
                {t("signUp")}
              </Link>
              <Link
                href="/entrar"
                className="text-cream-100/70 hover:text-cream-50 text-sm transition-colors"
              >
                {t("signIn")}
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-cream-50/10 mt-10 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-cream-100/40 text-xs">
            © {new Date().getFullYear()} Clube Ribatejo
          </p>
          <div className="flex items-center gap-4">
            <p className="text-cream-100/40 text-xs">{t("localContent")}</p>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
