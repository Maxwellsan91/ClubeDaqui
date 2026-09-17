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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAdmin();
  if (!user) return Response.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await request.json()) as { status?: string };
  const allowed = ["PENDING", "VALIDATED", "CANCELLED"];
  if (!body.status || !allowed.includes(body.status)) {
    return Response.json({ error: "Status inválido" });
  }

  const patch: Record<string, unknown> = { status: body.status };
  if (body.status === "CANCELLED") patch.cancelled_at = new Date().toISOString();

  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("referrals")
      .update(patch)
      .eq("id", id)
      .select("id,status")
      .single();
    if (error) return Response.json({ error: error.message });
    return Response.json({ data });
  } catch {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
}