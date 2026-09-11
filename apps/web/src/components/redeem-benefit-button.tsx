"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function RedeemBenefitButton({
  benefitId,
  businessLocationId,
}: {
  benefitId?: string;
  businessLocationId?: string;
}) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [code, setCode] = useState<string>();
  async function redeem() {
    if (!benefitId || !businessLocationId) return;
    setStatus("loading");
    try {
      const { data } = await createClient().auth.getSession();
      const token = data.session?.access_token;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!token || !apiUrl) throw new Error();
      const response = await fetch(`${apiUrl}/api/me/redemptions/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          benefit_id: benefitId,
          business_location_id: businessLocationId,
        }),
      });
      const payload = (await response.json()) as {
        data?: { manual_code?: string };
        message?: string;
      };
      if (!response.ok || !payload.data) throw new Error(payload.message);
      setCode(payload.data.manual_code);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }
  if (!benefitId || !businessLocationId) return null;
  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={redeem}
        disabled={status === "loading"}
        className="bg-gold-500 min-h-11 rounded-full px-5 py-3 text-sm font-semibold text-olive-900"
      >
        {status === "loading" ? "A preparar…" : "Usar benefício"}
      </button>
      {status === "success" ? (
        <p className="mt-3 text-sm text-olive-700">
          Apresente o código <strong className="text-olive-900">{code}</strong>{" "}
          no estabelecimento. Válido durante 5 minutos.
        </p>
      ) : null}
      {status === "error" ? (
        <p role="alert" className="text-wine-700 mt-3 text-sm">
          Não foi possível iniciar a utilização. Confirme que tem uma adesão
          ativa.
        </p>
      ) : null}
    </div>
  );
}
