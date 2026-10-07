import { UseRewardButton } from "./use-reward-button";

// Linha de recompensa: "3 selos — 50% no segundo prato".
export function RewardCard({
  requiredStamps,
  title,
  description,
  reached,
  redeemed,
  available,
  onRedeemed,
}: {
  requiredStamps: number;
  title: string;
  description?: string | null;
  reached?: boolean;
  redeemed?: boolean;
  // Quando desbloqueada e disponível, permite gerar o código de utilização.
  available?: { rewardRedemptionId: string } | null;
  onRedeemed?: () => void;
}) {
  return (
    <div
      className={
        "flex flex-col gap-3 rounded-xl border p-4 " +
        (reached
          ? "border-gold-500/40 bg-gold-500/5"
          : "border-olive-900/10 bg-white")
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold " +
            (reached
              ? "bg-gold-500 text-olive-900"
              : "bg-olive-900/8 text-olive-700")
          }
        >
          {requiredStamps}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-olive-900">{title}</p>
            {redeemed ? (
              <span className="bg-olive-700/10 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-olive-700 uppercase">
                Utilizada
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="text-xs text-olive-600">{description}</p>
          ) : (
            <p className="text-xs text-olive-600">
              {requiredStamps} selos necessários
            </p>
          )}
        </div>
      </div>
      {available && !redeemed ? (
        <UseRewardButton
          rewardRedemptionId={available.rewardRedemptionId}
          title={title}
          onRedeemed={onRedeemed}
        />
      ) : null}
    </div>
  );
}