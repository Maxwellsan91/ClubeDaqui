import assert from "node:assert/strict";
import test from "node:test";

import { ConfigService } from "@nestjs/config";
import type Stripe from "stripe";

import type { Environment } from "../../config/environment.js";
import type { SupabaseService } from "../../infrastructure/supabase/supabase.service.js";
import type { InvoicingService } from "../invoicing/invoicing.service.js";
import { PaymentsService } from "./payments.service.js";

function stripeEvent() {
  return {
    id: "evt_1",
    type: "checkout.session.completed",
    created: 1_790_157_600,
    livemode: false,
    data: {
      object: {
        id: "cs_1",
        payment_status: "paid",
        amount_total: 7345,
        currency: "eur",
        payment_intent: "pi_1",
        customer_email: null,
        customer_details: { email: null },
        metadata: {
          membership_id: "6f9c459d-f21c-4a70-b384-fb12b6408ca9",
          payment_id: "5334d335-6983-40f4-b511-0e45663883b7",
        },
      },
    },
  } as unknown as Stripe.Event;
}

test("duplicate Stripe webhooks produce one invoice and use confirmed amount", async () => {
  const rpcCalls: Record<string, unknown>[] = [];
  const issued = new Set<string>();
  let providerIssues = 0;
  const admin = {
    rpc: (_name: string, args: Record<string, unknown>) => {
      rpcCalls.push(args);
      return Promise.resolve({
        data: [
          {
            fiscal_document_id: "doc-1",
            already_processed: rpcCalls.length > 1,
          },
        ],
        error: null,
      });
    },
  };
  const invoicing = {
    processDocument: (id: string) => {
      if (!issued.has(id)) {
        issued.add(id);
        providerIssues += 1;
      }
      return Promise.resolve({ id });
    },
  };
  const config = new ConfigService<Environment, true>({
    NODE_ENV: "test",
    PORT: 3001,
    WEB_URL: "http://localhost:3000",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
  } as Environment);
  const service = new PaymentsService(
    config,
    { createAdminClient: () => admin } as unknown as SupabaseService,
    invoicing as unknown as InvoicingService,
  );
  (
    service as unknown as {
      stripeClient: {
        webhooks: { constructEvent: () => Stripe.Event };
      };
    }
  ).stripeClient = { webhooks: { constructEvent: () => stripeEvent() } };

  await service.handleWebhook(Buffer.from("event"), "signature");
  await service.handleWebhook(Buffer.from("event"), "signature");

  assert.equal(providerIssues, 1);
  assert.equal(rpcCalls.length, 2);
  assert.equal(rpcCalls[0]?.p_amount_cents, 7345);
  assert.equal(rpcCalls[0]?.p_currency, "EUR");
});
