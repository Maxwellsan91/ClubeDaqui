"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  BusinessCard,
  type BusinessCardData,
} from "@/components/business-card";
import { EmptyState } from "@/components/empty-state";
import { MemberSummary } from "@/components/member-summary";
import { RecordSavingsForm } from "@/components/record-savings-form";
import { SavingsByCategory } from "@/components/savings-by-category";
import { SavingsHistory } from "@/components/savings-history";
import { SavingsOverview } from "@/components/savings-overview";
import type { SavingsRecord } from "@/types/member";

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
    slug: "casa-ribatejana",
    name: "Casa Ribatejana",
    category: "Dormir",
    kind: "Alojamento",
    city: "Almeirim",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
  },
];

const storageKey = "clube-ribatejo-savings";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>();
  const [query, setQuery] = useState("");
  const [map, setMap] = useState(false);
  const [records, setRecords] = useState<SavingsRecord[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as SavingsRecord[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? undefined));
  }, []);

  const filtered = useMemo(
    () =>
      places.filter((place) =>
        `${place.name} ${place.kind} ${place.city}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );
  const saveRecord = (record: SavingsRecord) => {
    const next = [record, ...records];
    setRecords(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };
  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
  }
  const summary = {
    subscriptionStatus: "active" as const,
    validUntil: null,
    usedBenefits: records.length,
    availableBenefits: 0,
    totalBenefits: records.length,
    potentialSavings: null,
  };

  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16">
      <header className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-olive-900"
        >
          Clube Ribatejo
        </Link>
        <button
          onClick={signOut}
          className="text-wine-700 min-h-11 px-2 text-sm font-semibold"
        >
          Sair
        </button>
      </header>
      <section className="mx-auto max-w-7xl py-12 sm:py-16">
        <p className="text-wine-700 text-xs font-semibold tracking-[0.28em] uppercase">
          Área de membros
        </p>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="font-display text-5xl tracking-tight text-olive-900">
              Olá, {email?.split("@")[0] ?? "membro"}.
            </h1>
            <p className="mt-4 text-lg leading-7 text-olive-700">
              Descubra o próximo lugar e acompanhe quanto já poupou com o Clube.
            </p>
          </div>
          <button
            onClick={() => setMap(!map)}
            className="min-h-11 rounded-full bg-olive-900 px-5 py-3 text-sm font-semibold text-white"
          >
            {map ? "Ver lista" : "Ver mapa"}
          </button>
        </div>
        <div className="mt-10">
          <MemberSummary
            summary={summary}
            totalSavings={records.reduce(
              (sum, item) => sum + item.discountAmount,
              0,
            )}
          />
        </div>
        <div className="mt-6">
          <SavingsOverview records={records} />
        </div>
        <div className="mt-6">
          <SavingsByCategory records={records} />
        </div>
        <div className="mt-12">
          <RecordSavingsForm onSaved={saveRecord} />
        </div>
        <div className="mt-12">
          <SavingsHistory records={records} />
        </div>
        <div className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-wine-700 text-xs font-semibold tracking-[0.2em] uppercase">
                Descobrir
              </p>
              <h2 className="font-display mt-2 text-3xl text-olive-900">
                Benefícios e lugares disponíveis
              </h2>
            </div>
            <Link
              href="/explorar"
              className="text-wine-700 text-sm font-semibold"
            >
              Ver todos →
            </Link>
          </div>
          {map ? (
            <div className="mt-6 overflow-hidden rounded-3xl border border-olive-900/10">
              <iframe
                title="Mapa de lugares no Ribatejo"
                className="h-[28rem] w-full"
                loading="lazy"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-8.67%2C39.14%2C-8.54%2C39.24&layer=mapnik&marker=39.2028%2C-8.6281"
              />
              <p className="p-4 text-xs text-olive-700">
                Mapa: © OpenStreetMap contributors.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 flex max-w-xl items-center rounded-full border border-olive-900/15 bg-white p-2 shadow-sm">
                <span className="px-4 text-olive-700" aria-hidden="true">
                  ⌕
                </span>
                <label htmlFor="member-search" className="sr-only">
                  Pesquisar lugares
                </label>
                <input
                  id="member-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
                  placeholder="Pesquisar restaurante, hotel ou experiência"
                />
              </div>
              {filtered.length ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((place) => (
                    <BusinessCard key={place.slug} place={place} />
                  ))}
                </div>
              ) : (
                <div className="mt-6">
                  <EmptyState
                    title="Não encontrámos lugares"
                    description="Experimente outro termo de pesquisa."
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
