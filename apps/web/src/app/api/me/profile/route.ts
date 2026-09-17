import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,phone,nif")
    .eq("id", user.id)
    .maybeSingle();

  return Response.json({
    data: {
      fullName:
        (profile as { full_name?: string | null } | null)?.full_name ?? null,
      phone: (profile as { phone?: string | null } | null)?.phone ?? null,
      nif: (profile as { nif?: string | null } | null)?.nif ?? null,
      email: user.email ?? null,
    },
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    fullName?: string;
    phone?: string;
    nif?: string;
  };

  if (body.nif !== undefined) {
    if (!/^\d{9}$/.test(body.nif)) {
      return Response.json(
        { error: "NIF inválido — deve ter 9 dígitos" },
        { status: 400 },
      );
    }
    const { data: existing } = await supabase
      .from("profiles")
      .select("nif")
      .eq("id", user.id)
      .maybeSingle();
    if ((existing as { nif?: string | null } | null)?.nif) {
      return Response.json(
        { error: "O NIF não pode ser alterado após estar definido" },
        { status: 400 },
      );
    }
  }

  const patch: Record<string, unknown> = {};
  if (body.fullName !== undefined)
    patch.full_name = body.fullName.trim() || null;
  if (body.phone !== undefined) patch.phone = body.phone.trim() || null;
  if (body.nif !== undefined) patch.nif = body.nif;

  if (Object.keys(patch).length === 0) return Response.json({ data: {} });

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select("full_name,phone,nif")
    .single();

  if (error?.code === "23505") {
    return Response.json(
      { error: "Este NIF já está registado noutro utilizador" },
      { status: 409 },
    );
  }
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  type ProfileRow = {
    full_name: string | null;
    phone: string | null;
    nif: string | null;
  };
  const p = data as unknown as ProfileRow;
  return Response.json({
    data: { fullName: p.full_name, phone: p.phone, nif: p.nif },
  });
}
