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

export async function GET() {
  const user = await checkAdmin();
  if (!user) return Response.json({ message: "Forbidden" }, { status: 403 });

  try {
    const db = createAdminClient();
    const now = new Date().toISOString();

    const [profiles, counts, authUsers, influencerRows, membershipRows] =
      await Promise.all([
        db
          .from("profiles")
          .select("id,full_name,role,is_active,created_at")
          .order("created_at", { ascending: false }),
        db
          .from("redemptions")
          .select("member_id")
          .eq("status", "CONFIRMED"),
        db.auth.admin.listUsers({ perPage: 1000 }),
        db.from("influencers").select("email").eq("is_active", true),
        db.from("memberships").select("profile_id,source,status,ends_at"),
      ]);

    if (profiles.error) return Response.json({ data: [], total: 0 });

    type PRow = {
      id: string;
      full_name: string | null;
      role: string;
      is_active: boolean;
      created_at: string;
    };
    type MRow = {
      profile_id: string;
      source: string;
      status: string;
      ends_at: string | null;
    };

    const countMap = new Map<string, number>();
    for (const r of (counts.data ?? []) as { member_id: string }[]) {
      countMap.set(r.member_id, (countMap.get(r.member_id) ?? 0) + 1);
    }

    const emailMap = new Map<string, string>(
      (authUsers.data?.users ?? []).map((u) => [u.id, u.email ?? ""]),
    );

    const influencerEmailSet = new Set(
      ((influencerRows.data ?? []) as { email: string }[]).map((i) =>
        i.email.toLowerCase(),
      ),
    );

    const activeMem = new Map<string, MRow>();
    for (const m of (membershipRows.data ?? []) as unknown as MRow[]) {
      if (m.status === "active" && (m.ends_at ?? "") >= now) {
        const ex = activeMem.get(m.profile_id);
        if (!ex || (m.ends_at ?? "") > (ex.ends_at ?? ""))
          activeMem.set(m.profile_id, m);
      }
    }

    const presented = ((profiles.data ?? []) as unknown as PRow[]).map((p) => {
      const email = emailMap.get(p.id) ?? "";
      const mem = activeMem.get(p.id);
      return {
        id: p.id,
        fullName: p.full_name ?? "—",
        email,
        role: p.role,
        isActive: p.is_active,
        createdAt: p.created_at,
        redemptionsCount: countMap.get(p.id) ?? 0,
        isInfluencer: influencerEmailSet.has(email.toLowerCase()),
        membershipStatus: mem ? "active" : "inactive",
        membershipSource: mem?.source ?? null,
        membershipEndsAt: mem?.ends_at ?? null,
      };
    });

    return Response.json({ data: presented, total: presented.length });
  } catch {
    return Response.json({ data: [], total: 0 });
  }
}