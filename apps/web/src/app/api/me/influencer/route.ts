import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.email) return Response.json({ data: null });

  type InfRow = {
    id: string;
    name: string;
    unique_code: string;
    commission_rate: number;
    is_active: boolean;
  };
  type RefRow = {
    status: string;
    created_at: string;
    validates_at: string;
    cancelled_at: string | null;
  };

  const { data: influencer } = await supabase
    .from("influencers")
    .select("id,name,unique_code,commission_rate,is_active")
    .eq("email", user.email)
    .eq("is_active", true)
    .maybeSingle();

  if (!influencer) return Response.json({ data: null });

  const inf = influencer as unknown as InfRow;
  const { data: referrals } = await supabase
    .from("referrals")
    .select("status,created_at,validates_at,cancelled_at")
    .eq("influencer_code", inf.unique_code)
    .order("validates_at", { ascending: false });

  const now = new Date().toISOString();
  const rate = Number(inf.commission_rate);
  const PRICE = 24;

  const monthMap = new Map<
    string,
    { pending: number; validated: number; cancelled: number }
  >();
  for (const r of (referrals ?? []) as RefRow[]) {
    const d = new Date(r.validates_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const prev = monthMap.get(key) ?? {
      pending: 0,
      validated: 0,
      cancelled: 0,
    };
    if (r.status === "CANCELLED") {
      monthMap.set(key, { ...prev, cancelled: prev.cancelled + 1 });
    } else if (r.validates_at <= now) {
      monthMap.set(key, { ...prev, validated: prev.validated + 1 });
    } else {
      monthMap.set(key, { ...prev, pending: prev.pending + 1 });
    }
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

  const total = (referrals ?? []).length;
  const totalValidated = monthly.reduce((s, m) => s + m.validated, 0);
  const totalPending = monthly.reduce((s, m) => s + m.pending, 0);

  return Response.json({
    data: {
      id: inf.id,
      name: inf.name,
      uniqueCode: inf.unique_code,
      commissionRate: rate,
      totalReferrals: total,
      totalValidated,
      totalPending,
      totalValidatedCommission: Math.round(totalValidated * PRICE * rate) / 100,
      totalPendingCommission: Math.round(totalPending * PRICE * rate) / 100,
      monthly,
    },
  });
}
