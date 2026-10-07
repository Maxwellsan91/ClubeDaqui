import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";
import {
  MemberAuthGuard,
  type AuthenticatedRequest,
} from "../members/member-auth.guard.js";

/* Supabase's untyped RPC result is normalized into the response contracts below. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller("me/loyalty")
@UseGuards(MemberAuthGuard)
export class MemberLoyaltyController {
  constructor(private readonly supabase: SupabaseService) {}

  // Todos os programas onde o membro já tem progresso.
  @Get()
  async overview(@Req() request: AuthenticatedRequest) {
    const { data, error } = await this.supabase
      .createUserClient(request.accessToken)
      .rpc("get_member_loyalty_overview");

    if (error) throw new BadRequestException(error.message);
    return { data: data ?? [] };
  }

  // Detalhe de um programa: selos, histórico, próxima recompensa, rewards.
  @Get(":businessId")
  async detail(
    @Param("businessId") businessId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const id = this.uuid(businessId);
    const { data, error } = await this.supabase
      .createUserClient(request.accessToken)
      .rpc("get_member_loyalty_detail", { p_business_id: id });

    if (error) throw new BadRequestException(error.message);
    return { data: data ?? null };
  }

  // Gera QR/código temporário para registar uma visita normal.
  @Post(":businessId/visits")
  @HttpCode(201)
  async createVisit(
    @Param("businessId") businessId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const id = this.uuid(businessId);
    const { data, error } = await this.supabase
      .createUserClient(request.accessToken)
      .rpc("create_loyalty_visit_attempt", { p_business_id: id });

    if (error) throw new BadRequestException(error.message);
    const visit = Array.isArray(data) ? data[0] : data;
    if (!visit) {
      throw new BadRequestException("Não foi possível iniciar a visita");
    }
    return { data: visit };
  }

  // Gera QR/código temporário para utilizar uma recompensa desbloqueada.
  @Post("rewards/:rewardRedemptionId/use")
  @HttpCode(201)
  async useReward(
    @Param("rewardRedemptionId") rewardRedemptionId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const id = this.uuid(rewardRedemptionId);
    const { data, error } = await this.supabase
      .createUserClient(request.accessToken)
      .rpc("reserve_loyalty_reward", { p_reward_redemption_id: id });

    if (error) throw new BadRequestException(error.message);
    const reserved = Array.isArray(data) ? data[0] : data;
    if (!reserved) {
      throw new BadRequestException("Não foi possível reservar a recompensa");
    }
    return { data: reserved };
  }

  private uuid(value: string) {
    if (!UUID.test(value.trim())) {
      throw new BadRequestException("Identificador inválido");
    }
    return value.trim();
  }
}