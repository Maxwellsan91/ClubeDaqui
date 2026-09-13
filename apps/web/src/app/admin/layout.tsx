import { redirect } from "next/navigation";
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
      <span className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-50/30 cursor-not-allowed">
        {icon}
        <span className="hidden lg:block">{label}</span>
        <span className="ml-auto hidden lg:block text-[10px] bg-cream-50/10 text-cream-50/40 rounded-full px-2 py-0.5">
          em breve
        </span>
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-50/70 hover:bg-cream-50/10 hover:text-cream-50 transition-colors"
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
    <div className="flex min-h-screen bg-cream-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-16 lg:w-56 flex-col bg-olive-900">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-cream-50/10 px-4">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-gold-500 text-xs font-bold text-olive-900">
            CR
          </div>
          <div className="hidden lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-500">
              Admin
            </p>
            <p className="text-xs text-cream-50/50">Clube Ribatejo</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-2 pt-4">
          <NavLink
            href="/admin"
            label="Dashboard"
            icon={
              <svg className="h-5 w-5 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg className="h-5 w-5 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            }
          />
          <NavLink
            href="/admin/utilizadores"
            label="Utilizadores"
            icon={
              <svg className="h-5 w-5 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg className="h-5 w-5 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            }
          />
        </nav>

        {/* User */}
        <div className="border-t border-cream-50/10 p-3">
          <div className="flex items-center gap-3 rounded-xl px-1 py-2">
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-cream-50/15 text-xs font-semibold text-cream-50">
              {initials}
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-xs font-medium text-cream-50">
                {profile?.full_name ?? "Admin"}
              </p>
              <p className="text-[10px] text-cream-50/40">Administrador</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 pl-16 lg:pl-56">
        <div className="min-h-screen p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}