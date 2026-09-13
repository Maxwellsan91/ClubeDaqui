import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";
import { AdminAuthGuard } from "./admin-auth.guard.js";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

const MEMBERSHIP_PRICE_EUR = 24;

@Controller("admin")
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.createAdminClient();
  }

  // ── Dashboard stats ────────────────────────────────────────────────────

  @Get("stats")
  async stats() {
    const [
      { count: totalMembers },
      { count: newMembers30d },
      { count: activeBusinesses },
      { count: confirmedRedemptions },
      { data: economyRow },
    ] = await Promise.all([
      this.db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "MEMBER"),
      this.db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "MEMBER")
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        ),
      this.db
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      this.db
        .from("redemptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "CONFIRMED"),
      this.db
        .from("redemption_financials")
        .select("discount_amount")
        .throwOnError(),
    ]);

    const economyTotal = (
      (economyRow ?? []) as { discount_amount: number }[]
    ).reduce((sum, r) => sum + (r.discount_amount ?? 0), 0);

    const members = totalMembers ?? 0;

    return {
      data: {
        totalMembers: members,
        newMembers30d: newMembers30d ?? 0,
        activeBusinesses: activeBusinesses ?? 0,
        confirmedRedemptions: confirmedRedemptions ?? 0,
        economyTotal: Math.round(economyTotal * 100) / 100,
        estimatedRevenue: members * MEMBERSHIP_PRICE_EUR,
      },
    };
  }

  // ── Users ──────────────────────────────────────────────────────────────

  @Get("users")
  async users() {
    const { data, error } = await this.db
      .from("profiles")
      .select("id,full_name,role,created_at")
      .order("created_at", { ascending: false });
    if (error) return { data: [], total: 0 };

    // Redemption counts per user
    const { data: counts } = await this.db
      .from("redemptions")
      .select("member_id")
      .eq("status", "CONFIRMED");

    const countMap = new Map<string, number>();
    for (const r of (counts ?? []) as { member_id: string }[]) {
      countMap.set(r.member_id, (countMap.get(r.member_id) ?? 0) + 1);
    }

    const presented = (
      (data ?? []) as {
        id: string;
        full_name: string | null;
        role: string;
        created_at: string;
      }[]
    ).map((p) => ({
      id: p.id,
      fullName: p.full_name ?? "—",
      role: p.role,
      createdAt: p.created_at,
      redemptionsCount: countMap.get(p.id) ?? 0,
    }));

    return { data: presented, total: presented.length };
  }

  // ── Businesses / Partners ──────────────────────────────────────────────

  @Get("businesses")
  async businesses() {
    const { data: businesses, error } = await this.db
      .from("businesses")
      .select(
        "id,name,slug,is_active,business_locations(locality),business_categories(categories(name))",
      )
      .order("name");
    if (error) return { data: [], total: 0 };

    const { data: benefits } = await this.db
      .from("benefits")
      .select("id,business_id,is_active");

    const { data: redemptions } = await this.db
      .from("redemptions")
      .select("id,business_location_id,business_locations(business_id)")
      .eq("status", "CONFIRMED");

    const benefitMap = new Map<string, number>();
    for (const b of (benefits ?? []) as {
      business_id: string;
      is_active: boolean;
    }[]) {
      if (b.is_active) {
        benefitMap.set(b.business_id, (benefitMap.get(b.business_id) ?? 0) + 1);
      }
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

    return { data: presented, total: presented.length };
  }

  @Post("businesses")
  async createBusiness(
    @Body()
    body: {
      name?: string;
      slug?: string;
      description?: string;
      categorySlug?: string;
    },
  ) {
    const { name, slug, description, categorySlug } = body;
    if (!name || !slug) {
      return { error: "name e slug são obrigatórios" };
    }

    const { data: business, error } = await this.db
      .from("businesses")
      .insert({ name, slug, description: description ?? null, is_active: true })
      .select("id,name,slug")
      .single();
    if (error) return { error: error.message };

    if (categorySlug) {
      const { data: category } = await this.db
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle();
      if (category) {
        await this.db
          .from("business_categories")
          .insert({ business_id: business.id, category_id: category.id });
      }
    }

    return { data: business };
  }

  @Patch("businesses/:id")
  async updateBusiness(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      isActive?: boolean;
      phone?: string;
      instagram?: string;
      websiteUrl?: string;
    },
  ) {
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.description !== undefined) patch.description = body.description;
    if (body.isActive !== undefined) patch.is_active = body.isActive;
    if (body.phone !== undefined) patch.phone = body.phone;
    if (body.instagram !== undefined) patch.instagram = body.instagram;
    if (body.websiteUrl !== undefined) patch.website_url = body.websiteUrl;

    const { data, error } = await this.db
      .from("businesses")
      .update(patch)
      .eq("id", id)
      .select("id,name,slug,is_active")
      .single();
    if (error) return { error: error.message };
    return { data };
  }

  // ── Business detail (full, for edit form) ─────────────────────────────

  @Get("businesses/:id/detail")
  async businessDetail(@Param("id") id: string) {
    const { data: business } = await this.db
      .from("businesses")
      .select(
        "id,name,slug,description,phone,instagram,website_url,image_url,is_active,business_locations(id,address_line_1,postal_code,locality,municipality,latitude,longitude,phone),business_categories(categories(name,slug))",
      )
      .eq("id", id)
      .maybeSingle();

    if (!business) return { error: "Não encontrado" };

    const { data: benefit } = await this.db
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

    const b = business as unknown as BRow;
    const loc = b.business_locations?.[0] ?? null;
    const cat = b.business_categories?.[0]?.categories ?? null;

    type BenefitRow = {
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

    const ben = benefit as unknown as BenefitRow | null;
    const rules = ben?.benefit_rules ?? null;

    return {
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
    };
  }

  @Put("businesses/:id")
  async updateBusinessFull(
    @Param("id") id: string,
    @Body()
    body: {
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
    },
  ) {
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
      const { error } = await this.db
        .from("businesses")
        .update(bizPatch)
        .eq("id", id);
      if (error) return { error: error.message };
    }

    // 2. Update category
    if (body.categorySlug) {
      const { data: cat } = await this.db
        .from("categories")
        .select("id")
        .eq("slug", body.categorySlug)
        .maybeSingle();
      if (cat) {
        await this.db
          .from("business_categories")
          .upsert(
            { business_id: id, category_id: (cat as { id: string }).id },
            { onConflict: "business_id,category_id" },
          );
      }
    }

    // 3. Update location
    if (body.location) {
      const { data: loc } = await this.db
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
          await this.db
            .from("business_locations")
            .update(locPatch)
            .eq("id", (loc as { id: string }).id);
        } else {
          await this.db.from("business_locations").insert({
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
      const { data: ben } = await this.db
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
          await this.db
            .from("benefits")
            .update(benPatch)
            .eq("id", (ben as { id: string }).id);
        } else {
          await this.db
            .from("benefits")
            .insert({ business_id: id, is_active: true, ...benPatch });
        }
      }
    }

    // 5. Update benefit_rules
    if (body.benefitRules) {
      const { data: ben } = await this.db
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

        await this.db
          .from("benefit_rules")
          .update(rulesPatch)
          .eq("benefit_id", (ben as { id: string }).id);
      }
    }

    return { success: true };
  }

  // ── Influencers ────────────────────────────────────────────────────────

  @Get("influencers")
  async influencers() {
    const [{ data, error }, { data: redemptionRows }, { data: financialRows }] =
      await Promise.all([
        this.db
          .from("influencers")
          .select("id,name,email,unique_code,commission_rate,is_active,notes,created_at")
          .order("created_at", { ascending: false }),
        this.db
          .from("redemptions")
          .select("id,influencer_code")
          .eq("status", "CONFIRMED")
          .not("influencer_code", "is", null),
        this.db
          .from("redemption_financials")
          .select("redemption_id,discount_amount"),
      ]);

    if (error) return { data: [], total: 0 };

    type RedemptionRow = { id: string; influencer_code: string };
    type FinancialRow = { redemption_id: string; discount_amount: number };
    type InfluencerRow = {
      id: string;
      name: string;
      email: string;
      unique_code: string;
      commission_rate: number;
      is_active: boolean;
      notes: string | null;
      created_at: string;
    };

    // Map redemption_id → discount_amount
    const finMap = new Map<string, number>();
    for (const f of (financialRows ?? []) as FinancialRow[]) {
      finMap.set(f.redemption_id, f.discount_amount ?? 0);
    }

    // Map influencer_code → { count, economy }
    const statsMap = new Map<string, { count: number; economy: number }>();
    for (const r of (redemptionRows ?? []) as RedemptionRow[]) {
      const code = r.influencer_code;
      const prev = statsMap.get(code) ?? { count: 0, economy: 0 };
      statsMap.set(code, {
        count: prev.count + 1,
        economy: prev.economy + (finMap.get(r.id) ?? 0),
      });
    }

    const presented = ((data ?? []) as unknown as InfluencerRow[]).map((i) => {
      const stats = statsMap.get(i.unique_code) ?? { count: 0, economy: 0 };
      const commissionDue =
        Math.round(stats.economy * Number(i.commission_rate)) / 100;
      return {
        id: i.id,
        name: i.name,
        email: i.email,
        uniqueCode: i.unique_code,
        commissionRate: Number(i.commission_rate),
        isActive: i.is_active,
        notes: i.notes,
        createdAt: i.created_at,
        redemptionsCount: stats.count,
        totalEconomy: Math.round(stats.economy * 100) / 100,
        commissionDue,
      };
    });

    return { data: presented, total: presented.length };
  }

  @Post("influencers")
  async createInfluencer(
    @Body()
    body: {
      name?: string;
      email?: string;
      commissionRate?: number;
      uniqueCode?: string;
      notes?: string;
    },
  ) {
    const { name, email, commissionRate, notes } = body;
    if (!name || !email) return { error: "name e email são obrigatórios" };

    const code =
      body.uniqueCode?.trim().toUpperCase() ||
      name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 4)
        .toUpperCase()
        .padEnd(4, "X") +
        "-" +
        Math.floor(1000 + Math.random() * 9000).toString();

    const { data, error } = await this.db
      .from("influencers")
      .insert({
        name,
        email,
        unique_code: code,
        commission_rate: commissionRate ?? 10,
        notes: notes ?? null,
        is_active: true,
      })
      .select("id,name,email,unique_code,commission_rate,is_active,notes,created_at")
      .single();
    if (error) return { error: error.message };
    return { data };
  }

  @Patch("influencers/:id")
  async updateInfluencer(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      email?: string;
      commissionRate?: number;
      isActive?: boolean;
      notes?: string;
    },
  ) {
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.email !== undefined) patch.email = body.email;
    if (body.commissionRate !== undefined) patch.commission_rate = body.commissionRate;
    if (body.isActive !== undefined) patch.is_active = body.isActive;
    if (body.notes !== undefined) patch.notes = body.notes;

    const { data, error } = await this.db
      .from("influencers")
      .update(patch)
      .eq("id", id)
      .select("id,name,email,unique_code,commission_rate,is_active,notes,created_at")
      .single();
    if (error) return { error: error.message };
    return { data };
  }

  // ── Partner role management ────────────────────────────────────────────

  @Patch("users/:id/role")
  async updateUserRole(
    @Param("id") id: string,
    @Body() body: { role?: string },
  ) {
    const allowed = ["MEMBER", "PARTNER", "ADMIN"];
    if (!body.role || !allowed.includes(body.role)) {
      return { error: "Role inválido. Use: MEMBER, PARTNER ou ADMIN" };
    }
    const { data, error } = await this.db
      .from("profiles")
      .update({ role: body.role })
      .eq("id", id)
      .select("id,full_name,role")
      .single();
    if (error) return { error: error.message };
    return { data };
  }
}