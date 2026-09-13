"use client";

import type { SavingsRecord } from "@/types/member";

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
  summary?: {
    usedBenefits: number;
    totalBenefits: number;
    potentialSavings?: number | null;
  };
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

  // Clamp tooltip position so it doesn't clip at edges
  const tooltipLeft = Math.max(8, Math.min(totalPct, 88));

  const used = summary?.usedBenefits ?? records.length;
  const ofTotal = summary?.totalBenefits;

  return (
    <section className="bg-cream-100 rounded-3xl border border-olive-900/10 p-6 sm:p-8">
      {/* Header */}
      <p className="text-base font-semibold text-olive-900">
        Santarém &amp; Almeirim
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-olive-600">
        <svg
          width="14"
          height="14"
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

      {/* Progress bar with tooltip */}
      <div className="relative mt-8 pb-1">
        {/* Tooltip */}
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
          {/* Arrow down */}
          <span
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-olive-900"
            style={{ width: 0, height: 0 }}
          />
        </div>

        {/* Bar */}
        <div className="relative h-4 overflow-hidden rounded-full bg-olive-900/10">
          {/* Actual savings */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-olive-700 transition-all duration-700"
            style={{ width: `${totalPct}%` }}
          />
          {/* Average band */}
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

        {/* Right label */}
        <p className="mt-1 text-right text-[11px] text-olive-600">
          +{euro.format(potential)}
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
          Média de economia
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-olive-900/20" />
          Potencial
        </span>
      </div>
    </section>
  );
}
