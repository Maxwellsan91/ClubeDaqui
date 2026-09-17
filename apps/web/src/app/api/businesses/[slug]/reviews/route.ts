import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RevRow = {
  id: string;
  food_rating: number;
  service_rating: number;
  ambience_rating: number;
  value_rating: number;
  comment: string | null;
  published_at: string;
  profiles: { full_name: string | null } | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const supabase = await createClient();
    const { data: biz } = await supabase
      .from("businesses")
      .select("business_locations(id)")
      .eq("slug", slug)
      .maybeSingle();

    type BizRow = { business_locations: { id: string }[] };
    const locationIds = (
      (biz as unknown as BizRow | null)?.business_locations ?? []
    ).map((l) => l.id);

    if (!locationIds.length) {
      return Response.json({ data: [], avgRating: null, totalCount: 0 });
    }

    const { data: rows } = await supabase
      .from("reviews")
      .select(
        "id,food_rating,service_rating,ambience_rating,value_rating,comment,published_at,profiles(full_name)",
      )
      .in("business_location_id", locationIds)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(20);

    const reviews = (rows ?? []) as unknown as RevRow[];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce(
            (sum, r) =>
              sum +
              (r.food_rating +
                r.service_rating +
                r.ambience_rating +
                r.value_rating) /
                4,
            0,
          ) / reviews.length
        : null;

    return Response.json({
      data: reviews.map((r) => ({
        id: r.id,
        rating:
          Math.round(
            ((r.food_rating +
              r.service_rating +
              r.ambience_rating +
              r.value_rating) /
              4) *
              10,
          ) / 10,
        comment: r.comment,
        publishedAt: r.published_at,
        reviewerName: r.profiles?.full_name ?? "Membro do Clube",
      })),
      avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
      totalCount: reviews.length,
    });
  } catch {
    return Response.json({ data: [], avgRating: null, totalCount: 0 });
  }
}
