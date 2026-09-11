import type { SavingsCategory, SavingsRecord } from "@/types/member";

const categories: SavingsCategory[] = [
  "Gastronomia",
  "Experiências",
  "Alojamento",
  "Lazer",
];
const euro = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

export function SavingsByCategory({ records }: { records: SavingsRecord[] }) {
  const total = records.reduce((sum, item) => sum + item.discountAmount, 0);
  return (
    <section>
      <h2 className="font-display text-2xl text-olive-900">
        Economias por categoria
      </h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {categories.map((category) => {
          const value = records
            .filter((item) => item.category === category)
            .reduce((sum, item) => sum + item.discountAmount, 0);
          const percent = total ? Math.round((value / total) * 100) : 0;
          return (
            <div
              key={category}
              className="bg-cream-100 rounded-2xl border border-olive-900/10 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-olive-900">
                  {category}
                </p>
                <p className="text-sm text-olive-700">{euro.format(value)}</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-olive-900/10">
                <div
                  className="bg-gold-500 h-full rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-olive-600">
                {percent}% das suas economias
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
