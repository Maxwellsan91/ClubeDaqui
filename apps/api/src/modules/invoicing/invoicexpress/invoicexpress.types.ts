export type InvoiceXpressTax = { id: number; name: string; value: number };
export type InvoiceXpressClient = {
  id: string | number;
  code?: string;
  fiscal_id?: string;
};

export type InvoiceXpressDocument = {
  id: string | number;
  status: string;
  sequence_number?: string;
  sequence_id?: string | number;
  permalink?: string;
  before_taxes?: number;
  taxes?: number;
  total?: number;
  currency?: string;
  client?: { id?: string | number };
  date?: string;
};

export type InvoiceXpressDocumentResponse = {
  invoice?: InvoiceXpressDocument;
  invoice_receipt?: InvoiceXpressDocument;
  credit_note?: InvoiceXpressDocument;
};
