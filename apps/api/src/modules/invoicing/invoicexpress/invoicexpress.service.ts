import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { Environment } from "../../../config/environment.js";
import type {
  CreateCreditNoteInput,
  CreateInvoiceReceiptInput,
  InvoiceDocument,
  InvoicingProvider,
} from "../providers/invoicing-provider.interface.js";
import {
  clientPayload,
  mapDocument,
  mapInvoicePayload,
  unwrapDocument,
} from "./invoicexpress.mapper.js";
import {
  InvoiceXpressClient,
  InvoiceXpressHttpError,
} from "./invoicexpress.client.js";
import type {
  InvoiceXpressClient as ClientResponse,
  InvoiceXpressDocument,
  InvoiceXpressDocumentResponse,
  InvoiceXpressTax,
} from "./invoicexpress.types.js";

@Injectable()
export class InvoiceXpressService implements InvoicingProvider {
  constructor(
    private readonly client: InvoiceXpressClient,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  createInvoiceReceipt(input: CreateInvoiceReceiptInput) {
    return this.createDocument("invoice_receipts", "invoice_receipt", input);
  }

  createCreditNote(input: CreateCreditNoteInput) {
    return this.createDocument("credit_notes", "credit_note", input);
  }

  async getDocumentPdf(externalDocumentId: string): Promise<string> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await this.client.request<{
        accepted?: boolean;
        output?: { pdfUrl?: string };
      }>(
        `api/pdf/${encodeURIComponent(externalDocumentId)}.json`,
        {},
        {
          second_copy: "false",
        },
      );
      if (response.output?.pdfUrl) return response.output.pdfUrl;
      if (!response.accepted) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
    throw new Error("InvoiceXpress PDF is not ready");
  }

  async sendDocumentByEmail(
    documentType: "invoice_receipts" | "credit_notes",
    externalDocumentId: string,
    email: string,
  ) {
    await this.client.request(
      `${documentType}/${encodeURIComponent(externalDocumentId)}/email-document.json`,
      {
        method: "PUT",
        body: JSON.stringify({
          message: {
            client: { email, save: "0" },
            subject: "Documento Clube Daqui",
            body: "Segue o documento referente à sua adesão ao Clube Daqui.",
            logo: "0",
          },
        }),
      },
    );
  }

  private async createDocument(
    path: "invoice_receipts" | "credit_notes",
    wrapper: "invoice_receipt" | "credit_note",
    input: CreateInvoiceReceiptInput | CreateCreditNoteInput,
  ): Promise<InvoiceDocument> {
    const { taxName, taxRate, sequenceId, exemptionCode } =
      await this.getFiscalConfiguration();
    const externalClientId = await this.upsertClient(input);

    const providerType =
      path === "invoice_receipts" ? "InvoiceReceipt" : "CreditNote";
    let document = await this.findByReference(input.reference, providerType);
    let rawResponse: InvoiceXpressDocumentResponse;
    if (document) {
      rawResponse = { [wrapper]: document };
    } else {
      const mapped = mapInvoicePayload(
        input,
        taxName,
        taxRate,
        sequenceId,
        exemptionCode,
      );
      const payload = {
        [wrapper]: mapped.invoice,
        proprietary_uid: mapped.proprietary_uid,
      };
      try {
        rawResponse = await this.client.request<InvoiceXpressDocumentResponse>(
          `${path}.json`,
          { method: "POST", body: JSON.stringify(payload) },
        );
        document = unwrapDocument(rawResponse);
      } catch (error) {
        if (!(error instanceof InvoiceXpressHttpError && error.status === 409))
          throw error;
        document = await this.findByReference(input.reference, providerType);
        if (!document) throw error;
        rawResponse = { [wrapper]: document };
      }
    }

    if (document.status === "draft") {
      await this.client.request(
        `${path}/${encodeURIComponent(String(document.id))}/change-state.json`,
        {
          method: "PUT",
          body: JSON.stringify({ invoice: { state: "finalized" } }),
        },
      );
    }
    const finalResponse =
      await this.client.request<InvoiceXpressDocumentResponse>(
        `${path}/${encodeURIComponent(String(document.id))}.json`,
      );
    const finalDocument = unwrapDocument(finalResponse);
    if (!["settled", "final"].includes(finalDocument.status)) {
      throw new Error(
        `InvoiceXpress document has invalid status ${finalDocument.status}`,
      );
    }
    const result = mapDocument(finalDocument, input.currency, finalResponse);
    result.externalClientId ??= externalClientId;
    if (Math.abs(result.totalAmount - input.amountCents / 100) > 0.01) {
      throw new Error(
        "InvoiceXpress total does not match the confirmed Stripe payment",
      );
    }
    return result;
  }

  private async getFiscalConfiguration() {
    const taxName = this.config.get("INVOICEXPRESS_DEFAULT_TAX_NAME", {
      infer: true,
    });
    const sequenceId = this.config.get("INVOICEXPRESS_SEQUENCE_ID", {
      infer: true,
    });
    if (!taxName)
      throw new Error("InvoiceXpress tax configuration is required");
    const response = await this.client.request<{ taxes?: InvoiceXpressTax[] }>(
      "taxes.json",
    );
    const tax = response.taxes?.find((item) => item.name === taxName);
    if (!tax) throw new Error(`InvoiceXpress tax ${taxName} was not found`);
    const exemptionCode = this.config.get("INVOICEXPRESS_TAX_EXEMPTION_CODE", {
      infer: true,
    });
    if (tax.value === 0 && !exemptionCode)
      throw new Error(
        "InvoiceXpress tax exemption code is required for 0% tax",
      );
    return { taxName, taxRate: tax.value, sequenceId, exemptionCode };
  }

  private async upsertClient(input: CreateInvoiceReceiptInput) {
    const payload = clientPayload(input);
    let existing: ClientResponse | undefined;
    try {
      const response = await this.client.request<{ client: ClientResponse }>(
        "clients/find-by-code.json",
        {},
        { client_code: input.customer.code },
      );
      existing = response.client;
    } catch (error) {
      if (!(error instanceof InvoiceXpressHttpError && error.status === 404))
        throw error;
    }
    if (existing) {
      await this.client.request(
        `clients/${encodeURIComponent(String(existing.id))}.json`,
        {
          method: "PUT",
          body: JSON.stringify({ client: payload }),
        },
      );
      return String(existing.id);
    }
    const created = await this.client.request<{ client: ClientResponse }>(
      "clients.json",
      { method: "POST", body: JSON.stringify({ client: payload }) },
    );
    return String(created.client.id);
  }

  private async findByReference(reference: string, providerType: string) {
    const response = await this.client.request<{
      invoices?: InvoiceXpressDocument[];
    }>("invoices.json", {}, { reference, "type[]": providerType });
    return response.invoices?.find((item) => item.id) ?? null;
  }
}
