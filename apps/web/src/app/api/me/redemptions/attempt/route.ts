import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    benefit_id?: string;
    business_location_id?: string;
  };

  if (
    typeof body.benefit_id !== "string" ||
    typeof body.business_location_id !== "string"
  ) {
    return Response.json(
      { error: "Benefício e localização são obrigatórios" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("create_redemption_attempt", {
    p_benefit_id: body.benefit_id,
    p_business_location_id: body.business_location_id,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ data: Array.isArray(data) ? data[0] : data });
}
