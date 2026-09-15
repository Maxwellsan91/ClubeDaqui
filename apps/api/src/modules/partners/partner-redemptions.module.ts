import { Module } from "@nestjs/common";
import { PartnerRedemptionsController } from "./partner-redemptions.controller.js";
import { PartnerAuthGuard } from "./partner-auth.guard.js";

@Module({
  controllers: [PartnerRedemptionsController],
  providers: [PartnerAuthGuard],
})
export class PartnerRedemptionsModule {}
