import {
  BadRequestException,
  ConflictException,
  Controller,
  Get,
  Param,
  Post,
  Body,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";
import {
  MemberAuthGuard,
  type AuthenticatedRequest,
} from "./member-auth.guard.js";

/* Supabase's untyped query builder is normalized into the response contracts below. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */

type FinancialBody = { total_bill_amount?: unknown; discount_amount?: unknown };
type AttemptBody = { benefit_id?: unknown; business_location_id?: unknown };

@Controller("me")
@UseGuards(MemberAuthGuard)
export class MembersController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get("summary")
  async summary(@Req() request: AuthenticatedRequest) {
    const client = this.supabase.createUserClient(request.accessToken);
    const { data: profile } = await client
      .from("profiles")
      .select("full_name,role")
      .eq("id", request.user.id)
      .maybeSingle();
    const { data: membership } = await client
      .from("memberships")
      .select("id,status,ends_at")
      .eq("profile_id", request.user.id)
      .order("ends_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { count: usedBenefits } = membership
      ? await client
          .from("redemptions")
          .select("id", { count: "exact", head: true })
          .eq("membership_id", membership.id)
          .eq("status", "redeemed")
      : { count: 0 };
    const { count: availableBenefits } = await client
      .from("benefits")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);
    return {
      data: {
        fullName: profile?.full_name ?? null,
        role: (profile as { full_name: string | null; role: string } | null)?.role ?? "MEMBER",
        subscriptionStatus: membership?.status ?? "inactive",
        validUntil: membership?.ends_at ?? null,
        usedBenefits: usedBenefits ?? 0,
        availableBenefits: availableBenefits ?? 0,
        totalBenefits: (usedBenefits ?? 0) + (availableBenefits ?? 0),
        potentialSavings: null,
      },
    };
  }

  @Get("savings")
  async savings(@Req() request: AuthenticatedRequest) {
    const records = await this.getRecords(request);
    return {
      data: {
        records,
        totalSavings: records.reduce(
          (sum, item) => sum + item.discountAmount,
          0,
        ),
        potentialSavings: null,
      },
    };
  }

  @Get("redemptions")
  async redemptions(@Req() request: AuthenticatedRequest) {
    return { data: await this.getRedemptions(request) };
  }

  @Post("redemptions/:id/financials")
  async recordFinancials(
    @Param("id") redemptionId: string,
    @Body() body: FinancialBody,
    @Req() request: AuthenticatedRequest,
  ) {
    const total = this.amount(body.total_bill_amount);
    const discount = this.amount(body.discount_amount);
    if (total === null || discount === null || discount > total) {
      throw new BadRequestException("Valores de fatura e desconto inválidos");
    }
    const client = this.supabase.createUserClient(request.accessToken);
    const { data: redemption } = await client
      .from("redemptions")
      .select("id")
      .eq("id", redemptionId)
      .eq("status", "redeemed")
      .maybeSingle();
    if (!redemption) throw new BadRequestException("Utilização não encontrada");
    const { data, error } = await client
      .from("redemption_financials")
      .insert({
        redemption_id: redemptionId,
        total_bill_amount: total,
        discount_amount: discount,
        savings_recorded_by: request.user.id,
      })
      .select(
        "id,redemption_id,total_bill_amount,discount_amount,savings_recorded_at",
      )
      .single();
    if (error?.code === "23505")
      throw new ConflictException(
        "Esta utilização já tem uma economia registada",
      );
    if (error)
      throw new BadRequestException("Não foi possível guardar a economia");
    return { data };
  }

  @Post("referral")
  async registerReferral(@Req() request: AuthenticatedRequest) {
    const admin = this.supabase.createAdminClient();
    const userClient = this.supabase.createUserClient(request.accessToken);
    const {
      data: { user },
    } = await userClient.auth.getUser();
    const rawCode = user?.user_metadata?.referral_code as string | undefined;
    const referralCode = rawCode?.trim().toUpperCase();
    if (!referralCode) return { data: null };

    const { data: influencer } = await admin
      .from("influencers")
      .select("id")
      .eq("unique_code", referralCode)
      .eq("is_active", true)
      .maybeSingle();
    if (!influencer) return { data: null };

    const validatesAt = new Date(
      Date.now() + 15 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data } = await admin
      .from("referrals")
      .upsert(
        {
          influencer_code: referralCode,
          member_id: request.user.id,
          status: "PENDING",
          validates_at: validatesAt,
        },
        { onConflict: "influencer_code,member_id", ignoreDuplicates: true },
      )
      .select()
      .maybeSingle();
    return { data };
  }

  @Post("redemptions/attempt")
  async createAttempt(
    @Body() body: AttemptBody,
    @Req() request: AuthenticatedRequest,
  ) {
    if (
      typeof body.benefit_id !== "string" ||
      typeof body.business_location_id !== "string"
    ) {
      throw new BadRequestException("Benefício e localização são obrigatórios");
    }
    const { data, error } = await this.supabase
      .createUserClient(request.accessToken)
      .rpc("create_redemption_attempt", {
        p_benefit_id: body.benefit_id,
        p_business_location_id: body.business_location_id,
      });
    if (error) throw new BadRequestException(error.message);
    return { data: Array.isArray(data) ? data[0] : data };
  }

  private amount(value: unknown) {
    const parsed =
      typeof value === "number"
        ? value
        : typeof value === "string" && value.trim()
          ? Number(value)
          : NaN;
    return Number.isFinite(parsed) && parsed >= 0
      ? Math.round(parsed * 100) / 100
      : null;
  }

  private async getRecords(request: AuthenticatedRequest) {
    const redemptions = await this.getRedemptions(request);
    return redemptions.flatMap((item) =>
      item.financial
        ? [
            {
              id: item.id,
              redemptionId: item.id,
              businessName: item.businessName,
              businessSlug: item.businessSlug,
              category: item.category,
              redeemedAt: item.financial.recordedAt ?? item.redeemedAt,
              totalBillAmount: item.financial.totalBillAmount,
              discountAmount: item.financial.discountAmount,
            },
          ]
        : [],
    );
  }

  private async getRedemptions(request: AuthenticatedRequest) {
    const client = this.supabase.createUserClient(request.accessToken);
    const { data: memberships, error: membershipsError } = await client
      .from("memberships")
      .select("id")
      .eq("profile_id", request.user.id);
    if (membershipsError) {
      throw new BadRequestException("Não foi possível carregar as adesões");
    }
    const ids = (memberships ?? []).map((item) => item.id);
    if (!ids.length) return [];
    const { data: redemptions, error } = await client
      .from("redemptions")
      .select("id,redeemed_at,benefits(title,businesses(name,slug))")
      .in("membership_id", ids)
      .eq("status", "redeemed")
      .order("redeemed_at", { ascending: false });
    if (error) {
      throw new BadRequestException("Não foi possível carregar as utilizações");
    }
    const redemptionIds = (redemptions ?? []).map((item) => item.id);
    if (!redemptionIds.length) return [];
    const { data: financials, error: financialsError } = await client
      .from("redemption_financials")
      .select(
        "redemption_id,total_bill_amount,discount_amount,savings_recorded_at",
      )
      .in("redemption_id", redemptionIds);
    if (financialsError) {
      throw new BadRequestException("Não foi possível carregar as economias");
    }
    const byRedemption = new Map(
      (financials ?? []).map((item) => [item.redemption_id, item]),
    );
    return (redemptions ?? []).map((item) => {
      const financial = byRedemption.get(item.id);
      const benefit = Array.isArray(item.benefits)
        ? item.benefits[0]
        : item.benefits;
      const business =
        benefit?.businesses &&
        (Array.isArray(benefit.businesses)
          ? benefit.businesses[0]
          : benefit.businesses);
      return {
        id: item.id,
        benefitTitle: benefit?.title ?? "Benefício do Clube",
        businessName: business?.name ?? "Estabelecimento",
        businessSlug: business?.slug ?? "explorar",
        category: "Gastronomia" as const,
        redeemedAt: item.redeemed_at,
        financial: financial
          ? {
              totalBillAmount: Number(financial.total_bill_amount),
              discountAmount: Number(financial.discount_amount),
              recordedAt: financial.savings_recorded_at,
            }
          : null,
      };
    });
  }
}
