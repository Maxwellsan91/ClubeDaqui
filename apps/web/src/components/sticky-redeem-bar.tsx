"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CODE_TTL = 5 * 60; // seconds

function CountdownTimer({
  seconds,
  onExpire,
}: {
  seconds: number;
  onExpire?: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const fired = useRef(false);
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1 && !fired.current) {
          fired.current = true;
          setTimeout(() => onExpire?.(), 0);
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [remaining, onExpire]);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const expired = remaining <= 0;
  return (
    <span className={expired ? "text-wine-700/80 text-xs" : "text-olive-400 text-xs"}>
      {expired ? "Código expirado" : `Válido por ${m}:${String(s).padStart(2, "0")} min`}
    </span>
  );
}

type Phase = "idle" | "loading" | "code" | "confirmed" | "saving" | "saved" | "error";

export function StickyRedeemBar({
  benefitId,
  businessLocationId,
  businessName,
  businessSlug,
  isAuthenticated = true,
}: {
  benefitId?: string;
  businessLocationId?: string;
  businessName: string;
  businessSlug: string;
  isAuthenticated?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string>();
  const [redemptionId, setRedemptionId] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  // Savings form
  const [totalBill, setTotalBill] = useState("");
  const [discount, setDiscount] = useState("");
  const [formError, setFormError] = useState<string>();

  const sheetRef = useRef<HTMLDivElement>(null);

  // Client-side fallback for missing SSR data
  const [resolvedBenefitId, setResolvedBenefitId] = useState(benefitId);
  const [resolvedLocationId, setResolvedLocationId] = useState(businessLocationId);

  useEffect(() => {
    if (resolvedBenefitId && resolvedLocationId) return;
    if (!isAuthenticated) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    void (async () => {
      try {
        const bizRes = await fetch(`${apiUrl}/api/businesses/${businessSlug}`);
        if (!bizRes.ok) return;
        const bizPayload = (await bizRes.json()) as { data?: { id?: string; businessLocationId?: string } };
        const locId = bizPayload.data?.businessLocationId;
        const bizId = bizPayload.data?.id;
        if (locId) setResolvedLocationId(locId);
        if (!bizId) return;
        const beneRes = await fetch(`${apiUrl}/api/businesses/${bizId}/benefits`);
        if (!beneRes.ok) return;
        const benePayload = (await beneRes.json()) as { data?: { id?: string }[] };
        const firstId = benePayload.data?.[0]?.id;
        if (firstId) setResolvedBenefitId(firstId);
      } catch { /* silent */ }
    })();
  }, [businessSlug, resolvedBenefitId, resolvedLocationId, isAuthenticated]);

  // Poll for partner confirmation when code is shown
  useEffect(() => {
    if (phase !== "code" || !redemptionId) return;
    const id = setInterval(async () => {
      try {
        const { data } = await createClient()
          .from("redemptions")
          .select("status")
          .eq("id", redemptionId)
          .single();
        const s = (data as { status?: string } | null)?.status;
        if (s === "redeemed") setPhase("confirmed");
        else if (s === "expired") {
          setErrorMessage("O código expirou sem ser confirmado pelo parceiro. Pode gerar um novo.");
          setPhase("error");
        }
      } catch { /* retry next tick */ }
    }, 3000);
    return () => clearInterval(id);
  }, [phase, redemptionId]);

  // Close sheet on backdrop click — only when safe (not while loading or saving)
  useEffect(() => {
    if (!open) return;
    // Delay prevents the same tap that opened the sheet from immediately closing it
    const timer = setTimeout(() => {
      function handleClick(e: MouseEvent) {
        if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
          if (phase === "code" || phase === "error" || phase === "saved") {
            setOpen(false);
            setPhase("idle");
          }
        }
      }
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, 300);
    return () => clearTimeout(timer);
  }, [open, phase]);

  function translateError(raw?: string): string {
    if (!raw) return "Não foi possível iniciar a utilização. Tente novamente.";
    if (/membership/i.test(raw)) return "Precisa de uma adesão ativa para usar este benefício.";
    if (/limit reached/i.test(raw)) return "Já atingiu o limite de utilizações deste benefício neste ciclo.";
    if (/not available today/i.test(raw)) return "Este benefício não está disponível hoje.";
    if (/not available at this time/i.test(raw)) return "Este benefício não está disponível a esta hora.";
    if (/outside its validity/i.test(raw)) return "Este benefício está fora do período de validade.";
    if (/not available/i.test(raw)) return "Benefício não disponível de momento.";
    if (/expired/i.test(raw)) return "O código expirou. Pode gerar um novo.";
    return raw;
  }

  async function redeem() {
    setPhase("loading");
    setOpen(true);
    setCode(undefined);
    setRedemptionId(undefined);
    setTotalBill("");
    setDiscount("");
    setFormError(undefined);
    setErrorMessage(undefined);

    if (!resolvedBenefitId || !resolvedLocationId) {
      // Give the resolution useEffect a chance to finish before failing
      await new Promise((r) => setTimeout(r, 800));
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!token || !apiUrl) throw new Error("Sessão expirada. Recarregue a página.");

      const bId = resolvedBenefitId;
      const lId = resolvedLocationId;
      if (!bId || !lId) throw new Error("Benefício temporariamente indisponível. Recarregue a página.");

      const response = await fetch(`${apiUrl}/api/me/redemptions/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ benefit_id: bId, business_location_id: lId }),
      });
      const payload = (await response.json()) as { data?: { redemption_id?: string; manual_code?: string }; message?: string };
      if (!response.ok || !payload.data) throw new Error(payload.message);
      setCode(payload.data.manual_code);
      setRedemptionId(payload.data.redemption_id);
      setPhase("code");
    } catch (err) {
      setErrorMessage(translateError(err instanceof Error ? err.message : undefined));
      setPhase("error");
    }
  }

  async function saveFinancials() {
    const total = parseFloat(totalBill.replace(",", "."));
    const disc = parseFloat(discount.replace(",", "."));
    if (!totalBill || isNaN(total) || total <= 0) {
      setFormError("Introduza o valor total da fatura.");
      return;
    }
    if (discount === "" || isNaN(disc) || disc < 0 || disc > total) {
      setFormError("Introduza o valor do desconto (entre 0 € e o total da fatura).");
      return;
    }
    setFormError(undefined);
    setPhase("saving");
    try {
      const { data: session } = await createClient().auth.getSession();
      const token = session.session?.access_token;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!token || !apiUrl) throw new Error();
      const res = await fetch(`${apiUrl}/api/me/redemptions/${redemptionId}/financials`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ total_bill_amount: total, discount_amount: disc }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { message?: string };
        throw new Error(json.message);
      }
      setPhase("saved");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Não foi possível guardar. Tente novamente.");
      setPhase("confirmed");
    }
  }

  // ── Non-authenticated ──────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div
        className="fixed inset-x-0 bottom-16 z-[60] border-t border-olive-900/10 bg-white/95 px-5 py-3 backdrop-blur-sm sm:bottom-0 lg:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-xs text-olive-600">Benefício Clube</p>
            <p className="truncate text-sm font-semibold text-olive-900">{businessName}</p>
          </div>
          <a
            href="/registar"
            className="bg-gold-500 hover:bg-gold-500/90 flex-none rounded-full px-6 py-3 text-sm font-semibold text-olive-900 transition"
          >
            Aderir ao Clube
          </a>
        </div>
      </div>
    );
  }

  // ── Authenticated ──────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-[65] bg-olive-900/30 backdrop-blur-sm" aria-hidden="true" />
      )}

      {/* Bottom sheet */}
      {open && (
        <div
          ref={sheetRef}
          className="fixed inset-x-0 bottom-0 z-[70] rounded-t-3xl bg-white shadow-2xl relative"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-olive-900/15 mx-auto" />
            {phase !== "confirmed" && phase !== "saving" && (
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => { setOpen(false); setPhase("idle"); }}
                className="absolute right-4 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-olive-900/8 text-olive-700 hover:bg-olive-900/15 transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <div className="px-5 pb-6 pt-2">

            {/* Loading */}
            {phase === "loading" && (
              <div className="flex flex-col items-center gap-3 py-8">
                <svg className="h-6 w-6 animate-spin text-olive-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <p className="text-sm text-olive-600">A preparar código…</p>
              </div>
            )}

            {/* Error */}
            {phase === "error" && (
              <div className="py-4">
                <p className="font-semibold text-wine-700">Não foi possível iniciar</p>
                <p className="mt-2 text-sm text-olive-600">{errorMessage}</p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => void redeem()}
                    className="flex-1 rounded-full bg-olive-900 py-2.5 text-sm font-semibold text-white"
                  >
                    Tentar novamente
                  </button>
                  <button
                    onClick={() => { setOpen(false); setPhase("idle"); }}
                    className="rounded-full border border-olive-900/20 px-4 py-2.5 text-sm font-semibold text-olive-700"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}

            {/* Code — waiting for partner */}
            {phase === "code" && (
              <div className="space-y-4">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-olive-900 text-[11px] font-bold text-white">1</span>
                    <p className="text-sm font-semibold text-olive-900">Mostre o código ao parceiro</p>
                  </div>
                  <div className="rounded-2xl border border-olive-900/10 bg-olive-900 py-6 text-center">
                    <p className="font-mono text-5xl font-bold tracking-[0.35em] text-white">{code}</p>
                    <p className="mt-2">
                      <CountdownTimer
                        seconds={CODE_TTL}
                        onExpire={() => {
                          if (phase === "code") {
                            setErrorMessage("O código expirou. O parceiro não confirmou a tempo. Pode gerar um novo.");
                            setPhase("error");
                          }
                        }}
                      />
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-cream-50 border border-olive-900/8 px-4 py-3">
                  <svg className="h-4 w-4 shrink-0 animate-spin text-olive-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <p className="text-xs text-olive-600">A aguardar confirmação do parceiro…</p>
                </div>
              </div>
            )}

            {/* Confirmed — mandatory savings form */}
            {(phase === "confirmed" || phase === "saving") && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-olive-700 text-sm text-white">✓</span>
                  <div>
                    <p className="text-sm font-bold text-olive-900">Código confirmado pelo parceiro!</p>
                    <p className="text-xs text-olive-500">Registe agora os valores da sua visita.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-olive-900">
                      Valor total da fatura (€) <span className="text-wine-700">*</span>
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={totalBill}
                      onChange={(e) => { setTotalBill(e.target.value); setFormError(undefined); }}
                      placeholder="0,00"
                      className="w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-olive-900">
                      Valor do desconto obtido (€) <span className="text-wine-700">*</span>
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => { setDiscount(e.target.value); setFormError(undefined); }}
                      placeholder="0,00"
                      className="w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10"
                    />
                  </div>
                </div>

                {formError && <p className="text-xs text-wine-700">{formError}</p>}

                <button
                  onClick={() => void saveFinancials()}
                  disabled={phase === "saving"}
                  className="w-full rounded-xl bg-olive-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {phase === "saving" ? "A guardar…" : "Guardar poupança"}
                </button>

                <p className="text-center text-[11px] text-olive-400">
                  Esta informação é necessária para acompanhar as suas economias.
                </p>
              </div>
            )}

            {/* Saved */}
            {phase === "saved" && (
              <div className="py-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-olive-700/10 text-2xl">✓</div>
                <p className="font-display text-xl text-olive-900">Poupança registada!</p>
                <p className="mt-1 text-sm text-olive-600">
                  Poupou <span className="font-semibold text-olive-900">{parseFloat(discount.replace(",", ".")).toFixed(2)} €</span> nesta visita.
                </p>
                <button
                  onClick={() => { setOpen(false); setPhase("idle"); }}
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
        className="fixed inset-x-0 bottom-16 z-[60] border-t border-olive-900/10 bg-white/95 px-5 py-3 backdrop-blur-sm sm:bottom-0 lg:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-xs text-olive-600">Benefício Clube</p>
            <p className="truncate text-sm font-semibold text-olive-900">{businessName}</p>
          </div>
          <button
            type="button"
            onClick={() => void redeem()}
            disabled={phase === "loading" || phase === "code" || phase === "confirmed" || phase === "saving"}
            className="bg-gold-500 hover:bg-gold-500/90 flex-none rounded-full px-6 py-3 text-sm font-semibold text-olive-900 transition disabled:opacity-60"
          >
            {phase === "code" || phase === "confirmed" || phase === "saving" ? "Em curso…" : "Usar benefício"}
          </button>
        </div>
      </div>
    </>
  );
}