import assert from "node:assert/strict";
import test from "node:test";

import { ConfigService } from "@nestjs/config";

import {
  validateEnvironment,
  type Environment,
} from "../../config/environment.js";
import type { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";
import { InvoiceXpressHttpError } from "./invoicexpress/invoicexpress.client.js";
import type { InvoiceXpressClient } from "./invoicexpress/invoicexpress.client.js";
import { mapInvoicePayload } from "./invoicexpress/invoicexpress.mapper.js";
import { InvoiceXpressService } from "./invoicexpress/invoicexpress.service.js";
import { InvoicingService } from "./invoicing.service.js";
import type { CreateInvoiceReceiptInput } from "./providers/invoicing-provider.interface.js";
import type { InvoicingProvider } from "./providers/invoicing-provider.interface.js";

const input: CreateInvoiceReceiptInput = {
  idempotencyKey: "9dc1305d-e288-4a8f-a268-e03030e96db0",
  reference: "CD-PAY-payment-id",
  amountCents: 5900,
  currency: "EUR",
  issuedAt: new Date("2026-09-23T10:00:00Z"),
  customer: {
    name: "Cliente Teste",
    code: "CLUBE_USER_user-id",
    email: "member@example.com",
  },
};

function config(values: Partial<Environment> = {}) {
  return new ConfigService<Environment, true>({
    NODE_ENV: "test",
    PORT: 3001,
    WEB_URL: "http://localhost:3000",
    INVOICEXPRESS_ACCOUNT_NAME: "test",
    INVOICEXPRESS_API_KEY: "secret",
    INVOICEXPRESS_SEQUENCE_ID: "123",
    INVOICEXPRESS_DEFAULT_TAX_NAME: "IVA23",
    ...values,
  } as Environment);
}

class FakeClient {
  calls: Array<{ path: string; init: RequestInit }> = [];
  existing = false;
  offline = false;

  async request<T>(path: string, init: RequestInit = {}) {
    this.calls.push({ path, init });
    if (this.offline) throw new Error("offline");
    if (path === "taxes.json")
      return { taxes: [{ id: 1, name: "IVA23", value: 23 }] } as T;
    if (path === "clients/find-by-code.json")
      throw new InvoiceXpressHttpError(404, "not found");
    if (path === "clients.json") return { client: { id: 10 } } as T;
    if (path === "invoices.json")
      return {
        invoices: this.existing
          ? [
              {
                id: 20,
                status: "settled",
                total: 59,
                before_taxes: 47.97,
                taxes: 11.03,
              },
            ]
          : [],
      } as T;
    if (path === "invoice_receipts.json") {
      this.existing = true;
      return { invoice_receipt: { id: 20, status: "draft" } } as T;
    }
    if (path.endsWith("change-state.json")) return undefined as T;
    if (path === "invoice_receipts/20.json")
      return {
        invoice_receipt: {
          id: 20,
          status: "settled",
          sequence_number: "FTFR 1/1",
          sequence_id: "123",
          total: 59,
          before_taxes: 47.97,
          taxes: 11.03,
          client: { id: 10 },
        },
      } as T;
    throw new Error(`Unexpected request ${path}`);
  }
}

test("confirmed amount is mapped from the payment, not the frontend", () => {
  const payload = mapInvoicePayload(
    { ...input, amountCents: 1234 },
    "IVA23",
    23,
    "123",
  );
  assert.equal(payload.invoice.items[0]?.unit_price, "10.0325");
});

test("optional NIF is omitted", () => {
  const payload = mapInvoicePayload(input, "IVA23", 23, "123");
  assert.equal("fiscal_id" in payload.invoice.client, false);
});

test("provided NIF is sent", () => {
  const payload = mapInvoicePayload(
    { ...input, customer: { ...input.customer, fiscalId: "123456789" } },
    "IVA23",
    23,
    "123",
  );
  assert.equal(payload.invoice.client.fiscal_id, "123456789");
});

test("duplicate retry reconciles instead of creating another invoice", async () => {
  const client = new FakeClient();
  const service = new InvoiceXpressService(
    client as unknown as InvoiceXpressClient,
    config(),
  );
  await service.createInvoiceReceipt(input);
  await service.createInvoiceReceipt(input);
  assert.equal(
    client.calls.filter((call) => call.path === "invoice_receipts.json").length,
    1,
  );
});

test("InvoiceXpress offline fails without producing a document", async () => {
  const client = new FakeClient();
  client.offline = true;
  const service = new InvoiceXpressService(
    client as unknown as InvoiceXpressClient,
    config(),
  );
  await assert.rejects(service.createInvoiceReceipt(input), /offline/);
});

test("InvoiceXpress offline marks the persisted job as FAILED", async () => {
  const state: Record<string, unknown> = { status: "ISSUING" };
  const document = {
    id: "doc-1",
    user_id: "user-1",
    membership_id: "membership-1",
    payment_id: "payment-1",
    status: "ISSUING",
    idempotency_key: "9dc1305d-e288-4a8f-a268-e03030e96db0",
    source_reference: "stripe:payment:payment-1",
    currency: "EUR",
    customer_snapshot: { name: "Cliente", code: "CLUBE_USER_user-1" },
    retry_count: 1,
  };
  const fiscalBuilder = {
    update: (patch: Record<string, unknown>) => {
      Object.assign(state, patch);
      return fiscalBuilder;
    },
    eq: () => fiscalBuilder,
    then: (resolve: (value: unknown) => void) =>
      resolve({ data: state, error: null }),
  };
  const paymentBuilder = {
    select: () => paymentBuilder,
    eq: () => paymentBuilder,
    single: () =>
      Promise.resolve({
        data: {
          amount_cents: 5900,
          currency: "EUR",
          paid_at: "2026-09-23T10:00:00Z",
          status: "paid",
        },
        error: null,
      }),
  };
  const admin = {
    rpc: () => Promise.resolve({ data: [document], error: null }),
    from: (table: string) =>
      table === "payments" ? paymentBuilder : fiscalBuilder,
  };
  const provider = {
    createInvoiceReceipt: () => Promise.reject(new Error("offline")),
  } as unknown as InvoicingProvider;
  const service = new InvoicingService(
    { createAdminClient: () => admin } as unknown as SupabaseService,
    provider,
  );
  await assert.rejects(service.processDocument("doc-1"), /offline/);
  assert.equal(state.status, "FAILED");
  assert.equal(typeof state.next_retry_at, "string");
});

test("retry emits after InvoiceXpress becomes available", async () => {
  const client = new FakeClient();
  client.offline = true;
  const service = new InvoiceXpressService(
    client as unknown as InvoiceXpressClient,
    config(),
  );
  await assert.rejects(service.createInvoiceReceipt(input), /offline/);
  client.offline = false;
  const document = await service.createInvoiceReceipt(input);
  assert.equal(document.externalDocumentId, "20");
});

test("missing fiscal configuration blocks issuance", async () => {
  const client = new FakeClient();
  const service = new InvoiceXpressService(
    client as unknown as InvoiceXpressClient,
    config({ INVOICEXPRESS_DEFAULT_TAX_NAME: undefined }),
  );
  await assert.rejects(
    service.createInvoiceReceipt(input),
    /tax configuration is required/,
  );
});

test("partial InvoiceXpress environment fails during startup validation", () => {
  assert.throws(
    () => validateEnvironment({ INVOICE_XPRESS_API: "secret" }),
    /INVOICEXPRESS_ACCOUNT_NAME/,
  );
});

test("zero tax without an exemption code blocks issuance", async () => {
  const client = new FakeClient();
  const original = client.request.bind(client);
  client.request = <T>(path: string, init: RequestInit = {}) =>
    path === "taxes.json"
      ? Promise.resolve({ taxes: [{ id: 1, name: "IVA23", value: 0 }] } as T)
      : original<T>(path, init);
  const service = new InvoiceXpressService(
    client as unknown as InvoiceXpressClient,
    config(),
  );
  await assert.rejects(service.createInvoiceReceipt(input), /exemption code/);
});

test("credit note payload links the original and never deletes it", () => {
  const payload = mapInvoicePayload(
    { ...input, originalExternalDocumentId: "42" },
    "IVA23",
    23,
    "123",
  );
  assert.equal(payload.invoice.owner_invoice_id, "42");
});

test("a member cannot obtain another user's PDF", async () => {
  const filters = new Map<string, string>();
  const query = {
    select: () => query,
    eq: (key: string, value: string) => {
      filters.set(key, value);
      return query;
    },
    maybeSingle: () =>
      Promise.resolve({
        data:
          filters.get("id") === "doc-other" &&
          filters.get("user_id") === "owner"
            ? { id: "doc-other", status: "ISSUED", external_document_id: "20" }
            : null,
      }),
  };
  const supabase = {
    createAdminClient: () => ({ from: () => query }),
  } as unknown as SupabaseService;
  const provider = {
    getDocumentPdf: () => Promise.resolve("https://example.test/document.pdf"),
  } as unknown as InvoicingProvider;
  const service = new InvoicingService(supabase, provider);
  await assert.rejects(
    service.getPdf("doc-other", "attacker"),
    /não encontrado/,
  );
});
