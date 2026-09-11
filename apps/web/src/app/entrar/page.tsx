"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const { error: authError } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (authError)
      setError("Não foi possível enviar o acesso. Tente novamente.");
    else setSent(true);
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
          Use o seu email para receber um link seguro de acesso.
        </p>
        {sent ? (
          <div className="text-cream-50 mt-10 rounded-3xl bg-olive-900 p-8">
            <h2 className="font-display text-2xl">Verifique o seu email.</h2>
            <p className="text-cream-100/70 mt-3 text-sm">
              Enviámos um link de acesso para {email}.
            </p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="bg-cream-100 mt-10 rounded-3xl p-8"
          >
            <label className="block text-sm font-semibold text-olive-900">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl bg-white px-4 py-3 outline-none"
                required
              />
            </label>
            {error && <p className="text-wine-700 mt-4 text-sm">{error}</p>}
            <button className="bg-wine-700 mt-7 rounded-full px-6 py-3 text-sm font-semibold text-white">
              Enviar link de acesso
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
