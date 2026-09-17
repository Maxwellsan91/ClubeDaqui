import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if ((profile as { role?: string } | null)?.role !== "ADMIN") {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { role?: string };
  const allowed = ["MEMBER", "PARTNER", "ADMIN", "INFLUENCER"];
  if (!body.role || !allowed.includes(body.role)) {
    return Response.json({
      error: "Role inválido. Use: MEMBER, PARTNER, ADMIN ou INFLUENCER",
    });
  }
  if (id === user.id) {
    return Response.json({ error: "Não pode alterar a sua própria role" }, { status: 400 });
  }
  if (body.role === "ADMIN") {
    return Response.json(
      { error: "A atribuição de ADMIN requer um procedimento de superadmin" },
      { status: 400 },
    );
  }

  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("profiles")
      .update({ role: body.role })
      .eq("id", id)
      .select("id,full_name,role")
      .single();
    if (error) return Response.json({ error: error.message });
    return Response.json({ data });
  } catch {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
}