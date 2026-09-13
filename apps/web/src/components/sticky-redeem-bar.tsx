"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

export function StickyRedeemBar({
  benefitId,
  businessLocationId,
  businessName,
  businessSlug,
}: {
  benefitId?: string;
  businessLocationId?: string;
  businessName: string;
  businessSlug: string;
}) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "code" | "saved" | "error"
  >("idle");
  const [code, setCode] = useState<string>();
  const [redemptionId, setRedemptionId] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close sheet on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        if (status === "idle" || status === "error") setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, status]);

  async function redeem() {
    if (!benefitId || !businessLocationId) return;
    setStatus("loading");
    setOpen(true);
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

  function handleSaved(record: SavingsRecord) {
    void record;
    setStatus("saved");
  }

  if (!benefitId || !businessLocationId) return null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-olive-900/30 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Bottom sheet when open */}
      {open && (
        <div
          ref={sheetRef}
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white shadow-2xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-olive-900/15" />
          </div>

          <div className="px-5 pb-6 pt-2">
            {status === "loading" && (
              <div className="flex flex-col items-center gap-3 py-8">
                <svg
                  className="h-6 w-6 animate-spin text-olive-700"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <p className="text-sm text-olive-600">A preparar código…</p>
              </div>
            )}

            {status === "error" && (
              <div className="py-4">
                <p className="text-wine-700 font-semibold">
                  Não foi possível iniciar
                </p>
                <p className="mt-1 text-sm text-olive-600">
                  {errorMessage ?? "Confirme que tem uma adesão ativa."}
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-4 text-sm font-semibold text-olive-700 underline"
                >
                  Fechar
                </button>
              </div>
            )}

            {status === "code" && (
              <div className="space-y-5">
                {/* Step 1 */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-olive-900 text-[11px] font-bold text-white">
                      1
                    </span>
                    <p className="text-sm font-semibold text-olive-900">
                      Mostre o código ao parceiro
                    </p>
                  </div>
                  <div className="rounded-2xl border border-olive-900/10 bg-olive-900 py-6 text-center">
                    <p className="font-mono text-5xl font-bold tracking-[0.35em] text-white">
                      {code}
                    </p>
                    <p className="mt-2 text-xs">
                      <CountdownTimer seconds={5 * 60} />
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-olive-900/15 text-[11px] font-bold text-olive-900">
                      2
                    </span>
                    <p className="text-sm font-semibold text-olive-900">
                      Registe a economia após a visita
                    </p>
                  </div>
                  {redemptionId && (
                    <RecordSavingsForm
                      redemptionId={redemptionId}
                      businessName={businessName}
                      businessSlug={businessSlug}
                      onSaved={handleSaved}
                    />
                  )}
                </div>
              </div>
            )}

            {status === "saved" && (
              <div className="py-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-olive-700/10 text-xl text-olive-700">
                  ✓
                </div>
                <p className="font-display text-xl text-olive-900">
                  Visita registada!
                </p>
                <p className="mt-1 text-sm text-olive-600">
                  A sua economia foi guardada.
                </p>
                <button
                  onClick={() => {
                    setOpen(false);
                    setStatus("idle");
                  }}
                  className="mt-5 text-sm font-semibold text-olive-700 underline"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-olive-900/10 bg-white/95 px-5 py-3 backdrop-blur-sm lg:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-xs text-olive-600">Benefício Clube</p>
            <p className="truncate text-sm font-semibold text-olive-900">
              {businessName}
            </p>
          </div>
          <button
            type="button"
            onClick={redeem}
            disabled={status === "loading"}
            className="bg-gold-500 hover:bg-gold-500/90 flex-none rounded-full px-6 py-3 text-sm font-semibold text-olive-900 transition disabled:opacity-60"
          >
            Usar benefício
          </button>
        </div>
      </div>
    </>
  );
}