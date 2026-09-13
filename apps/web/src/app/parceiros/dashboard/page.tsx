"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/app-header";

const euro = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const dateShort = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type MonthPoint = { month: string; count: number };

type RecentRedemption = {
  id: string;
  memberName: string | null;
  benefitTitle: string;
  redeemedAt: string;
  billAmount: number | null;
};

type Stats = {
  businessName: string | null;
  totalRedemptions: number;
  thisMonthRedemptions: number;
  lastMonthRedemptions: number;
  uniqueMembers: number;
  totalRevenue: number;
  avgBillAmount: number;
  monthlySeries: MonthPoint[];
  recentRedemptions: RecentRedemption[];
};

function MonthlyChart({ series }: { series: MonthPoint[] }) {
  const max = Math.max(...series.map((s) => s.count), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height: "7rem" }}>
      {series.map((s) => {
        const pct = Math.max((s.count / max) * 100, s.count > 0 ? 6 : 0);
        return (
          <div
            key={s.month}
            className="flex flex-1 flex-col items-center justify-end gap-1"
          >
            {s.count > 0 && (
              <p className="text-[10px] font-semibold text-olive-900">
                {s.count}
              </p>
            )}
            <div
              className="w-full rounded-t-md bg-olive-700 transition-all duration-500"
              style={{ height: `${pct}%`, minHeight: s.count > 0 ? 4 : 0 }}
            />
            <p className="text-[10px] text-olive-600">{s.month}</p>
          </div>
        );
      })}
    </div>
  );
}

function Delta({
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
      className={`text-xs font-semibold ${up ? "text-olive-700" : "text-wine-700"}`}
    >
      {up ? "↑" : "↓"} {Math.abs(pct)}% vs mês anterior
    </span>
  );
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function PartnerDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    (async () => {
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
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, []);

  const nav = (
    <div className="flex items-center gap-5">
      <Link
        href="/parceiros/validar"
        className="bg-gold-500 inline-flex min-h-[36px] items-center rounded-full px-4 text-sm font-semibold text-olive-900"
      >
        Validar código
      </Link>
    </div>
  );

  return (
    <main className="min-h-screen">
      <AppHeader rightSlot={nav} mobileRight={nav} />

      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        {/* Heading */}
        <p className="text-wine-700 text-[11px] font-bold tracking-[0.28em] uppercase">
          Área de parceiros
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight text-olive-900 sm:text-4xl">
              {stats?.businessName ?? "O seu estabelecimento"}
            </h1>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-olive-700/10 px-3 py-1 text-xs font-semibold text-olive-700">
              <span className="h-1.5 w-1.5 rounded-full bg-olive-700" />
              Parceiro ativo
            </span>
          </div>
        </div>

        {/* Loading / Error */}
        {status === "loading" && (
          <p className="mt-10 text-sm text-olive-600">
            A carregar estatísticas…
          </p>
        )}
        {status === "error" && (
          <div className="mt-10 rounded-2xl border border-dashed border-olive-900/20 p-7">
            <p className="font-semibold text-olive-900">
              Estatísticas indisponíveis
            </p>
            <p className="mt-1 text-sm text-olive-600">
              Não foi possível carregar os dados. Tente novamente mais tarde.
            </p>
          </div>
        )}

        {status === "ready" && stats && (
          <>
            {/* Impact banner */}
            <div className="border-gold-500/30 bg-gold-500/8 mt-8 rounded-2xl border p-5 sm:p-6">
              <p className="text-[11px] font-bold tracking-[0.22em] text-olive-600 uppercase">
                Impacto do Clube
              </p>
              <p className="font-display mt-2 text-3xl tracking-tight text-olive-900 sm:text-4xl">
                {euro.format(stats.totalRevenue)}
                <span className="ml-2 text-lg font-normal text-olive-600">
                  de faturação gerada
                </span>
              </p>
              <p className="mt-1 text-sm text-olive-700">
                {stats.uniqueMembers}{" "}
                {stats.uniqueMembers === 1
                  ? "membro visitou"
                  : "membros visitaram"}{" "}
                o seu estabelecimento através do Clube Ribatejo.
              </p>
            </div>

            {/* Stats grid */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Visitas este mês */}
              <div className="bg-cream-100 flex flex-col justify-between rounded-2xl border border-olive-900/10 p-4">
                <p className="text-[11px] text-olive-600">Visitas este mês</p>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-olive-900">
                    {stats.thisMonthRedemptions}
                  </p>
                  <Delta
                    current={stats.thisMonthRedemptions}
                    previous={stats.lastMonthRedemptions}
                  />
                </div>
              </div>

              {/* Total utilizações */}
              <div className="bg-cream-100 flex flex-col justify-between rounded-2xl border border-olive-900/10 p-4">
                <p className="text-[11px] text-olive-600">Total utilizações</p>
                <p className="mt-3 text-2xl font-bold text-olive-900">
                  {stats.totalRedemptions}
                </p>
              </div>

              {/* Membros únicos */}
              <div className="bg-cream-100 flex flex-col justify-between rounded-2xl border border-olive-900/10 p-4">
                <p className="text-[11px] text-olive-600">Membros únicos</p>
                <p className="mt-3 text-2xl font-bold text-olive-900">
                  {stats.uniqueMembers}
                </p>
              </div>

              {/* Fatura média */}
              <div className="bg-cream-100 flex flex-col justify-between rounded-2xl border border-olive-900/10 p-4">
                <p className="text-[11px] text-olive-600">Fatura média</p>
                <p className="mt-3 text-2xl font-bold text-olive-900">
                  {euro.format(stats.avgBillAmount)}
                </p>
              </div>
            </div>

            {/* Monthly trend */}
            {stats.monthlySeries.length > 0 && (
              <div className="bg-cream-100 mt-5 rounded-2xl border border-olive-900/10 p-5">
                <p className="text-[11px] font-bold tracking-[0.22em] text-olive-600 uppercase">
                  Visitas mensais
                </p>
                <p className="font-display mt-1 text-xl text-olive-900">
                  Crescimento ao longo do tempo
                </p>
                <div className="mt-5">
                  <MonthlyChart series={stats.monthlySeries} />
                </div>
              </div>
            )}

            {/* Recent redemptions */}
            {stats.recentRedemptions.length > 0 && (
              <div className="mt-5">
                <p className="text-[11px] font-bold tracking-[0.22em] text-olive-600 uppercase">
                  Atividade recente
                </p>
                <div className="mt-3 overflow-hidden rounded-2xl border border-olive-900/10">
                  {stats.recentRedemptions.map((r, idx) => (
                    <div
                      key={r.id}
                      className={`flex items-center gap-3 px-4 py-3.5 ${
                        idx < stats.recentRedemptions.length - 1
                          ? "border-b border-olive-900/8"
                          : ""
                      } bg-cream-100`}
                    >
                      {/* Avatar */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-olive-900 text-xs font-bold text-white">
                        {(r.memberName ?? "M").charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-olive-900">
                          {r.memberName ?? "Membro do Clube"}
                        </p>
                        <p className="text-[11px] text-olive-600">
                          {r.benefitTitle}
                        </p>
                      </div>

                      {/* Right */}
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] text-olive-600">
                          {dateShort.format(new Date(r.redeemedAt))}
                        </p>
                        {r.billAmount != null && (
                          <p className="text-sm font-semibold text-olive-900">
                            {euro.format(r.billAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state when no redemptions yet */}
            {stats.totalRedemptions === 0 && (
              <div className="mt-8 rounded-2xl border border-dashed border-olive-900/20 p-7">
                <p className="font-display text-xl text-olive-900">
                  Pronto para receber os primeiros membros.
                </p>
                <p className="mt-2 text-sm leading-6 text-olive-700">
                  Quando um membro usar o benefício e apresentar o código,
                  confirme aqui e os dados aparecerão no dashboard.
                </p>
                <Link
                  href="/parceiros/validar"
                  className="bg-gold-500 mt-5 inline-flex min-h-[44px] items-center rounded-full px-5 py-2.5 text-sm font-semibold text-olive-900"
                >
                  Validar primeiro código
                </Link>
              </div>
            )}

            {/* CTA footer */}
            <div className="mt-10 border-t border-olive-900/10 pt-8">
              <p className="text-xs text-olive-600">
                Precisa de ajuda ou quer alterar as condições do benefício?
              </p>
              <Link
                href="/parceiros"
                className="mt-2 text-sm font-semibold text-wine-700"
              >
                Contactar a equipa do Clube →
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}