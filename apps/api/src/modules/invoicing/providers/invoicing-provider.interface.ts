export type InvoiceCustomer = {
  code: string;
  name: string;
  email?: string;
  fiscalId?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
};

export type CreateInvoiceReceiptInput = {
  idempotencyKey: string;
  reference: string;
  amountCents: number;
  currency: string;
  issuedAt: Date;
  customer: InvoiceCustomer;
};

export type CreateCreditNoteInput = CreateInvoiceReceiptInput & {
  originalExternalDocumentId: string;
};

export type InvoiceDocument = {
  externalDocumentId: string;
  externalClientId?: string;
  documentNumber?: string;
  sequenceId?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  permalink?: string;
  issuedAt: Date;
  providerResponse: unknown;
};

export interface InvoicingProvider {
  createInvoiceReceipt(
    input: CreateInvoiceReceiptInput,
  ): Promise<InvoiceDocument>;
  createCreditNote(input: CreateCreditNoteInput): Promise<InvoiceDocument>;
  getDocumentPdf(externalDocumentId: string): Promise<string>;
}

export const INVOICING_PROVIDER = Symbol("INVOICING_PROVIDER");
