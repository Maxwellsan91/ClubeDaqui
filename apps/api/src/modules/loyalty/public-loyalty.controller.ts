import { BadRequestException, Controller, Get, Param } from "@nestjs/common";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";

/* Supabase's untyped RPC result is normalized into the response contracts below. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Resumo público do programa de fidelização de um negócio (sem autenticação).
// Usado no bloco "Selos Daqui" da página do parceiro para visitantes anónimos.
@Controller("businesses")
export class PublicLoyaltyController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get(":businessId/loyalty")
  async summary(@Param("businessId") businessId: string) {
    if (!UUID.test(businessId.trim())) {
      throw new BadRequestException("Identificador inválido");
    }
    const { data, error } = await this.supabase
      .createPublicClient()
      .rpc("get_business_loyalty_summary", { p_business_id: businessId.trim() });

    if (error) throw new BadRequestException(error.message);
    return { data: data ?? null };
  }
}