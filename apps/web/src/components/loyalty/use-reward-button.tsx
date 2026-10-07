"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CodeTicket } from "./code-ticket";

// Membro utiliza uma recompensa desbloqueada: gera código para o parceiro validar.
export function UseRewardButton({
  rewardRedemptionId,
  title,
}: {
  rewardRedemptionId: string;
  title: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "code" | "error">(
    "idle",
  );
  const [code, setCode] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  async function start() {
    setStatus("loading");
    try {
      const { data } = await createClient().auth.getSession();
      const token = data.session?.access_token;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!token || !apiUrl) throw new Error();
      const response = await fetch(
        `${apiUrl}/api/me/loyalty/rewards/${rewardRedemptionId}/use`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const payload = (await response.json()) as {
        data?: { manual_code?: string };
        message?: string;
      };
      if (!response.ok || !payload.data?.manual_code)
        throw new Error(payload.message);
      setCode(payload.data.manual_code);
      setStatus("code");
    } catch (err) {
      setErrorMessage(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível preparar a recompensa.",
      );
      setStatus("error");
    }
  }

  if (status === "code" && code) {
    return (
      <CodeTicket
        code={code}
        hint={`Mostre este código ao parceiro para utilizar "${title}".`}
      />
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={status === "loading"}
        className="bg-gold-500 hover:bg-gold-500/90 inline-flex min-h-[44px] items-center justify-center rounded-full px-5 text-sm font-semibold text-olive-900 transition disabled:opacity-60"
      >
        {status === "loading" ? "A preparar…" : "Usar recompensa"}
      </button>
      {status === "error" ? (
        <p role="alert" className="text-wine-700 mt-2 text-sm">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}