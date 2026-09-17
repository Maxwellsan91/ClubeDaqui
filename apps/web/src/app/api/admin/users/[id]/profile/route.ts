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
  const body = (await request.json()) as {
    fullName?: string;
    phone?: string;
    nif?: string;
  };

  const patch: Record<string, unknown> = {};
  if (body.fullName !== undefined) patch.full_name = body.fullName.trim() || null;
  if (body.phone !== undefined) patch.phone = body.phone.trim() || null;
  if (body.nif !== undefined) {
    if (body.nif && !/^\d{9}$/.test(body.nif))
      return Response.json({ error: "NIF inválido — deve ter 9 dígitos" });
    patch.nif = body.nif || null;
  }
  if (Object.keys(patch).length === 0) return Response.json({ data: {} });

  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("profiles")
      .update(patch)
      .eq("id", id)
      .select("full_name,phone,nif")
      .single();
    if (error?.code === "23505")
      return Response.json({ error: "Este NIF já está registado noutro utilizador" });
    if (error) return Response.json({ error: error.message });
    return Response.json({ data });
  } catch {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
}