"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CODE_TTL = 5 * 60;

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
  return (
    <span
      className={
        remaining <= 0 ? "text-wine-700/80 text-xs" : "text-xs text-olive-400"
      }
    >
      {remaining <= 0
        ? "Código expirado"
        : `Válido por ${m}:${String(s).padStart(2, "0")} min`}
    </span>
  );
}

type Phase =
  "idle" | "loading" | "code" | "confirmed" | "saving" | "saved" | "error";

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
  const [totalBill, setTotalBill] = useState("");
  const [discount, setDiscount] = useState("");
  const [formError, setFormError] = useState<string>();
  const [benefitUsed, setBenefitUsed] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHovered, setReviewHovered] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);

  const [resolvedBenefitId, setResolvedBenefitId] = useState(benefitId);
  const [resolvedLocationId, setResolvedLocationId] =
    useState(businessLocationId);

  // Client-side fallback for SSR-missing IDs
  useEffect(() => {
    if (resolvedBenefitId && resolvedLocationId) return;
    if (!isAuthenticated) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    void (async () => {
      try {
        const bizRes = await fetch(`${apiUrl}/api/businesses/${businessSlug}`);
        if (!bizRes.ok) return;
        const bizPayload = (await bizRes.json()) as {
          data?: { id?: string; businessLocationId?: string };
        };
        const locId = bizPayload.data?.businessLocationId;
        const bizId = bizPayload.data?.id;
        if (locId) setResolvedLocationId(locId);
        if (!bizId) return;
        const beneRes = await fetch(
          `${apiUrl}/api/businesses/${bizId}/benefits`,
        );
        if (!beneRes.ok) return;
        const benePayload = (await beneRes.json()) as {
          data?: { id?: string }[];
        };
        const firstId = benePayload.data?.[0]?.id;
        if (firstId) setResolvedBenefitId(firstId);
      } catch {
        /* silent */
      }
    })();
  }, [businessSlug, resolvedBenefitId, resolvedLocationId, isAuthenticated]);

  // Check if this benefit was already used in the current membership cycle
  useEffect(() => {
    if (!isAuthenticated || !resolvedBenefitId) return;
    void (async () => {
      try {
        const { data } = await createClient().rpc("get_member_benefit_used", {
          p_benefit_id: resolvedBenefitId,
        });
        if (data === true) setBenefitUsed(true);
      } catch {
        /* silent */
      }
    })();
  }, [isAuthenticated, resolvedBenefitId]);

  // Poll for partner confirmation
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
          setErrorMessage(
            "O código expirou sem ser confirmado pelo parceiro. Pode gerar um novo.",
          );
          setPhase("error");
        }
      } catch {
        /* retry */
      }
    }, 3000);
    return () => clearInterval(id);
  }, [phase, redemptionId]);

  // Backdrop click — closes only in safe phases, with delay to avoid accidental close on open
  useEffect(() => {
    if (!open) return;
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

  // Lock body scroll while sheet is open to prevent page scroll on mobile
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    const prevRoot = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = prevRoot;
    };
  }, [open]);

  function translateError(raw?: string): string {
    if (!raw) return "Não foi possível iniciar a utilização. Tente novamente.";
    if (/membership/i.test(raw))
      return "Precisa de uma adesão ativa para usar este benefício.";
    if (/limit reached/i.test(raw))
      return "Já atingiu o limite de utilizações deste benefício neste ciclo.";
    if (/not available today/i.test(raw))
      return "Este benefício não está disponível hoje.";
    if (/not available at this time/i.test(raw))
      return "Este benefício não está disponível a esta hora.";
    if (/outside its validity/i.test(raw))
      return "Este benefício está fora do período de validade.";
    if (/not available/i.test(raw))
      return "Benefício não disponível de momento.";
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
    setReviewRating(0);
    setReviewHovered(0);
    setReviewComment("");
    setReviewDone(false);

    if (!resolvedBenefitId || !resolvedLocationId) {
      await new Promise((r) => setTimeout(r, 800));
    }

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!token || !apiUrl)
        throw new Error("Sessão expirada. Recarregue a página.");
      const bId = resolvedBenefitId;
      const lId = resolvedLocationId;
      if (!bId || !lId)
        throw new Error(
          "Benefício temporariamente indisponível. Recarregue a página.",
        );
      const response = await fetch(`${apiUrl}/api/me/redemptions/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ benefit_id: bId, business_location_id: lId }),
      });
      const payload = (await response.json()) as {
        data?: { redemption_id?: string; manual_code?: string };
        message?: string;
      };
      if (!response.ok || !payload.data) throw new Error(payload.message);
      setCode(payload.data.manual_code);
      setRedemptionId(payload.data.redemption_id);
      setPhase("code");
    } catch (err) {
      setErrorMessage(
        translateError(err instanceof Error ? err.message : undefined),
      );
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
      setFormError(
        "Introduza o valor do desconto (entre 0 € e o total da fatura).",
      );
      return;
    }
    setFormError(undefined);
    setPhase("saving");
    try {
      const { data: session } = await createClient().auth.getSession();
      const token = session.session?.access_token;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!token || !apiUrl) throw new Error();
      const res = await fetch(
        `${apiUrl}/api/me/redemptions/${redemptionId}/financials`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            total_bill_amount: total,
            discount_amount: disc,
          }),
        },
      );
      if (!res.ok) {
        const json = (await res.json()) as { message?: string };
        throw new Error(json.message);
      }
      setBenefitUsed(true);
      setPhase("saved");
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar. Tente novamente.",
      );
      setPhase("confirmed");
    }
  }

  async function submitReview() {
    if (!redemptionId || reviewRating === 0) return;
    setReviewSubmitting(true);
    try {
      const { data: session } = await createClient().auth.getSession();
      const token = session.session?.access_token;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!token || !apiUrl) throw new Error();
      await fetch(`${apiUrl}/api/me/redemptions/${redemptionId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        }),
      });
      setReviewDone(true);
    } catch {
      /* silent — review is optional */
    } finally {
      setReviewSubmitting(false);
    }
  }

  // ── Non-authenticated ─────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div
        className="fixed inset-x-0 bottom-16 z-[60] border-t border-olive-900/10 bg-white/95 px-5 py-3 backdrop-blur-sm sm:bottom-0 lg:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-xs text-olive-600">Benefício Clube</p>
            <p className="truncate text-sm font-semibold text-olive-900">
              {businessName}
            </p>
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

  // ── Authenticated ─────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop — separate from sheet so it doesn't conflict with fixed positioning */}
      {open && (
        <div
          className="fixed inset-0 z-[65] bg-olive-900/30 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Bottom sheet — must NOT have `relative` class (would override `fixed` in some CSS engines) */}
      {open && (
        <div
          ref={sheetRef}
          className="fixed inset-0 z-[70] h-[100dvh] max-h-[100dvh] w-full max-w-full touch-pan-y overflow-y-auto overscroll-contain rounded-none bg-white shadow-2xl sm:inset-x-0 sm:inset-y-auto sm:bottom-0 sm:h-auto sm:max-h-[calc(100dvh-0.5rem)] sm:rounded-t-3xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Handle + close button — inner wrapper is relative */}
          <div className="relative flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-olive-900/15" />
            {phase !== "confirmed" && phase !== "saving" && (
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => {
                  setOpen(false);
                  setPhase("idle");
                }}
                className="absolute top-0 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-olive-900/8 text-olive-700 transition hover:bg-olive-900/15"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <div className="min-w-0 px-5 pt-2 pb-6">
            {phase === "loading" && (
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

            {phase === "error" && (
              <div className="py-4">
                <p className="text-wine-700 font-semibold">
                  Não foi possível iniciar
                </p>
                <p className="mt-2 text-sm text-olive-600">{errorMessage}</p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => void redeem()}
                    className="flex-1 rounded-full bg-olive-900 py-2.5 text-sm font-semibold text-white"
                  >
                    Tentar novamente
                  </button>
                  <button
                    onClick={() => {
                      setOpen(false);
                      setPhase("idle");
                    }}
                    className="rounded-full border border-olive-900/20 px-4 py-2.5 text-sm font-semibold text-olive-700"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}

            {phase === "code" && (
              <div className="space-y-4">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-olive-900 text-[11px] font-bold text-white">
                      1
                    </span>
                    <p className="text-sm font-semibold text-olive-900">
                      Mostre o código ao parceiro
                    </p>
                  </div>
                  <div className="rounded-2xl bg-olive-900 py-7 text-center">
                    <p className="font-mono text-5xl font-bold tracking-[0.35em] text-white">
                      {code}
                    </p>
                    <p className="mt-2">
                      <CountdownTimer
                        seconds={CODE_TTL}
                        onExpire={() => {
                          if (phase === "code") {
                            setErrorMessage(
                              "O código expirou. O parceiro não confirmou a tempo. Pode gerar um novo.",
                            );
                            setPhase("error");
                          }
                        }}
                      />
                    </p>
                  </div>
                </div>
                <div className="bg-cream-50 flex items-center gap-3 rounded-xl border border-olive-900/8 px-4 py-3">
                  <svg
                    className="h-4 w-4 shrink-0 animate-spin text-olive-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <p className="text-xs text-olive-600">
                    A aguardar confirmação do parceiro…
                  </p>
                </div>
              </div>
            )}

            {(phase === "confirmed" || phase === "saving") && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-xl bg-olive-700/10 px-3 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-olive-700 text-xs text-white">
                    ✓
                  </span>
                  <div>
                    <p className="text-sm font-bold text-olive-900">
                      Código confirmado pelo parceiro!
                    </p>
                    <p className="text-xs text-olive-500">
                      Registe agora os valores da sua visita.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-olive-900">
                      Valor total da fatura (€){" "}
                      <span className="text-wine-700">*</span>
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={totalBill}
                      onChange={(e) => {
                        setTotalBill(e.target.value);
                        setFormError(undefined);
                      }}
                      placeholder="0,00"
                      className="w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-olive-900">
                      Valor do desconto obtido (€){" "}
                      <span className="text-wine-700">*</span>
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => {
                        setDiscount(e.target.value);
                        setFormError(undefined);
                      }}
                      placeholder="0,00"
                      className="w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700"
                    />
                  </div>
                </div>
                {formError && (
                  <p className="text-wine-700 text-xs">{formError}</p>
                )}
                <button
                  onClick={() => void saveFinancials()}
                  disabled={phase === "saving"}
                  className="w-full rounded-xl bg-olive-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {phase === "saving" ? "A guardar…" : "Guardar poupança"}
                </button>
                <p className="text-center text-[11px] text-olive-400">
                  Esta informação é necessária para acompanhar as suas
                  economias.
                </p>
              </div>
            )}

            {phase === "saved" && (
              <div className="py-4">
                <div className="flex items-center gap-3 rounded-xl bg-olive-700/10 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-olive-700 text-white">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-olive-900">
                      Poupança registada!
                    </p>
                    <p className="text-xs text-olive-600">
                      Poupou{" "}
                      <span className="font-semibold">
                        {parseFloat(discount.replace(",", ".")).toFixed(2)} €
                      </span>{" "}
                      nesta visita.
                    </p>
                  </div>
                </div>

                {!reviewDone && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-olive-900">
                      Como foi a visita?
                    </p>
                    <p className="text-xs text-olive-500">
                      A sua opinião ajuda outros membros. Opcional.
                    </p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const filled = (reviewHovered || reviewRating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            aria-label={`${star} estrela${star !== 1 ? "s" : ""}`}
                            onMouseEnter={() => setReviewHovered(star)}
                            onMouseLeave={() => setReviewHovered(0)}
                            onClick={() => setReviewRating(star)}
                            className={`min-h-[44px] min-w-[44px] text-3xl leading-none transition-colors ${filled ? "text-gold-500" : "text-olive-900/15"}`}
                          >
                            ★
                          </button>
                        );
                      })}
                    </div>
                    {reviewRating > 0 && (
                      <div className="space-y-2">
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Partilhe a sua experiência (opcional)"
                          rows={2}
                          className="bg-cream-50 w-full resize-none rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none placeholder:text-olive-400 focus:border-olive-700"
                        />
                        <button
                          onClick={() => void submitReview()}
                          disabled={reviewSubmitting}
                          className="w-full rounded-xl border border-olive-900/15 py-2.5 text-sm font-semibold text-olive-700 transition hover:bg-olive-900/5 disabled:opacity-50"
                        >
                          {reviewSubmitting ? "A guardar…" : "Enviar avaliação"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {reviewDone && (
                  <p className="mt-3 text-center text-xs text-olive-500">
                    Obrigado pela avaliação!
                  </p>
                )}

                <button
                  onClick={() => {
                    setOpen(false);
                    setPhase("idle");
                  }}
                  className="mt-4 w-full text-center text-sm font-semibold text-olive-700 underline"
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
            <p className="truncate text-sm font-semibold text-olive-900">
              {businessName}
            </p>
          </div>

          {benefitUsed ? (
            <div className="flex-none rounded-full bg-olive-900/8 px-5 py-3 text-center">
              <p className="text-xs font-semibold text-olive-500">
                Benefício utilizado
              </p>
              <p className="text-[10px] text-olive-400">Até ao próximo ciclo</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void redeem()}
              disabled={
                phase === "loading" ||
                phase === "code" ||
                phase === "confirmed" ||
                phase === "saving"
              }
              className="bg-gold-500 hover:bg-gold-500/90 flex-none rounded-full px-6 py-3 text-sm font-semibold text-olive-900 transition disabled:opacity-60"
            >
              {phase === "code" || phase === "confirmed" || phase === "saving"
                ? "Em curso…"
                : "Usar benefício"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
