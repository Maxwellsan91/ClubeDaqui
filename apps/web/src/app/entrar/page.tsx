"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
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
      const requestedPath = new URLSearchParams(window.location.search).get(
        "redirectTo",
      );
      const next =
        requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : "/conta";
      const { error: authError } = await createClient().auth.signInWithPassword(
        { email: email.trim(), password },
      );
      if (authError) {
        setError(
          "Email ou palavra-passe incorretos. Confirme se já validou o seu email.",
        );
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
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="font-display text-[1.2rem] font-semibold tracking-tight text-olive-900"
        >
          Clube Ribatejo
        </Link>
        <Link
          href="/registar"
          className="text-wine-700 hover:text-wine-800 text-sm font-semibold transition-colors"
        >
          Criar conta
        </Link>
      </header>

      {/* Form area */}
      <div className="flex flex-1 items-start justify-center px-5 pt-8 pb-10 sm:px-8 sm:pt-16">
        <div className="w-full max-w-md">
          <p className="text-wine-700 text-[11px] font-semibold tracking-[0.28em] uppercase">
            Área de membros
          </p>
          <h1 className="font-display mt-3 text-[2.4rem] leading-tight tracking-tight text-olive-900 sm:text-5xl">
            Entre no Clube.
          </h1>
          <p className="mt-3 text-sm leading-6 text-olive-700">
            Ainda não tem conta?{" "}
            <Link
              href="/registar"
              className="text-wine-700 hover:decoration-wine-700 font-semibold underline decoration-transparent underline-offset-4 transition-all"
            >
              Crie uma gratuitamente.
            </Link>
          </p>

          <form
            onSubmit={submit}
            className="bg-cream-100 mt-8 space-y-5 rounded-2xl p-6 sm:p-8"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-olive-900"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="focus:border-wine-700 mt-2 block w-full rounded-xl border border-olive-900/12 bg-white px-4 py-3 text-olive-900 transition-colors placeholder:text-olive-700/40 focus:outline-none"
                placeholder="o.seu@email.pt"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-olive-900"
                >
                  Palavra-passe
                </label>
              </div>
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
              <p
                role="alert"
                className="bg-wine-700/8 text-wine-700 rounded-xl px-4 py-3 text-sm"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="bg-wine-700 hover:bg-wine-800 block min-h-[48px] w-full rounded-full px-6 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
            >
              {submitting ? "A entrar…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
