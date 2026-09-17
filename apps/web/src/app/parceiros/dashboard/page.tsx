"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const euro = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTime = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

type MonthPoint = { month: string; count: number };
type RecentRedemption = {
  id: string;
  memberName: string | null;
  benefitTitle: string;
  redeemedAt: string;
  billAmount: number | null;
  discountAmount: number | null;
};
type Stats = {
  businessName: string | null;
  totalRedemptions: number;
  thisMonthRedemptions: number;
  lastMonthRedemptions: number;
  uniqueMembers: number;
  totalRevenue: number;
  avgBillAmount: number;
  totalDiscount: number;
  monthlySeries: MonthPoint[];
  recentRedemptions: RecentRedemption[];
};

function MonthlyChart({ series }: { series: MonthPoint[] }) {
  const max = Math.max(...series.map((s) => s.count), 1);
  return (
    <div className="flex items-end gap-2" style={{ height: "8rem" }}>
      {series.map((s) => {
        const pct = Math.max((s.count / max) * 100, s.count > 0 ? 8 : 2);
        return (
          <div
            key={s.month}
            className="flex flex-1 flex-col items-center justify-end gap-1.5"
          >
            {s.count > 0 && (
              <span className="text-[10px] font-bold text-olive-900">
                {s.count}
              </span>
            )}
            <div
              className="w-full rounded-t-lg transition-all duration-700"
              style={{
                height: `${pct}%`,
                background:
                  s.count > 0
                    ? "linear-gradient(to top, #3d4a2e, #5a6e43)"
                    : "#e8e4dc",
                minHeight: 3,
              }}
            />
            <span className="text-[10px] font-medium text-olive-500">
              {s.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DeltaBadge({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  if (!previous) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return null;
  const up = pct > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
        up ? "bg-olive-700/10 text-olive-700" : "bg-wine-700/10 text-wine-700"
      }`}
    >
      {up ? "↑" : "↓"} {Math.abs(pct)}%
    </span>
  );
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const { data: session } = await createClient().auth.getSession();
        const token = session.session?.access_token;
        if (!token || !apiUrl) throw new Error();
        const res = await fetch(`${apiUrl}/api/partner/redemptions/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const payload = (await res.json()) as { data?: Stats };
        setStats(payload.data ?? null);
        setLoadState("ready");
      } catch {
        setLoadState("error");
      }
    })();
  }, []);

  async function signOut() {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.replace("/entrar");
  }

  return (
    <div className="bg-cream-50 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-olive-900/8 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-olive-900 text-xs font-bold text-white">
              CR
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-olive-500 uppercase">
                Clube Daqui
              </p>
              <p className="text-xs font-semibold text-olive-900">
                {stats?.businessName ?? "Área de parceiros"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/parceiros/validar"
              className="bg-gold-500 inline-flex h-9 items-center rounded-full px-4 text-xs font-bold text-olive-900 transition hover:opacity-90"
            >
              <svg
                className="mr-1.5 h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Validar código
            </Link>
            <button
              onClick={() => void signOut()}
              disabled={signingOut}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-olive-900/15 px-3 text-xs font-semibold text-olive-600 transition hover:bg-olive-900/5 disabled:opacity-50"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Page title */}
        <div className="mb-8">
          <p className="text-wine-700 text-[11px] font-bold tracking-[0.28em] uppercase">
            Dashboard
          </p>
          <h1 className="font-display mt-1 text-3xl tracking-tight text-olive-900 sm:text-4xl">
            {stats?.businessName ?? "O seu estabelecimento"}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-olive-600" />
            <span className="text-xs font-semibold text-olive-600">
              Parceiro ativo
            </span>
          </div>
        </div>

        <Link
          href="/parceiros/validar"
          className="group bg-gold-500 shadow-gold-500/20 hover:bg-gold-400 mb-8 flex min-h-[88px] w-full items-center justify-between gap-4 rounded-3xl px-6 py-5 text-olive-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:px-8"
        >
          <span>
            <span className="block text-[11px] font-bold tracking-[0.2em] uppercase opacity-70">
              Ação principal
            </span>
            <span className="font-display mt-1 block text-2xl sm:text-3xl">
              Validar código do membro
            </span>
            <span className="mt-1 block text-xs font-medium opacity-70">
              Introduza o código apresentado no telemóvel do cliente
            </span>
          </span>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-olive-900 text-white transition group-hover:scale-105">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Link>

        {/* Loading */}
        {loadState === "loading" && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-olive-900/5"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {loadState === "error" && (
          <div className="rounded-2xl border border-dashed border-olive-900/20 bg-white p-8 text-center">
            <div className="bg-wine-700/8 text-wine-700 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="font-semibold text-olive-900">
              Não foi possível carregar os dados
            </p>
            <p className="mt-1 text-sm text-olive-600">
              Verifique a sua ligação e tente novamente.
            </p>
            <button
              onClick={() => {
                setLoadState("loading");
                window.location.reload();
              }}
              className="mt-4 rounded-full bg-olive-900 px-5 py-2 text-sm font-semibold text-white"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {loadState === "ready" && stats && (
          <div className="space-y-5">
            {/* Impact banner */}
            <div className="overflow-hidden rounded-2xl bg-olive-900 p-6 sm:p-8">
              <p className="text-[11px] font-bold tracking-[0.22em] text-olive-300 uppercase">
                Impacto gerado pelo Clube
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="font-display text-4xl tracking-tight text-white">
                    {euro.format(stats.totalRevenue)}
                  </p>
                  <p className="mt-1 text-xs text-olive-300">
                    Faturação total gerada
                  </p>
                </div>
                <div>
                  <p className="font-display text-4xl tracking-tight text-white">
                    {stats.uniqueMembers}
                  </p>
                  <p className="mt-1 text-xs text-olive-300">
                    {stats.uniqueMembers === 1
                      ? "Membro único"
                      : "Membros únicos"}
                  </p>
                </div>
                <div>
                  <p className="font-display text-4xl tracking-tight text-white">
                    {stats.totalRedemptions}
                  </p>
                  <p className="mt-1 text-xs text-olive-300">
                    Benefícios utilizados
                  </p>
                </div>
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-olive-900/10 bg-white p-4">
                <p className="text-[11px] font-semibold text-olive-500">
                  Visitas este mês
                </p>
                <p className="mt-2 text-2xl font-bold text-olive-900">
                  {stats.thisMonthRedemptions}
                </p>
                <div className="mt-1">
                  <DeltaBadge
                    current={stats.thisMonthRedemptions}
                    previous={stats.lastMonthRedemptions}
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-olive-900/10 bg-white p-4">
                <p className="text-[11px] font-semibold text-olive-500">
                  Total faturado
                </p>
                <p className="mt-2 text-2xl font-bold text-olive-900">
                  {euro.format(stats.totalRevenue)}
                </p>
              </div>
              <div className="rounded-2xl border border-olive-900/10 bg-white p-4">
                <p className="text-[11px] font-semibold text-olive-500">
                  Fatura média
                </p>
                <p className="mt-2 text-2xl font-bold text-olive-900">
                  {euro.format(stats.avgBillAmount)}
                </p>
              </div>
              <div className="rounded-2xl border border-olive-900/10 bg-white p-4">
                <p className="text-[11px] font-semibold text-olive-500">
                  Visitas mês anterior
                </p>
                <p className="mt-2 text-2xl font-bold text-olive-900">
                  {stats.lastMonthRedemptions}
                </p>
              </div>
            </div>

            {/* Monthly chart */}
            <div className="rounded-2xl border border-olive-900/10 bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.2em] text-olive-500 uppercase">
                    Tendência mensal
                  </p>
                  <p className="font-display mt-1 text-xl text-olive-900">
                    Visitas nos últimos 6 meses
                  </p>
                </div>
              </div>
              <MonthlyChart series={stats.monthlySeries} />
            </div>

            {/* Recent redemptions */}
            {stats.recentRedemptions.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-olive-900/10 bg-white">
                <div className="flex items-center justify-between px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.2em] text-olive-500 uppercase">
                      Atividade recente
                    </p>
                    <p className="font-display mt-0.5 text-lg text-olive-900">
                      Últimas utilizações
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-olive-900/6">
                  {stats.recentRedemptions.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 px-5 py-3.5 sm:px-6"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-olive-900 text-[11px] font-bold text-white">
                        {(r.memberName ?? "M").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-olive-900">
                          {r.memberName ?? "Membro do Clube"}
                        </p>
                        <p className="text-[11px] text-olive-500">
                          {r.benefitTitle}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {r.billAmount != null && (
                          <p className="text-sm font-bold text-olive-900">
                            {euro.format(r.billAmount)}
                          </p>
                        )}
                        {r.discountAmount != null && (
                          <p className="text-[10px] text-olive-500">
                            −{euro.format(r.discountAmount)}
                          </p>
                        )}
                        <p className="mt-0.5 text-[10px] text-olive-400">
                          {dateTime.format(new Date(r.redeemedAt))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="rounded-2xl border border-dashed border-olive-900/20 bg-white p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-olive-900/6">
                  <svg
                    className="h-6 w-6 text-olive-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="font-display text-xl text-olive-900">
                  Pronto para receber os primeiros membros
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-olive-600">
                  Quando um membro apresentar o código de benefício, confirme-o
                  aqui e os dados aparecerão automaticamente.
                </p>
                <Link
                  href="/parceiros/validar"
                  className="bg-gold-500 mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-olive-900"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Validar primeiro código
                </Link>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-olive-900/10 pt-6 pb-2">
              <p className="text-xs text-olive-500">
                Questões sobre o seu benefício ou condições?{" "}
                <Link
                  href="/parceiros"
                  className="text-wine-700 font-semibold underline underline-offset-2"
                >
                  Fale connosco
                </Link>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
