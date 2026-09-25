import { Module } from "@nestjs/common";

import { AdminAuthGuard } from "../admin/admin-auth.guard.js";
import { MemberAuthGuard } from "../members/member-auth.guard.js";
import {
  AdminFiscalDocumentsController,
  MemberFiscalDocumentsController,
} from "./invoicing.controller.js";
import { InvoicingService } from "./invoicing.service.js";
import { InvoiceXpressClient } from "./invoicexpress/invoicexpress.client.js";
import { InvoiceXpressService } from "./invoicexpress/invoicexpress.service.js";
import { INVOICING_PROVIDER } from "./providers/invoicing-provider.interface.js";

@Module({
  controllers: [
    MemberFiscalDocumentsController,
    AdminFiscalDocumentsController,
  ],
  providers: [
    InvoicingService,
    InvoiceXpressClient,
    InvoiceXpressService,
    MemberAuthGuard,
    AdminAuthGuard,
    { provide: INVOICING_PROVIDER, useExisting: InvoiceXpressService },
  ],
  exports: [InvoicingService],
})
export class InvoicingModule {}
