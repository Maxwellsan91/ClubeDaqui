import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
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

type RedemptionCodeBody = { manual_code?: unknown };

@Controller("partner/redemptions")
@UseGuards(MemberAuthGuard)
export class PartnerRedemptionsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post("preview")
  @HttpCode(200)
  async preview(
    @Body() body: RedemptionCodeBody,
    @Req() request: AuthenticatedRequest,
  ) {
    const manualCode = this.manualCode(body.manual_code);
    const { data, error } = await this.supabase
      .createUserClient(request.accessToken)
      .rpc("get_redemption_preview", {
        p_token: null,
        p_manual_code: manualCode,
      });

    if (error) throw new BadRequestException(error.message);
    const preview = Array.isArray(data) ? data[0] : data;
    if (!preview) {
      throw new BadRequestException(
        "Código inválido, expirado ou não associado ao seu estabelecimento",
      );
    }

    return { data: preview };
  }

  @Post("confirm")
  @HttpCode(200)
  async confirm(
    @Body() body: RedemptionCodeBody,
    @Req() request: AuthenticatedRequest,
  ) {
    const manualCode = this.manualCode(body.manual_code);
    const { data, error } = await this.supabase
      .createUserClient(request.accessToken)
      .rpc("confirm_redemption", {
        p_token: null,
        p_manual_code: manualCode,
      });

    if (error) throw new BadRequestException(error.message);
    const redemption = Array.isArray(data) ? data[0] : data;
    if (!redemption) {
      throw new BadRequestException("Não foi possível confirmar a utilização");
    }

    return { data: redemption };
  }

  private manualCode(value: unknown) {
    if (typeof value !== "string" || !/^\d{6}$/.test(value.trim())) {
      throw new BadRequestException("Introduza um código válido de 6 dígitos");
    }
    return value.trim();
  }
}
