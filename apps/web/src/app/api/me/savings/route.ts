import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id")
    .eq("profile_id", user.id);
  const ids = (memberships ?? []).map((m: { id: string }) => m.id);
  if (!ids.length) {
    return Response.json({
      data: { records: [], totalSavings: 0, potentialSavings: null },
    });
  }

  const { data: redemptions } = await supabase
    .from("redemptions")
    .select("id,redeemed_at,benefits(title,businesses(name,slug))")
    .in("membership_id", ids)
    .eq("status", "redeemed")
    .order("redeemed_at", { ascending: false });

  const redemptionIds = (redemptions ?? []).map((r: { id: string }) => r.id);
  if (!redemptionIds.length) {
    return Response.json({
      data: { records: [], totalSavings: 0, potentialSavings: null },
    });
  }

  const { data: financials } = await supabase
    .from("redemption_financials")
    .select(
      "redemption_id,total_bill_amount,discount_amount,savings_recorded_at",
    )
    .in("redemption_id", redemptionIds);

  type FinancialRow = {
    redemption_id: string;
    total_bill_amount: number;
    discount_amount: number;
    savings_recorded_at: string | null;
  };
  type RedemptionRow = {
    id: string;
    redeemed_at: string;
    benefits: {
      title: string;
      businesses: { name: string; slug: string } | null;
    } | null;
  };

  const byRedemption = new Map<string, FinancialRow>(
    ((financials ?? []) as unknown as FinancialRow[]).map((f) => [
      f.redemption_id,
      f,
    ]),
  );

  const records = ((redemptions ?? []) as unknown as RedemptionRow[])
    .filter((item) => byRedemption.has(item.id))
    .map((item) => {
      const financial = byRedemption.get(item.id)!;
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
        redemptionId: item.id,
        businessName: business?.name ?? "Estabelecimento",
        businessSlug: business?.slug ?? "explorar",
        category: "Gastronomia" as const,
        redeemedAt: financial.savings_recorded_at ?? item.redeemed_at,
        totalBillAmount: Number(financial.total_bill_amount),
        discountAmount: Number(financial.discount_amount),
      };
    });

  return Response.json({
    data: {
      records,
      totalSavings: records.reduce((sum, r) => sum + r.discountAmount, 0),
      potentialSavings: null,
    },
  });
}
