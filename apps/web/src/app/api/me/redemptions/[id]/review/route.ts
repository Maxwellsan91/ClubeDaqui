import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: redemptionId } = await params;
  const body = (await request.json()) as {
    rating?: unknown;
    comment?: unknown;
  };

  const rating =
    typeof body.rating === "number" ? body.rating : Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json(
      { error: "A avaliação deve ser entre 1 e 5 estrelas" },
      { status: 400 },
    );
  }
  const comment =
    typeof body.comment === "string" && body.comment.trim()
      ? body.comment.trim()
      : null;

  const { data: redemption } = await supabase
    .from("redemptions")
    .select("id,business_location_id,membership_id")
    .eq("id", redemptionId)
    .eq("status", "redeemed")
    .maybeSingle();

  if (!redemption) {
    return Response.json(
      { error: "Utilização não encontrada ou não confirmada" },
      { status: 400 },
    );
  }

  type RRow = {
    id: string;
    business_location_id: string;
    membership_id: string;
  };
  const r = redemption as unknown as RRow;

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      redemption_id: r.id,
      profile_id: user.id,
      business_location_id: r.business_location_id,
      food_rating: rating,
      service_rating: rating,
      ambience_rating: rating,
      value_rating: rating,
      comment,
      status: "pending",
      published_at: null,
    })
    .select("id,food_rating,comment,published_at")
    .single();

  if (error?.code === "23505") {
    return Response.json(
      { error: "Esta utilização já tem uma avaliação" },
      { status: 409 },
    );
  }
  if (error) {
    return Response.json(
      { error: "Não foi possível guardar a avaliação" },
      { status: 400 },
    );
  }

  return Response.json({ data });
}
