"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Stats = {
  totalMembers: number;
  newMembers30d: number;
  activeBusinesses: number;
  confirmedRedemptions: number;
  economyTotal: number;
  estimatedRevenue: number;
};

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "gold" | "wine" | "olive";
  icon: React.ReactNode;
}) {
  const accentColor =
    accent === "gold"
      ? "bg-gold-500/10 text-gold-500"
      : accent === "wine"
        ? "bg-wine-700/10 text-wine-700"
        : "bg-olive-900/10 text-olive-900";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-xl p-2.5 ${accentColor}`}>{icon}</div>
      </div>
      <p className="mt-4 text-2xl font-bold text-olive-900">{value}</p>
      <p className="mt-1 text-sm font-medium text-olive-900">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-olive-600">{sub}</p>}
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString("pt-PT");
}
function fmtEur(n: number) {
  return n.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: session } = await createClient().auth.getSession();
      const token = session.session?.access_token;
      if (!token) return;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const json = (await res.json()) as { data: Stats };
        setStats(json.data);
      }
      setLoading(false);
    }
    void load();
  }, []);

  const cards = stats
    ? [
        {
          label: "Membros totais",
          value: fmt(stats.totalMembers),
          sub: "contas com role MEMBER",
          accent: "olive" as const,
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          ),
        },
        {
          label: "Novos membros",
          value: fmt(stats.newMembers30d),
          sub: "últimos 30 dias",
          accent: "gold" as const,
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          ),
        },
        {
          label: "Estabelecimentos ativos",
          value: fmt(stats.activeBusinesses),
          sub: "na plataforma",
          accent: "olive" as const,
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          ),
        },
        {
          label: "Resgates confirmados",
          value: fmt(stats.confirmedRedemptions),
          sub: "benefícios utilizados",
          accent: "olive" as const,
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ),
        },
        {
          label: "Economia gerada",
          value: fmtEur(stats.economyTotal),
          sub: "descontos registados pelos membros",
          accent: "wine" as const,
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          ),
        },
        {
          label: "Receita estimada",
          value: fmtEur(stats.estimatedRevenue),
          sub: `${fmt(stats.totalMembers)} membros × 24€/ano`,
          accent: "gold" as const,
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          ),
        },
      ]
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-olive-900">Dashboard</h1>
        <p className="mt-1 text-sm text-olive-600">
          Visão geral do Clube Ribatejo
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/60" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <a
          href="/admin/parceiros"
          className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-olive-900/10 text-olive-900">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-olive-900">Gerir Parceiros</p>
            <p className="text-sm text-olive-600">
              Ver estabelecimentos e benefícios
            </p>
          </div>
          <svg className="ml-auto h-5 w-5 text-olive-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>

        <a
          href="/admin/utilizadores"
          className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10 text-gold-500">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-olive-900">Gerir Utilizadores</p>
            <p className="text-sm text-olive-600">
              Membros, parceiros e roles
            </p>
          </div>
          <svg className="ml-auto h-5 w-5 text-olive-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      </div>
    </div>
  );
}