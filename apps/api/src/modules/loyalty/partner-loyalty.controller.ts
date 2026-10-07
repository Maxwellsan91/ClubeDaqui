import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { z } from "zod";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { type AuthenticatedRequest } from "../members/member-auth.guard.js";
import { PartnerAuthGuard } from "../partners/partner-auth.guard.js";

/* Supabase's untyped result is normalized into the response contracts below. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

const codeSchema = z
  .object({ manual_code: z.string().trim().regex(/^\d{6}$/) })
  .strict();

const visitValidateSchema = z
  .object({
    manual_code: z.string().trim().regex(/^\d{6}$/),
    bill_amount: z
      .union([
        z.number().finite().min(0).max(1_000_000),
        z.string().trim().regex(/^\d{1,7}(?:[.,]\d{1,2})?$/),
      ])
      .optional(),
  })
  .strict();

@Controller("partner/loyalty")
@UseGuards(PartnerAuthGuard)
export class PartnerLoyaltyController {
  constructor(private readonly supabase: SupabaseService) {}

  // Programa(s) do parceiro + recompensas (RLS filtra pelos seus businesses).
  @Get("program")
  async program(@Req() request: AuthenticatedRequest) {
    const { data, error } = await this.supabase
      .createUserClient(request.accessToken)
      .from("loyalty_programs")
      .select(
        "id,business_id,name,description,is_active,stamp_rule_type,minimum_spend,max_stamps_per_day,starts_at,ends_at,loyalty_rewards(id,title,description,required_stamps,reward_type,is_active)",
      )
      .order("created_at", { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return { data: data ?? [] };
  }

  // Métricas de fidelização para o dashboard do parceiro.
  @Get("dashboard")
  async dashboard(@Req() request: AuthenticatedRequest) {
    const { data, error } = await this.supabase
      .createUserClient(request.accessToken)
      .rpc("get_partner_loyalty_dashboard");

    if (error) throw new BadRequestException(error.message);
    return { data: data ?? null };
  }

  // Últimas visitas validadas.
  @Get("visits")
  async visits(@Req() request: AuthenticatedRequest) {
    const { data, error } = await this.supabase
      .createUserClient(request.accessToken)
      .from("loyalty_visits")
      .select(
        "id,business_id,visit_date,validated_at,bill_amount,source_type,status",
      )
      .eq("status", "validated")
      .order("validated_at", { ascending: false })
      .limit(50);

    if (error) throw new BadRequestException(error.message);
    return { data: data ?? [] };
  }

  // Pré-visualiza uma visita pendente antes de validar.
  @Post("visits/preview")
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(codeSchema))
  async previewVisit(
    @Body() body: z.infer<typeof codeSchema>,
    @Req() request: AuthenticatedRequest,
  ) {
    const { data, error } = await this.supabase
      .createUserClient(request.accessToken)
      .rpc("get_loyalty_visit_preview", {
        p_token: null,
        p_manual_code: body.manual_code,
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

  // Valida a visita -> emite selo automaticamente (via trigger).
  @Post("visits/validate")
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(visitValidateSchema))
  async validateVisit(
    @Body() body: z.infer<typeof visitValidateSchema>,
    @Req() request: AuthenticatedRequest,
  ) {
    const bill =
      body.bill_amount === undefined
        ? null
        : Number(String(body.bill_amount).replace(",", "."));
    const { data, error } = await this.supabase
      .createUserClient(request.accessToken)
      .rpc("confirm_loyalty_visit", {
        p_token: null,
        p_manual_code: body.manual_code,
        p_bill_amount: bill,
      });

    if (error) throw new BadRequestException(error.message);
    const visit = Array.isArray(data) ? data[0] : data;
    if (!visit) throw new BadRequestException("Não foi possível validar a visita");
    return { data: visit };
  }

  // Valida a utilização de uma recompensa reservada.
  @Post("rewards/validate")
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(codeSchema))
  async validateReward(
    @Body() body: z.infer<typeof codeSchema>,
    @Req() request: AuthenticatedRequest,
  ) {
    const { data, error } = await this.supabase
      .createUserClient(request.accessToken)
      .rpc("confirm_loyalty_reward", {
        p_token: null,
        p_manual_code: body.manual_code,
      });

    if (error) throw new BadRequestException(error.message);
    const reward = Array.isArray(data) ? data[0] : data;
    if (!reward) {
      throw new BadRequestException("Não foi possível validar a recompensa");
    }
    return { data: reward };
  }
}