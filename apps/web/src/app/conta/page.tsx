"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/app-header";
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
import type {
  MemberRedemption,
  MemberSummaryData,
  SavingsRecord,
} from "@/types/member";

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
  const [serverSummary, setServerSummary] = useState<MemberSummaryData | null>(
    null,
  );
  const [unrecordedRedemptions, setUnrecordedRedemptions] = useState<
    MemberRedemption[]
  >([]);
  const [apiStatus, setApiStatus] = useState<
    "loading" | "connected" | "fallback"
  >("loading");

  useEffect(() => {
    const client = createClient();
    client.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? undefined));
    client.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!token || !apiUrl) {
        setApiStatus("fallback");
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [summaryResponse, savingsResponse, redemptionsResponse] =
          await Promise.all([
            fetch(`${apiUrl}/api/me/summary`, { headers }),
            fetch(`${apiUrl}/api/me/savings`, { headers }),
            fetch(`${apiUrl}/api/me/redemptions`, { headers }),
          ]);
        if (
          !summaryResponse.ok ||
          !savingsResponse.ok ||
          !redemptionsResponse.ok
        ) {
          throw new Error("Member API unavailable");
        }
        const summaryPayload = (await summaryResponse.json()) as {
          data?: MemberSummaryData;
        };
        const savingsPayload = (await savingsResponse.json()) as {
          data?: { records?: SavingsRecord[] };
        };
        const redemptionsPayload = (await redemptionsResponse.json()) as {
          data?: MemberRedemption[];
        };
        if (summaryPayload.data) setServerSummary(summaryPayload.data);
        setRecords(savingsPayload.data?.records ?? []);
        setUnrecordedRedemptions(
          (redemptionsPayload.data ?? []).filter((item) => !item.financial),
        );
        setApiStatus("connected");
      } catch {
        // Mantém o fallback local da demo se a API estiver indisponível.
        setApiStatus("fallback");
      }
    });
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
  const saveServerRecord = (record: SavingsRecord) => {
    setRecords((current) => [record, ...current]);
    setUnrecordedRedemptions((current) =>
      current.filter((item) => item.id !== record.redemptionId),
    );
  };
  const summary = serverSummary ?? {
    subscriptionStatus: "active" as const,
    validUntil: null,
    usedBenefits: records.length,
    availableBenefits: 0,
    totalBenefits: records.length,
    potentialSavings: null,
  };

  const logoutButton = (
    <form action="/auth/logout" method="POST">
      <button
        type="submit"
        className="min-h-[44px] rounded-full border border-olive-900/15 px-4 py-2 text-sm font-semibold text-olive-700 transition hover:bg-olive-900/5"
      >
        Sair
      </button>
    </form>
  );

  return (
    <main className="min-h-screen">
      <AppHeader rightSlot={logoutButton} mobileRight={logoutButton} />
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-wine-700 text-xs font-semibold tracking-[0.28em] uppercase">
          Área de membros
        </p>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="font-display text-5xl tracking-tight text-olive-900">
              Olá,{" "}
              {serverSummary?.fullName?.split(" ")[0] ??
                email?.split("@")[0] ??
                "membro"}
              .
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
        {/* Ações pendentes após visita — mostradas primeiro quando existem */}
        {apiStatus === "connected" && unrecordedRedemptions.length > 0 ? (
          <section className="mt-10">
            <div className="border-gold-500/30 bg-gold-500/8 rounded-2xl border p-5 sm:p-6">
              <p className="text-wine-700 text-[11px] font-bold tracking-[0.25em] uppercase">
                Após a visita
              </p>
              <h2 className="font-display mt-2 text-2xl text-olive-900 sm:text-3xl">
                {unrecordedRedemptions.length === 1
                  ? "Tem 1 benefício utilizado por completar."
                  : `Tem ${unrecordedRedemptions.length} benefícios utilizados por completar.`}
              </h2>
              <p className="mt-2 text-sm leading-6 text-olive-700">
                Registe o valor poupado e deixe uma avaliação para ajudar outros
                membros.
              </p>
            </div>
            <div className="mt-5 space-y-8">
              {unrecordedRedemptions.map((redemption) => (
                <div key={redemption.id}>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="font-semibold text-olive-900">
                        {redemption.businessName}
                      </p>
                      <p className="text-sm text-olive-600">
                        {redemption.benefitTitle}
                      </p>
                    </div>
                    <p className="text-xs text-olive-600">
                      {new Intl.DateTimeFormat("pt-PT", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(redemption.redeemedAt))}
                    </p>
                  </div>
                  <RecordSavingsForm
                    redemptionId={redemption.id}
                    businessName={redemption.businessName}
                    businessSlug={redemption.businessSlug}
                    onSaved={saveServerRecord}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Resumo e histórico */}
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
        {apiStatus === "loading" ? (
          <p className="mt-10 text-sm text-olive-700">
            A carregar as suas utilizações…
          </p>
        ) : null}
        <div className="mt-10">
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
