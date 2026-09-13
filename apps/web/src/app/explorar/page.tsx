"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { type BusinessCardData } from "@/components/business-card";
import { EmptyState } from "@/components/empty-state";
import { AppHeader } from "@/components/app-header";

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
      .then((r) => (r.ok ? r.json() : null))
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
                  places.find((p) => p.name === item.name)?.image ??
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
      remotePlaces.filter((p) => {
        const matchesFilter = filter === "Todos" || p.category === filter;
        return (
          matchesFilter &&
          `${p.name} ${p.kind} ${p.city}`
            .toLowerCase()
            .includes(query.toLowerCase())
        );
      }),
    [filter, query, remotePlaces],
  );

  const displayed = visible.slice(0, visibleCount);

  return (
    <main className="min-h-screen">
      <AppHeader
        rightSlot={
          <Link
            href="/conta"
            className="text-sm font-semibold text-olive-700 transition-colors hover:text-olive-900"
          >
            Área de membros
          </Link>
        }
      />

      <section className="mx-auto max-w-2xl px-5 pt-8 pb-16 sm:px-8">
        {/* Page title */}
        <div className="mb-5">
          <p className="text-wine-700 text-[11px] font-semibold tracking-[0.28em] uppercase">
            Guia piloto · Almeirim
          </p>
          <h1 className="font-display mt-2 text-2xl leading-tight tracking-tight text-olive-900 sm:text-3xl">
            Encontre o seu próximo lugar.
          </h1>
        </div>

        {/* Search */}
        <div className="flex items-center rounded-2xl border border-olive-900/12 bg-white shadow-sm">
          <span className="pl-4 text-lg text-olive-600 select-none">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-olive-700/50"
            placeholder="Pesquisar por nome, local ou tipo"
            aria-label="Pesquisar lugares"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="pr-4 text-sm text-olive-600 transition-colors hover:text-olive-900"
              aria-label="Limpar pesquisa"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div
          className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filtrar por categoria"
        >
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => {
                setFilter(item);
                setVisibleCount(20);
              }}
              aria-pressed={filter === item}
              className={`min-h-[38px] flex-none rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === item
                  ? "text-cream-50 bg-olive-900"
                  : "border border-olive-900/15 text-olive-700 hover:border-olive-900/30"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="mt-5 text-sm text-olive-600">
          {visible.length}{" "}
          {visible.length === 1 ? "lugar encontrado" : "lugares encontrados"}
        </p>

        {/* List */}
        {loading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex h-20 animate-pulse items-center gap-4 rounded-2xl bg-olive-900/8 p-3"
              />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Não foi possível carregar os lugares"
            description="Tente novamente dentro de instantes."
          />
        ) : displayed.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Não encontrámos lugares"
              description="Experimente outro termo ou remova os filtros."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-olive-900/10">
            {displayed.map((place, idx) => (
              <Link
                key={place.slug}
                href={`/explorar/${place.slug}`}
                className={`flex items-center gap-4 bg-white px-4 py-3.5 transition hover:bg-cream-100 active:bg-cream-100 ${
                  idx < displayed.length - 1
                    ? "border-b border-olive-900/8"
                    : ""
                }`}
              >
                {/* Thumbnail */}
                <div
                  className="h-14 w-14 flex-none rounded-xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${place.image})` }}
                  aria-hidden="true"
                />
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-olive-900">
                    {place.name}
                  </p>
                  <p className="mt-0.5 text-xs text-olive-600">
                    {place.kind} · {place.city}
                  </p>
                  <p className="mt-0.5 text-xs text-olive-500">
                    1 oferta disponível
                  </p>
                </div>
                {/* Chevron */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-olive-900/30"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>
        )}

        {displayed.length < visible.length && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setVisibleCount((c) => c + 20)}
              className="min-h-[44px] rounded-full border border-olive-900/20 px-7 py-2.5 text-sm font-semibold text-olive-900 transition hover:bg-olive-900 hover:text-white"
            >
              Carregar mais
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
