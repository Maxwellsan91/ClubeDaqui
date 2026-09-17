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
    name?: string;
    description?: string;
    isActive?: boolean;
    phone?: string;
    instagram?: string;
    websiteUrl?: string;
  };

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.description !== undefined) patch.description = body.description;
  if (body.isActive !== undefined) patch.is_active = body.isActive;
  if (body.phone !== undefined) patch.phone = body.phone;
  if (body.instagram !== undefined) patch.instagram = body.instagram;
  if (body.websiteUrl !== undefined) patch.website_url = body.websiteUrl;

  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("businesses")
      .update(patch)
      .eq("id", id)
      .select("id,name,slug,is_active")
      .single();
    if (error) return Response.json({ error: error.message });
    return Response.json({ data });
  } catch {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
}