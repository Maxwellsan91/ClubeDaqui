import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rawCode = (user.user_metadata?.referral_code as string | undefined)
    ?.trim()
    .toUpperCase();
  if (!rawCode || !/^[A-Z0-9_-]{3,32}$/.test(rawCode)) {
    return Response.json({ data: null });
  }

  const { data: influencer } = await supabase
    .from("influencers")
    .select("id")
    .eq("unique_code", rawCode)
    .eq("is_active", true)
    .maybeSingle();
  if (!influencer) return Response.json({ data: null });

  const validatesAt = new Date(
    Date.now() + 15 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data } = await supabase
    .from("referrals")
    .upsert(
      {
        influencer_code: rawCode,
        member_id: user.id,
        status: "PENDING",
        validates_at: validatesAt,
      },
      { onConflict: "influencer_code,member_id", ignoreDuplicates: true },
    )
    .select()
    .maybeSingle();

  return Response.json({ data });
}
