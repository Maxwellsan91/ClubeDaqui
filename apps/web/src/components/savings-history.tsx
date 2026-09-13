import Link from "next/link";
import type { SavingsRecord } from "@/types/member";

const euro = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

const dateShort = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const AVATAR_COLORS = ["#743b40", "#5a6e5c", "#b58b4a", "#243029", "#425044"];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + h * 31;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function SavingsHistory({ records }: { records: SavingsRecord[] }) {
  const groups = records.reduce<Record<string, SavingsRecord[]>>(
    (all, record) => {
      const key = new Intl.DateTimeFormat("pt-PT", {
        month: "long",
        year: "numeric",
      }).format(new Date(record.redeemedAt));
      (all[key] ??= []).push(record);
      return all;
    },
    {},
  );

  if (records.length === 0) {
    return (
      <section>
        <h2 className="font-display text-2xl text-olive-900">
          Histórico de economias
        </h2>
        <div className="mt-5 rounded-2xl border border-dashed border-olive-900/20 p-7">
          <p className="font-display text-xl text-olive-900">
            Ainda não existem economias registadas.
          </p>
          <p className="mt-2 text-sm leading-6 text-olive-700">
            Quando usar um benefício, registe o valor da fatura e do desconto
            para acompanhar o seu impacto.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl text-olive-900">
          Histórico de economias
        </h2>
        <span className="text-sm text-olive-600">
          {records.length} registos
        </span>
      </div>

      <div className="mt-5 space-y-8">
        {Object.entries(groups).map(([month, items]) => (
          <div key={month}>
            {/* Month header */}
            <p className="mb-1 text-base font-bold text-olive-900 capitalize">
              {month.charAt(0).toUpperCase() + month.slice(1)}
            </p>

            {/* Rows */}
            <div className="bg-cream-100 overflow-hidden rounded-2xl border border-olive-900/10">
              {items.map((item, idx) => (
                <Link
                  key={item.id}
                  href={`/explorar/${item.businessSlug}`}
                  className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-olive-900/4 ${
                    idx < items.length - 1 ? "border-b border-olive-900/8" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: avatarColor(item.businessName) }}
                  >
                    {initials(item.businessName)}
                  </div>

                  {/* Center */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-olive-600">
                      {item.category}
                    </p>
                    <p className="truncate text-sm leading-tight font-semibold text-olive-900">
                      {item.businessName}
                    </p>
                  </div>

                  {/* Right */}
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-olive-600">
                      {dateShort.format(new Date(item.redeemedAt))}
                    </p>
                    <p className="text-wine-700 text-sm font-semibold">
                      +{euro.format(item.discountAmount)}
                    </p>
                  </div>

                  {/* Chevron */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-olive-900/25"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
