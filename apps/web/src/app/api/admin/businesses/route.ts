import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if ((profile as { role?: string } | null)?.role !== "ADMIN") return null;
  return user;
}

export async function GET() {
  const user = await checkAdmin();
  if (!user) return Response.json({ message: "Forbidden" }, { status: 403 });

  try {
    const db = createAdminClient();

    const [{ data: businesses, error }, { data: benefits }, { data: redemptions }] =
      await Promise.all([
        db
          .from("businesses")
          .select(
            "id,name,slug,is_active,business_locations(locality),business_categories(categories(name))",
          )
          .order("name"),
        db.from("benefits").select("id,business_id,is_active"),
        db
          .from("redemptions")
          .select("id,business_location_id,business_locations(business_id)")
          .eq("status", "CONFIRMED"),
      ]);

    if (error) return Response.json({ data: [], total: 0 });

    const benefitMap = new Map<string, number>();
    for (const b of (benefits ?? []) as { business_id: string; is_active: boolean }[]) {
      if (b.is_active)
        benefitMap.set(b.business_id, (benefitMap.get(b.business_id) ?? 0) + 1);
    }

    const redemptionMap = new Map<string, number>();
    for (const r of (redemptions ?? []) as unknown as {
      business_locations: { business_id: string } | null;
    }[]) {
      const bid = r.business_locations?.business_id;
      if (bid) redemptionMap.set(bid, (redemptionMap.get(bid) ?? 0) + 1);
    }

    type BusinessRow = {
      id: string;
      name: string;
      slug: string;
      is_active: boolean;
      business_locations: Array<{ locality: string }>;
      business_categories: Array<{ categories: { name: string } | null }>;
    };

    const presented = ((businesses ?? []) as unknown as BusinessRow[]).map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      isActive: b.is_active,
      city: b.business_locations?.[0]?.locality ?? "—",
      category: b.business_categories?.[0]?.categories?.name ?? "—",
      activeBenefits: benefitMap.get(b.id) ?? 0,
      redemptionsCount: redemptionMap.get(b.id) ?? 0,
    }));

    return Response.json({ data: presented, total: presented.length });
  } catch {
    return Response.json({ data: [], total: 0 });
  }
}

export async function POST(request: Request) {
  const user = await checkAdmin();
  if (!user) return Response.json({ message: "Forbidden" }, { status: 403 });

  const body = (await request.json()) as {
    name?: string;
    slug?: string;
    description?: string;
    categorySlug?: string;
  };

  const { name, slug, description, categorySlug } = body;
  if (!name || !slug) return Response.json({ error: "name e slug são obrigatórios" });

  try {
    const db = createAdminClient();
    const { data: business, error } = await db
      .from("businesses")
      .insert({ name, slug, description: description ?? null, is_active: true })
      .select("id,name,slug")
      .single();
    if (error) return Response.json({ error: error.message });

    if (categorySlug) {
      const { data: category } = await db
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle();
      if (category) {
        await db
          .from("business_categories")
          .insert({ business_id: (business as { id: string }).id, category_id: (category as { id: string }).id });
      }
    }

    return Response.json({ data: business });
  } catch {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
}