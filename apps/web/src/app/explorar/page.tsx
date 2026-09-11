"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const places = [
  ["A Tasca do Bronze", "Comer", "Restaurante", "Almeirim"],
  ["A Adega", "Comer", "Restaurante", "Fazendas de Almeirim"],
  ["Adega Novo Conceito", "Comer", "Adega", "Fazendas de Almeirim"],
  ["Experiências do Tejo", "Lazer", "Experiência", "Almeirim"],
  ["Casa Ribatejana", "Dormir", "Alojamento", "Almeirim"],
];

const filters = ["Todos", "Comer", "Dormir", "Lazer"];
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ExplorePage() {
  const [filter, setFilter] = useState("Todos");
  const [query, setQuery] = useState("");
  const [remotePlaces, setRemotePlaces] = useState(places);
  useEffect(() => {
    if (!apiUrl) return;
    fetch(`${apiUrl}/api/businesses`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.data) {
          setRemotePlaces(
            payload.data.map(
              (item: {
                name: string;
                category: string;
                kind: string;
                city: string;
              }) => [item.name, item.category, item.kind, item.city],
            ),
          );
        }
      })
      .catch(() => undefined);
  }, []);
  const visible = useMemo(
    () =>
      remotePlaces.filter(([name, type, kind, place]) => {
        const matchesFilter = filter === "Todos" || type === filter;
        return (
          matchesFilter &&
          `${name} ${kind} ${place}`.toLowerCase().includes(query.toLowerCase())
        );
      }),
    [filter, query, remotePlaces],
  );

  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16">
      <header className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-olive-900"
        >
          Clube Ribatejo
        </Link>
        <Link href="/" className="text-wine-700 text-sm font-semibold">
          ← Voltar à Home
        </Link>
      </header>
      <section className="mx-auto max-w-7xl pt-20 pb-20">
        <p className="text-wine-700 text-xs font-semibold tracking-[0.28em] uppercase">
          Guia piloto · Almeirim
        </p>
        <h1 className="font-display mt-5 text-5xl tracking-tight text-olive-900 sm:text-7xl">
          Encontre o seu próximo lugar.
        </h1>
        <div className="mt-10 flex max-w-2xl items-center rounded-full border border-olive-900/15 bg-white p-2 shadow-sm">
          <span className="px-4 text-olive-700">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
            placeholder="Pesquisar por nome, local ou categoria"
          />
        </div>
        <div className="mt-7 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${filter === item ? "text-cream-50 bg-olive-900" : "hover:border-gold-500 border border-olive-900/15 text-olive-700"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="mt-12 text-sm text-olive-700">
          {visible.length}{" "}
          {visible.length === 1 ? "lugar encontrado" : "lugares encontrados"}
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map(([name, , kind, place]) => (
            <article
              key={name}
              className="bg-cream-100 rounded-3xl border border-olive-900/10 p-7 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-gold-500 text-xs font-semibold tracking-[0.2em] uppercase">
                {kind}
              </p>
              <h2 className="font-display mt-10 text-2xl text-olive-900">
                {name}
              </h2>
              <p className="text-wine-700 mt-2 text-sm font-semibold">
                {place}
              </p>
              <button className="text-wine-700 decoration-gold-500 mt-7 text-sm font-semibold underline underline-offset-4">
                Ver ficha
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
