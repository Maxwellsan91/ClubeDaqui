import type { SavingsCategory, SavingsRecord } from "@/types/member";

const euro = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

const CATEGORIES: { name: SavingsCategory; color: string }[] = [
  { name: "Gastronomia", color: "#743b40" },
  { name: "Experiências", color: "#b58b4a" },
  { name: "Alojamento", color: "#5a6e5c" },
  { name: "Lazer", color: "#425044" },
];

function DonutRing({ percent, color }: { percent: number; color: string }) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const filled = (percent / 100) * circumference;

  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      className="shrink-0"
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#243029"
        strokeOpacity="0.1"
        strokeWidth="7"
      />
      {/* Fill */}
      {percent > 0 && (
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "36px 36px",
            transition: "stroke-dasharray 0.7s ease",
          }}
        />
      )}
      {/* Percentage */}
      <text
        x="36"
        y="40"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="#243029"
      >
        {percent}%
      </text>
    </svg>
  );
}

export function SavingsByCategory({ records }: { records: SavingsRecord[] }) {
  const total = records.reduce((sum, r) => sum + r.discountAmount, 0);

  return (
    <section>
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map(({ name, color }) => {
          const value = records
            .filter((r) => r.category === name)
            .reduce((sum, r) => sum + r.discountAmount, 0);
          const percent = total ? Math.round((value / total) * 100) : 0;

          return (
            <div
              key={name}
              className="bg-cream-100 flex items-center gap-3 rounded-2xl border border-olive-900/10 p-4"
            >
              <DonutRing percent={percent} color={color} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-olive-900">
                  {name}
                </p>
                <p className="mt-0.5 text-sm text-olive-700">
                  {euro.format(value)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
