import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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
  const adminUser = await checkAdmin();
  if (!adminUser) return Response.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const db = createAdminClient();

    type ProfileRow = {
      id: string;
      full_name: string | null;
      phone: string | null;
      nif: string | null;
      role: string;
      is_active: boolean;
      created_at: string;
    };
    type MembershipRow = {
      id: string;
      status: string;
      source: string;
      ends_at: string | null;
      created_at: string;
    };
    type LogRow = {
      id: string;
      previous_active: boolean;
      new_active: boolean;
      reason: string;
      changed_by_name: string;
      created_at: string;
    };

    const [profileRes, authRes, membershipsRes, statusLogsRes] = await Promise.all([
      db
        .from("profiles")
        .select("id,full_name,phone,nif,role,is_active,created_at")
        .eq("id", id)
        .maybeSingle(),
      db.auth.admin.getUserById(id),
      db
        .from("memberships")
        .select("id,status,source,ends_at,created_at")
        .eq("profile_id", id)
        .order("created_at", { ascending: false }),
      db
        .from("profile_status_logs")
        .select("id,previous_active,new_active,reason,changed_by_name,created_at")
        .eq("profile_id", id)
        .order("created_at", { ascending: false }),
    ]);

    const p = profileRes.data as unknown as ProfileRow | null;
    if (!p) return Response.json({ error: "Utilizador não encontrado" });

    const email = authRes.data?.user?.email ?? "";
    const membershipIds = ((membershipsRes.data ?? []) as MembershipRow[]).map((m) => m.id);

    const [influencerRes, redemptionRes] = await Promise.all([
      db
        .from("influencers")
        .select("id,unique_code,commission_rate")
        .eq("email", email)
        .maybeSingle(),
      membershipIds.length
        ? db
            .from("redemptions")
            .select("id,redeemed_at,status,benefits(title,businesses(name))")
            .in("membership_id", membershipIds)
            .order("redeemed_at", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [] as unknown[] }),
    ]);

    const inf = influencerRes.data as unknown as {
      id: string;
      unique_code: string;
      commission_rate: number;
    } | null;

    return Response.json({
      data: {
        id: p.id,
        fullName: p.full_name ?? "—",
        phone: p.phone ?? null,
        nif: p.nif ?? null,
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
        influencer: inf
          ? {
              id: inf.id,
              uniqueCode: inf.unique_code,
              commissionRate: Number(inf.commission_rate),
            }
          : null,
        statusLogs: ((statusLogsRes.data ?? []) as unknown as LogRow[]).map((l) => ({
          id: l.id,
          previousActive: l.previous_active,
          newActive: l.new_active,
          reason: l.reason,
          changedByName: l.changed_by_name,
          createdAt: l.created_at,
        })),
      },
    });
  } catch {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
}