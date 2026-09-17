"use client";

import { useEffect, useState } from "react";
import { RecordSavingsForm } from "./record-savings-form";
import type { SavingsRecord } from "@/types/member";

function CountdownTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const expired = remaining <= 0;

  return (
    <span className={expired ? "text-wine-700" : "text-olive-600"}>
      {expired
        ? "Código expirado"
        : `Válido por ${m}:${String(s).padStart(2, "0")} min`}
    </span>
  );
}

export function RedeemBenefitButton({
  benefitId,
  businessLocationId,
  businessName,
  businessSlug,
  onSaved,
}: {
  benefitId?: string;
  businessLocationId?: string;
  businessName: string;
  businessSlug: string;
  onSaved?: (record: SavingsRecord) => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "code" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string>();
  const [code, setCode] = useState<string>();
  const [redemptionId, setRedemptionId] = useState<string>();

  async function redeem() {
    if (!benefitId || !businessLocationId) return;
    setStatus("loading");
    try {
      const response = await fetch("/api/me/redemptions/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          benefit_id: benefitId,
          business_location_id: businessLocationId,
        }),
      });
      const payload = (await response.json()) as {
        data?: { redemption_id?: string; manual_code?: string };
        message?: string;
      };
      if (!response.ok || !payload.data) throw new Error(payload.message);
      setCode(payload.data.manual_code);
      setRedemptionId(payload.data.redemption_id);
      setStatus("code");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível iniciar a utilização.",
      );
      setStatus("error");
    }
  }

  if (!benefitId || !businessLocationId) return null;

  if (status === "idle" || status === "loading" || status === "error") {
    return (
      <div className="mt-5">
        <button
          type="button"
          onClick={redeem}
          disabled={status === "loading"}
          className="bg-gold-500 hover:bg-gold-500/90 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl px-6 text-base font-semibold text-olive-900 transition disabled:opacity-60 sm:w-auto sm:rounded-full"
        >
          {status === "loading" ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              A preparar código…
            </span>
          ) : (
            "Usar benefício"
          )}
        </button>
        {status === "error" && (
          <p role="alert" className="text-wine-700 mt-3 text-sm">
            {errorMessage ?? "Confirme que tem uma adesão ativa."}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      {/* Step 1 — Code */}
      <div className="bg-cream-100 rounded-2xl border border-olive-900/10 p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-olive-900 text-[11px] font-bold text-white">
            1
          </span>
          <p className="text-xs font-semibold text-olive-900">
            Mostre o código ao parceiro
          </p>
        </div>

        {/* Code display */}
        <div className="rounded-xl border border-olive-900/10 bg-white py-5 text-center">
          <p className="font-mono text-4xl font-bold tracking-[0.35em] text-olive-900">
            {code}
          </p>
          <p className="mt-2 text-xs">
            <CountdownTimer seconds={5 * 60} />
          </p>
        </div>

        <p className="mt-3 text-sm leading-5 text-olive-600">
          O parceiro irá introduzir este código no seu dispositivo para
          confirmar a utilização.
        </p>
      </div>

      {/* Step 2 — Savings */}
      <div className="bg-cream-100 rounded-2xl border border-olive-900/10 p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-olive-900/20 text-[11px] font-bold text-olive-900">
            2
          </span>
          <p className="text-xs font-semibold text-olive-900">
            Registe a sua economia
          </p>
        </div>
        <p className="mb-4 text-sm text-olive-600">
          Após o parceiro confirmar, preencha os valores da visita:
        </p>
        {redemptionId ? (
          <RecordSavingsForm
            redemptionId={redemptionId}
            businessName={businessName}
            businessSlug={businessSlug}
            onSaved={(record) => onSaved?.(record)}
          />
        ) : null}
      </div>
    </div>
  );
}
