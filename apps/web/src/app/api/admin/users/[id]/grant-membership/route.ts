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
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAdmin();
  if (!user) return Response.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const db = createAdminClient();
    const { data: existing } = await db
      .from("memberships")
      .select("id")
      .eq("profile_id", id)
      .eq("status", "active")
      .gte("ends_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (existing) return Response.json({ error: "O utilizador já tem uma adesão activa" });

    const endsAt = new Date();
    endsAt.setFullYear(endsAt.getFullYear() + 1);
    const { data, error } = await db
      .from("memberships")
      .insert({
        profile_id: id,
        status: "active",
        starts_at: new Date().toISOString(),
        ends_at: endsAt.toISOString(),
        source: "ADMIN_GRANT",
      })
      .select("id,status,source,ends_at")
      .single();

    if (error) return Response.json({ error: error.message });
    return Response.json({ data });
  } catch {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
}