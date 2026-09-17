import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ClubBenefitCard } from "@/components/club-benefit-card";
import { RatingDisplay } from "@/components/rating-display";
import { RedeemBenefitButton } from "@/components/redeem-benefit-button";
import { StickyRedeemBar } from "@/components/sticky-redeem-bar";
import { ExploreGoogleMap } from "@/components/explore-google-map";
import { createClient } from "@/lib/supabase/server";

const AVATAR_COLORS = [
  "#743b40",
  "#5a6e5c",
  "#b58b4a",
  "#243029",
  "#425044",
  "#6b4226",
];
function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const DAYS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DAYS_FULL = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

type DayHours = {
  day: number; // 0=Seg … 6=Dom
  time: string; // e.g. "11:30–16:00" | "Fechado"
};

type BusinessDetail = {
  name: string;
  kind: string;
  city: string;
  address: string;
  description: string;
  image: string;
  businessLocationId?: string;
  coordinates?: [number, number];
  instagram?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  priceRange?: string | null;
};

type Benefit = {
  id?: string;
  title: string;
  description: string;
  terms: string;
  rules?: string[];
  validDays?: number[];
  schedule?: DayHours[]; // replaces old hours[]
  hours?: { label: string; time: string }[]; // legacy compat
};

const details: Record<string, BusinessDetail> = {
  "a-tasca-do-bronze": {
    name: "A Tasca do Bronze",
    kind: "Restaurante",
    city: "Almeirim",
    address: "Rua de Coruche, 141, 2080-094 Almeirim",
    coordinates: [39.2028305, -8.6281241],
    priceRange: "12 € – 35 €",
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
    priceRange: "15 € – 40 €",
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
    priceRange: "15 € – 40 €",
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
    coordinates: [39.2086, -8.6267],
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
    coordinates: [39.2051, -8.6242],
    description:
      "Uma estadia tranquila para explorar Almeirim e tudo o que o Ribatejo tem para oferecer.",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=85",
  },
};

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  let business: BusinessDetail | undefined = details[slug];
  let benefit: Benefit | undefined;
  type ReviewItem = {
    id: string;
    rating: number;
    comment: string | null;
    publishedAt: string;
    reviewerName: string;
  };
  let reviews: ReviewItem[] = [];
  let avgRating: number | null = null;

  // Query Supabase directly — server component, no HTTP round-trip needed
  try {
    type BizRow = {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      phone: string | null;
      website_url: string | null;
      instagram: string | null;
      image_url: string | null;
      price_min: number | null;
      price_max: number | null;
      business_locations: Array<{
        id?: string;
        address_line_1: string;
        locality: string;
        phone: string | null;
        latitude: number | null;
        longitude: number | null;
      }>;
      business_categories: Array<{ categories: { name: string } | null }>;
    };
    const { data: bizData } = await supabase
      .from("businesses")
      .select(
        "id,name,slug,description,phone,website_url,instagram,image_url,price_min,price_max,business_locations(id,address_line_1,locality,phone,latitude,longitude),business_categories(categories(name))",
      )
      .eq("is_active", true)
      .eq("slug", slug)
      .maybeSingle();

    if (bizData) {
      const d = bizData as unknown as BizRow;
      const loc = d.business_locations?.[0];
      const cat = d.business_categories?.[0]?.categories?.name ?? "Local";
      business = {
        name: d.name,
        kind: cat,
        city: loc?.locality ?? "",
        address: loc?.address_line_1 ?? "",
        description: d.description ?? "Uma descoberta do nosso roteiro local.",
        image:
          d.image_url ??
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=85",
        businessLocationId: loc?.id,
        coordinates:
          loc?.latitude && loc?.longitude
            ? [loc.latitude, loc.longitude]
            : undefined,
        instagram: d.instagram ?? undefined,
        phone: d.phone ?? loc?.phone ?? undefined,
        website: d.website_url ?? undefined,
        priceRange:
          d.price_min !== null && d.price_max !== null
            ? `${d.price_min} € – ${d.price_max} €`
            : undefined,
      };

      // Fetch benefits for this business
      try {
        type BenRuleRow = {
          allowed_weekdays: number[];
          starts_at: string | null;
          ends_at: string | null;
          reservation_required: boolean;
          membership_cycle_limit: number;
        };
        type BenRow = {
          id: string;
          title: string;
          description: string | null;
          terms: string | null;
          type: string;
          valid_from: string | null;
          valid_until: string | null;
          benefit_rules: BenRuleRow | null;
        };
        const { data: benefitsData } = await supabase
          .from("benefits")
          .select(
            "id,title,description,terms,type,valid_from,valid_until,benefit_rules(allowed_weekdays,starts_at,ends_at,reservation_required,membership_cycle_limit)",
          )
          .eq("business_id", d.id)
          .eq("is_active", true);
        const firstBenefit = (benefitsData as unknown as BenRow[] | null)?.[0];
        if (firstBenefit) {
          const rules = firstBenefit.benefit_rules;
          const pgDowToFrontend = (dow: number) => (dow + 6) % 7;
          const schedule = rules?.allowed_weekdays
            ? rules.allowed_weekdays
                .map((pgDow) => ({
                  day: pgDowToFrontend(pgDow),
                  time:
                    rules.starts_at && rules.ends_at
                      ? `${rules.starts_at.slice(0, 5)}–${rules.ends_at.slice(0, 5)}`
                      : "Consulte o estabelecimento",
                }))
                .sort((a, b) => a.day - b.day)
            : [];
          benefit = {
            id: firstBenefit.id,
            title: firstBenefit.title,
            description: firstBenefit.description ?? "",
            terms: firstBenefit.terms ?? "",
            schedule,
            validDays: rules?.allowed_weekdays
              ? rules.allowed_weekdays.map(pgDowToFrontend).sort()
              : [],
          };
        }
      } catch {
        /* keep no benefit */
      }

      // Fetch reviews
      try {
        const locationIds = d.business_locations
          .map((l) => l.id)
          .filter(Boolean) as string[];
        if (locationIds.length) {
          type RevRow = {
            id: string;
            food_rating: number;
            service_rating: number;
            ambience_rating: number;
            value_rating: number;
            comment: string | null;
            published_at: string;
            profiles: { full_name: string | null } | null;
          };
          const { data: revData } = await supabase
            .from("reviews")
            .select(
              "id,food_rating,service_rating,ambience_rating,value_rating,comment,published_at,profiles(full_name)",
            )
            .in("business_location_id", locationIds)
            .eq("status", "published")
            .order("published_at", { ascending: false })
            .limit(20);
          const revRows = (revData ?? []) as unknown as RevRow[];
          reviews = revRows.map((r) => ({
            id: r.id,
            rating:
              Math.round(
                ((r.food_rating +
                  r.service_rating +
                  r.ambience_rating +
                  r.value_rating) /
                  4) *
                  10,
              ) / 10,
            comment: r.comment,
            publishedAt: r.published_at,
            reviewerName: r.profiles?.full_name ?? "Membro do Clube",
          }));
          avgRating =
            revRows.length > 0
              ? Math.round(
                  (revRows.reduce(
                    (sum, r) =>
                      sum +
                      (r.food_rating +
                        r.service_rating +
                        r.ambience_rating +
                        r.value_rating) /
                        4,
                    0,
                  ) /
                    revRows.length) *
                    10,
                ) / 10
              : null;
        }
      } catch {
        /* silent */
      }
    }
  } catch {
    /* keep demo fallback */
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
    ? `https://www.google.com/maps/dir/?api=1&destination=${business.coordinates[0]},${business.coordinates[1]}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name}, ${business.address}`)}`;

  const color = avatarColor(business.name);
  const ini = initials(business.name);

  // Parse rules from terms (newline-separated or as-is)
  const rules: string[] =
    benefit?.rules ??
    (benefit?.terms
      ? benefit.terms
          .split(/\n|•|;/)
          .map((r) => r.trim())
          .filter(Boolean)
      : []);

  // Build schedule: prefer benefit.schedule, fall back to legacy benefit.hours
  const schedule: DayHours[] =
    benefit?.schedule ??
    (benefit?.hours
      ? benefit.hours.map((h, i) => ({ day: i, time: h.time }))
      : []);

  // Set of open day indices for the chip grid
  const openDays = new Set(schedule.map((s) => s.day));

  // Valid days from benefit (0=Mon … 6=Sun), or empty
  const validDays: number[] = benefit?.validDays ?? [];

  return (
    <main className="min-h-screen pb-36 sm:pb-24 lg:pb-0">
      <AppHeader rightSlot={backLink} mobileRight={backLink} />

      {/* Hero image */}
      <div
        className="h-52 w-full bg-cover bg-center sm:h-72 lg:h-[360px]"
        style={{ backgroundImage: `url(${business.image})` }}
        role="img"
        aria-label={`Imagem de ${business.name}`}
      />

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* Identity */}
        <div className="pt-6 pb-5 sm:pt-8">
          {/* Avatar + meta */}
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white shadow-sm"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            >
              {ini}
            </div>
            <div className="min-w-0">
              <p className="text-gold-500 text-[11px] font-bold tracking-[0.25em] uppercase">
                {business.kind} · {business.city}
              </p>
              <h1 className="font-display mt-1 text-2xl leading-tight tracking-tight text-olive-900 sm:text-4xl">
                {business.name}
              </h1>
              <p className="mt-0.5 text-xs text-olive-600">
                {business.address}
              </p>
            </div>
          </div>

          {/* Rating row */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <RatingDisplay
              rating={avgRating}
              reviewCount={reviews.length || null}
            />
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-wine-700 inline-flex min-h-[40px] items-center rounded-full px-5 py-2 text-sm font-semibold text-white"
            >
              Como chegar
            </a>
            {business.priceRange && (
              <span className="rounded-full bg-olive-900/8 px-4 py-2 text-sm font-semibold text-olive-700">
                {business.priceRange} por pessoa
              </span>
            )}
          </div>
        </div>

        {/* Benefit banner — mobile (above grid) */}
        {benefit && (
          <div className="border-gold-500/30 bg-gold-500/8 mb-6 rounded-2xl border p-5 lg:hidden">
            <p className="text-wine-700 text-[11px] font-bold tracking-[0.22em] uppercase">
              Benefício Clube
            </p>
            <p className="font-display mt-1.5 text-xl text-olive-900">
              {benefit.title}
            </p>
            {benefit.description && (
              <p className="mt-1 text-sm leading-5 text-olive-700">
                {benefit.description}
              </p>
            )}
          </div>
        )}

        {/* Two-column on desktop */}
        <div className="grid gap-10 pb-16 lg:grid-cols-[1fr_360px] lg:items-start">
          {/* Left column */}
          <div className="space-y-10">
            {/* Description */}
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

            {/* Usage rules */}
            {rules.length > 0 && (
              <section>
                <p className="text-wine-700 text-[11px] font-bold tracking-[0.22em] uppercase">
                  Condições
                </p>
                <h2 className="font-display mt-2 text-2xl text-olive-900 sm:text-3xl">
                  Regras de utilização
                </h2>
                <ul className="mt-4 space-y-3">
                  {rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="bg-gold-500/15 text-gold-500 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                        ✓
                      </span>
                      <p className="text-sm leading-6 text-olive-700">{rule}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Operating hours + valid days combined — shows when either exists */}
            {(schedule.length > 0 || validDays.length > 0) && (
              <section>
                <p className="text-wine-700 text-[11px] font-bold tracking-[0.22em] uppercase">
                  O que precisa saber
                </p>
                <h2 className="font-display mt-2 text-2xl text-olive-900 sm:text-3xl">
                  Horários de funcionamento
                </h2>

                {/* Day chips grid — open=green dot, closed=gray */}
                <div className="mt-5 flex gap-2">
                  {DAYS_PT.map((abbr, idx) => {
                    const isOpen = openDays.has(idx);
                    const isBenefitDay =
                      validDays.length === 0 || validDays.includes(idx);
                    return (
                      <div
                        key={abbr}
                        className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl py-2 text-[11px] font-semibold ${
                          isOpen
                            ? "bg-olive-900/8 text-olive-900"
                            : "bg-olive-900/4 text-olive-400"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isOpen && isBenefitDay
                              ? "bg-olive-700"
                              : isOpen
                                ? "bg-gold-500"
                                : "bg-olive-900/15"
                          }`}
                        />
                        {abbr}
                      </div>
                    );
                  })}
                </div>

                {/* Time table */}
                {schedule.length > 0 && (
                  <div className="bg-cream-100 mt-3 divide-y divide-olive-900/8 overflow-hidden rounded-2xl border border-olive-900/10">
                    {DAYS_FULL.map((fullDay, idx) => {
                      const entry = schedule.find((s) => s.day === idx);
                      if (!entry) return null;
                      return (
                        <div
                          key={fullDay}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <p className="text-sm font-medium text-olive-900">
                            {fullDay}
                          </p>
                          <p className="text-sm text-olive-600">{entry.time}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Benefit valid days note */}
                {validDays.length > 0 && (
                  <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-olive-600">
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-olive-700" />
                    Benefício disponível:{" "}
                    {validDays.map((d) => DAYS_FULL[d]).join(", ")}
                  </p>
                )}
              </section>
            )}

            {/* How to use */}
            <section>
              <p className="text-wine-700 text-[11px] font-bold tracking-[0.22em] uppercase">
                Passo a passo
              </p>
              <h2 className="font-display mt-2 text-2xl text-olive-900 sm:text-3xl">
                Como utilizar esta oferta
              </h2>
              <ol className="mt-4 space-y-4">
                {[
                  {
                    step: "1",
                    title: "Visite o estabelecimento",
                    body: "Dirija-se ao local e informe que é membro do Clube Daqui.",
                  },
                  {
                    step: "2",
                    title: "Gere o código",
                    body: 'Toque em "Usar benefício" e apresente o código de 6 dígitos ao parceiro.',
                  },
                  {
                    step: "3",
                    title: "O parceiro confirma",
                    body: "O estabelecimento introduz o código no seu dispositivo para validar a utilização.",
                  },
                  {
                    step: "4",
                    title: "Registe a sua poupança",
                    body: "Após a visita, insira o valor da fatura e o desconto obtido para acompanhar as suas economias.",
                  },
                ].map((item) => (
                  <li key={item.step} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-olive-900 text-sm font-bold text-white">
                      {item.step}
                    </span>
                    <div>
                      <p className="font-semibold text-olive-900">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm leading-6 text-olive-700">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* Mais informações */}
            {(business.instagram ||
              business.phone ||
              business.whatsapp ||
              business.website) && (
              <section>
                <p className="text-wine-700 text-[11px] font-bold tracking-[0.22em] uppercase">
                  Contacto
                </p>
                <h2 className="font-display mt-2 text-2xl text-olive-900 sm:text-3xl">
                  Mais informações
                </h2>
                <div className="bg-cream-100 mt-4 divide-y divide-olive-900/8 overflow-hidden rounded-2xl border border-olive-900/10">
                  {business.instagram && (
                    <a
                      href={`https://instagram.com/${business.instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-olive-900/5"
                    >
                      {/* Instagram icon */}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-olive-700"
                        aria-hidden="true"
                      >
                        <rect
                          x="2"
                          y="2"
                          width="20"
                          height="20"
                          rx="5"
                          ry="5"
                        />
                        <circle cx="12" cy="12" r="4" />
                        <circle
                          cx="17.5"
                          cy="6.5"
                          r="1"
                          fill="currentColor"
                          stroke="none"
                        />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-olive-500">Instagram</p>
                        <p className="truncate text-sm font-medium text-olive-900">
                          @{business.instagram.replace(/^@/, "")}
                        </p>
                      </div>
                      <svg
                        width="14"
                        height="14"
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
                    </a>
                  )}
                  {business.phone && (
                    <a
                      href={`tel:${business.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-olive-900/5"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-olive-700"
                        aria-hidden="true"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.57a16 16 0 0 0 6.52 6.52l.93-.93a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-olive-500">Telefone</p>
                        <p className="truncate text-sm font-medium text-olive-900">
                          {business.phone}
                        </p>
                      </div>
                      <svg
                        width="14"
                        height="14"
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
                    </a>
                  )}
                  {business.whatsapp && (
                    <a
                      href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-olive-900/5"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="shrink-0 text-olive-700"
                        aria-hidden="true"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-olive-500">WhatsApp</p>
                        <p className="truncate text-sm font-medium text-olive-900">
                          {business.whatsapp}
                        </p>
                      </div>
                      <svg
                        width="14"
                        height="14"
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
                    </a>
                  )}
                  {business.website && (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-olive-900/5"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-olive-700"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-olive-500">Website</p>
                        <p className="truncate text-sm font-medium text-olive-900">
                          {business.website.replace(/^https?:\/\//, "")}
                        </p>
                      </div>
                      <svg
                        width="14"
                        height="14"
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
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Map */}
            {business.coordinates && (
              <section>
                <p className="text-wine-700 text-[11px] font-bold tracking-[0.22em] uppercase">
                  Localização
                </p>
                <div className="mt-3 overflow-hidden rounded-2xl border border-olive-900/10">
                  <div className="relative h-64 sm:h-80">
                    <ExploreGoogleMap
                      places={[
                        {
                          slug,
                          name: business.name,
                          category: business.kind,
                          kind: business.kind,
                          city: business.city,
                          image: business.image,
                          coordinates: business.coordinates,
                        },
                      ]}
                      center={business.coordinates}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 bg-[#111111] px-4 py-3 text-white">
                    <p className="text-xs text-white/70">
                      Localização do parceiro
                    </p>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-white px-4 py-2 text-xs font-bold text-olive-900"
                    >
                      Abrir no Google Maps
                    </a>
                  </div>
                </div>
              </section>
            )}

            {/* Review section */}
            <section id="avaliar">
              <p className="text-wine-700 text-[11px] font-bold tracking-[0.22em] uppercase">
                Avaliações
              </p>
              <h2 className="font-display mt-2 text-2xl text-olive-900 sm:text-3xl">
                O que dizem os membros
              </h2>

              {reviews.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {/* Avg rating summary */}
                  {avgRating !== null && (
                    <div className="bg-cream-50 flex items-center gap-3 rounded-xl border border-olive-900/10 px-4 py-3">
                      <span className="font-display text-4xl font-bold text-olive-900">
                        {avgRating.toFixed(1)}
                      </span>
                      <div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              className={`text-lg ${Math.round(avgRating) >= s ? "text-gold-500" : "text-olive-900/15"}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-olive-500">
                          {reviews.length} avaliação
                          {reviews.length !== 1 ? "ões" : ""}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Review list */}
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-olive-900/8 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-olive-900">
                            {r.reviewerName}
                          </p>
                          <div className="mt-0.5 flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span
                                key={s}
                                className={`text-sm ${Math.round(r.rating) >= s ? "text-gold-500" : "text-olive-900/15"}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="shrink-0 text-xs text-olive-400">
                          {new Intl.DateTimeFormat("pt-PT", {
                            month: "short",
                            year: "numeric",
                          }).format(new Date(r.publishedAt))}
                        </p>
                      </div>
                      {r.comment && (
                        <p className="mt-2 text-sm leading-5 text-olive-700">
                          {r.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-cream-50 mt-5 rounded-xl border border-olive-900/10 px-5 py-8 text-center">
                  <p className="text-sm text-olive-600">
                    Ainda não há avaliações. Seja o primeiro a partilhar a sua
                    experiência após usar um benefício do Clube.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right column — desktop only */}
          <aside className="hidden space-y-5 lg:block">
            <ClubBenefitCard
              title={benefit?.title}
              description={benefit?.description}
              terms={benefit?.terms}
              hideCta={isAuthenticated}
            />
            <RedeemBenefitButton
              benefitId={benefit?.id}
              businessLocationId={business.businessLocationId}
              businessName={business.name}
              businessSlug={slug}
            />

            {/* Rules — desktop sidebar */}
            {rules.length > 0 && (
              <div className="bg-cream-100 rounded-2xl border border-olive-900/10 p-5">
                <p className="text-[11px] font-bold tracking-[0.22em] text-olive-600 uppercase">
                  Regras de utilização
                </p>
                <ul className="mt-3 space-y-2">
                  {rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-gold-500 mt-0.5 shrink-0">✓</span>
                      <span className="leading-5 text-olive-700">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hours — desktop sidebar */}
            {schedule.length > 0 && (
              <div className="bg-cream-100 rounded-2xl border border-olive-900/10 p-5">
                <p className="text-[11px] font-bold tracking-[0.22em] text-olive-600 uppercase">
                  Horários
                </p>
                {/* Day chip row */}
                <div className="mt-3 flex gap-1">
                  {DAYS_PT.map((abbr, idx) => (
                    <div
                      key={abbr}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold ${
                        openDays.has(idx)
                          ? "bg-olive-900/8 text-olive-900"
                          : "bg-olive-900/4 text-olive-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${openDays.has(idx) ? "bg-olive-700" : "bg-olive-900/15"}`}
                      />
                      {abbr}
                    </div>
                  ))}
                </div>
                <div className="mt-2 divide-y divide-olive-900/8">
                  {DAYS_FULL.map((fullDay, idx) => {
                    const entry = schedule.find((s) => s.day === idx);
                    if (!entry) return null;
                    return (
                      <div
                        key={fullDay}
                        className="flex justify-between py-2 text-sm"
                      >
                        <span className="text-olive-700">{fullDay}</span>
                        <span className="font-medium text-olive-900">
                          {entry.time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mais informações — desktop sidebar */}
            {(business.instagram ||
              business.phone ||
              business.whatsapp ||
              business.website) && (
              <div className="bg-cream-100 overflow-hidden rounded-2xl border border-olive-900/10">
                <p className="px-5 pt-5 pb-2 text-[11px] font-bold tracking-[0.22em] text-olive-600 uppercase">
                  Mais informações
                </p>
                <div className="divide-y divide-olive-900/8">
                  {business.instagram && (
                    <a
                      href={`https://instagram.com/${business.instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-olive-900/5"
                    >
                      <span className="text-olive-700">Instagram</span>
                      <span className="ml-auto truncate font-medium text-olive-900">
                        @{business.instagram.replace(/^@/, "")}
                      </span>
                    </a>
                  )}
                  {business.phone && (
                    <a
                      href={`tel:${business.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-olive-900/5"
                    >
                      <span className="text-olive-700">Telefone</span>
                      <span className="ml-auto font-medium text-olive-900">
                        {business.phone}
                      </span>
                    </a>
                  )}
                  {business.whatsapp && (
                    <a
                      href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-olive-900/5"
                    >
                      <span className="text-olive-700">WhatsApp</span>
                      <span className="ml-auto font-medium text-olive-900">
                        {business.whatsapp}
                      </span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Practical info */}
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

      {/* Sticky bottom bar — mobile only */}
      <StickyRedeemBar
        benefitId={benefit?.id}
        businessLocationId={business.businessLocationId}
        businessName={business.name}
        businessSlug={slug}
        isAuthenticated={isAuthenticated}
      />
    </main>
  );
}
