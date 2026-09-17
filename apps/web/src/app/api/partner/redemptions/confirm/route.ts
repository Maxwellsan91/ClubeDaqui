    import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { manual_code?: unknown };
  const code = body.manual_code;
  if (typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
    return Response.json(
      { message: "Introduza um código válido de 6 dígitos" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("confirm_redemption", {
    p_token: null,
    p_manual_code: code.trim(),
  });

  if (error) return Response.json({ message: error.message }, { status: 400 });
  const redemption = Array.isArray(data) ? data[0] : data;
  if (!redemption) {
    return Response.json(
      { message: "Não foi possível confirmar a utilização" },
      { status: 400 },
    );
  }
  return Response.json({ data: redemption });
}