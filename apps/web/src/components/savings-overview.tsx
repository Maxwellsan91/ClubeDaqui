import type { SavingsRecord } from "@/types/member";

const euro = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

export function SavingsOverview({ records }: { records: SavingsRecord[] }) {
  const total = records.reduce((sum, item) => sum + item.discountAmount, 0);
  const average = records.length ? total / records.length : 0;
  const max = Math.max(total, 1);
  return (
    <section className="border-gold-500/40 bg-gold-500/10 rounded-3xl border p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-wine-700 text-xs font-semibold tracking-[0.2em] uppercase">
            Economias
          </p>
          <h2 className="font-display mt-3 text-3xl text-olive-900">
            As suas economias
          </h2>
          <p className="mt-2 text-sm text-olive-700">
            Clube Ribatejo · Santarém e Almeirim
          </p>
        </div>
        <p className="font-display text-4xl text-olive-900">
          {euro.format(total)}
        </p>
      </div>
      <div className="mt-7">
        <div className="flex justify-between text-xs font-semibold text-olive-700">
          <span>
            {records.length}{" "}
            {records.length === 1
              ? "benefício utilizado"
              : "benefícios utilizados"}
          </span>
          <span>
            {average
              ? `${euro.format(average)} em média`
              : "Comece a registar as suas visitas"}
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-olive-900/10">
          <div
            className="bg-wine-700 h-full rounded-full transition-all"
            style={{ width: `${Math.min((total / max) * 100, 100)}%` }}
          />
        </div>
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white/50 p-4">
          <p className="text-xs text-olive-600">Total poupado</p>
          <p className="mt-1 text-xl font-semibold text-olive-900">
            {euro.format(total)}
          </p>
        </div>
        <div className="rounded-2xl bg-white/50 p-4">
          <p className="text-xs text-olive-600">Média por utilização</p>
          <p className="mt-1 text-xl font-semibold text-olive-900">
            {euro.format(average)}
          </p>
        </div>
        <div className="rounded-2xl bg-white/50 p-4">
          <p className="text-xs text-olive-600">Potencial futuro</p>
          <p className="mt-1 text-xl font-semibold text-olive-900">—</p>
        </div>
      </div>
    </section>
  );
}
