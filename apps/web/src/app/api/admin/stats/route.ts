import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MEMBERSHIP_PRICE_EUR = 24;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if ((profile as { role?: string } | null)?.role !== "ADMIN") {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const db = createAdminClient();
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [
      { count: totalMembers },
      { count: newMembers30d },
      { count: activeBusinesses },
      { count: confirmedRedemptions },
      { data: economyRow },
    ] = await Promise.all([
      db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "MEMBER"),
      db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "MEMBER")
        .gte("created_at", thirtyDaysAgo),
      db
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      db
        .from("redemptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "CONFIRMED"),
      db.from("redemption_financials").select("discount_amount"),
    ]);

    const economyTotal = ((economyRow ?? []) as { discount_amount: number }[]).reduce(
      (sum, r) => sum + (r.discount_amount ?? 0),
      0,
    );
    const members = totalMembers ?? 0;

    return Response.json({
      data: {
        totalMembers: members,
        newMembers30d: newMembers30d ?? 0,
        activeBusinesses: activeBusinesses ?? 0,
        confirmedRedemptions: confirmedRedemptions ?? 0,
        economyTotal: Math.round(economyTotal * 100) / 100,
        estimatedRevenue: members * MEMBERSHIP_PRICE_EUR,
      },
    });
  } catch {
    return Response.json({
      data: {
        totalMembers: 0,
        newMembers30d: 0,
        activeBusinesses: 0,
        confirmedRedemptions: 0,
        economyTotal: 0,
        estimatedRevenue: 0,
      },
    });
  }
}