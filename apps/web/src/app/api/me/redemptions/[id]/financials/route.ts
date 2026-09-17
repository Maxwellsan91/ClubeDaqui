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
    total_bill_amount?: unknown;
    discount_amount?: unknown;
  };

  function parseAmount(value: unknown): number | null {
    const parsed =
      typeof value === "number"
        ? value
        : typeof value === "string" && value.trim()
          ? Number(value)
          : NaN;
    return Number.isFinite(parsed) && parsed >= 0
      ? Math.round(parsed * 100) / 100
      : null;
  }

  const total = parseAmount(body.total_bill_amount);
  const discount = parseAmount(body.discount_amount);
  if (total === null || discount === null || discount > total) {
    return Response.json(
      { error: "Valores de fatura e desconto inválidos" },
      { status: 400 },
    );
  }

  const { data: redemption } = await supabase
    .from("redemptions")
    .select("id")
    .eq("id", redemptionId)
    .eq("status", "redeemed")
    .maybeSingle();
  if (!redemption) {
    return Response.json(
      { error: "Utilização não encontrada" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("redemption_financials")
    .insert({
      redemption_id: redemptionId,
      total_bill_amount: total,
      discount_amount: discount,
      savings_recorded_by: user.id,
    })
    .select(
      "id,redemption_id,total_bill_amount,discount_amount,savings_recorded_at",
    )
    .single();

  if (error?.code === "23505") {
    return Response.json(
      { error: "Esta utilização já tem uma economia registada" },
      { status: 409 },
    );
  }
  if (error) {
    return Response.json(
      { error: "Não foi possível guardar a economia" },
      { status: 400 },
    );
  }

  return Response.json({ data });
}
