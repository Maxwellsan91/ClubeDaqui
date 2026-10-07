import Link from "next/link";
import { StampProgress } from "./stamp-progress";
import type { LoyaltyOverviewItem } from "@/types/loyalty";

// Cartão de um programa na secção "Os meus Selos" da conta.
export function LoyaltyCard({ item }: { item: LoyaltyOverviewItem }) {
  const required = item.nextReward?.requiredStamps ?? item.currentStamps;

  return (
    <div className="rounded-2xl border border-olive-900/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-olive-900">
            {item.businessName}
          </h3>
          <p className="text-xs text-olive-600">Selos Daqui</p>
        </div>
        {item.availableRewardsCount > 0 ? (
          <span className="bg-gold-500/15 text-olive-900 rounded-full px-2.5 py-1 text-xs font-semibold">
            {item.availableRewardsCount} recompensa
            {item.availableRewardsCount > 1 ? "s" : ""}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <StampProgress current={item.currentStamps} required={required} />
      </div>

      {item.nextReward ? (
        <div className="mt-4 rounded-xl bg-cream-100 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-olive-600">
            Próxima recompensa
          </p>
          <p className="text-sm font-medium text-olive-900">
            {item.nextReward.title}
          </p>
          <p className="mt-0.5 text-xs text-olive-600">
            {item.nextReward.stampsRemaining > 0
              ? `Faltam ${item.nextReward.stampsRemaining} selo${item.nextReward.stampsRemaining > 1 ? "s" : ""}`
              : "Já pode desbloquear"}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-olive-600">
          Todas as recompensas deste parceiro foram alcançadas.
        </p>
      )}

      <Link
        href={`/explorar/${item.businessSlug}`}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-olive-900 underline-offset-4 hover:underline"
      >
        Ver progresso
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}