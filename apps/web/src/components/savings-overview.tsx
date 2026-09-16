"use client";

import type { MemberSummaryData, SavingsRecord } from "@/types/member";

const euro = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function SavingsOverview({
  records,
  summary,
}: {
  records: SavingsRecord[];
  summary?: MemberSummaryData;
}) {
  const total = records.reduce((sum, r) => sum + r.discountAmount, 0);
  const avgPerUse = records.length ? total / records.length : 0;
  const potential =
    summary?.potentialSavings ??
    Math.max(
      total + (summary?.totalBenefits ?? 10) * Math.max(avgPerUse, 15),
      total + 100,
    );
  const subscriptionPrice = summary?.subscriptionPrice ?? 59;
  const scale = Math.max(potential, subscriptionPrice, total, 100);

  const totalPct = Math.min((total / scale) * 100, 100);
  const breakEvenPct = Math.min((subscriptionPrice / scale) * 100, 100);
  const profitablePct = Math.max(totalPct - breakEvenPct, 0);
  const tooltipLeft = Math.max(8, Math.min(totalPct, 88));

  const used = summary?.usedBenefits ?? records.length;
  const ofTotal = summary?.totalBenefits;
  const active = summary?.subscriptionStatus === "active";

  return (
    <section className="text-cream-50 rounded-3xl bg-olive-900 p-5 sm:p-7">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-gold-500 text-xs font-semibold tracking-[0.2em] uppercase">
            Santarém e região
          </p>
          <p className="text-cream-100/60 mt-0.5 flex items-center gap-1.5 text-xs">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            {used}
            {ofTotal ? ` de ${ofTotal}` : ""} utilizados
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              active
                ? "bg-cream-50/10 text-cream-50"
                : "bg-cream-50/10 text-cream-100/60"
            }`}
          >
            {active ? "Clube ativo" : "Clube inativo"}
          </span>
          {summary?.validUntil && (
            <span className="text-cream-100/50 text-[10px]">
              válido até {summary.validUntil}
            </span>
          )}
        </div>
      </div>

      {/* Total poupado */}
      <p className="font-display mt-4 text-3xl tracking-tight text-white">
        {euro.format(total)}
        <span className="text-cream-100/60 ml-2 text-base font-normal">
          poupados
        </span>
      </p>

      {/* Progress bar with tooltip */}
      <div className="relative mt-10 pb-1">
        <div
          className="absolute -top-8 flex -translate-x-1/2 items-center gap-1"
          style={{ left: `${tooltipLeft}%` }}
          aria-hidden="true"
        >
          <span className="bg-cream-50 rounded-full px-2.5 py-1 text-[11px] font-bold text-olive-900 shadow-sm">
            {euro.format(total)}
          </span>
          <span
            className="text-gold-300 absolute top-8 -translate-x-1/2 text-[10px] font-bold"
            style={{ left: `${breakEvenPct}%` }}
          >
            {euro.format(subscriptionPrice)}
          </span>
        </div>

        <div className="relative h-3.5 overflow-hidden rounded-full bg-white/15">
          <div
            className="bg-gold-500 absolute inset-y-0 left-0 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(totalPct, breakEvenPct)}%` }}
          />
          {profitablePct > 0 && (
            <div
              className="absolute inset-y-0 rounded-full bg-olive-400 transition-all duration-700"
              style={{ left: `${breakEvenPct}%`, width: `${profitablePct}%` }}
            />
          )}
          <div
            className="absolute -top-1 h-5 w-0.5 bg-white/80"
            style={{ left: `${breakEvenPct}%` }}
            aria-hidden="true"
          />
        </div>

        <p className="text-cream-100/50 mt-1 text-right text-[11px]">
          potencial +{euro.format(potential)}
        </p>
      </div>

      {/* Legend */}
      <div className="text-cream-100/60 mt-3 flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="bg-gold-500 inline-block h-2 w-2 rounded-full" />
          Desconto até recuperar a subscrição
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-olive-400" />
          Lucro após a subscrição
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-white/20" />
          Potencial
        </span>
      </div>
    </section>
  );
}
