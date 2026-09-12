"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
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

  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-semibold text-olive-900"
        >
          Clube Ribatejo
        </Link>
        <Link href="/parceiros" className="text-wine-700 text-sm font-semibold">
          ← Área de parceiros
        </Link>
      </header>

      <section className="mx-auto max-w-3xl py-16 sm:py-24">
        <p className="text-wine-700 text-xs font-semibold tracking-[0.28em] uppercase">
          Validação de parceiro
        </p>
        <h1 className="font-display mt-5 text-5xl tracking-tight text-olive-900 sm:text-6xl">
          Confirmar benefício
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-olive-700">
          Introduza o código apresentado pelo membro. Reveja os dados antes de
          confirmar a utilização.
        </p>

        <form
          onSubmit={previewCode}
          className="bg-cream-100 mt-10 rounded-3xl border border-olive-900/10 p-6 sm:p-8"
        >
          <label className="block text-sm font-semibold text-olive-900">
            Código de 6 dígitos
            <input
              value={code}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                setPreview(undefined);
                setStatus("idle");
                setMessage("");
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              className="mt-3 w-full rounded-xl bg-white px-4 py-4 text-center text-2xl tracking-[0.35em] outline-none"
              placeholder="000000"
              required
            />
          </label>
          <button
            disabled={status === "previewing" || code.length !== 6}
            className="bg-wine-700 mt-6 min-h-11 rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {status === "previewing" ? "A verificar…" : "Verificar código"}
          </button>
        </form>

        {message ? (
          <p role="alert" className="text-wine-700 mt-5 text-sm">
            {message}
          </p>
        ) : null}

        {preview ? (
          <section className="mt-8 rounded-3xl bg-olive-900 p-7 text-white sm:p-9">
            <p className="text-gold-500 text-xs font-semibold tracking-[0.2em] uppercase">
              Utilização encontrada
            </p>
            <h2 className="font-display mt-4 text-3xl">
              {preview.benefit_title}
            </h2>
            <dl className="text-cream-100/80 mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-5">
                <dt>Membro</dt>
                <dd className="text-right font-semibold text-white">
                  {preview.member_name || "Membro do Clube"}
                </dd>
              </div>
              <div className="flex justify-between gap-5">
                <dt>Local</dt>
                <dd className="text-right font-semibold text-white">
                  {preview.business_location_name}
                </dd>
              </div>
              <div className="flex justify-between gap-5">
                <dt>Válido até</dt>
                <dd className="text-right font-semibold text-white">
                  {new Intl.DateTimeFormat("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(preview.expires_at))}
                </dd>
              </div>
            </dl>
            <p className="text-cream-100/70 mt-6 text-sm leading-6">
              {preview.benefit_terms}
            </p>

            {status === "success" ? (
              <div className="mt-7">
                <p className="text-gold-500 font-semibold">
                  Benefício confirmado com sucesso.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-5 min-h-11 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold"
                >
                  Validar outro código
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={confirm}
                disabled={status === "confirming"}
                className="bg-gold-500 mt-7 min-h-11 rounded-full px-6 py-3 text-sm font-semibold text-olive-900 disabled:opacity-50"
              >
                {status === "confirming"
                  ? "A confirmar…"
                  : "Confirmar utilização"}
              </button>
            )}
          </section>
        ) : null}
      </section>
    </main>
  );
}
