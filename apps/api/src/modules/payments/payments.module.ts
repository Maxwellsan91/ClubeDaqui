import { Module } from "@nestjs/common";

import { SupabaseModule } from "../../infrastructure/supabase/supabase.module.js";
import { MemberAuthGuard } from "../members/member-auth.guard.js";
import { InvoicingModule } from "../invoicing/invoicing.module.js";
import { PaymentsController } from "./payments.controller.js";
import { PaymentsService } from "./payments.service.js";

@Module({
  imports: [SupabaseModule, InvoicingModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MemberAuthGuard],
})
export class PaymentsModule {}
