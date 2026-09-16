import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";

const businesses = [
  {
    id: "almeirim-tasca-bronze",
    name: "A Tasca do Bronze",
    category: "Comer",
    kind: "Restaurante",
    city: "Almeirim",
    address: "Rua de Coruche, 141, 2080-094 Almeirim",
    source: "almeirim.city + OpenStreetMap",
    latitude: 39.2028305,
    longitude: -8.6281241,
    priceRange: "12 € – 35 €",
  },
  {
    id: "fazendas-a-adega",
    name: "A Adega",
    category: "Comer",
    kind: "Restaurante",
    city: "Fazendas de Almeirim",
    address: "2080-562 Fazendas de Almeirim",
    source: "almeirim.city",
    latitude: 39.1767872,
    longitude: -8.5833777,
    priceRange: "15 € – 40 €",
  },
  {
    id: "fazendas-novo-conceito",
    name: "Adega Novo Conceito",
    category: "Comer",
    kind: "Adega",
    city: "Fazendas de Almeirim",
    address: "Rua João de Deus, 80, 2080-576 Fazendas de Almeirim",
    source: "almeirim.city + OpenStreetMap",
    latitude: 39.1791369,
    longitude: -8.5922863,
    priceRange: "15 € – 40 €",
  },
  {
    id: "almeirim-tejo",
    name: "Experiências do Tejo",
    category: "Lazer",
    kind: "Experiência",
    city: "Almeirim",
    address: "Almeirim, Santarém",
    source: "Clube Ribatejo (demo)",
  },
  {
    id: "almeirim-casa-ribatejana",
    name: "Casa Ribatejana",
    category: "Dormir",
    kind: "Alojamento",
    city: "Almeirim",
    address: "Almeirim, Santarém",
    source: "Clube Ribatejo (demo)",
  },
];
type BusinessRecord = {
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

@Controller("businesses")
export class BusinessesController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async list(@Query("category") category?: string, @Query("q") query?: string) {
    try {
      const { data, error } = await this.supabase
        .createPublicClient()
        .from("businesses")
        .select(
          "id,name,slug,description,phone,website_url,instagram,image_url,price_min,price_max,price_currency,business_locations(id,address_line_1,postal_code,locality,phone,latitude,longitude),business_categories(categories(name))",
        )
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      const result = (data as unknown as BusinessRecord[]).map((item) =>
        this.present(item),
      );
      return this.filter(result, category, query);
    } catch {
      return this.filter(businesses, category, query);
    }
  }

  private filter<
    T extends { category: string; name: string; city: string; kind: string },
  >(items: T[], category?: string, query?: string) {
    const normalized = query?.trim().toLowerCase();
    const data = items.filter(
      (item) =>
        (!category || item.category.toLowerCase() === category.toLowerCase()) &&
        (!normalized ||
          `${item.name} ${item.city} ${item.kind}`
            .toLowerCase()
            .includes(normalized)),
    );
    return { data, total: data.length };
  }

  private present(item: BusinessRecord) {
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

  @Get(":slug/reviews")
  async reviews(@Param("slug") slug: string) {
    const client = this.supabase.createPublicClient();
    const { data: biz } = await client
      .from("businesses")
      .select("business_locations(id)")
      .eq("slug", slug)
      .maybeSingle();

    type BizRow = { business_locations: { id: string }[] };
    const locationIds = (
      (biz as unknown as BizRow | null)?.business_locations ?? []
    ).map((l) => l.id);
    if (!locationIds.length)
      return { data: [], avgRating: null, totalCount: 0 };

    const { data: rows } = await client
      .from("reviews")
      .select(
        "id,food_rating,service_rating,ambience_rating,value_rating,comment,published_at,profiles(full_name)",
      )
      .in("business_location_id", locationIds)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(20);

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
    const reviews = (rows ?? []) as unknown as RevRow[];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce(
            (sum, r) =>
              sum +
              (r.food_rating +
                r.service_rating +
                r.ambience_rating +
                r.value_rating) /
                4,
            0,
          ) / reviews.length
        : null;

    return {
      data: reviews.map((r) => ({
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
      })),
      avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
      totalCount: reviews.length,
    };
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    try {
      const { data, error } = await this.supabase
        .createPublicClient()
        .from("businesses")
        .select(
          "id,name,slug,description,phone,website_url,instagram,image_url,price_min,price_max,price_currency,business_locations(id,address_line_1,postal_code,locality,phone,latitude,longitude),business_categories(categories(name))",
        )
        .eq("is_active", true)
        .eq("slug", id)
        .maybeSingle();
      if (error) throw error;
      if (data)
        return { data: this.present(data as unknown as BusinessRecord) };
    } catch {
      /* use demo fallback */
    }
    const business = businesses.find((item) => item.id === id);
    if (!business)
      throw new NotFoundException("Estabelecimento não encontrado");
    return { data: business };
  }
}
