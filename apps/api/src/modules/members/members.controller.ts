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

@Controller("me")
@UseGuards(MemberAuthGuard)
export class MembersController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get("summary")
  async summary(@Req() request: AuthenticatedRequest) {
    const client = this.supabase.createUserClient(request.accessToken);
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
    const { count: recordedBenefits } = membership
      ? await client
          .from("redemption_financials")
          .select("id", { count: "exact", head: true })
          .in(
            "redemption_id",
            (
              (
                await client
                  .from("redemptions")
                  .select("id")
                  .eq("membership_id", membership.id)
              ).data ?? []
            ).map((item) => item.id),
          )
      : { count: 0 };
    return {
      data: {
        subscriptionStatus: membership?.status ?? "inactive",
        validUntil: membership?.ends_at ?? null,
        usedBenefits: usedBenefits ?? 0,
        availableBenefits: 0,
        totalBenefits: recordedBenefits ?? 0,
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
    return { data: await this.getRecords(request) };
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
    const client = this.supabase.createUserClient(request.accessToken);
    const { data: memberships } = await client
      .from("memberships")
      .select("id")
      .eq("profile_id", request.user.id);
    const ids = (memberships ?? []).map((item) => item.id);
    if (!ids.length) return [];
    const { data: redemptions, error } = await client
      .from("redemptions")
      .select("id,redeemed_at,benefits(title,businesses(name,slug))")
      .in("membership_id", ids)
      .eq("status", "redeemed")
      .order("redeemed_at", { ascending: false });
    if (error) return [];
    const redemptionIds = (redemptions ?? []).map((item) => item.id);
    if (!redemptionIds.length) return [];
    const { data: financials } = await client
      .from("redemption_financials")
      .select(
        "redemption_id,total_bill_amount,discount_amount,savings_recorded_at",
      )
      .in("redemption_id", redemptionIds);
    const byRedemption = new Map(
      (financials ?? []).map((item) => [item.redemption_id, item]),
    );
    return (redemptions ?? []).flatMap((item) => {
      const financial = byRedemption.get(item.id);
      if (!financial) return [];
      const benefit = Array.isArray(item.benefits)
        ? item.benefits[0]
        : item.benefits;
      const business =
        benefit?.businesses &&
        (Array.isArray(benefit.businesses)
          ? benefit.businesses[0]
          : benefit.businesses);
      return [
        {
          id: item.id,
          businessName: business?.name ?? "Estabelecimento",
          businessSlug: business?.slug ?? "explorar",
          category: "Gastronomia",
          redeemedAt: financial.savings_recorded_at ?? item.redeemed_at,
          totalBillAmount: Number(financial.total_bill_amount),
          discountAmount: Number(financial.discount_amount),
        },
      ];
    });
  }
}
