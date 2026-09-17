import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BenefitRow = {
  id: string;
  title: string;
  description: string | null;
  terms: string | null;
  type: string;
  valid_from: string | null;
  valid_until: string | null;
  benefit_rules: {
    allowed_weekdays: number[];
    starts_at: string | null;
    ends_at: string | null;
    reservation_required: boolean;
    membership_cycle_limit: number;
  } | null;
};

function pgDowToFrontend(dow: number): number {
  return (dow + 6) % 7;
}

function presentBenefit(row: BenefitRow) {
  const rules = row.benefit_rules;
  const schedule = rules?.allowed_weekdays
    ? rules.allowed_weekdays
        .map((pgDow) => ({
          day: pgDowToFrontend(pgDow),
          time:
            rules.starts_at && rules.ends_at
              ? `${rules.starts_at.slice(0, 5)}–${rules.ends_at.slice(0, 5)}`
              : "Consulte o estabelecimento",
        }))
        .sort((a, b) => a.day - b.day)
    : [];
  const validDays = rules?.allowed_weekdays
    ? rules.allowed_weekdays.map(pgDowToFrontend).sort()
    : [];
  const parsedRules = row.terms
    ? row.terms
        .split(/\n|•|;/)
        .map((r) => r.trim())
        .filter(Boolean)
    : [];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    terms: row.terms,
    rules: parsedRules,
    schedule,
    validDays,
    reservationRequired: rules?.reservation_required ?? false,
    cycleLimit: rules?.membership_cycle_limit ?? 1,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("benefits")
      .select(
        "id,title,description,terms,type,valid_from,valid_until,benefit_rules(allowed_weekdays,starts_at,ends_at,reservation_required,membership_cycle_limit)",
      )
      .eq("business_id", slug)
      .eq("is_active", true);
    if (error) throw error;
    const presented = (data as unknown as BenefitRow[]).map(presentBenefit);
    return Response.json({ data: presented, total: presented.length });
  } catch {
    return Response.json({ data: [], total: 0 });
  }
}
