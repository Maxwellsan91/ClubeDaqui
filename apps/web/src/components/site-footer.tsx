"use client";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { useLanguage } from "./language-provider";

export function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="text-cream-50 bg-olive-900 px-5 py-8 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        {/* Desktop: 3-col grid. Mobile: brand + compact 2-col links */}
        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Image
              src="/logo-dark.png"
              alt="Clube Daqui"
              width={170}
              height={46}
              style={{ height: "44px", width: "auto" }}
            />
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

        {/* Mobile compact layout */}
        <div className="sm:hidden">
          <Image
            src="/logo-dark.png"
            alt="Clube Daqui"
            width={150}
            height={40}
            style={{ height: "36px", width: "auto" }}
          />
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2">
            <Link href="/explorar" className="text-cream-100/65 py-1 text-sm">
              {t("places")}
            </Link>
            <Link href="/parceiros" className="text-cream-100/65 py-1 text-sm">
              {t("partner")}
            </Link>
            <Link href="/clube" className="text-cream-100/65 py-1 text-sm">
              Clube
            </Link>
            <Link href="/registar" className="text-cream-100/65 py-1 text-sm">
              {t("signUp")}
            </Link>
            <Link href="/conta" className="text-cream-100/65 py-1 text-sm">
              {t("membersArea")}
            </Link>
            <Link href="/entrar" className="text-cream-100/65 py-1 text-sm">
              {t("signIn")}
            </Link>
          </div>
        </div>

        <div className="border-cream-50/10 mt-6 flex items-center justify-between border-t pt-5 sm:mt-10 sm:pt-6">
          <p className="text-cream-100/40 text-xs">
            © {new Date().getFullYear()} Clube Daqui
          </p>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
