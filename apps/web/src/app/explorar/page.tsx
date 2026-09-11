"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BusinessCard,
  type BusinessCardData,
} from "@/components/business-card";
import { EmptyState } from "@/components/empty-state";

const places: BusinessCardData[] = [
  {
    slug: "a-tasca-do-bronze",
    name: "A Tasca do Bronze",
    category: "Comer",
    kind: "Restaurante",
    city: "Almeirim",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
    cuisine: "Tradicional portuguesa",
  },
  {
    slug: "a-adega",
    name: "A Adega",
    category: "Comer",
    kind: "Restaurante",
    city: "Fazendas de Almeirim",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80",
    cuisine: "Cozinha portuguesa",
  },
  {
    slug: "adega-novo-conceito",
    name: "Adega Novo Conceito",
    category: "Comer",
    kind: "Adega",
    city: "Fazendas de Almeirim",
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "experiências-do-tejo",
    name: "Experiências do Tejo",
    category: "Lazer",
    kind: "Experiência",
    city: "Almeirim",
    image:
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "casa-ribatejana",
    name: "Casa Ribatejana",
    category: "Dormir",
    kind: "Alojamento",
    city: "Almeirim",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
  },
];

const filters = ["Todos", "Comer", "Dormir", "Lazer"];
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ExplorePage() {
  const [filter, setFilter] = useState("Todos");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(9);
  const [remotePlaces, setRemotePlaces] = useState<BusinessCardData[]>(places);
  const [loading, setLoading] = useState(Boolean(apiUrl));
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!apiUrl) return;
    fetch(`${apiUrl}/api/businesses`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.data) {
          setRemotePlaces(
            payload.data.map(
              (item: {
                id?: string;
                name: string;
                category: string;
                kind: string;
                city: string;
              }) => ({
                slug: item.name.toLowerCase().replaceAll(" ", "-"),
                name: item.name,
                category: item.category,
                kind: item.kind,
                city: item.city,
                image:
                  places.find((place) => place.name === item.name)?.image ??
                  "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80",
              }),
            ),
          );
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);
  const visible = useMemo(
    () =>
      remotePlaces.filter((place) => {
        const matchesFilter = filter === "Todos" || place.category === filter;
        return (
          matchesFilter &&
          `${place.name} ${place.kind} ${place.city}`
            .toLowerCase()
            .includes(query.toLowerCase())
        );
      }),
    [filter, query, remotePlaces],
  );
  const displayed = visible.slice(0, visibleCount);

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
        <Link href="/entrar" className="text-wine-700 text-sm font-semibold">
          Entrar
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
        {loading ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[430px] animate-pulse rounded-3xl bg-olive-900/10"
              />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Não foi possível carregar os lugares"
            description="Tente novamente dentro de instantes."
          />
        ) : displayed.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="Não encontrámos lugares"
              description="Experimente outro termo ou remova os filtros."
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayed.map((place) => (
              <BusinessCard key={place.slug} place={place} />
            ))}
          </div>
        )}
        {displayed.length < visible.length && (
          <button
            onClick={() => setVisibleCount((count) => count + 9)}
            className="mt-10 rounded-full border border-olive-900/20 px-6 py-3 text-sm font-semibold text-olive-900 transition hover:bg-olive-900 hover:text-white"
          >
            Carregar mais lugares
          </button>
        )}
      </section>
    </main>
  );
}
