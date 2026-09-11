import type { MemberSummaryData } from "@/types/member";

const euro = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

export function MemberSummary({
  summary,
  totalSavings,
}: {
  summary: MemberSummaryData;
  totalSavings: number;
}) {
  const active = summary.subscriptionStatus === "active";
  return (
    <section className="text-cream-50 rounded-3xl bg-olive-900 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-gold-500 text-xs font-semibold tracking-[0.2em] uppercase">
            Resumo do Clube
          </p>
          <h2 className="font-display mt-3 text-3xl">
            {active ? "Clube ativo" : "Clube por ativar"}
          </h2>
          <p className="text-cream-100/70 mt-2 text-sm">
            {summary.validUntil
              ? `Válido até ${summary.validUntil}`
              : "A validade será apresentada após a adesão."}
          </p>
        </div>
        <div className="bg-cream-50/10 rounded-2xl px-5 py-4">
          <p className="text-cream-100/60 text-xs">Total poupado</p>
          <p className="font-display text-gold-500 mt-1 text-3xl">
            {euro.format(totalSavings)}
          </p>
        </div>
      </div>
      <div className="border-cream-50/15 mt-8 grid grid-cols-2 gap-4 border-t pt-6 sm:grid-cols-3">
        <div>
          <p className="text-cream-100/60 text-xs">Benefícios usados</p>
          <p className="mt-1 text-xl font-semibold">{summary.usedBenefits}</p>
        </div>
        <div>
          <p className="text-cream-100/60 text-xs">Disponíveis</p>
          <p className="mt-1 text-xl font-semibold">
            {summary.availableBenefits}
          </p>
        </div>
        <div>
          <p className="text-cream-100/60 text-xs">Utilização</p>
          <p className="mt-1 text-xl font-semibold">
            {summary.totalBenefits
              ? Math.round((summary.usedBenefits / summary.totalBenefits) * 100)
              : 0}
            %
          </p>
        </div>
      </div>
    </section>
  );
}
