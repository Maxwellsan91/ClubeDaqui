import type {
  CreateCreditNoteInput,
  CreateInvoiceReceiptInput,
  InvoiceDocument,
} from "../providers/invoicing-provider.interface.js";
import type {
  InvoiceXpressDocument,
  InvoiceXpressDocumentResponse,
} from "./invoicexpress.types.js";

const ITEM_NAME = "Adesão anual Clube Daqui";
const ITEM_DESCRIPTION =
  "Adesão anual ao Clube Daqui — acesso por 12 meses a benefícios exclusivos na rede de parceiros.";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Lisbon",
  }).format(date);
}

function clientPayload(input: CreateInvoiceReceiptInput) {
  return {
    name: input.customer.name,
    code: input.customer.code,
    ...(input.customer.email ? { email: input.customer.email } : {}),
    ...(input.customer.fiscalId ? { fiscal_id: input.customer.fiscalId } : {}),
    ...(input.customer.address ? { address: input.customer.address } : {}),
    ...(input.customer.city ? { city: input.customer.city } : {}),
    ...(input.customer.postalCode
      ? { postal_code: input.customer.postalCode }
      : {}),
    ...(input.customer.country ? { country: input.customer.country } : {}),
  };
}

export function mapInvoicePayload(
  input: CreateInvoiceReceiptInput | CreateCreditNoteInput,
  taxName: string,
  taxRate: number,
  sequenceId?: string,
  exemptionCode?: string,
) {
  const gross = input.amountCents / 100;
  const net = gross / (1 + taxRate / 100);
  const invoice = {
    date: formatDate(input.issuedAt),
    due_date: formatDate(input.issuedAt),
    reference: input.reference,
    ...(sequenceId ? { sequence_id: sequenceId } : {}),
    observations: "Documento referente à adesão anual ao Clube Daqui.",
    ...(taxRate === 0 && exemptionCode ? { tax_exemption: exemptionCode } : {}),
    client: clientPayload(input),
    items: [
      {
        name: ITEM_NAME,
        description: ITEM_DESCRIPTION,
        unit_price: net.toFixed(4),
        quantity: "1",
        unit: "service",
        tax: { name: taxName },
      },
    ],
    ...(input.currency !== "EUR" ? { currency_code: input.currency } : {}),
    ...("originalExternalDocumentId" in input
      ? { owner_invoice_id: input.originalExternalDocumentId }
      : {}),
  };
  return { invoice, proprietary_uid: input.idempotencyKey };
}

export function unwrapDocument(response: InvoiceXpressDocumentResponse) {
  const document =
    response.invoice_receipt ?? response.credit_note ?? response.invoice;
  if (!document?.id) throw new Error("InvoiceXpress returned no document id");
  return document;
}

export function mapDocument(
  document: InvoiceXpressDocument,
  currency: string,
  response: unknown,
): InvoiceDocument {
  return {
    externalDocumentId: String(document.id),
    externalClientId: document.client?.id
      ? String(document.client.id)
      : undefined,
    documentNumber: document.sequence_number,
    sequenceId: document.sequence_id ? String(document.sequence_id) : undefined,
    subtotal: Number(document.before_taxes ?? 0),
    taxAmount: Number(document.taxes ?? 0),
    totalAmount: Number(document.total ?? 0),
    currency,
    permalink: document.permalink,
    issuedAt: new Date(),
    providerResponse: response,
  };
}

export { clientPayload };
