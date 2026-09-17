import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

function NavLink({
  href,
  icon,
  label,
  disabled,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="text-cream-50/30 flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm">
        {icon}
        <span className="hidden lg:block">{label}</span>
        <span className="bg-cream-50/10 text-cream-50/40 ml-auto hidden rounded-full px-2 py-0.5 text-[10px] lg:block">
          em breve
        </span>
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="text-cream-50/70 hover:bg-cream-50/10 hover:text-cream-50 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
    >
      {icon}
      <span className="hidden lg:block">{label}</span>
    </Link>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar?redirectTo=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "ADMIN") redirect("/conta");

  const initials = (profile?.full_name ?? "A")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="bg-cream-50 flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-16 flex-col bg-olive-900 lg:w-56">
        {/* Logo */}
        <div className="border-cream-50/10 flex h-16 items-center gap-3 border-b px-3">
          {/* Mobile: app icon */}
          <Image
            src="/logo-icon.png"
            alt="Clube Daqui"
            width={32}
            height={32}
            className="flex-none lg:hidden"
            style={{ height: "32px", width: "32px", borderRadius: "6px" }}
          />
          {/* Desktop: horizontal dark logo + admin badge */}
          <div className="hidden lg:flex lg:flex-col lg:gap-0.5">
            <Image
              src="/logo-dark.png"
              alt="Clube Daqui"
              width={120}
              height={32}
              style={{ height: "26px", width: "auto" }}
            />
            <p className="text-gold-500 text-[10px] font-semibold tracking-widest uppercase">
              Admin
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-2 pt-4">
          <NavLink
            href="/admin"
            label="Dashboard"
            icon={
              <svg
                className="h-5 w-5 flex-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            }
          />
          <NavLink
            href="/admin/parceiros"
            label="Parceiros"
            icon={
              <svg
                className="h-5 w-5 flex-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            }
          />
          <NavLink
            href="/admin/utilizadores"
            label="Utilizadores"
            icon={
              <svg
                className="h-5 w-5 flex-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <NavLink
            href="/admin/influencers"
            label="Influencers"
            icon={
              <svg
                className="h-5 w-5 flex-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            }
          />
        </nav>

        {/* User + logout */}
        <div className="border-cream-50/10 space-y-1 border-t p-3">
          <div className="flex items-center gap-3 rounded-xl px-1 py-2">
            <div className="bg-cream-50/15 text-cream-50 flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-semibold">
              {initials}
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="text-cream-50 truncate text-xs font-medium">
                {profile?.full_name ?? "Admin"}
              </p>
              <p className="text-cream-50/40 text-[10px]">Administrador</p>
            </div>
          </div>
          <form action="/auth/logout" method="POST">
            <button
              type="submit"
              className="text-cream-50/60 hover:bg-cream-50/10 hover:text-cream-50 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
            >
              <svg
                className="h-5 w-5 flex-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden lg:block">Sair</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 pl-16 lg:pl-56">
        <div className="min-h-screen p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
