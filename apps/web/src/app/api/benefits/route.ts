import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("benefits")
      .select(
        "id,title,description,terms,type,business_id,businesses(name,slug)",
      )
      .eq("is_active", true);
    if (error) throw error;
    return Response.json({ data: data ?? [], total: data?.length ?? 0 });
  } catch {
    return Response.json({ data: [], total: 0 });
  }
}
