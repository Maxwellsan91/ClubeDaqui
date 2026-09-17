import { Controller, Get, Param } from "@nestjs/common";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";

// PG extract(dow): 0=Sun,1=Mon,...,6=Sat → frontend: 0=Mon,...,6=Sun
function pgDowToFrontend(dow: number): number {
  return (dow + 6) % 7;
}

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

function presentBenefit(row: BenefitRow) {
  const rules = row.benefit_rules;

  // Build schedule: one entry per open day with formatted time window
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

  // validDays: frontend day indices where benefit applies
  const validDays = rules?.allowed_weekdays
    ? rules.allowed_weekdays.map(pgDowToFrontend).sort()
    : [];

  // Parse terms into rules array
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

@Controller()
export class BenefitsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get("businesses/:businessId/benefits")
  async list(@Param("businessId") businessId: string) {
    try {
      const { data, error } = await this.supabase
        .createPublicClient()
        .from("benefits")
        .select(
          "id,title,description,terms,type,valid_from,valid_until,benefit_rules(allowed_weekdays,starts_at,ends_at,reservation_required,membership_cycle_limit)",
        )
        .eq("business_id", businessId)
        .eq("is_active", true);
      if (error) throw error;
      const presented = (data as unknown as BenefitRow[]).map(presentBenefit);
      return { data: presented, total: presented.length };
    } catch {
      return { data: [], total: 0 };
    }
  }

  @Get("benefits")
  async all() {
    try {
      const { data, error } = await this.supabase
        .createPublicClient()
        .from("benefits")
        .select(
          "id,title,description,terms,type,business_id,businesses(name,slug)",
        )
        .eq("is_active", true);
      if (error) throw error;
      return { data: data ?? [], total: data?.length ?? 0 };
    } catch {
      return { data: [], total: 0 };
    }
  }
}
