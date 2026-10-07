import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { z } from "zod";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { AdminAuthGuard } from "../admin/admin-auth.guard.js";

/* Admin mutations use the service-role client; results are untyped. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const stampRuleType = z.enum(["VISIT", "MINIMUM_SPEND"]);
const rewardType = z.enum([
  "PERCENTAGE_DISCOUNT",
  "FIXED_DISCOUNT",
  "FREE_ITEM",
  "BUY_ONE_GET_ONE",
  "CUSTOM",
]);
const money = z.number().finite().min(0).max(1_000_000);

const programCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2_000).optional(),
    isActive: z.boolean().optional(),
    stampRuleType: stampRuleType.optional(),
    minimumSpend: money.optional(),
    maxStampsPerDay: z.number().int().min(1).max(50).optional(),
    startsAt: z.string().datetime({ offset: true }).optional(),
    endsAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

const programUpdateSchema = programCreateSchema.partial();

const rewardCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2_000).optional(),
    requiredStamps: z.number().int().min(1).max(100),
    rewardType,
    percentageDiscount: z.number().finite().min(0).max(100).optional(),
    fixedDiscount: money.optional(),
    freeItemDescription: z.string().trim().max(500).optional(),
    customDescription: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional(),
    validityDaysAfterUnlock: z.number().int().min(1).max(3_650).optional(),
  })
  .strict();

const rewardUpdateSchema = rewardCreateSchema.partial();

@Controller("admin")
@UseGuards(AdminAuthGuard)
export class AdminLoyaltyController {
  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.createAdminClient();
  }

  @Post("businesses/:id/loyalty-program")
  @UsePipes(new ZodValidationPipe(programCreateSchema))
  async createProgram(
    @Param("id") businessId: string,
    @Body() body: z.infer<typeof programCreateSchema>,
  ) {
    const id = this.uuid(businessId);
    const { data, error } = await this.db
      .from("loyalty_programs")
      .insert({
        business_id: id,
        name: body.name,
        description: body.description ?? null,
        is_active: body.isActive ?? false,
        stamp_rule_type: body.stampRuleType ?? "VISIT",
        minimum_spend: body.minimumSpend ?? null,
        max_stamps_per_day: body.maxStampsPerDay ?? 1,
        starts_at: body.startsAt ?? null,
        ends_at: body.endsAt ?? null,
      })
      .select("*")
      .single();

    if (error) throw new BadRequestException(error.message);
    return { data };
  }

  @Patch("loyalty-programs/:id")
  @UsePipes(new ZodValidationPipe(programUpdateSchema))
  async updateProgram(
    @Param("id") programId: string,
    @Body() body: z.infer<typeof programUpdateSchema>,
  ) {
    const id = this.uuid(programId);
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.description !== undefined) patch.description = body.description;
    if (body.isActive !== undefined) patch.is_active = body.isActive;
    if (body.stampRuleType !== undefined) patch.stamp_rule_type = body.stampRuleType;
    if (body.minimumSpend !== undefined) patch.minimum_spend = body.minimumSpend;
    if (body.maxStampsPerDay !== undefined) patch.max_stamps_per_day = body.maxStampsPerDay;
    if (body.startsAt !== undefined) patch.starts_at = body.startsAt;
    if (body.endsAt !== undefined) patch.ends_at = body.endsAt;

    const { data, error } = await this.db
      .from("loyalty_programs")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new BadRequestException(error.message);
    return { data };
  }

  @Post("loyalty-programs/:id/rewards")
  @UsePipes(new ZodValidationPipe(rewardCreateSchema))
  async createReward(
    @Param("id") programId: string,
    @Body() body: z.infer<typeof rewardCreateSchema>,
  ) {
    const id = this.uuid(programId);
    const { data, error } = await this.db
      .from("loyalty_rewards")
      .insert({
        loyalty_program_id: id,
        title: body.title,
        description: body.description ?? null,
        required_stamps: body.requiredStamps,
        reward_type: body.rewardType,
        percentage_discount: body.percentageDiscount ?? null,
        fixed_discount: body.fixedDiscount ?? null,
        free_item_description: body.freeItemDescription ?? null,
        custom_description: body.customDescription ?? null,
        is_active: body.isActive ?? true,
        validity_days_after_unlock: body.validityDaysAfterUnlock ?? null,
      })
      .select("*")
      .single();

    if (error) throw new BadRequestException(error.message);
    return { data };
  }

  @Patch("loyalty-rewards/:id")
  @UsePipes(new ZodValidationPipe(rewardUpdateSchema))
  async updateReward(
    @Param("id") rewardId: string,
    @Body() body: z.infer<typeof rewardUpdateSchema>,
  ) {
    const id = this.uuid(rewardId);
    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.requiredStamps !== undefined) patch.required_stamps = body.requiredStamps;
    if (body.rewardType !== undefined) patch.reward_type = body.rewardType;
    if (body.percentageDiscount !== undefined) patch.percentage_discount = body.percentageDiscount;
    if (body.fixedDiscount !== undefined) patch.fixed_discount = body.fixedDiscount;
    if (body.freeItemDescription !== undefined) patch.free_item_description = body.freeItemDescription;
    if (body.customDescription !== undefined) patch.custom_description = body.customDescription;
    if (body.isActive !== undefined) patch.is_active = body.isActive;
    if (body.validityDaysAfterUnlock !== undefined) patch.validity_days_after_unlock = body.validityDaysAfterUnlock;

    const { data, error } = await this.db
      .from("loyalty_rewards")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new BadRequestException(error.message);
    return { data };
  }

  private uuid(value: string) {
    if (!UUID.test(value.trim())) {
      throw new BadRequestException("Identificador inválido");
    }
    return value.trim();
  }
}