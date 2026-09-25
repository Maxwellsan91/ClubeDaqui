/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";

import { AdminAuthGuard } from "../admin/admin-auth.guard.js";
import {
  MemberAuthGuard,
  type AuthenticatedRequest,
} from "../members/member-auth.guard.js";
import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";
import { InvoicingService } from "./invoicing.service.js";

@Controller("me/fiscal-documents")
@UseGuards(MemberAuthGuard)
export class MemberFiscalDocumentsController {
  constructor(
    private readonly invoicing: InvoicingService,
    private readonly supabase: SupabaseService,
  ) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest) {
    const { data, error } = await this.supabase
      .createUserClient(request.accessToken)
      .from("fiscal_documents")
      .select(
        "id,membership_id,payment_id,provider,document_type,status,document_number,subtotal,tax_amount,total_amount,currency,permalink,issued_at,created_at,updated_at",
      )
      .eq("user_id", request.user.id)
      .order("created_at", { ascending: false });
    if (error)
      throw new Error("Não foi possível carregar os documentos fiscais");
    return { data: data ?? [] };
  }

  @Get(":id/pdf")
  async pdf(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return { data: { url: await this.invoicing.getPdf(id, request.user.id) } };
  }
}

@Controller("admin/fiscal-documents")
@UseGuards(AdminAuthGuard)
export class AdminFiscalDocumentsController {
  constructor(
    private readonly invoicing: InvoicingService,
    private readonly supabase: SupabaseService,
  ) {}

  @Get(":id")
  async get(@Param("id") id: string) {
    const { data } = await this.supabase
      .createAdminClient()
      .from("fiscal_documents")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!data) throw new NotFoundException("Documento fiscal não encontrado");
    return { data };
  }

  @Post(":id/retry")
  async retry(@Param("id") id: string) {
    return { data: await this.invoicing.processDocument(id, true) };
  }
}
