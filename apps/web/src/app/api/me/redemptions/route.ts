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
  if (!ids.length) return Response.json({ data: [] });

  const { data: redemptions } = await supabase
    .from("redemptions")
    .select("id,redeemed_at,benefits(title,businesses(name,slug))")
    .in("membership_id", ids)
    .eq("status", "redeemed")
    .order("redeemed_at", { ascending: false });

  const redemptionIds = (redemptions ?? []).map((r: { id: string }) => r.id);
  if (!redemptionIds.length) return Response.json({ data: [] });

  const [{ data: financials }, { data: reviews }] = await Promise.all([
    supabase
      .from("redemption_financials")
      .select(
        "redemption_id,total_bill_amount,discount_amount,savings_recorded_at",
      )
      .in("redemption_id", redemptionIds),
    supabase
      .from("reviews")
      .select("redemption_id")
      .in("redemption_id", redemptionIds),
  ]);

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
  const reviewedIds = new Set(
    ((reviews ?? []) as unknown as { redemption_id: string }[]).map(
      (r) => r.redemption_id,
    ),
  );

  const data = ((redemptions ?? []) as unknown as RedemptionRow[]).map(
    (item) => {
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
        hasReview: reviewedIds.has(item.id),
        financial: financial
          ? {
              totalBillAmount: Number(financial.total_bill_amount),
              discountAmount: Number(financial.discount_amount),
              recordedAt: financial.savings_recorded_at,
            }
          : null,
      };
    },
  );

  return Response.json({ data });
}
