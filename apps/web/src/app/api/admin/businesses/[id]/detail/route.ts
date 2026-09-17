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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAdmin();
  if (!user) return Response.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const db = createAdminClient();
    const { data: business } = await db
      .from("businesses")
      .select(
        "id,name,slug,description,phone,instagram,website_url,image_url,is_active,business_locations(id,address_line_1,postal_code,locality,municipality,latitude,longitude,phone),business_categories(categories(name,slug))",
      )
      .eq("id", id)
      .maybeSingle();

    if (!business) return Response.json({ error: "Não encontrado" });

    const { data: benefit } = await db
      .from("benefits")
      .select(
        "id,title,description,terms,type,is_active,benefit_rules(allowed_weekdays,starts_at,ends_at,reservation_required,membership_cycle_limit)",
      )
      .eq("business_id", id)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    type BRow = {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      phone: string | null;
      instagram: string | null;
      website_url: string | null;
      image_url: string | null;
      is_active: boolean;
      business_locations: Array<{
        id: string;
        address_line_1: string | null;
        postal_code: string | null;
        locality: string | null;
        municipality: string | null;
        latitude: number | null;
        longitude: number | null;
        phone: string | null;
      }>;
      business_categories: Array<{
        categories: { name: string; slug: string } | null;
      }>;
    };
    type BenRow = {
      id: string;
      title: string;
      description: string | null;
      terms: string | null;
      type: string;
      is_active: boolean;
      benefit_rules: {
        allowed_weekdays: number[];
        starts_at: string | null;
        ends_at: string | null;
        reservation_required: boolean;
        membership_cycle_limit: number;
      } | null;
    };

    const b = business as unknown as BRow;
    const loc = b.business_locations?.[0] ?? null;
    const cat = b.business_categories?.[0]?.categories ?? null;
    const ben = benefit as unknown as BenRow | null;
    const rules = ben?.benefit_rules ?? null;

    return Response.json({
      data: {
        id: b.id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        phone: b.phone,
        instagram: b.instagram,
        websiteUrl: b.website_url,
        imageUrl: b.image_url,
        isActive: b.is_active,
        categorySlug: cat?.slug ?? null,
        categoryName: cat?.name ?? null,
        location: loc
          ? {
              id: loc.id,
              addressLine1: loc.address_line_1,
              postalCode: loc.postal_code,
              locality: loc.locality,
              municipality: loc.municipality,
              latitude: loc.latitude,
              longitude: loc.longitude,
              phone: loc.phone,
            }
          : null,
        benefit: ben
          ? {
              id: ben.id,
              title: ben.title,
              description: ben.description,
              terms: ben.terms,
              type: ben.type,
              isActive: ben.is_active,
            }
          : null,
        benefitRules: rules
          ? {
              allowedWeekdays: rules.allowed_weekdays ?? [],
              startsAt: rules.starts_at?.slice(0, 5) ?? "00:00",
              endsAt: rules.ends_at?.slice(0, 5) ?? "23:59",
              reservationRequired: rules.reservation_required,
              cycleLimit: rules.membership_cycle_limit,
            }
          : null,
      },
    });
  } catch {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAdmin();
  if (!user) return Response.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    description?: string;
    phone?: string;
    instagram?: string;
    websiteUrl?: string;
    imageUrl?: string;
    isActive?: boolean;
    categorySlug?: string;
    location?: {
      addressLine1?: string;
      postalCode?: string;
      locality?: string;
      municipality?: string;
      latitude?: number | null;
      longitude?: number | null;
      phone?: string;
    };
    benefit?: {
      title?: string;
      description?: string;
      terms?: string;
      type?: string;
    };
    benefitRules?: {
      allowedWeekdays?: number[];
      startsAt?: string;
      endsAt?: string;
      reservationRequired?: boolean;
      cycleLimit?: number;
    };
  };

  try {
    const db = createAdminClient();

    // 1. Update business
    const bizPatch: Record<string, unknown> = {};
    if (body.name !== undefined) bizPatch.name = body.name;
    if (body.description !== undefined) bizPatch.description = body.description;
    if (body.phone !== undefined) bizPatch.phone = body.phone;
    if (body.instagram !== undefined) bizPatch.instagram = body.instagram;
    if (body.websiteUrl !== undefined) bizPatch.website_url = body.websiteUrl;
    if (body.imageUrl !== undefined) bizPatch.image_url = body.imageUrl;
    if (body.isActive !== undefined) bizPatch.is_active = body.isActive;

    if (Object.keys(bizPatch).length > 0) {
      const { error } = await db.from("businesses").update(bizPatch).eq("id", id);
      if (error) return Response.json({ error: error.message });
    }

    // 2. Update category
    if (body.categorySlug) {
      const { data: cat } = await db
        .from("categories")
        .select("id")
        .eq("slug", body.categorySlug)
        .maybeSingle();
      if (cat) {
        await db.from("business_categories").upsert(
          { business_id: id, category_id: (cat as { id: string }).id },
          { onConflict: "business_id,category_id" },
        );
      }
    }

    // 3. Update location
    if (body.location) {
      const { data: loc } = await db
        .from("business_locations")
        .select("id")
        .eq("business_id", id)
        .limit(1)
        .maybeSingle();

      const locPatch: Record<string, unknown> = {};
      const l = body.location;
      if (l.addressLine1 !== undefined) locPatch.address_line_1 = l.addressLine1;
      if (l.postalCode !== undefined) locPatch.postal_code = l.postalCode;
      if (l.locality !== undefined) locPatch.locality = l.locality;
      if (l.municipality !== undefined) locPatch.municipality = l.municipality;
      if (l.latitude !== undefined) locPatch.latitude = l.latitude;
      if (l.longitude !== undefined) locPatch.longitude = l.longitude;
      if (l.phone !== undefined) locPatch.phone = l.phone;

      if (Object.keys(locPatch).length > 0) {
        if (loc) {
          await db
            .from("business_locations")
            .update(locPatch)
            .eq("id", (loc as { id: string }).id);
        } else {
          await db.from("business_locations").insert({
            business_id: id,
            name: body.name ?? "Principal",
            slug: id,
            is_active: true,
            ...locPatch,
          });
        }
      }
    }

    // 4. Update benefit
    if (body.benefit) {
      const { data: ben } = await db
        .from("benefits")
        .select("id")
        .eq("business_id", id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      const benPatch: Record<string, unknown> = {};
      const bv = body.benefit;
      if (bv.title !== undefined) benPatch.title = bv.title;
      if (bv.description !== undefined) benPatch.description = bv.description;
      if (bv.terms !== undefined) benPatch.terms = bv.terms;
      if (bv.type !== undefined) benPatch.type = bv.type;

      if (Object.keys(benPatch).length > 0) {
        if (ben) {
          await db
            .from("benefits")
            .update(benPatch)
            .eq("id", (ben as { id: string }).id);
        } else {
          await db
            .from("benefits")
            .insert({ business_id: id, is_active: true, ...benPatch });
        }
      }
    }

    // 5. Update benefit_rules
    if (body.benefitRules) {
      const { data: ben } = await db
        .from("benefits")
        .select("id")
        .eq("business_id", id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (ben) {
        const br = body.benefitRules;
        const rulesPatch: Record<string, unknown> = {};
        if (br.allowedWeekdays !== undefined)
          rulesPatch.allowed_weekdays = br.allowedWeekdays;
        if (br.startsAt !== undefined) rulesPatch.starts_at = br.startsAt;
        if (br.endsAt !== undefined) rulesPatch.ends_at = br.endsAt;
        if (br.reservationRequired !== undefined)
          rulesPatch.reservation_required = br.reservationRequired;
        if (br.cycleLimit !== undefined)
          rulesPatch.membership_cycle_limit = br.cycleLimit;

        await db
          .from("benefit_rules")
          .update(rulesPatch)
          .eq("benefit_id", (ben as { id: string }).id);
      }
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
}