"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/app-header";

type RedemptionPreview = {
  redemption_id: string;
  member_name: string | null;
  benefit_title: string;
  benefit_terms: string;
  business_location_name: string;
  reservation_required: boolean;
  expires_at: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ValidateRedemptionPage() {
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<RedemptionPreview>();
  const [status, setStatus] = useState<
    "idle" | "previewing" | "ready" | "confirming" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function callApi(path: "preview" | "confirm") {
    const { data } = await createClient().auth.getSession();
    const token = data.session?.access_token;
    if (!token || !apiUrl) throw new Error("Sessão ou API indisponível");

    const response = await fetch(`${apiUrl}/api/partner/redemptions/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ manual_code: code }),
    });
    const payload = (await response.json()) as {
      data?: RedemptionPreview;
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

  async function previewCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("previewing");
    setMessage("");
    setPreview(undefined);
    try {
      const data = await callApi("preview");
      setPreview(data);
      setStatus("ready");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível validar",
      );
      setStatus("error");
    }
  }

  async function confirm() {
    setStatus("confirming");
    setMessage("");
    try {
      await callApi("confirm");
      setStatus("success");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível confirmar",
      );
      setStatus("error");
    }
  }

  function reset() {
    setCode("");
    setPreview(undefined);
    setMessage("");
    setStatus("idle");
  }

  const partnerNav = (
    <Link
      href="/parceiros"
      className="flex items-center gap-1.5 text-sm font-semibold text-olive-700"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Área de parceiros
    </Link>
  );

  return (
    <main className="min-h-screen">
      <AppHeader rightSlot={partnerNav} mobileRight={partnerNav} />

      <section className="mx-auto max-w-lg px-5 py-10 sm:px-8 sm:py-14">
        {/* Heading */}
        <p className="text-wine-700 text-[11px] font-bold tracking-[0.28em] uppercase">
          Área de parceiros
        </p>
        <h1 className="font-display mt-3 text-3xl tracking-tight text-olive-900 sm:text-4xl">
          Validar benefício
        </h1>
        <p className="mt-3 text-sm leading-6 text-olive-700">
          Introduza o código de 6 dígitos apresentado pelo membro para confirmar
          a utilização do benefício.
        </p>

        {/* Code input */}
        <form
          onSubmit={previewCode}
          className="bg-cream-100 mt-8 rounded-2xl border border-olive-900/10 p-5 sm:p-6"
        >
          <label
            htmlFor="code-input"
            className="block text-sm font-semibold text-olive-900"
          >
            Código do membro
          </label>
          <input
            id="code-input"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              if (preview) {
                setPreview(undefined);
                setStatus("idle");
                setMessage("");
              }
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            className="focus:border-wine-700 mt-3 w-full rounded-xl border border-olive-900/12 bg-white py-4 text-center font-mono text-3xl tracking-[0.35em] text-olive-900 outline-none"
            placeholder="000000"
            required
          />
          <button
            type="submit"
            disabled={status === "previewing" || code.length !== 6}
            className="bg-wine-700 hover:bg-wine-800 mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition disabled:opacity-50"
          >
            {status === "previewing" ? "A verificar…" : "Verificar código"}
          </button>
        </form>

        {/* Error message */}
        {status === "error" || message ? (
          <div className="border-wine-700/20 bg-wine-700/5 mt-4 rounded-xl border px-4 py-3">
            <p role="alert" className="text-wine-700 text-sm font-semibold">
              {message ||
                "Código inválido ou expirado. Verifique e tente novamente."}
            </p>
          </div>
        ) : null}

        {/* Preview */}
        {preview ? (
          <section className="mt-6 overflow-hidden rounded-2xl border border-olive-900/10">
            {/* Header */}
            <div className="bg-olive-900 px-5 py-5 sm:px-6">
              <p className="text-gold-500 text-[11px] font-bold tracking-[0.22em] uppercase">
                Utilização encontrada
              </p>
              <h2 className="font-display mt-1.5 text-2xl text-white">
                {preview.benefit_title}
              </h2>
            </div>

            {/* Details */}
            <div className="bg-cream-100 px-5 py-5 sm:px-6">
              <dl className="space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-olive-600">Membro</dt>
                  <dd className="text-right font-semibold text-olive-900">
                    {preview.member_name || "Membro do Clube"}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-olive-600">Local</dt>
                  <dd className="text-right font-semibold text-olive-900">
                    {preview.business_location_name}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-olive-600">Código válido até</dt>
                  <dd className="text-right font-semibold text-olive-900">
                    {new Intl.DateTimeFormat("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(preview.expires_at))}
                  </dd>
                </div>
              </dl>

              {preview.benefit_terms && (
                <p className="mt-4 rounded-xl bg-olive-900/5 px-3 py-2.5 text-xs leading-5 text-olive-600">
                  {preview.benefit_terms}
                </p>
              )}

              {/* Actions */}
              {status === "success" ? (
                <div className="mt-6">
                  <div className="flex items-center gap-3 rounded-xl bg-olive-700/10 px-4 py-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-olive-700 text-sm text-white">
                      ✓
                    </span>
                    <p className="text-sm font-semibold text-olive-900">
                      Benefício confirmado com sucesso.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-olive-900/20 px-5 text-sm font-semibold text-olive-900 transition hover:bg-olive-900/5"
                  >
                    Validar outro código
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={confirm}
                  disabled={status === "confirming"}
                  className="bg-gold-500 hover:bg-gold-500/90 mt-5 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl text-base font-semibold text-olive-900 transition disabled:opacity-50"
                >
                  {status === "confirming"
                    ? "A confirmar…"
                    : "Confirmar utilização"}
                </button>
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
