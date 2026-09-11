import Link from "next/link";
import type { SavingsRecord } from "@/types/member";

const euro = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

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
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl text-olive-900">
          Histórico de economias
        </h2>
        {records.length ? (
          <span className="text-sm text-olive-600">
            {records.length} registos
          </span>
        ) : null}
      </div>
      {records.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-olive-900/20 p-7">
          <p className="font-display text-xl text-olive-900">
            Ainda não existem economias registadas.
          </p>
          <p className="mt-2 text-sm leading-6 text-olive-700">
            Quando usar um benefício, registe o valor da fatura e do desconto
            para acompanhar o seu impacto.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-7">
          {Object.entries(groups).map(([month, items]) => (
            <div key={month}>
              <p className="text-wine-700 text-xs font-semibold tracking-[0.18em] uppercase">
                {month}
              </p>
              <div className="mt-3 space-y-3">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="bg-cream-100 rounded-2xl border border-olive-900/10 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/explorar/${item.businessSlug}`}
                          className="font-display decoration-gold-500 text-xl text-olive-900 underline underline-offset-4"
                        >
                          {item.businessName}
                        </Link>
                        <p className="mt-1 text-xs text-olive-600">
                          {item.category} ·{" "}
                          {new Intl.DateTimeFormat("pt-PT").format(
                            new Date(item.redeemedAt),
                          )}
                        </p>
                      </div>
                      <p className="text-wine-700 text-lg font-semibold">
                        +{euro.format(item.discountAmount)}
                      </p>
                    </div>
                    <div className="mt-4 flex gap-6 text-xs text-olive-600">
                      <span>
                        Fatura{" "}
                        <strong className="text-olive-900">
                          {euro.format(item.totalBillAmount)}
                        </strong>
                      </span>
                      <span>
                        Desconto{" "}
                        <strong className="text-olive-900">
                          {euro.format(item.discountAmount)}
                        </strong>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
