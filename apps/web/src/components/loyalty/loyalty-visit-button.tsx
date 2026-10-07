"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CodeTicket } from "./code-ticket";

// Membro regista uma visita normal: gera código temporário para o parceiro
// validar. Depois de gerar, faz polling à visita até o parceiro a validar
// (emitindo o selo) ou o código expirar.
export function LoyaltyVisitButton({
  businessId,
  businessSlug,
  isAuthenticated = true,
  onValidated,
}: {
  businessId: string;
  businessSlug: string;
  isAuthenticated?: boolean;
  onValidated?: () => void;
}) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "code" | "validated" | "error"
  >("idle");
  const [code, setCode] = useState<string>();
  const [visitId, setVisitId] = useState<string>();
  const [expiresAt, setExpiresAt] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const onValidatedRef = useRef(onValidated);
  useEffect(() => {
    onValidatedRef.current = onValidated;
  }, [onValidated]);

  async function start() {
    setStatus("loading");
    setErrorMessage(undefined);
    try {
      const { data } = await createClient().auth.getSession();
      const token = data.session?.access_token;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!token || !apiUrl) throw new Error();
      const response = await fetch(
        `${apiUrl}/api/me/loyalty/${businessId}/visits`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const payload = (await response.json()) as {
        data?: { visit_id?: string; manual_code?: string; expires_at?: string };
        message?: string;
      };
      if (!response.ok || !payload.data?.manual_code)
        throw new Error(payload.message);
      setCode(payload.data.manual_code);
      setVisitId(payload.data.visit_id);
      setExpiresAt(payload.data.expires_at);
      setStatus("code");
    } catch (err) {
      setErrorMessage(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível registar a visita. Confirme que tem adesão ativa.",
      );
      setStatus("error");
    }
  }

  // Polling: espera o parceiro validar a visita (emite o selo) ou expirar.
  useEffect(() => {
    if (status !== "code" || !visitId) return;
    let active = true;
    const supabase = createClient();

    const id = setInterval(async () => {
      try {
        const { data } = await supabase
          .from("loyalty_visits")
          .select("status")
          .eq("id", visitId)
          .single();
        const s = (data as { status?: string } | null)?.status;
        if (!active) return;
        if (s === "validated") {
          setStatus("validated");
          onValidatedRef.current?.();
        } else if (s === "cancelled") {
          setErrorMessage(
            "O código expirou sem ser validado. Pode gerar um novo.",
          );
          setStatus("error");
        }
      } catch {
        /* mantém o polling */
      }
    }, 3000);

    // Stop defensivo quando o código expira (status continua 'pending' na BD).
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
  }, [status, visitId, expiresAt]);

  if (status === "validated") {
    return (
      <div className="bg-olive-700/10 mt-4 flex items-center gap-3 rounded-2xl p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive-700 text-white">
          <svg
            className="h-5 w-5"
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
            Visita validada — novo selo registado!
          </p>
          <p className="text-xs text-olive-600">
            O seu progresso foi atualizado.
          </p>
        </div>
      </div>
    );
  }

  if (status === "code" && code) {
    return (
      <div className="mt-4">
        <CodeTicket
          code={code}
          hint="Mostre este código ao parceiro para validar a visita e receber o seu selo."
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

  if (!isAuthenticated) {
    return (
      <Link
        href={`/entrar?redirectTo=${encodeURIComponent(`/explorar/${businessSlug}`)}`}
        className="bg-olive-900 hover:bg-olive-900/90 mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition sm:w-auto"
      >
        Entrar para acumular selos
      </Link>
    );
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={start}
        disabled={status === "loading"}
        className="bg-olive-900 hover:bg-olive-900/90 inline-flex min-h-[48px] w-full items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "A preparar código…" : "Registar visita"}
      </button>
      {status === "error" ? (
        <p role="alert" className="text-wine-700 mt-3 text-sm">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}