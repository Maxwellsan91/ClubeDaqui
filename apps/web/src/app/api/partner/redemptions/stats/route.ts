import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.rpc("get_partner_dashboard");
  if (error) return Response.json({ message: error.message }, { status: 400 });
  return Response.json({ data: data ?? null });
}