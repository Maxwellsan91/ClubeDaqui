import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();
  if (!adminUser) return Response.json({ message: "Unauthorized" }, { status: 401 });
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role,full_name")
    .eq("id", adminUser.id)
    .maybeSingle();
  if ((adminProfile as { role?: string } | null)?.role !== "ADMIN") {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { isActive?: boolean; reason?: string };
  if (body.isActive === undefined) return Response.json({ error: "isActive é obrigatório" });
  if (!body.reason?.trim())
    return Response.json({ error: "É obrigatório indicar o motivo da alteração" });

  try {
    const db = createAdminClient();
    const { data: profile } = await db
      .from("profiles")
      .select("is_active,full_name")
      .eq("id", id)
      .maybeSingle();
    if (!profile) return Response.json({ error: "Utilizador não encontrado" });

    const p = profile as { is_active: boolean; full_name: string | null };
    const adminName =
      (adminProfile as { role?: string; full_name?: string | null } | null)?.full_name ?? "Admin";

    await db.from("profiles").update({ is_active: body.isActive }).eq("id", id);
    await db.from("profile_status_logs").insert({
      profile_id: id,
      changed_by_id: adminUser.id,
      changed_by_name: adminName,
      previous_active: p.is_active,
      new_active: body.isActive,
      reason: body.reason.trim(),
    });

    return Response.json({ data: { id, isActive: body.isActive } });
  } catch {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
}