import { Controller, Get, Param } from "@nestjs/common";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";
@Controller()
export class BenefitsController {
  constructor(private readonly supabase: SupabaseService) {}
  @Get("businesses/:businessId/benefits")
  async list(@Param("businessId") businessId: string) {
    try {
      const { data, error } = await this.supabase
        .createPublicClient()
        .from("benefits")
        .select("id,title,description,terms,type,valid_from,valid_until")
        .eq("business_id", businessId)
        .eq("is_active", true);
      if (error) throw error;
      return { data: data ?? [], total: data?.length ?? 0 };
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
