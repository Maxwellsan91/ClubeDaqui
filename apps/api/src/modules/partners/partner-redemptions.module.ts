import { Module } from "@nestjs/common";
import { MemberAuthGuard } from "../members/member-auth.guard.js";
import { PartnerRedemptionsController } from "./partner-redemptions.controller.js";

@Module({
  controllers: [PartnerRedemptionsController],
  providers: [MemberAuthGuard],
})
export class PartnerRedemptionsModule {}
