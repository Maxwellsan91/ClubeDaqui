import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MEMBERSHIP_PRICE_EUR = 24;

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if ((profile as { role?: string } | null)?.role !== "ADMIN") return null;
  return user;
}

export async function GET() {
  const user = await checkAdmin();
  if (!user) return Response.json({ message: "Forbidden" }, { status: 403 });

  try {
    const db = createAdminClient();
    const now = new Date().toISOString();

    const [{ data, error }, { data: redemptionRows }, { data: financialRows }, { data: referralRows }] =
      await Promise.all([
        db
          .from("influencers")
          .select("id,name,email,unique_code,commission_rate,is_active,notes,created_at")
          .order("created_at", { ascending: false }),
        db
          .from("redemptions")
          .select("id,influencer_code")
          .eq("status", "CONFIRMED")
          .not("influencer_code", "is", null),
        db.from("redemption_financials").select("redemption_id,discount_amount"),
        db.from("referrals").select("influencer_code,status,validates_at,cancelled_at"),
      ]);

    if (error) return Response.json({ data: [], total: 0 });

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

    const referralStats = new Map<string, { pending: number; validated: number; cancelled: number }>();
    for (const r of (referralRows ?? []) as ReferralRow[]) {
      const code = r.influencer_code;
      const prev = referralStats.get(code) ?? { pending: 0, validated: 0, cancelled: 0 };
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
      const rf = referralStats.get(i.unique_code) ?? { pending: 0, validated: 0, cancelled: 0 };
      const validatedCommission = Math.round(rf.validated * MEMBERSHIP_PRICE_EUR * rate) / 100;
      const pendingCommission = Math.round(rf.pending * MEMBERSHIP_PRICE_EUR * rate) / 100;
      const redemptionCommission = Math.round(rd.economy * rate) / 100;
      return {
        id: i.id,
        name: i.name,
        email: i.email,
        uniqueCode: i.unique_code,
        commissionRate: rate,
        isActive: i.is_active,
        notes: i.notes,
        createdAt: i.created_at,
        referrals: {
          pending: rf.pending,
          validated: rf.validated,
          cancelled: rf.cancelled,
          total: rf.pending + rf.validated + rf.cancelled,
          pendingCommission,
          validatedCommission,
        },
        redemptions: {
          count: rd.count,
          economy: Math.round(rd.economy * 100) / 100,
          commission: redemptionCommission,
        },
        commissionDue: validatedCommission + redemptionCommission,
      };
    });

    return Response.json({ data: presented, total: presented.length });
  } catch {
    return Response.json({ data: [], total: 0 });
  }
}

export async function POST(request: Request) {
  const user = await checkAdmin();
  if (!user) return Response.json({ message: "Forbidden" }, { status: 403 });

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    commissionRate?: number;
    uniqueCode?: string;
    notes?: string;
  };

  const { name, email, commissionRate, notes } = body;
  if (!name || !email) return Response.json({ error: "name e email são obrigatórios" });

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

  try {
    const db = createAdminClient();
    const { data, error } = await db
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
    if (error) return Response.json({ error: error.message });
    return Response.json({ data });
  } catch {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
}