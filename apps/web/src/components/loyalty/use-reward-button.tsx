"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CodeTicket } from "./code-ticket";

// Membro utiliza uma recompensa desbloqueada: gera código para o parceiro
// validar e faz polling até a recompensa ficar redimida (ou o código expirar).
export function UseRewardButton({
  rewardRedemptionId,
  title,
  onRedeemed,
}: {
  rewardRedemptionId: string;
  title: string;
  onRedeemed?: () => void;
}) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "code" | "redeemed" | "error"
  >("idle");
  const [code, setCode] = useState<string>();
  const [expiresAt, setExpiresAt] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const onRedeemedRef = useRef(onRedeemed);
  useEffect(() => {
    onRedeemedRef.current = onRedeemed;
  }, [onRedeemed]);

  async function start() {
    setStatus("loading");
    setErrorMessage(undefined);
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
        data?: { manual_code?: string; token_expires_at?: string };
        message?: string;
      };
      if (!response.ok || !payload.data?.manual_code)
        throw new Error(payload.message);
      setCode(payload.data.manual_code);
      setExpiresAt(payload.data.token_expires_at);
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

  // Polling: espera o parceiro validar a recompensa (redeemed) ou expirar.
  useEffect(() => {
    if (status !== "code") return;
    let active = true;
    const supabase = createClient();

    const id = setInterval(async () => {
      try {
        const { data } = await supabase
          .from("loyalty_reward_redemptions")
          .select("status")
          .eq("id", rewardRedemptionId)
          .single();
        const s = (data as { status?: string } | null)?.status;
        if (!active) return;
        if (s === "redeemed") {
          setStatus("redeemed");
          onRedeemedRef.current?.();
        } else if (s === "expired" || s === "cancelled") {
          setErrorMessage(
            "O código expirou sem ser validado. Pode gerar um novo.",
          );
          setStatus("error");
        }
      } catch {
        /* mantém o polling */
      }
    }, 3000);

    const expiryMs = expiresAt
      ? new Date(expiresAt).getTime() - Date.now()
      : 5 * 60 * 1000;
    const expiryTimer = setTimeout(
      () => {
        if (!active) return;
        setErrorMessage(
          "O código expirou sem ser validado. Pode gerar um novo.",
        );
        setStatus("error");
      },
      Math.max(expiryMs, 0),
    );

    return () => {
      active = false;
      clearInterval(id);
      clearTimeout(expiryTimer);
    };
  }, [status, rewardRedemptionId, expiresAt]);

  if (status === "redeemed") {
    return (
      <div className="bg-olive-700/10 flex items-center gap-3 rounded-xl p-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-olive-700 text-white">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <p className="text-sm font-bold text-olive-900">Recompensa utilizada!</p>
      </div>
    );
  }

  if (status === "code" && code) {
    return (
      <div>
        <CodeTicket
          code={code}
          hint={`Mostre este código ao parceiro para utilizar "${title}".`}
        />
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-olive-600">
          <svg
            className="h-3.5 w-3.5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          À espera da validação do parceiro…
        </p>
      </div>
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