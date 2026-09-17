import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

interface AppHeaderProps {
  /** Right-side slot visible on desktop only. Defaults to main nav links. */
  rightSlot?: ReactNode;
  /** If true, the right slot is also shown on mobile (e.g. for the logout button). */
  mobileRight?: ReactNode;
}

function DefaultNav() {
  return (
    <nav className="flex items-center gap-1">
      <Link
        href="/explorar"
        className="rounded-full px-4 py-2 text-sm font-medium text-olive-700 transition-colors hover:bg-olive-900/5 hover:text-olive-900"
      >
        Explorar
      </Link>
      <Link
        href="/clube"
        className="rounded-full px-4 py-2 text-sm font-medium text-olive-700 transition-colors hover:bg-olive-900/5 hover:text-olive-900"
      >
        Clube
      </Link>
      <Link
        href="/parceiros"
        className="rounded-full px-4 py-2 text-sm font-medium text-olive-700 transition-colors hover:bg-olive-900/5 hover:text-olive-900"
      >
        Parceiros
      </Link>
      <Link
        href="/conta"
        className="bg-wine-700 hover:bg-wine-800 ml-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition-colors"
      >
        Área de Membro
      </Link>
    </nav>
  );
}

export function AppHeader({ rightSlot, mobileRight }: AppHeaderProps) {
  return (
    <header className="bg-cream-50/95 sticky top-0 z-40 border-b border-olive-900/8 backdrop-blur-sm">
      <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="flex-none"
          aria-label="Clube Daqui — página inicial"
        >
          <Image
            src="/logo-light.png"
            alt="Clube Daqui"
            width={140}
            height={38}
            priority
            className="dark:hidden"
            style={{ height: "34px", width: "auto" }}
          />
          <Image
            src="/logo-dark.png"
            alt="Clube Daqui"
            width={140}
            height={38}
            priority
            className="hidden dark:block"
            style={{ height: "34px", width: "auto" }}
          />
        </Link>

        {/* Mobile right slot */}
        {mobileRight && <div className="sm:hidden">{mobileRight}</div>}

        {/* Desktop nav or custom right slot */}
        <div className="hidden sm:block">{rightSlot ?? <DefaultNav />}</div>
      </div>
    </header>
  );
}
