import Link from "next/link";

const details: Record<
  string,
  {
    name: string;
    kind: string;
    city: string;
    address: string;
    description: string;
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
  },
  "a-adega": {
    name: "A Adega",
    kind: "Restaurante",
    city: "Fazendas de Almeirim",
    address: "2080-562 Fazendas de Almeirim",
    coordinates: [39.1767872, -8.5833777],
    description:
      "Uma morada para descobrir a cozinha portuguesa e a hospitalidade ribatejana.",
  },
  "adega-novo-conceito": {
    name: "Adega Novo Conceito",
    kind: "Adega",
    city: "Fazendas de Almeirim",
    address: "Rua João de Deus, 80, 2080-576 Fazendas de Almeirim",
    coordinates: [39.1791369, -8.5922863],
    description:
      "Produtos e ambiente com identidade local, no coração do nosso território piloto.",
  },
  "experiências-do-tejo": {
    name: "Experiências do Tejo",
    kind: "Experiência",
    city: "Almeirim",
    address: "Almeirim, Santarém",
    description:
      "Descubra a paisagem, a cultura e o ritmo do Tejo através de experiências locais.",
  },
  "casa-ribatejana": {
    name: "Casa Ribatejana",
    kind: "Alojamento",
    city: "Almeirim",
    address: "Almeirim, Santarém",
    description:
      "Uma estadia tranquila para explorar Almeirim e tudo o que o Ribatejo tem para oferecer.",
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
      <section className="mx-auto max-w-4xl py-24">
        <p className="text-gold-500 text-xs font-semibold tracking-[0.28em] uppercase">
          {business.kind} · {business.city}
        </p>
        <h1 className="font-display mt-6 text-6xl tracking-tight text-olive-900">
          {business.name}
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-olive-700">
          {business.description}
        </p>
        <p className="text-wine-700 mt-5 text-sm font-semibold">
          {business.address}
        </p>
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
        <div className="text-cream-50 mt-12 rounded-3xl bg-olive-900 p-8">
          <p className="font-display text-2xl">
            {benefit?.title ?? "Em breve, um benefício exclusivo neste local."}
          </p>
          <p className="text-cream-100/70 mt-3 text-sm">
            {benefit?.description ??
              "Estamos a falar com os primeiros parceiros de Almeirim."}
          </p>
          {benefit?.terms && (
            <p className="text-cream-100/70 mt-3 text-sm">{benefit.terms}</p>
          )}
          <p className="text-cream-100/70 mt-3 text-sm">
            O Clube Ribatejo está a criar uma experiência local de benefícios,
            pensada para membros e parceiros da nossa região.
          </p>
          <button className="bg-gold-500 mt-7 rounded-full px-5 py-3 text-sm font-semibold text-olive-900">
            Quero saber mais
          </button>
        </div>
      </section>
    </main>
  );
}
