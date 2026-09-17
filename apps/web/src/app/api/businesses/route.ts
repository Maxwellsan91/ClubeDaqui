import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BusinessRow = {
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
  price_currency: string | null;
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

const STATIC_BUSINESSES = [
  {
    id: "almeirim-tasca-bronze",
    slug: "a-tasca-do-bronze",
    name: "A Tasca do Bronze",
    category: "Comer",
    kind: "Restaurante",
    city: "Almeirim",
    address: "Rua de Coruche, 141, 2080-094 Almeirim",
    latitude: 39.2028305,
    longitude: -8.6281241,
    priceRange: "12 € – 35 €",
    description: null,
    phone: null,
    website: null,
    instagram: null,
    imageUrl: null,
    businessLocationId: undefined,
  },
  {
    id: "fazendas-a-adega",
    slug: "a-adega",
    name: "A Adega",
    category: "Comer",
    kind: "Restaurante",
    city: "Fazendas de Almeirim",
    address: "2080-562 Fazendas de Almeirim",
    latitude: 39.1767872,
    longitude: -8.5833777,
    priceRange: "15 € – 40 €",
    description: null,
    phone: null,
    website: null,
    instagram: null,
    imageUrl: null,
    businessLocationId: undefined,
  },
  {
    id: "fazendas-novo-conceito",
    slug: "adega-novo-conceito",
    name: "Adega Novo Conceito",
    category: "Comer",
    kind: "Adega",
    city: "Fazendas de Almeirim",
    address: "Rua João de Deus, 80, 2080-576 Fazendas de Almeirim",
    latitude: 39.1791369,
    longitude: -8.5922863,
    priceRange: "15 € – 40 €",
    description: null,
    phone: null,
    website: null,
    instagram: null,
    imageUrl: null,
    businessLocationId: undefined,
  },
  {
    id: "almeirim-tejo",
    slug: "experiências-do-tejo",
    name: "Experiências do Tejo",
    category: "Lazer",
    kind: "Experiência",
    city: "Almeirim",
    address: "Almeirim, Santarém",
    latitude: 39.2086,
    longitude: -8.6267,
    priceRange: null,
    description: null,
    phone: null,
    website: null,
    instagram: null,
    imageUrl: null,
    businessLocationId: undefined,
  },
  {
    id: "almeirim-casa-ribatejana",
    slug: "casa-ribatejana",
    name: "Casa Ribatejana",
    category: "Dormir",
    kind: "Alojamento",
    city: "Almeirim",
    address: "Almeirim, Santarém",
    latitude: 39.2051,
    longitude: -8.6242,
    priceRange: null,
    description: null,
    phone: null,
    website: null,
    instagram: null,
    imageUrl: null,
    businessLocationId: undefined,
  },
];

function presentBusiness(item: BusinessRow) {
  const location = item.business_locations?.[0];
  const category = item.business_categories?.[0]?.categories?.name ?? "";
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    category,
    kind: category,
    city: location?.locality ?? "",
    address: location?.address_line_1 ?? "",
    businessLocationId: location?.id,
    latitude: location?.latitude,
    longitude: location?.longitude,
    description: item.description,
    phone: item.phone ?? location?.phone ?? null,
    website: item.website_url ?? null,
    instagram: item.instagram ?? null,
    imageUrl: item.image_url ?? null,
    priceRange:
      item.price_min !== null && item.price_max !== null
        ? `${item.price_min} € – ${item.price_max} €`
        : null,
  };
}

type PresentedBusiness = ReturnType<typeof presentBusiness>;
type StaticBusiness = (typeof STATIC_BUSINESSES)[0];

function filterItems<
  T extends { category: string; name: string; city: string; kind: string },
>(items: T[], category?: string | null, q?: string | null): T[] {
  const normalized = q?.trim().toLowerCase();
  return items.filter(
    (item) =>
      (!category || item.category.toLowerCase() === category.toLowerCase()) &&
      (!normalized ||
        `${item.name} ${item.city} ${item.kind}`
          .toLowerCase()
          .includes(normalized)),
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("businesses")
      .select(
        "id,name,slug,description,phone,website_url,instagram,image_url,price_min,price_max,price_currency,business_locations(id,address_line_1,postal_code,locality,phone,latitude,longitude),business_categories(categories(name))",
      )
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    const presented = (data as unknown as BusinessRow[]).map(presentBusiness);
    const filtered = filterItems<PresentedBusiness>(presented, category, q);
    return Response.json({ data: filtered, total: filtered.length });
  } catch {
    const filtered = filterItems<StaticBusiness>(
      STATIC_BUSINESSES,
      category,
      q,
    );
    return Response.json({ data: filtered, total: filtered.length });
  }
}
