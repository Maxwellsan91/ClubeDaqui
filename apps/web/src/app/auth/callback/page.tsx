"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

function safeDestination(value: string | null, fallback = "/conta") {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function completeAuth() {
      const supabase = createClient();
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const flowId = searchParams.get("sb_flow_id");
      const destination =
        type === "recovery"
          ? "/conta/atualizar-senha"
          : safeDestination(
              searchParams.get("next"),
              type === "signup" || type === "email" ? "/checkout" : "/conta",
            );

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
          code,
          flowId ? { flowId } : undefined,
        );
        if (exchangeError) {
          if (!cancelled) setError(true);
          return;
        }
      } else if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });
        if (verifyError) {
          if (!cancelled) setError(true);
          return;
        }
      }

      // For the default Supabase email template, the access and refresh tokens
      // arrive in the URL fragment. The browser client consumes that fragment
      // during initialization and persists the session in its cookie storage.
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (!cancelled) setError(true);
        return;
      }
      if (!cancelled) router.replace(destination);
    }

    void completeAuth();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl text-olive-900">
            Este link já não é válido.
          </h1>
          <p className="mt-4 text-sm leading-6 text-olive-700">
            O link pode ter expirado ou já ter sido utilizado. Volte ao registo
            para solicitar um novo email de confirmação.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-olive-700">A confirmar o seu email…</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-6">
          <p className="text-sm text-olive-700">A confirmar o seu email…</p>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
