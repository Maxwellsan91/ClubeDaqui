"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CodeTicket } from "./code-ticket";

// Membro regista uma visita normal: gera código temporário para o parceiro validar.
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
        `${apiUrl}/api/me/loyalty/${businessId}/visits`,
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
      onValidated?.();
    } catch (err) {
      setErrorMessage(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível registar a visita. Confirme que tem adesão ativa.",
      );
      setStatus("error");
    }
  }

  if (status === "code" && code) {
    return (
      <div className="mt-4">
        <CodeTicket
          code={code}
          hint="Mostre este código ao parceiro para validar a visita e receber o seu selo."
        />
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