"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { type BusinessCardData } from "@/components/business-card";
import { EmptyState } from "@/components/empty-state";
import { AppHeader } from "@/components/app-header";
import { ExploreGoogleMap } from "@/components/explore-google-map";

const staticPlaces: BusinessCardData[] = [
  {
    slug: "a-tasca-do-bronze",
    name: "A Tasca do Bronze",
    category: "Comer",
    kind: "Restaurante",
    city: "Almeirim",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
    cuisine: "Tradicional portuguesa",
    coordinates: [39.2028305, -8.6281241],
    priceRange: "12 € – 35 €",
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
    coordinates: [39.1767872, -8.5833777],
    priceRange: "15 € – 40 €",
  },
  {
    slug: "adega-novo-conceito",
    name: "Adega Novo Conceito",
    category: "Comer",
    kind: "Adega",
    city: "Fazendas de Almeirim",
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
    coordinates: [39.1791369, -8.5922863],
    priceRange: "15 € – 40 €",
  },
  {
    slug: "experiências-do-tejo",
    name: "Experiências do Tejo",
    category: "Lazer",
    kind: "Experiência",
    city: "Almeirim",
    image:
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=80",
    coordinates: [39.2086, -8.6267],
  },
  {
    slug: "casa-ribatejana",
    name: "Casa Ribatejana",
    category: "Dormir",
    kind: "Alojamento",
    city: "Almeirim",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    coordinates: [39.2051, -8.6242],
  },
];

const FAVORITES_KEY = "clube-daqui-favorites";
const categoryFilters = ["Todos", "Comer", "Dormir", "Lazer"];
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

function distanceKm(from: [number, number], to: [number, number]) {
  const earthRadius = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(to[0] - from[0]);
  const dLon = toRadians(to[1] - from[1]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from[0])) *
      Math.cos(toRadians(to[0])) *
      Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function ExplorePage() {
  const [filter, setFilter] = useState("Todos");
  const [showFavorites, setShowFavorites] = useState(false);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const [remotePlaces, setRemotePlaces] =
    useState<BusinessCardData[]>(staticPlaces);
  const [loading, setLoading] = useState(Boolean(apiUrl));
  const [error, setError] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [userPosition, setUserPosition] = useState<[number, number]>();
  const [locationState, setLocationState] = useState<
    "idle" | "loading" | "ready" | "denied"
  >("idle");
  const [watchId, setWatchId] = useState<number>();
  const [mapMode, setMapMode] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setFavorites(new Set(JSON.parse(stored) as string[]));
    } catch {
      /* ignore parse errors */
    }
  }, []);

  useEffect(() => {
    return () => {
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Fetch businesses from API
  useEffect(() => {
    if (!apiUrl) return;
    fetch(`${apiUrl}/api/businesses`)
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (payload?.data) {
          setRemotePlaces(
            payload.data.map(
              (item: {
                slug: string;
                name: string;
                category: string;
                kind: string;
                city: string;
                latitude?: number;
                longitude?: number;
                imageUrl?: string;
                priceRange?: string | null;
              }) => ({
                slug: item.slug,
                name: item.name,
                category: item.category,
                kind: item.kind,
                city: item.city,
                image:
                  item.imageUrl ??
                  staticPlaces.find((p) => p.name === item.name)?.image ??
                  "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80",
                coordinates:
                  typeof item.latitude === "number" &&
                  typeof item.longitude === "number"
                    ? [item.latitude, item.longitude]
                    : staticPlaces.find((p) => p.name === item.name)
                        ?.coordinates,
                priceRange: item.priceRange ?? null,
              }),
            ),
          );
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  function toggleLocation() {
    if (watchId !== undefined) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(undefined);
      setUserPosition(undefined);
      setLocationState("idle");
      return;
    }
    if (!navigator.geolocation) {
      setLocationState("denied");
      return;
    }
    setLocationState("loading");
    const id = navigator.geolocation.watchPosition(
      (position) => {
        setUserPosition([position.coords.latitude, position.coords.longitude]);
        setLocationState("ready");
      },
      () => setLocationState("denied"),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 },
    );
    setWatchId(id);
  }

  function toggleFavorite(slug: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const visible = useMemo(() => {
    const filtered = remotePlaces.filter((p) => {
      if (showFavorites && !favorites.has(p.slug)) return false;
      const matchesCategory = filter === "Todos" || p.category === filter;
      const matchesQuery = `${p.name} ${p.kind} ${p.city}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
    if (!userPosition) return filtered;
    return [...filtered].sort((a, b) => {
      const da = a.coordinates
        ? distanceKm(userPosition, a.coordinates)
        : Number.POSITIVE_INFINITY;
      const db = b.coordinates
        ? distanceKm(userPosition, b.coordinates)
        : Number.POSITIVE_INFINITY;
      return da - db;
    });
  }, [filter, showFavorites, query, remotePlaces, favorites, userPosition]);

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
          className="-mx-5 mt-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filtrar por categoria"
        >
          {/* Favoritos chip */}
          <button
            onClick={() => {
              setShowFavorites((v) => !v);
              setVisibleCount(20);
            }}
            aria-pressed={showFavorites}
            className={`flex min-h-[38px] flex-none items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
              showFavorites
                ? "bg-wine-700 text-white"
                : "border border-olive-900/15 text-olive-700 hover:border-olive-900/30"
            }`}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill={showFavorites ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Favoritos
            {favorites.size > 0 && (
              <span
                className={`rounded-full px-1.5 text-[10px] font-bold ${showFavorites ? "bg-white/20 text-white" : "bg-olive-900/10 text-olive-700"}`}
              >
                {favorites.size}
              </span>
            )}
          </button>

          {/* Category chips */}
          {categoryFilters.map((item) => (
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

        <button
          type="button"
          onClick={toggleLocation}
          className="mt-4 inline-flex min-h-[40px] items-center rounded-full border border-olive-900/15 px-4 py-2 text-sm font-semibold text-olive-700 transition hover:border-olive-900/30"
        >
          {locationState === "loading"
            ? "A obter localização…"
            : watchId !== undefined
              ? "Parar localização"
              : "Usar a minha localização"}
        </button>
        {locationState === "denied" && (
          <p className="text-wine-700 mt-2 text-xs">
            Não foi possível obter a localização. Verifique a permissão do
            browser.
          </p>
        )}

        {/* Count */}
        <p className="mt-5 text-sm text-olive-600">
          {showFavorites && favorites.size === 0
            ? "Nenhum favorito guardado ainda"
            : `${visible.length} ${visible.length === 1 ? "lugar encontrado" : "lugares encontrados"}`}
        </p>

        <button
          type="button"
          onClick={() => setMapMode((value) => !value)}
          className="mt-4 min-h-[42px] rounded-full bg-olive-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          {mapMode ? "Ver lista" : "Ver mapa"}
        </button>

        {/* Map-first exploration */}
        {mapMode && (
          <section className="relative mt-4 h-[70vh] min-h-[30rem] overflow-hidden rounded-3xl bg-[#202124] shadow-lg">
            <ExploreGoogleMap
              places={visible}
              center={userPosition ?? [39.2028, -8.6281]}
              userPosition={userPosition}
            />
            <div className="absolute right-4 bottom-4 left-4 max-h-44 overflow-x-auto rounded-2xl bg-[#111111]/95 p-3 text-white shadow-xl backdrop-blur sm:left-auto sm:w-80">
              <p className="mb-2 px-1 text-xs font-semibold text-white/60">
                {visible.length} parceiros próximos
              </p>
              <div className="flex gap-2 sm:block sm:space-y-2">
                {visible.slice(0, 8).map((place) => (
                  <Link
                    key={place.slug}
                    href={`/explorar/${place.slug}`}
                    className="block min-w-44 rounded-xl bg-white/10 px-3 py-2 transition hover:bg-white/20 sm:min-w-0"
                  >
                    <p className="truncate text-sm font-semibold">
                      {place.name}
                    </p>
                    <p className="text-[11px] text-white/60">
                      {place.kind} · {place.city}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* List */}
        {!mapMode &&
          (loading ? (
            <div className="mt-4 space-y-px">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-[76px] animate-pulse items-center gap-4 bg-olive-900/5 px-4 first:rounded-t-2xl last:rounded-b-2xl"
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
              {showFavorites && favorites.size === 0 ? (
                <div className="rounded-2xl border border-dashed border-olive-900/20 p-8 text-center">
                  <p className="font-display text-xl text-olive-900">
                    Ainda sem favoritos
                  </p>
                  <p className="mt-2 text-sm leading-6 text-olive-600">
                    Toque no coração ao lado de um lugar para o guardar aqui.
                  </p>
                </div>
              ) : (
                <EmptyState
                  title="Não encontrámos lugares"
                  description="Experimente outro termo ou remova os filtros."
                />
              )}
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-olive-900/10">
              {displayed.map((place, idx) => (
                <div
                  key={place.slug}
                  className={`flex items-center gap-3 bg-white px-4 py-3.5 ${
                    idx < displayed.length - 1
                      ? "border-b border-olive-900/8"
                      : ""
                  }`}
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/explorar/${place.slug}`}
                    className="flex flex-1 items-center gap-3 transition hover:opacity-90"
                  >
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
                      {userPosition && place.coordinates && (
                        <p className="mt-0.5 text-xs font-semibold text-olive-700">
                          {distanceKm(userPosition, place.coordinates).toFixed(
                            1,
                          )}{" "}
                          km de si
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Favorite button */}
                  <button
                    onClick={(e) => toggleFavorite(place.slug, e)}
                    aria-label={
                      favorites.has(place.slug)
                        ? `Remover ${place.name} dos favoritos`
                        : `Adicionar ${place.name} aos favoritos`
                    }
                    className={`shrink-0 p-1 transition-transform active:scale-90 ${
                      favorites.has(place.slug)
                        ? "text-wine-700"
                        : "text-olive-900/20 hover:text-olive-900/40"
                    }`}
                  >
                    <HeartIcon filled={favorites.has(place.slug)} />
                  </button>
                </div>
              ))}
            </div>
          ))}

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
