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
        {
          email: email.trim(),
          password,
        },
      );
      if (authError) {
        setError(
          "Email ou palavra-passe incorretos. Confirme também se já validou o seu email.",
        );
        setSubmitting(false);
        return;
      }
      router.refresh();
      router.replace(next);
    } catch {
      setError(
        "Não foi possível contactar o serviço de autenticação. Tente novamente.",
      );
      setSubmitting(false);
    }
  }
  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16">
      <header className="mx-auto flex max-w-7xl justify-between">
        <Link
          href="/"
          className="font-display text-xl font-semibold text-olive-900"
        >
          Clube Ribatejo
        </Link>
        <Link href="/explorar" className="text-wine-700 text-sm font-semibold">
          ← Explorar
        </Link>
      </header>
      <section className="mx-auto max-w-lg py-24">
        <p className="text-wine-700 text-xs font-semibold tracking-[0.28em] uppercase">
          Área de membros
        </p>
        <h1 className="font-display mt-5 text-5xl tracking-tight text-olive-900">
          Entre no Clube Ribatejo.
        </h1>
        <p className="mt-6 text-lg leading-8 text-olive-700">
          Entre com o email e a palavra-passe da sua conta confirmada.
        </p>
        <p className="mt-3 text-sm text-olive-700">
          Ainda não tem conta?{" "}
          <Link href="/registar" className="text-wine-700 font-semibold">
            Criar conta
          </Link>
        </p>
        <form onSubmit={submit} className="bg-cream-100 mt-10 rounded-3xl p-8">
          <label className="block text-sm font-semibold text-olive-900">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="mt-2 min-h-11 w-full rounded-xl bg-white px-4 outline-none"
              required
            />
          </label>
          <label className="mt-5 block text-sm font-semibold text-olive-900">
            Palavra-passe
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="mt-2 min-h-11 w-full rounded-xl bg-white px-4 outline-none"
              required
            />
          </label>
          {error ? (
            <p role="alert" className="text-wine-700 mt-4 text-sm">
              {error}
            </p>
          ) : null}
          <button
            disabled={submitting}
            className="bg-wine-700 mt-7 min-h-11 rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "A entrar…" : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
