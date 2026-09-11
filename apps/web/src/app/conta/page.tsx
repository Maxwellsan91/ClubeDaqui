"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const [email, setEmail] = useState<string>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? undefined))
      .finally(() => setLoading(false));
  }, []);
  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/";
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
          Explorar
        </Link>
      </header>
      <section className="mx-auto max-w-2xl py-24">
        <p className="text-wine-700 text-xs font-semibold tracking-[0.28em] uppercase">
          Área de membros
        </p>
        <h1 className="font-display mt-5 text-5xl tracking-tight text-olive-900">
          A sua conta.
        </h1>
        {loading ? (
          <p className="mt-8 text-olive-700">A carregar sessão…</p>
        ) : email ? (
          <div className="bg-cream-100 mt-10 rounded-3xl p-8">
            <p className="text-sm text-olive-700">Sessão iniciada com</p>
            <p className="mt-2 text-lg font-semibold text-olive-900">{email}</p>
            <p className="mt-8 text-sm leading-6 text-olive-700">
              Em breve poderá consultar os seus benefícios e resgates nesta
              área.
            </p>
            <button
              onClick={signOut}
              className="mt-7 rounded-full bg-olive-900 px-6 py-3 text-sm font-semibold text-white"
            >
              Terminar sessão
            </button>
          </div>
        ) : (
          <div className="bg-cream-100 mt-10 rounded-3xl p-8">
            <p className="text-olive-700">Ainda não iniciou sessão.</p>
            <Link
              href="/entrar"
              className="bg-wine-700 mt-7 inline-block rounded-full px-6 py-3 text-sm font-semibold text-white"
            >
              Entrar
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
