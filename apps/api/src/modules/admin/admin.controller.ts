import {
  Body,
  Controller,
  Get,
  Headers,
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
    const now = new Date().toISOString();
    const [profiles, counts, authUsers, influencerRows, membershipRows] =
      await Promise.all([
        this.db.from("profiles").select("id,full_name,role,is_active,created_at").order("created_at", { ascending: false }),
        this.db.from("redemptions").select("member_id").eq("status", "CONFIRMED"),
        this.db.auth.admin.listUsers({ perPage: 1000 }),
        this.db.from("influencers").select("email").eq("is_active", true),
        this.db.from("memberships").select("profile_id,source,status,ends_at"),
      ]);
    if (profiles.error) return { data: [], total: 0 };

    type PRow = { id: string; full_name: string | null; role: string; is_active: boolean; created_at: string };
    type MRow = { profile_id: string; source: string; status: string; ends_at: string | null };

    const countMap = new Map<string, number>();
    for (const r of (counts.data ?? []) as { member_id: string }[]) {
      countMap.set(r.member_id, (countMap.get(r.member_id) ?? 0) + 1);
    }

    const emailMap = new Map<string, string>(
      (authUsers.data?.users ?? []).map((u) => [u.id, u.email ?? ""]),
    );

    const influencerEmailSet = new Set(
      ((influencerRows.data ?? []) as { email: string }[]).map((i) => i.email.toLowerCase()),
    );

    // Best active membership per profile
    const activeMem = new Map<string, MRow>();
    for (const m of (membershipRows.data ?? []) as unknown as MRow[]) {
      if (m.status === "active" && (m.ends_at ?? "") >= now) {
        const ex = activeMem.get(m.profile_id);
        if (!ex || (m.ends_at ?? "") > (ex.ends_at ?? "")) activeMem.set(m.profile_id, m);
      }
    }

    const presented = ((profiles.data ?? []) as unknown as PRow[]).map((p) => {
      const email = emailMap.get(p.id) ?? "";
      const mem = activeMem.get(p.id);
      return {
        id: p.id,
        fullName: p.full_name ?? "—",
        email,
        role: p.role,
        isActive: p.is_active,
        createdAt: p.created_at,
        redemptionsCount: countMap.get(p.id) ?? 0,
        isInfluencer: influencerEmailSet.has(email.toLowerCase()),
        membershipStatus: mem ? "active" : "inactive",
        membershipSource: mem?.source ?? null,
        membershipEndsAt: mem?.ends_at ?? null,
      };
    });

    return { data: presented, total: presented.length };
  }

  @Post("users/:id/promote-influencer")
  async promoteInfluencer(
    @Param("id") id: string,
    @Body()
    body: {
      commissionRate?: number;
      customCode?: string;
    },
  ) {
    const { data: authUser, error: authError } =
      await this.db.auth.admin.getUserById(id);
    if (authError || !authUser.user?.email) {
      return { error: "Utilizador não encontrado" };
    }
    const email = authUser.user.email;

    const { data: existingInfluencer } = await this.db
      .from("influencers")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existingInfluencer) {
      return { error: "Este utilizador já é influencer" };
    }

    const { data: profile } = await this.db
      .from("profiles")
      .select("full_name")
      .eq("id", id)
      .maybeSingle();
    const name =
      (profile as { full_name: string | null } | null)?.full_name ?? email;

    const code =
      body.customCode?.trim().toUpperCase() ||
      name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 4)
        .toUpperCase()
        .padEnd(4, "X") +
        "-" +
        Math.floor(1000 + Math.random() * 9000).toString();

    const { data: influencer, error: infError } = await this.db
      .from("influencers")
      .insert({
        name,
        email,
        unique_code: code,
        commission_rate: body.commissionRate ?? 10,
        is_active: true,
      })
      .select("id,unique_code")
      .single();
    if (infError) return { error: infError.message };

    // Conceder adesão gratuita de 1 ano se não tiver uma activa
    const { data: existingMembership } = await this.db
      .from("memberships")
      .select("id")
      .eq("profile_id", id)
      .eq("status", "active")
      .gte("ends_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    // Set role to INFLUENCER
    await this.db.from("profiles").update({ role: "INFLUENCER" }).eq("id", id);

    if (!existingMembership) {
      const endsAt = new Date();
      endsAt.setFullYear(endsAt.getFullYear() + 1);
      await this.db.from("memberships").insert({
        profile_id: id,
        status: "active",
        ends_at: endsAt.toISOString(),
        source: "INFLUENCER_GRANT",
      });
    }

    return { data: influencer };
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
    const now = new Date().toISOString();
    const [
      { data, error },
      { data: redemptionRows },
      { data: financialRows },
      { data: referralRows },
    ] = await Promise.all([
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
      this.db
        .from("referrals")
        .select("influencer_code,status,validates_at,cancelled_at"),
    ]);

    if (error) return { data: [], total: 0 };

    type RedemptionRow = { id: string; influencer_code: string };
    type FinancialRow = { redemption_id: string; discount_amount: number };
    type ReferralRow = {
      influencer_code: string;
      status: string;
      validates_at: string;
      cancelled_at: string | null;
    };
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

    // Redemption stats: code → { count, economy }
    const finMap = new Map<string, number>();
    for (const f of (financialRows ?? []) as FinancialRow[]) {
      finMap.set(f.redemption_id, f.discount_amount ?? 0);
    }
    const redemptionStats = new Map<string, { count: number; economy: number }>();
    for (const r of (redemptionRows ?? []) as RedemptionRow[]) {
      const code = r.influencer_code;
      const prev = redemptionStats.get(code) ?? { count: 0, economy: 0 };
      redemptionStats.set(code, {
        count: prev.count + 1,
        economy: prev.economy + (finMap.get(r.id) ?? 0),
      });
    }

    // Referral stats: code → { pending, validated, cancelled }
    const referralStats = new Map<
      string,
      { pending: number; validated: number; cancelled: number }
    >();
    for (const r of (referralRows ?? []) as ReferralRow[]) {
      const code = r.influencer_code;
      const prev = referralStats.get(code) ?? {
        pending: 0,
        validated: 0,
        cancelled: 0,
      };
      if (r.status === "CANCELLED") {
        referralStats.set(code, { ...prev, cancelled: prev.cancelled + 1 });
      } else if (r.validates_at <= now) {
        referralStats.set(code, { ...prev, validated: prev.validated + 1 });
      } else {
        referralStats.set(code, { ...prev, pending: prev.pending + 1 });
      }
    }

    const presented = ((data ?? []) as unknown as InfluencerRow[]).map((i) => {
      const rate = Number(i.commission_rate);
      const rd = redemptionStats.get(i.unique_code) ?? { count: 0, economy: 0 };
      const rf = referralStats.get(i.unique_code) ?? {
        pending: 0,
        validated: 0,
        cancelled: 0,
      };
      // Commission per validated referral = rate% × membership price (24€)
      const validatedCommission =
        Math.round(rf.validated * MEMBERSHIP_PRICE_EUR * rate) / 100;
      const pendingCommission =
        Math.round(rf.pending * MEMBERSHIP_PRICE_EUR * rate) / 100;
      // Commission from benefit redemptions = rate% × economy generated
      const redemptionCommission =
        Math.round(rd.economy * rate) / 100;

      return {
        id: i.id,
        name: i.name,
        email: i.email,
        uniqueCode: i.unique_code,
        commissionRate: rate,
        isActive: i.is_active,
        notes: i.notes,
        createdAt: i.created_at,
        // Referral (member acquisition) stats
        referrals: {
          pending: rf.pending,
          validated: rf.validated,
          cancelled: rf.cancelled,
          total: rf.pending + rf.validated + rf.cancelled,
          pendingCommission,
          validatedCommission,
        },
        // Benefit redemption stats
        redemptions: {
          count: rd.count,
          economy: Math.round(rd.economy * 100) / 100,
          commission: redemptionCommission,
        },
        // Total commission due (only validated)
        commissionDue: validatedCommission + redemptionCommission,
      };
    });

    return { data: presented, total: presented.length };
  }

  @Get("influencers/:id")
  async influencerDetail(@Param("id") id: string) {
    const { data: influencer } = await this.db
      .from("influencers")
      .select("id,name,email,unique_code,commission_rate,is_active,notes,created_at")
      .eq("id", id)
      .maybeSingle();
    if (!influencer) return { error: "Não encontrado" };

    type InfRow = {
      id: string; name: string; email: string; unique_code: string;
      commission_rate: number; is_active: boolean; notes: string | null; created_at: string;
    };
    type RefRow = {
      id: string; member_id: string; status: string;
      created_at: string; validates_at: string; cancelled_at: string | null;
      profiles: { full_name: string | null } | null;
    };

    const inf = influencer as unknown as InfRow;
    const rate = Number(inf.commission_rate);
    const PRICE = MEMBERSHIP_PRICE_EUR;

    const { data: referrals } = await this.db
      .from("referrals")
      .select("id,member_id,status,created_at,validates_at,cancelled_at,profiles(full_name)")
      .eq("influencer_code", inf.unique_code)
      .order("created_at", { ascending: false });

    const now = new Date().toISOString();

    const processed = ((referrals ?? []) as unknown as RefRow[]).map((r) => {
      const effectiveStatus =
        r.status === "CANCELLED"
          ? "CANCELLED"
          : r.validates_at <= now
            ? "VALIDATED"
            : "PENDING";
      return {
        id: r.id,
        memberId: r.member_id,
        memberName: r.profiles?.full_name ?? "—",
        status: effectiveStatus,
        createdAt: r.created_at,
        validatesAt: r.validates_at,
        cancelledAt: r.cancelled_at,
        commission: effectiveStatus === "VALIDATED" ? Math.round(PRICE * rate) / 100 : 0,
        pendingCommission: effectiveStatus === "PENDING" ? Math.round(PRICE * rate) / 100 : 0,
      };
    });

    // Monthly breakdown grouped by validates_at month
    const monthMap = new Map<string, { pending: number; validated: number; cancelled: number }>();
    for (const r of processed) {
      const d = new Date(r.validatesAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const prev = monthMap.get(key) ?? { pending: 0, validated: 0, cancelled: 0 };
      if (r.status === "CANCELLED") monthMap.set(key, { ...prev, cancelled: prev.cancelled + 1 });
      else if (r.status === "VALIDATED") monthMap.set(key, { ...prev, validated: prev.validated + 1 });
      else monthMap.set(key, { ...prev, pending: prev.pending + 1 });
    }

    const monthly = Array.from(monthMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, s]) => ({
        month,
        pending: s.pending,
        validated: s.validated,
        cancelled: s.cancelled,
        validatedCommission: Math.round(s.validated * PRICE * rate) / 100,
        pendingCommission: Math.round(s.pending * PRICE * rate) / 100,
      }));

    const totals = {
      total: processed.length,
      validated: processed.filter((r) => r.status === "VALIDATED").length,
      pending: processed.filter((r) => r.status === "PENDING").length,
      cancelled: processed.filter((r) => r.status === "CANCELLED").length,
      validatedCommission: processed.reduce((s, r) => s + r.commission, 0),
      pendingCommission: processed.reduce((s, r) => s + r.pendingCommission, 0),
    };

    return {
      data: {
        id: inf.id, name: inf.name, email: inf.email,
        uniqueCode: inf.unique_code, commissionRate: rate,
        isActive: inf.is_active, notes: inf.notes, createdAt: inf.created_at,
        totals, monthly, referrals: processed,
      },
    };
  }

  @Patch("referrals/:id")
  async updateReferral(
    @Param("id") id: string,
    @Body() body: { status?: string },
  ) {
    const allowed = ["PENDING", "VALIDATED", "CANCELLED"];
    if (!body.status || !allowed.includes(body.status)) {
      return { error: "Status inválido" };
    }
    const patch: Record<string, unknown> = { status: body.status };
    if (body.status === "CANCELLED") patch.cancelled_at = new Date().toISOString();
    const { data, error } = await this.db
      .from("referrals")
      .update(patch)
      .eq("id", id)
      .select("id,status")
      .single();
    if (error) return { error: error.message };
    return { data };
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

  // ── User detail + status management ───────────────────────────────────

  @Get("users/:id")
  async userDetail(@Param("id") id: string) {
    type ProfileRow = { id: string; full_name: string | null; role: string; is_active: boolean; created_at: string };
    type MembershipRow = { id: string; status: string; source: string; ends_at: string | null; created_at: string };
    type LogRow = { id: string; previous_active: boolean; new_active: boolean; reason: string; changed_by_name: string; created_at: string };

    // Phase 1: independent queries
    const [profileRes, authRes, membershipsRes, statusLogsRes] = await Promise.all([
      this.db.from("profiles").select("id,full_name,role,is_active,created_at").eq("id", id).maybeSingle(),
      this.db.auth.admin.getUserById(id),
      this.db.from("memberships").select("id,status,source,ends_at,created_at").eq("profile_id", id).order("created_at", { ascending: false }),
      this.db.from("profile_status_logs").select("id,previous_active,new_active,reason,changed_by_name,created_at").eq("profile_id", id).order("created_at", { ascending: false }),
    ]);

    const p = profileRes.data as unknown as ProfileRow | null;
    if (!p) return { error: "Utilizador não encontrado" };

    const email = authRes.data?.user?.email ?? "";
    const membershipIds = ((membershipsRes.data ?? []) as MembershipRow[]).map((m) => m.id);

    // Phase 2: queries that need email or membershipIds
    const [influencerRes, redemptionRes] = await Promise.all([
      this.db.from("influencers").select("id,unique_code,commission_rate").eq("email", email).maybeSingle(),
      membershipIds.length
        ? this.db.from("redemptions").select("id,redeemed_at,status,benefits(title,businesses(name))").in("membership_id", membershipIds).order("redeemed_at", { ascending: false }).limit(20)
        : Promise.resolve({ data: [] as unknown[] }),
    ]);

    const inf = influencerRes.data as unknown as { id: string; unique_code: string; commission_rate: number } | null;

    return {
      data: {
        id: p.id,
        fullName: p.full_name ?? "—",
        email,
        role: p.role,
        isActive: p.is_active,
        createdAt: p.created_at,
        memberships: ((membershipsRes.data ?? []) as MembershipRow[]).map((m) => ({
          id: m.id,
          status: m.status,
          source: m.source ?? "PAID",
          endsAt: m.ends_at,
          createdAt: m.created_at,
        })),
        recentRedemptions: (redemptionRes.data ?? []).slice(0, 10),
        influencer: inf ? { id: inf.id, uniqueCode: inf.unique_code, commissionRate: Number(inf.commission_rate) } : null,
        statusLogs: ((statusLogsRes.data ?? []) as unknown as LogRow[]).map((l) => ({
          id: l.id,
          previousActive: l.previous_active,
          newActive: l.new_active,
          reason: l.reason,
          changedByName: l.changed_by_name,
          createdAt: l.created_at,
        })),
      },
    };
  }

  @Patch("users/:id/status")
  async updateUserStatus(
    @Param("id") id: string,
    @Body() body: { isActive?: boolean; reason?: string },
    @Headers("authorization") auth: string,
  ) {
    if (body.isActive === undefined) return { error: "isActive é obrigatório" };
    if (!body.reason?.trim()) return { error: "É obrigatório indicar o motivo da alteração" };

    // Get current status
    const { data: profile } = await this.db
      .from("profiles")
      .select("is_active,full_name")
      .eq("id", id)
      .maybeSingle();
    if (!profile) return { error: "Utilizador não encontrado" };

    const p = profile as { is_active: boolean; full_name: string | null };

    // Get admin identity from token
    const token = auth.replace("Bearer ", "");
    const { data: { user: adminUser } } = await this.supabase.createUserClient(token).auth.getUser();
    const { data: adminProfile } = await this.db
      .from("profiles")
      .select("full_name")
      .eq("id", adminUser?.id ?? "")
      .maybeSingle();
    const adminName = (adminProfile as { full_name: string | null } | null)?.full_name ?? "Admin";

    await this.db.from("profiles").update({ is_active: body.isActive }).eq("id", id);
    await this.db.from("profile_status_logs").insert({
      profile_id: id,
      changed_by_id: adminUser?.id ?? "",
      changed_by_name: adminName,
      previous_active: p.is_active,
      new_active: body.isActive,
      reason: body.reason.trim(),
    });

    return { data: { id, isActive: body.isActive } };
  }

  @Patch("users/:id/profile")
  async updateUserProfile(
    @Param("id") id: string,
    @Body() body: { fullName?: string; phone?: string; nif?: string },
  ) {
    const patch: Record<string, unknown> = {};
    if (body.fullName !== undefined) patch.full_name = body.fullName.trim() || null;
    if (body.phone !== undefined) patch.phone = body.phone.trim() || null;
    if (body.nif !== undefined) {
      if (body.nif && !/^\d{9}$/.test(body.nif)) return { error: "NIF inválido — deve ter 9 dígitos" };
      patch.nif = body.nif || null;
    }
    if (Object.keys(patch).length === 0) return { data: {} };
    const { data, error } = await this.db
      .from("profiles")
      .update(patch)
      .eq("id", id)
      .select("full_name,phone,nif")
      .single();
    if (error?.code === "23505") return { error: "Este NIF já está registado noutro utilizador" };
    if (error) return { error: error.message };
    return { data };
  }

  @Post("users/:id/grant-membership")
  async grantMembership(@Param("id") id: string) {
    const { data: existing } = await this.db
      .from("memberships")
      .select("id")
      .eq("profile_id", id)
      .eq("status", "active")
      .gte("ends_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();
    if (existing) return { error: "O utilizador já tem uma adesão activa" };

    const endsAt = new Date();
    endsAt.setFullYear(endsAt.getFullYear() + 1);
    const { data, error } = await this.db
      .from("memberships")
      .insert({ profile_id: id, status: "active", ends_at: endsAt.toISOString(), source: "ADMIN_GRANT" })
      .select("id,status,source,ends_at")
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
    const allowed = ["MEMBER", "PARTNER", "ADMIN", "INFLUENCER"];
    if (!body.role || !allowed.includes(body.role)) {
      return { error: "Role inválido. Use: MEMBER, PARTNER, ADMIN ou INFLUENCER" };
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