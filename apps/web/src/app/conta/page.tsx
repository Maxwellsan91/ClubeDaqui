"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const places = [
  ["A Tasca do Bronze", "Restaurante", "Almeirim"],
  ["A Adega", "Restaurante", "Fazendas de Almeirim"],
  ["Adega Novo Conceito", "Adega", "Fazendas de Almeirim"],
  ["Casa Ribatejana", "Alojamento", "Almeirim"],
  ["Experiências do Tejo", "Lazer", "Almeirim"],
];

export default function AccountPage() {
  const [email, setEmail] = useState<string>();
  const [query, setQuery] = useState("");
  const [map, setMap] = useState(false);
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? undefined));
  }, []);
  const filtered = useMemo(
    () =>
      places.filter(([name, kind, city]) =>
        `${name} ${kind} ${city}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );
  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/";
  }
  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16">
      <header className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-semibold text-olive-900"
        >
          Clube Ribatejo
        </Link>
        <button
          onClick={signOut}
          className="text-wine-700 text-sm font-semibold"
        >
          Sair
        </button>
      </header>
      <section className="mx-auto max-w-7xl py-16">
        <p className="text-wine-700 text-xs font-semibold tracking-[0.28em] uppercase">
          Área de membros
        </p>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="font-display text-5xl tracking-tight text-olive-900">
              Olá, {email?.split("@")[0] ?? "membro"}.
            </h1>
            <p className="mt-4 text-olive-700">
              Encontre o próximo lugar para descobrir.
            </p>
          </div>
          <button
            onClick={() => setMap(!map)}
            className="rounded-full bg-olive-900 px-5 py-3 text-sm font-semibold text-white"
          >
            {map ? "Ver lista" : "Ver mapa"}
          </button>
        </div>
        <div className="mt-10 flex max-w-xl items-center rounded-full border border-olive-900/15 bg-white p-2 shadow-sm">
          <span className="px-4 text-olive-700">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
            placeholder="Pesquisar restaurante, hotel ou experiência"
          />
        </div>
        {map ? (
          <div className="mt-10 overflow-hidden rounded-3xl border border-olive-900/10">
            <iframe
              title="Mapa de lugares no Ribatejo"
              className="h-[32rem] w-full"
              loading="lazy"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-8.67%2C39.14%2C-8.54%2C39.24&layer=mapnik&marker=39.2028%2C-8.6281"
            />
            <p className="p-4 text-xs text-olive-700">
              Mapa: © OpenStreetMap contributors.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-12 text-sm text-olive-700">
              {filtered.length} lugares para descobrir
            </p>
            <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-5">
              {filtered.map(([name, kind, city]) => (
                <article
                  key={name}
                  className="bg-cream-100 min-w-[18rem] snap-start rounded-3xl border border-olive-900/10 p-7"
                >
                  <p className="text-gold-500 text-xs font-semibold tracking-[0.2em] uppercase">
                    {kind}
                  </p>
                  <h2 className="font-display mt-12 text-2xl text-olive-900">
                    {name}
                  </h2>
                  <p className="text-wine-700 mt-2 text-sm font-semibold">
                    {city}
                  </p>
                  <Link
                    href={`/explorar/${name.toLowerCase().replaceAll(" ", "-")}`}
                    className="text-wine-700 decoration-gold-500 mt-7 inline-block text-sm font-semibold underline underline-offset-4"
                  >
                    Ver ficha →
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
