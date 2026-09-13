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
  const avgTotal =
    avgPerUse * Math.max(summary?.totalBenefits ?? 0, records.length);

  const totalPct = potential ? Math.min((total / potential) * 100, 100) : 0;
  const avgPct = potential ? Math.min((avgTotal / potential) * 100, 100) : 0;
  const tooltipLeft = Math.max(8, Math.min(totalPct, 88));

  const used = summary?.usedBenefits ?? records.length;
  const ofTotal = summary?.totalBenefits;
  const active = summary?.subscriptionStatus === "active";

  return (
    <section className="bg-cream-100 rounded-3xl border border-olive-900/10 p-5 sm:p-7">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-olive-900">
            Santarém e região
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-olive-600">
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
                ? "bg-olive-700/10 text-olive-700"
                : "bg-olive-900/8 text-olive-600"
            }`}
          >
            {active ? "Clube ativo" : "Clube inativo"}
          </span>
          {summary?.validUntil && (
            <span className="text-[10px] text-olive-600">
              válido até {summary.validUntil}
            </span>
          )}
        </div>
      </div>

      {/* Total poupado */}
      <p className="font-display mt-4 text-3xl tracking-tight text-olive-900">
        {euro.format(total)}
        <span className="ml-2 text-base font-normal text-olive-600">
          poupados
        </span>
      </p>

      {/* Progress bar with tooltip */}
      <div className="relative mt-6 pb-1">
        <div
          className="absolute -top-8 flex -translate-x-1/2 items-center gap-1"
          style={{ left: `${tooltipLeft}%` }}
          aria-hidden="true"
        >
          <span className="rounded-full bg-olive-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            {euro.format(total)}
          </span>
          {avgTotal > total + 1 && (
            <span className="bg-gold-500 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              {euro.format(avgTotal)}
            </span>
          )}
        </div>

        <div className="relative h-3.5 overflow-hidden rounded-full bg-olive-900/10">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-olive-700 transition-all duration-700"
            style={{ width: `${totalPct}%` }}
          />
          {avgPct > totalPct + 1 && (
            <div
              className="bg-gold-500/70 absolute inset-y-0"
              style={{
                left: `${totalPct}%`,
                width: `${Math.max(avgPct - totalPct, 2)}%`,
              }}
            />
          )}
        </div>

        <p className="mt-1 text-right text-[11px] text-olive-600">
          potencial +{euro.format(potential)}
        </p>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-olive-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-olive-700" />
          Sua economia
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-gold-500 inline-block h-2 w-2 rounded-full" />
          Média
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-olive-900/20" />
          Potencial
        </span>
      </div>
    </section>
  );
}
