import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: membership } = await supabase
    .from("memberships")
    .select("id,status,ends_at")
    .eq("profile_id", user.id)
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: payment } = membership
    ? await supabase
        .from("payments")
        .select("amount_cents")
        .eq("membership_id", membership.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { count: usedBenefits } = membership
    ? await supabase
        .from("redemptions")
        .select("id", { count: "exact", head: true })
        .eq("membership_id", membership.id)
        .eq("status", "redeemed")
    : { count: 0 };

  const { count: availableBenefits } = await supabase
    .from("benefits")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  type ProfileRow = { full_name: string | null; role: string } | null;

  return Response.json({
    data: {
      fullName: profile?.full_name ?? null,
      role: (profile as ProfileRow)?.role ?? "MEMBER",
      subscriptionStatus: membership?.status ?? "inactive",
      validUntil: membership?.ends_at ?? null,
      usedBenefits: usedBenefits ?? 0,
      availableBenefits: availableBenefits ?? 0,
      totalBenefits: (usedBenefits ?? 0) + (availableBenefits ?? 0),
      potentialSavings: null,
      subscriptionPrice: (payment as { amount_cents?: number } | null)
        ?.amount_cents
        ? (payment as { amount_cents: number }).amount_cents / 100
        : 59,
    },
  });
}
