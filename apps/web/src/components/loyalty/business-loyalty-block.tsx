"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StampProgress } from "./stamp-progress";
import { RewardCard } from "./reward-card";
import { LoyaltyHistory } from "./loyalty-history";
import { LoyaltyVisitButton } from "./loyalty-visit-button";
import type { LoyaltyDetail, LoyaltyPublicSummary } from "@/types/loyalty";

// Bloco "Selos Daqui" na página do parceiro.
// Membro autenticado -> progresso pessoal + recompensas disponíveis + histórico.
// Visitante -> estrutura do programa + convite a entrar.
export function BusinessLoyaltyBlock({
  businessId,
  businessSlug,
}: {
  businessId: string;
  businessSlug: string;
}) {
  const [status, setStatus] = useState<"loading" | "member" | "public" | "none">(
    "loading",
  );
  const [detail, setDetail] = useState<LoyaltyDetail | null>(null);
  const [summary, setSummary] = useState<LoyaltyPublicSummary | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    void (async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        setStatus("none");
        return;
      }
      const { data } = await createClient().auth.getSession();
      const token = data.session?.access_token;

      if (token) {
        try {
          const res = await fetch(`${apiUrl}/api/me/loyalty/${businessId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const payload = (await res.json()) as { data?: LoyaltyDetail | null };
            if (payload.data) {
              setDetail(payload.data);
              setStatus("member");
              return;
            }
          }
        } catch {
          /* cai para o resumo público */
        }
      }

      try {
        const res = await fetch(`${apiUrl}/api/businesses/${businessId}/loyalty`);
        const payload = (await res.json()) as { data?: LoyaltyPublicSummary | null };
        if (payload.data) {
          setSummary(payload.data);
          setStatus("public");
        } else {
          setStatus("none");
        }
      } catch {
        setStatus("none");
      }
    })();
  }, [businessId, reloadKey]);

  if (status === "loading" || status === "none") return null;

  const isMember = status === "member" && detail;
  const current = isMember ? detail.currentStamps : 0;
  const required = isMember
    ? (detail.nextReward?.requiredStamps ?? detail.currentStamps)
    : Math.max(...(summary?.rewards.map((r) => r.requiredStamps) ?? [1]));
  const programName = isMember ? detail.programName : summary?.programName;

  return (
    <section className="rounded-3xl border border-olive-900/10 bg-white p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <span className="bg-gold-500 h-2.5 w-2.5 rounded-full" />
        <h2 className="text-lg font-semibold tracking-tight text-olive-900">
          Selos Daqui
        </h2>
      </div>
      <p className="mt-1 text-sm text-olive-600">
        {programName
          ? "Volte, acumule selos e desbloqueie recompensas."
          : null}
      </p>

      <div className="mt-5">
        <StampProgress current={current} required={required || 1} />
      </div>

      {/* Recompensas do programa */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {isMember
          ? detail.rewards.map((r) => {
              const available =
                detail.availableRewards.find(
                  (a) => a.rewardId === r.rewardId,
                ) ?? null;
              const redeemed = detail.redeemedRewards.some(
                (x) => x.title === r.title,
              );
              return (
                <RewardCard
                  key={r.rewardId}
                  requiredStamps={r.requiredStamps}
                  title={r.title}
                  description={r.description}
                  reached={r.reached && !redeemed}
                  redeemed={redeemed}
                  available={available ? { rewardRedemptionId: available.rewardRedemptionId } : null}
                  onRedeemed={() => setTimeout(() => setReloadKey((k) => k + 1), 0)}
                />
              );
            })
          : summary?.rewards.map((r, i) => (
              <RewardCard
                key={i}
                requiredStamps={r.requiredStamps}
                title={r.title}
                description={r.description}
              />
            ))}
      </div>

      {/* Ação do membro / convite */}
      {isMember ? (
        <div className="mt-6">
          <LoyaltyVisitButton
            businessId={businessId}
            businessSlug={businessSlug}
            isAuthenticated
            onValidated={() => setTimeout(() => setReloadKey((k) => k + 1), 0)}
          />
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-sm text-olive-700">
            Comece a acumular selos na sua primeira visita.
          </p>
          <LoyaltyVisitButton
            businessId={businessId}
            businessSlug={businessSlug}
            isAuthenticated={false}
          />
        </div>
      )}

      {/* Histórico (apenas membro) */}
      {isMember && detail.history.length > 0 ? (
        <details className="mt-6 group">
          <summary className="cursor-pointer text-sm font-semibold text-olive-900">
            Histórico de visitas
          </summary>
          <div className="mt-3">
            <LoyaltyHistory items={detail.history} />
          </div>
        </details>
      ) : null}
    </section>
  );
}