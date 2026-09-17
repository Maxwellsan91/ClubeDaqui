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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAdmin();
  if (!user) return Response.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await request.json()) as {
    commissionRate?: number;
    customCode?: string;
  };

  try {
    const db = createAdminClient();
    const { data: authUser, error: authError } = await db.auth.admin.getUserById(id);
    if (authError || !authUser.user?.email) {
      return Response.json({ error: "Utilizador não encontrado" });
    }
    const email = authUser.user.email;

    const { data: existingInfluencer } = await db
      .from("influencers")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existingInfluencer) {
      return Response.json({ error: "Este utilizador já é influencer" });
    }

    const { data: profile } = await db
      .from("profiles")
      .select("full_name")
      .eq("id", id)
      .maybeSingle();
    const name = (profile as { full_name: string | null } | null)?.full_name ?? email;

    const code =
      body.customCode?.trim().toUpperCase() ||
      name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 4)
        .toUpperCase()
        .padEnd(4, "X") +
        "-" +
        Math.floor(1000 + Math.random() * 9000).toString();

    const { data: influencer, error: infError } = await db
      .from("influencers")
      .insert({
        name,
        email,
        unique_code: code,
        commission_rate: body.commissionRate ?? 10,
        is_active: true,
      })
      .select("id,unique_code")
      .single();
    if (infError) return Response.json({ error: infError.message });

    const { data: existingMembership } = await db
      .from("memberships")
      .select("id")
      .eq("profile_id", id)
      .eq("status", "active")
      .gte("ends_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    await db.from("profiles").update({ role: "INFLUENCER" }).eq("id", id);

    if (!existingMembership) {
      const endsAt = new Date();
      endsAt.setFullYear(endsAt.getFullYear() + 1);
      await db.from("memberships").insert({
        profile_id: id,
        status: "active",
        starts_at: new Date().toISOString(),
        ends_at: endsAt.toISOString(),
        source: "INFLUENCER_GRANT",
      });
    }

    return Response.json({ data: influencer });
  } catch {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
}