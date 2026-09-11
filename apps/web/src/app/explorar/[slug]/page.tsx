import Link from "next/link";
import { ClubBenefitCard } from "@/components/club-benefit-card";
import { RatingDisplay } from "@/components/rating-display";
import { SectionHeader } from "@/components/section-header";

const details: Record<
  string,
  {
    name: string;
    kind: string;
    city: string;
    address: string;
    description: string;
    image: string;
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
    { title: string; description: string; terms: string } | undefined;
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
            coordinates:
              payload.data.latitude && payload.data.longitude
                ? [payload.data.latitude, payload.data.longitude]
                : undefined,
          };
          const benefitsResponse = await fetch(
            `${apiUrl}/api/businesses/${(payload.data as { id?: string }).id}/benefits`,
            { cache: "no-store" },
          );
          if (benefitsResponse.ok)
            benefit = (await benefitsResponse.json()).data?.[0];
        }
      }
    } catch {
      /* keep demo fallback */
    }
  }
  if (!business)
    return <main className="p-10">Estabelecimento não encontrado.</main>;
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
      <section className="mx-auto max-w-5xl py-12 sm:py-20">
        <div
          className="h-64 rounded-3xl bg-cover bg-center sm:h-96"
          style={{ backgroundImage: `url(${business.image})` }}
          role="img"
          aria-label={`Imagem ilustrativa de ${business.name}`}
        />
        <div className="mt-10">
          <p className="text-gold-500 text-xs font-semibold tracking-[0.28em] uppercase">
            {business.kind} · {business.city}
          </p>
          <h1 className="font-display mt-6 text-5xl tracking-tight text-olive-900 sm:text-6xl">
            {business.name}
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-olive-700">
            {business.description}
          </p>
          <p className="text-wine-700 mt-5 text-sm font-semibold">
            {business.address}
          </p>
          <div className="mt-5">
            <RatingDisplay />
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={
                business.coordinates
                  ? `https://www.openstreetmap.org/?mlat=${business.coordinates[0]}&mlon=${business.coordinates[1]}#map=17/${business.coordinates[0]}/${business.coordinates[1]}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name}, ${business.address}`)}`
              }
              target="_blank"
              rel="noreferrer"
              className="bg-wine-700 inline-flex min-h-11 items-center rounded-full px-5 py-3 text-sm font-semibold text-white"
            >
              Como chegar
            </a>
            <button
              type="button"
              className="min-h-11 rounded-full border border-olive-900/20 px-5 py-3 text-sm font-semibold text-olive-900"
            >
              ♡ Favorito
            </button>
          </div>
        </div>
        <div className="mt-16 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-12">
            <section>
              <SectionHeader
                eyebrow="Descoberta local"
                title="Porque visitar"
              />
              <p className="mt-4 text-base leading-8 text-olive-700">
                {business.description}
              </p>
            </section>
            <section>
              <SectionHeader title="O que pedir" />
              <p className="mt-4 text-sm text-olive-600">
                Informação a ser adicionada pelo estabelecimento.
              </p>
            </section>
            <section>
              <SectionHeader title="Avaliações verificadas" />
              <div className="mt-4 rounded-2xl border border-dashed border-olive-900/20 p-6">
                <RatingDisplay />
                <p className="mt-2 text-sm text-olive-700">
                  Ainda não existem avaliações verificadas.
                </p>
              </div>
            </section>
          </div>
          <aside className="space-y-6">
            <ClubBenefitCard
              title={benefit?.title}
              description={benefit?.description}
              terms={benefit?.terms}
            />
            <section className="bg-cream-100 rounded-2xl border border-olive-900/10 p-6">
              <SectionHeader title="Informações práticas" />
              <dl className="mt-5 space-y-3 text-sm text-olive-700">
                <div className="flex justify-between gap-4">
                  <dt>Localização</dt>
                  <dd className="text-right font-semibold">{business.city}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Morada</dt>
                  <dd className="text-right font-semibold">
                    {business.address}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Preço médio</dt>
                  <dd className="text-right">Informação a adicionar</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
        {business.coordinates && (
          <div className="mt-10 overflow-hidden rounded-3xl border border-olive-900/10">
            <iframe
              title={`Mapa de ${business.name}`}
              className="h-80 w-full"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${business.coordinates[1] - 0.008}%2C${business.coordinates[0] - 0.005}%2C${business.coordinates[1] + 0.008}%2C${business.coordinates[0] + 0.005}&layer=mapnik&marker=${business.coordinates[0]}%2C${business.coordinates[1]}`}
            />
            <p className="p-4 text-xs text-olive-700">
              Mapa: © OpenStreetMap contributors. Localização aproximada.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
