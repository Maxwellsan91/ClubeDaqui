"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const router = useRouter();
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<RedemptionPreview>();
  const [status, setStatus] = useState<
    "idle" | "previewing" | "ready" | "confirming" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [signingOut, setSigningOut] = useState(false);

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

  async function signOut() {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.replace("/entrar");
  }

  return (
    <div className="bg-cream-50 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-olive-900/8 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3 sm:px-8">
          <Link
            href="/parceiros/dashboard"
            className="flex items-center gap-2 text-sm font-semibold text-olive-700 transition hover:text-olive-900"
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
            Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-olive-900 text-[10px] font-bold text-white">
              CR
            </div>
            <button
              onClick={() => void signOut()}
              disabled={signingOut}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-olive-900/15 px-3 text-xs font-semibold text-olive-600 transition hover:bg-olive-900/5 disabled:opacity-50"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Sair
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-lg px-5 py-10 sm:px-8 sm:py-14">
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
          onSubmit={(e) => void previewCode(e)}
          className="mt-8 overflow-hidden rounded-2xl border border-olive-900/10 bg-white"
        >
          <div className="p-5 sm:p-6">
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
              className="bg-cream-50 mt-3 w-full rounded-xl border border-olive-900/12 py-4 text-center font-mono text-4xl tracking-[0.4em] text-olive-900 transition outline-none focus:border-olive-700 focus:bg-white"
              placeholder="000000"
              required
            />
          </div>
          <div className="border-t border-olive-900/8 px-5 py-4 sm:px-6">
            <button
              type="submit"
              disabled={status === "previewing" || code.length !== 6}
              className="bg-gold-500 shadow-gold-500/20 hover:bg-gold-400 inline-flex min-h-[56px] w-full items-center justify-center rounded-xl text-base font-bold text-olive-900 shadow-md transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "previewing" ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  A verificar…
                </>
              ) : (
                "Verificar código"
              )}
            </button>
          </div>
        </form>

        {/* Error */}
        {(status === "error" || message) && status !== "success" ? (
          <div className="border-wine-700/20 bg-wine-700/5 mt-4 flex items-start gap-3 rounded-xl border px-4 py-3">
            <svg
              className="text-wine-700 mt-0.5 h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p role="alert" className="text-wine-700 text-sm font-semibold">
              {message ||
                "Código inválido ou expirado. Verifique e tente novamente."}
            </p>
          </div>
        ) : null}

        {/* Preview card */}
        {preview && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-olive-900/10">
            {/* Card header */}
            <div className="bg-olive-900 px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.22em] text-olive-300 uppercase">
                    Código válido
                  </p>
                  <h2 className="font-display mt-1 text-2xl leading-tight text-white">
                    {preview.benefit_title}
                  </h2>
                </div>
                <div className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-center">
                  <p className="font-mono text-xl font-bold tracking-wider text-white">
                    {code}
                  </p>
                </div>
              </div>
            </div>

            {/* Card body */}
            <div className="bg-cream-50 px-5 py-5 sm:px-6">
              <dl className="space-y-3">
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <dt className="text-olive-500">Membro</dt>
                  <dd className="font-semibold text-olive-900">
                    {preview.member_name || "Membro do Clube"}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <dt className="text-olive-500">Estabelecimento</dt>
                  <dd className="font-semibold text-olive-900">
                    {preview.business_location_name}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <dt className="text-olive-500">Código expira às</dt>
                  <dd className="font-semibold text-olive-900">
                    {new Intl.DateTimeFormat("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(preview.expires_at))}
                  </dd>
                </div>
              </dl>

              {preview.benefit_terms && (
                <div className="mt-4 rounded-xl bg-olive-900/5 px-4 py-3">
                  <p className="text-xs font-semibold text-olive-600">
                    Condições do benefício
                  </p>
                  <p className="mt-1 text-xs leading-5 text-olive-700">
                    {preview.benefit_terms}
                  </p>
                </div>
              )}

              <div className="mt-5">
                {status === "success" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-olive-700/10 p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-olive-700 text-white">
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
                      <div>
                        <p className="text-sm font-bold text-olive-900">
                          Benefício confirmado!
                        </p>
                        <p className="text-xs text-olive-600">
                          O membro será notificado para registar a poupança.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={reset}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-olive-900/15 text-sm font-semibold text-olive-900 transition hover:bg-olive-900/5"
                      >
                        Validar outro
                      </button>
                      <Link
                        href="/parceiros/dashboard"
                        className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-olive-900 text-sm font-semibold text-white transition hover:bg-olive-800"
                      >
                        Ver dashboard
                      </Link>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void confirm()}
                    disabled={status === "confirming"}
                    className="bg-gold-500 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl text-base font-bold text-olive-900 transition hover:opacity-90 disabled:opacity-50"
                  >
                    {status === "confirming" ? (
                      <>
                        <svg
                          className="mr-2 h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        A confirmar…
                      </>
                    ) : (
                      "Confirmar utilização"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
