import { Module } from "@nestjs/common";
import { MemberLoyaltyController } from "./member-loyalty.controller.js";
import { PartnerLoyaltyController } from "./partner-loyalty.controller.js";
import { AdminLoyaltyController } from "./admin-loyalty.controller.js";
import { PublicLoyaltyController } from "./public-loyalty.controller.js";
import { MemberAuthGuard } from "../members/member-auth.guard.js";
import { PartnerAuthGuard } from "../partners/partner-auth.guard.js";
import { AdminAuthGuard } from "../admin/admin-auth.guard.js";

@Module({
  controllers: [
    MemberLoyaltyController,
    PartnerLoyaltyController,
    AdminLoyaltyController,
    PublicLoyaltyController,
  ],
  providers: [MemberAuthGuard, PartnerAuthGuard, AdminAuthGuard],
})
export class LoyaltyModule {}