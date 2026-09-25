/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";

import { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";
import {
  INVOICING_PROVIDER,
  type InvoiceCustomer,
  type InvoicingProvider,
} from "./providers/invoicing-provider.interface.js";

type FiscalDocumentRow = {
  id: string;
  user_id: string;
  membership_id: string;
  payment_id: string;
  status: string;
  idempotency_key: string;
  source_reference: string;
  currency: string;
  customer_snapshot: Record<string, unknown>;
  retry_count: number;
  external_document_id?: string | null;
};

@Injectable()
export class InvoicingService {
  private readonly logger = new Logger(InvoicingService.name);

  constructor(
    private readonly supabase: SupabaseService,
    @Inject(INVOICING_PROVIDER)
    private readonly provider: InvoicingProvider,
  ) {}

  async processDocument(documentId: string, force = false) {
    const admin = this.supabase.createAdminClient();
    const { data: claimed, error: claimError } = await admin.rpc(
      "claim_fiscal_document",
      { p_document_id: documentId, p_force: force },
    );
    if (claimError)
      throw new Error(`Could not claim fiscal document: ${claimError.message}`);
    const document = (claimed?.[0] ?? null) as FiscalDocumentRow | null;
    if (!document) {
      const { data: existing } = await admin
        .from("fiscal_documents")
        .select("*")
        .eq("id", documentId)
        .maybeSingle();
      if (!existing)
        throw new NotFoundException("Documento fiscal não encontrado");
      return existing;
    }

    try {
      const { data: payment, error: paymentError } = await admin
        .from("payments")
        .select("amount_cents,currency,paid_at,status")
        .eq("id", document.payment_id)
        .single();
      if (paymentError || !payment || payment.status !== "paid")
        throw new Error("Confirmed payment was not found");

      const customer = this.toCustomer(document.customer_snapshot);
      const issued = await this.provider.createInvoiceReceipt({
        idempotencyKey: document.idempotency_key,
        reference: `CD-PAY-${document.payment_id}`,
        amountCents: Number(payment.amount_cents),
        currency: payment.currency,
        issuedAt: new Date(payment.paid_at as string),
        customer,
      });

      const { data: updated, error: updateError } = await admin
        .from("fiscal_documents")
        .update({
          status: "ISSUED",
          external_document_id: issued.externalDocumentId,
          external_client_id: issued.externalClientId ?? null,
          document_number: issued.documentNumber ?? null,
          sequence_id: issued.sequenceId ?? null,
          subtotal: issued.subtotal,
          tax_amount: issued.taxAmount,
          total_amount: issued.totalAmount,
          currency: issued.currency,
          permalink: issued.permalink ?? null,
          issued_at: issued.issuedAt.toISOString(),
          provider_response: issued.providerResponse,
          processing_started_at: null,
          next_retry_at: null,
        })
        .eq("id", document.id)
        .eq("status", "ISSUING")
        .select("*")
        .single();
      if (updateError)
        throw new Error(
          `Could not persist fiscal document: ${updateError.message}`,
        );

      if (issued.externalClientId) {
        await admin.from("invoicing_customers").upsert(
          {
            user_id: document.user_id,
            provider: "invoicexpress",
            external_client_id: issued.externalClientId,
            external_code: customer.code,
          },
          { onConflict: "user_id,provider" },
        );
      }
      this.logger.log(`Fiscal document ${document.id} issued successfully`);
      return updated;
    } catch (error) {
      const message = this.safeError(error);
      const delayMinutes = Math.min(60, 2 ** Math.min(6, document.retry_count));
      await admin
        .from("fiscal_documents")
        .update({
          status: "FAILED",
          processing_started_at: null,
          last_error_code: error instanceof Error ? error.name : "UnknownError",
          last_error_message: message,
          next_retry_at: new Date(
            Date.now() + delayMinutes * 60_000,
          ).toISOString(),
        })
        .eq("id", document.id)
        .eq("status", "ISSUING");
      this.logger.error(`Fiscal document ${document.id} failed: ${message}`);
      throw error;
    }
  }

  async getPdf(documentId: string, userId?: string) {
    const admin = this.supabase.createAdminClient();
    let query = admin
      .from("fiscal_documents")
      .select("id,user_id,status,external_document_id,pdf_url")
      .eq("id", documentId);
    if (userId) query = query.eq("user_id", userId);
    const { data: document } = await query.maybeSingle();
    if (
      !document ||
      document.status !== "ISSUED" ||
      !document.external_document_id
    )
      throw new NotFoundException("Documento fiscal emitido não encontrado");
    if (document.pdf_url) return document.pdf_url;
    const url = await this.provider.getDocumentPdf(
      document.external_document_id,
    );
    await admin
      .from("fiscal_documents")
      .update({ pdf_url: url })
      .eq("id", document.id);
    return url;
  }

  private toCustomer(snapshot: Record<string, unknown>): InvoiceCustomer {
    const name = typeof snapshot.name === "string" ? snapshot.name.trim() : "";
    const code = typeof snapshot.code === "string" ? snapshot.code.trim() : "";
    if (!name || !code)
      throw new Error("Fiscal customer name and code are required");
    const optional = (key: string) =>
      typeof snapshot[key] === "string" && snapshot[key].trim()
        ? snapshot[key].trim()
        : undefined;
    return {
      name,
      code,
      email: optional("email"),
      fiscalId: optional("fiscal_id"),
      address: optional("address"),
      city: optional("city"),
      postalCode: optional("postal_code"),
      country: optional("country"),
    };
  }

  private safeError(error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown invoicing error";
    return message
      .replace(/[\w.+-]+@[\w.-]+/g, "[redacted-email]")
      .slice(0, 500);
  }
}
