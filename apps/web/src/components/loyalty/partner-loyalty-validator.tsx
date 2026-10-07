"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

type VisitPreview = {
  member_name: string | null;
  program_name: string;
  business_name: string;
  current_stamps: number;
};

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { data } = await createClient().auth.getSession();
  const token = data.session?.access_token;
  if (!token || !apiUrl) throw new Error("Sessão ou API indisponível");
  const response = await fetch(`${apiUrl}/api/partner/loyalty/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as {
    data?: T;
    message?: string | string[];
  };
  if (!response.ok || !payload.data) {
    const detail = Array.isArray(payload.message)
      ? payload.message.join(" ")
      : payload.message;
    throw new Error(detail || "Não foi possível validar o código");
  }
  return payload.data;
}

// Validação de Selos Daqui pelo parceiro: visita (gera selo) ou recompensa.
export function PartnerLoyaltyValidator() {
  const [mode, setMode] = useState<"visit" | "reward">("visit");
  const [code, setCode] = useState("");
  const [bill, setBill] = useState("");
  const [preview, setPreview] = useState<VisitPreview | null>(null);
  const [status, setStatus] = useState<
    "idle" | "working" | "ready" | "done" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  function reset() {
    setCode("");
    setBill("");
    setPreview(null);
    setMessage("");
    setStatus("idle");
  }

  async function previewVisit() {
    setStatus("working");
    setMessage("");
    try {
      const data = await post<VisitPreview>("visits/preview", {
        manual_code: code,
      });
      setPreview(data);
      setStatus("ready");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro");
      setStatus("error");
    }
  }

  async function validateVisit() {
    setStatus("working");
    setMessage("");
    try {
      const data = await post<{ stamp_issued: boolean; current_stamps: number }>(
        "visits/validate",
        {
          manual_code: code,
          ...(bill ? { bill_amount: bill } : {}),
        },
      );
      setMessage(
        data.stamp_issued
          ? `Selo emitido. Total: ${data.current_stamps} selos.`
          : `Visita validada (sem selo — limite diário ou valor mínimo). Total: ${data.current_stamps}.`,
      );
      setStatus("done");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro");
      setStatus("error");
    }
  }

  async function validateReward() {
    setStatus("working");
    setMessage("");
    try {
      await post<{ reward_status: string }>("rewards/validate", {
        manual_code: code,
      });
      setMessage("Recompensa validada com sucesso.");
      setStatus("done");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro");
      setStatus("error");
    }
  }

  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-olive-900/10 bg-white">
      <div className="border-b border-olive-900/8 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="bg-gold-500 h-2.5 w-2.5 rounded-full" />
          <h2 className="text-base font-semibold text-olive-900">
            Validar Selos Daqui
          </h2>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {/* Toggle visita / recompensa */}
        <div className="bg-cream-100 grid grid-cols-2 gap-1 rounded-xl p-1">
          {(["visit", "reward"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                reset();
              }}
              className={
                "min-h-[40px] rounded-lg text-sm font-semibold transition " +
                (mode === m
                  ? "bg-white text-olive-900 shadow-sm"
                  : "text-olive-600")
              }
            >
              {m === "visit" ? "Visita" : "Recompensa"}
            </button>
          ))}
        </div>

        <label className="mt-5 block text-sm font-semibold text-olive-900">
          Código do membro
        </label>
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
            if (preview || status !== "idle") {
              setPreview(null);
              setStatus("idle");
              setMessage("");
            }
          }}
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          className="bg-cream-50 mt-3 w-full rounded-xl border border-olive-900/12 py-4 text-center font-mono text-4xl tracking-[0.4em] text-olive-900 transition outline-none focus:border-olive-700 focus:bg-white"
        />

        {mode === "visit" && status !== "done" ? (
          <>
            <label className="mt-4 block text-xs font-semibold text-olive-600">
              Valor da conta (opcional)
            </label>
            <input
              value={bill}
              onChange={(e) =>
                setBill(e.target.value.replace(/[^\d.,]/g, "").slice(0, 10))
              }
              inputMode="decimal"
              placeholder="€ 0,00"
              className="bg-cream-50 mt-2 w-full rounded-xl border border-olive-900/12 px-4 py-3 text-olive-900 outline-none focus:border-olive-700 focus:bg-white"
            />
          </>
        ) : null}

        {/* Preview da visita */}
        {preview && status === "ready" ? (
          <div className="mt-4 rounded-xl bg-olive-900/5 px-4 py-3 text-sm">
            <p className="font-semibold text-olive-900">
              {preview.member_name || "Membro do Clube"}
            </p>
            <p className="text-olive-600">
              {preview.program_name} · {preview.current_stamps} selos atuais
            </p>
          </div>
        ) : null}

        {message ? (
          <p
            role="alert"
            className={
              "mt-4 rounded-xl px-4 py-3 text-sm font-semibold " +
              (status === "error"
                ? "bg-wine-700/5 text-wine-700"
                : "bg-olive-700/10 text-olive-900")
            }
          >
            {message}
          </p>
        ) : null}

        {/* Ações */}
        <div className="mt-5">
          {status === "done" ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-olive-900/15 text-sm font-semibold text-olive-900 transition hover:bg-olive-900/5"
            >
              Validar outro
            </button>
          ) : mode === "visit" ? (
            preview && status === "ready" ? (
              <button
                type="button"
                onClick={() => void validateVisit()}
                className="bg-gold-500 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl text-base font-bold text-olive-900 transition hover:opacity-90 disabled:opacity-50"
              >
                Confirmar visita e emitir selo
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void previewVisit()}
                disabled={code.length !== 6 || status === "working"}
                className="bg-olive-900 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl text-base font-bold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {status === "working" ? "A verificar…" : "Verificar visita"}
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => void validateReward()}
              disabled={code.length !== 6 || status === "working"}
              className="bg-gold-500 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl text-base font-bold text-olive-900 transition hover:opacity-90 disabled:opacity-40"
            >
              {status === "working" ? "A validar…" : "Validar recompensa"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}