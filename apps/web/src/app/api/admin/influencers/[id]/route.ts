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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAdmin();
  if (!user) return Response.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const db = createAdminClient();
    const { data: influencer } = await db
      .from("influencers")
      .select("id,name,email,unique_code,commission_rate,is_active,notes,created_at")
      .eq("id", id)
      .maybeSingle();
    if (!influencer) return Response.json({ error: "Não encontrado" });

    type InfRow = {
      id: string;
      name: string;
      email: string;
      unique_code: string;
      commission_rate: number;
      is_active: boolean;
      notes: string | null;
      created_at: string;
    };
    type RefRow = {
      id: string;
      member_id: string;
      status: string;
      created_at: string;
      validates_at: string;
      cancelled_at: string | null;
      profiles: { full_name: string | null } | null;
    };

    const inf = influencer as unknown as InfRow;
    const rate = Number(inf.commission_rate);
    const PRICE = MEMBERSHIP_PRICE_EUR;

    const { data: referrals } = await db
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

    return Response.json({
      data: {
        id: inf.id,
        name: inf.name,
        email: inf.email,
        uniqueCode: inf.unique_code,
        commissionRate: rate,
        isActive: inf.is_active,
        notes: inf.notes,
        createdAt: inf.created_at,
        totals,
        monthly,
        referrals: processed,
      },
    });
  } catch {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAdmin();
  if (!user) return Response.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    commissionRate?: number;
    isActive?: boolean;
    notes?: string;
  };

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.email !== undefined) patch.email = body.email;
  if (body.commissionRate !== undefined) patch.commission_rate = body.commissionRate;
  if (body.isActive !== undefined) patch.is_active = body.isActive;
  if (body.notes !== undefined) patch.notes = body.notes;

  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("influencers")
      .update(patch)
      .eq("id", id)
      .select("id,name,email,unique_code,commission_rate,is_active,notes,created_at")
      .single();
    if (error) return Response.json({ error: error.message });
    return Response.json({ data });
  } catch {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAdmin();
  if (!user) return Response.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const db = createAdminClient();
    const { error } = await db.from("influencers").delete().eq("id", id);
    if (error) return Response.json({ error: error.message });
    return Response.json({ data: { id } });
  } catch {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
}