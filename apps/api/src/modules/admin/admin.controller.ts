import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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