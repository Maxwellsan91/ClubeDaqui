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
  business_locations: Array<{
    id?: string;
    address_line_1: string;
    locality: string;
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
          "id,name,slug,description,business_locations(address_line_1,postal_code,locality,latitude,longitude),business_categories(categories(name))",
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
    };
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    try {
      const { data, error } = await this.supabase
        .createPublicClient()
        .from("businesses")
        .select(
          "id,name,slug,description,business_locations(address_line_1,postal_code,locality,latitude,longitude),business_categories(categories(name))",
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
