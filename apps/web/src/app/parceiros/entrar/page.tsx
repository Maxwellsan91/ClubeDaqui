"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PartnerSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const requestedPath = new URLSearchParams(window.location.search).get("redirectTo");
      const next =
        requestedPath?.startsWith("/parceiros") ? requestedPath : "/parceiros/dashboard";
      const { error: authError } = await createClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError("Email ou palavra-passe incorretos.");
        setSubmitting(false);
        return;
      }
      router.refresh();
      router.replace(next);
    } catch {
      setError("Não foi possível contactar o serviço. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-cream-50 flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="font-display text-[1.2rem] font-semibold tracking-tight text-olive-900"
        >
          Clube Ribatejo
        </Link>
        <Link
          href="/parceiros"
          className="text-sm font-semibold text-olive-600 hover:text-olive-900 transition-colors"
        >
          Área de parceiros
        </Link>
      </header>

      <div className="flex flex-1 items-start justify-center px-5 pt-8 pb-10 sm:px-8 sm:pt-16">
        <div className="w-full max-w-md">
          <p className="text-wine-700 text-[11px] font-semibold tracking-[0.28em] uppercase">
            Parceiros
          </p>
          <h1 className="font-display mt-3 text-[2.4rem] leading-tight tracking-tight text-olive-900 sm:text-5xl">
            Área reservada.
          </h1>
          <p className="mt-3 text-sm leading-6 text-olive-700">
            Acesso exclusivo para estabelecimentos parceiros do Clube Ribatejo.
          </p>

          <form
            onSubmit={submit}
            className="bg-cream-100 mt-8 space-y-5 rounded-2xl p-6 sm:p-8"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-olive-900">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="focus:border-wine-700 mt-2 block w-full rounded-xl border border-olive-900/12 bg-white px-4 py-3 text-olive-900 transition-colors placeholder:text-olive-700/40 focus:outline-none"
                placeholder="parceiro@restaurante.pt"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-olive-900">
                Palavra-passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="focus:border-wine-700 mt-2 block w-full rounded-xl border border-olive-900/12 bg-white px-4 py-3 text-olive-900 transition-colors placeholder:text-olive-700/40 focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p role="alert" className="bg-wine-700/8 text-wine-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="bg-olive-900 hover:bg-olive-800 block min-h-[48px] w-full rounded-full px-6 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
            >
              {submitting ? "A entrar…" : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-olive-500">
            Não é parceiro?{" "}
            <Link href="/parceiros" className="underline underline-offset-2 hover:text-olive-900 transition-colors">
              Saiba como aderir
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}