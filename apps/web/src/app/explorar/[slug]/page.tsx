import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ClubBenefitCard } from "@/components/club-benefit-card";
import { RatingDisplay } from "@/components/rating-display";
import { RedeemBenefitButton } from "@/components/redeem-benefit-button";
import ReviewForm from "@/components/review-form";

const details: Record<
  string,
  {
    name: string;
    kind: string;
    city: string;
    address: string;
    description: string;
    image: string;
    businessLocationId?: string;
    coordinates?: [number, number];
  }
> = {
  "a-tasca-do-bronze": {
    name: "A Tasca do Bronze",
    kind: "Restaurante",
    city: "Almeirim",
    address: "Rua de Coruche, 141, 2080-094 Almeirim",
    coordinates: [39.2028305, -8.6281241],
    description:
      "Uma descoberta do nosso roteiro local, selecionada para conhecer melhor os sabores do Ribatejo.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=85",
  },
  "a-adega": {
    name: "A Adega",
    kind: "Restaurante",
    city: "Fazendas de Almeirim",
    address: "2080-562 Fazendas de Almeirim",
    coordinates: [39.1767872, -8.5833777],
    description:
      "Uma morada para descobrir a cozinha portuguesa e a hospitalidade ribatejana.",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=85",
  },
  "adega-novo-conceito": {
    name: "Adega Novo Conceito",
    kind: "Adega",
    city: "Fazendas de Almeirim",
    address: "Rua João de Deus, 80, 2080-576 Fazendas de Almeirim",
    coordinates: [39.1791369, -8.5922863],
    description:
      "Produtos e ambiente com identidade local, no coração do nosso território piloto.",
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1400&q=85",
  },
  "experiências-do-tejo": {
    name: "Experiências do Tejo",
    kind: "Experiência",
    city: "Almeirim",
    address: "Almeirim, Santarém",
    description:
      "Descubra a paisagem, a cultura e o ritmo do Tejo através de experiências locais.",
    image:
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1400&q=85",
  },
  "casa-ribatejana": {
    name: "Casa Ribatejana",
    kind: "Alojamento",
    city: "Almeirim",
    address: "Almeirim, Santarém",
    description:
      "Uma estadia tranquila para explorar Almeirim e tudo o que o Ribatejo tem para oferecer.",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=85",
  },
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let business = details[slug];
  let benefit:
    | { id?: string; title: string; description: string; terms: string }
    | undefined;

  if (apiUrl) {
    try {
      const response = await fetch(`${apiUrl}/api/businesses/${slug}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          data?: {
            name: string;
            kind?: string;
            category?: string;
            city: string;
            address: string;
            description?: string;
            image?: string;
            businessLocationId?: string;
            latitude?: number;
            longitude?: number;
          };
        };
        if (payload.data) {
          business = {
            name: payload.data.name,
            kind: payload.data.kind ?? payload.data.category ?? "Local",
            city: payload.data.city,
            address: payload.data.address,
            description:
              payload.data.description ??
              "Uma descoberta do nosso roteiro local.",
            image:
              payload.data.image ??
              "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=85",
            businessLocationId: payload.data.businessLocationId,
            coordinates:
              payload.data.latitude && payload.data.longitude
                ? [payload.data.latitude, payload.data.longitude]
                : undefined,
          };
          const benefitsRes = await fetch(
            `${apiUrl}/api/businesses/${(payload.data as { id?: string }).id}/benefits`,
            { cache: "no-store" },
          );
          if (benefitsRes.ok) benefit = (await benefitsRes.json()).data?.[0];
        }
      }
    } catch {
      /* keep demo fallback */
    }
  }

  if (!business)
    return (
      <main className="min-h-screen">
        <AppHeader />
        <p className="p-10 text-center text-olive-700">
          Estabelecimento não encontrado.
        </p>
      </main>
    );

  const backLink = (
    <Link
      href="/explorar"
      className="flex items-center gap-1.5 text-sm font-semibold text-olive-700"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Explorar
    </Link>
  );

  const mapsUrl = business.coordinates
    ? `https://www.openstreetmap.org/?mlat=${business.coordinates[0]}&mlon=${business.coordinates[1]}#map=17/${business.coordinates[0]}/${business.coordinates[1]}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name}, ${business.address}`)}`;

  return (
    <main className="min-h-screen">
      <AppHeader rightSlot={backLink} mobileRight={backLink} />

      {/* Hero image */}
      <div
        className="h-56 w-full bg-cover bg-center sm:h-80 lg:h-[400px]"
        style={{ backgroundImage: `url(${business.image})` }}
        role="img"
        aria-label={`Imagem de ${business.name}`}
      />

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* Identity */}
        <div className="pt-7 pb-5 sm:pt-10">
          <p className="text-gold-500 text-xs font-bold tracking-[0.25em] uppercase">
            {business.kind} · {business.city}
          </p>
          <h1 className="font-display mt-3 text-3xl leading-tight tracking-tight text-olive-900 sm:text-5xl">
            {business.name}
          </h1>
          <p className="mt-1 text-sm text-olive-600">{business.address}</p>
          <div className="mt-3">
            <RatingDisplay />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-wine-700 inline-flex min-h-[44px] items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white"
            >
              Como chegar
            </a>
          </div>
        </div>

        {/* Mobile: benefit card + redeem (appears before description on mobile) */}
        <div className="lg:hidden">
          <div className="border-gold-500/30 bg-gold-500/8 rounded-2xl border p-5">
            <p className="text-wine-700 text-[11px] font-bold tracking-[0.22em] uppercase">
              Benefício Clube
            </p>
            <p className="font-display mt-2 text-xl text-olive-900">
              {benefit?.title ?? "Benefício a anunciar"}
            </p>
            {benefit?.description && (
              <p className="mt-1.5 text-sm leading-5 text-olive-700">
                {benefit.description}
              </p>
            )}
            {benefit?.terms && (
              <p className="mt-1 text-xs text-olive-600">{benefit.terms}</p>
            )}
            {!benefit && (
              <Link
                href="/clube"
                className="bg-wine-700 mt-4 inline-flex min-h-[44px] items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              >
                Desbloquear este benefício
              </Link>
            )}
          </div>
          <RedeemBenefitButton
            benefitId={benefit?.id}
            businessLocationId={business.businessLocationId}
            businessName={business.name}
            businessSlug={slug}
          />
        </div>

        {/* Two-column on desktop */}
        <div className="mt-8 grid gap-10 pb-16 lg:grid-cols-[1fr_380px] lg:items-start">
          {/* Left: description + map */}
          <div className="space-y-10">
            <section>
              <p className="text-wine-700 text-[11px] font-bold tracking-[0.22em] uppercase">
                Descoberta local
              </p>
              <h2 className="font-display mt-2 text-2xl text-olive-900 sm:text-3xl">
                Porque visitar
              </h2>
              <p className="mt-3 text-base leading-7 text-olive-700">
                {business.description}
              </p>
            </section>

            {/* Map */}
            {business.coordinates && (
              <section>
                <p className="text-wine-700 text-[11px] font-bold tracking-[0.22em] uppercase">
                  Localização
                </p>
                <div className="mt-3 overflow-hidden rounded-2xl border border-olive-900/10">
                  <iframe
                    title={`Mapa de ${business.name}`}
                    className="h-64 w-full sm:h-80"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${business.coordinates[1] - 0.008}%2C${business.coordinates[0] - 0.005}%2C${business.coordinates[1] + 0.008}%2C${business.coordinates[0] + 0.005}&layer=mapnik&marker=${business.coordinates[0]}%2C${business.coordinates[1]}`}
                  />
                  <p className="px-4 py-2 text-xs text-olive-600">
                    © OpenStreetMap contributors. Localização aproximada.
                  </p>
                </div>
              </section>
            )}

            {/* Review section */}
            <section id="avaliar">
              <p className="text-wine-700 text-[11px] font-bold tracking-[0.22em] uppercase">
                Avaliações
              </p>
              <h2 className="font-display mt-2 text-2xl text-olive-900 sm:text-3xl">
                Partilhe a sua experiência
              </h2>
              <p className="mt-2 text-sm leading-5 text-olive-600">
                A sua avaliação ajuda outros membros a escolher melhor.
              </p>
              <div className="mt-5">
                <ReviewForm businessSlug={slug} businessName={business.name} />
              </div>
            </section>
          </div>

          {/* Right: benefit + practical info (desktop only) */}
          <aside className="hidden space-y-5 lg:block">
            <ClubBenefitCard
              title={benefit?.title}
              description={benefit?.description}
              terms={benefit?.terms}
            />
            <RedeemBenefitButton
              benefitId={benefit?.id}
              businessLocationId={business.businessLocationId}
              businessName={business.name}
              businessSlug={slug}
            />
            <div className="bg-cream-100 rounded-2xl border border-olive-900/10 p-5">
              <p className="text-[11px] font-bold tracking-[0.22em] text-olive-600 uppercase">
                Informações práticas
              </p>
              <dl className="mt-4 space-y-3 text-sm text-olive-700">
                <div className="flex justify-between gap-4">
                  <dt>Localização</dt>
                  <dd className="text-right font-semibold text-olive-900">
                    {business.city}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Morada</dt>
                  <dd className="text-right font-semibold text-olive-900">
                    {business.address}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
