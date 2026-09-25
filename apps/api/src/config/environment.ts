import { z } from "zod";

const emptyAsUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: emptyAsUndefined(z.coerce.number().int().min(1).max(65_535)).default(
      3001,
    ),
    WEB_URL: emptyAsUndefined(z.url()).default("http://localhost:3000"),
    SUPABASE_URL: emptyAsUndefined(z.url()).optional(),
    SUPABASE_PUBLISHABLE_KEY: emptyAsUndefined(z.string().min(1)).optional(),
    SUPABASE_SERVICE_ROLE_KEY: emptyAsUndefined(z.string().min(1)).optional(),
    STRIPE_SECRET_KEY: emptyAsUndefined(
      z.string().startsWith("sk_"),
    ).optional(),
    STRIPE_PRICE_ID: emptyAsUndefined(
      z
        .string()
        .startsWith("price_")
        .refine((value) => !value.startsWith("price_prod_"), {
          message: "Use o ID do preço Stripe, não o ID do produto",
        }),
    ).optional(),
    STRIPE_WEBHOOK_SECRET: emptyAsUndefined(
      z.string().startsWith("whsec_"),
    ).optional(),
    RESEND_API_KEY: emptyAsUndefined(z.string().startsWith("re_")).optional(),
    EMAIL_FROM: emptyAsUndefined(z.string().min(3)).optional(),
    INVOICEXPRESS_ACCOUNT_NAME: emptyAsUndefined(
      z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*$/),
    ).optional(),
    INVOICEXPRESS_API_KEY: emptyAsUndefined(z.string().min(1)).optional(),
    INVOICE_XPRESS_API: emptyAsUndefined(z.string().min(1)).optional(),
    INVOICEXPRESS_SEQUENCE_ID: emptyAsUndefined(z.string().min(1)).optional(),
    INVOICEXPRESS_DEFAULT_TAX_NAME: emptyAsUndefined(
      z.string().min(1),
    ).optional(),
    INVOICEXPRESS_TAX_EXEMPTION_CODE: emptyAsUndefined(
      z.string().min(1),
    ).optional(),
    INVOICEXPRESS_BASE_URL: emptyAsUndefined(
      z.url().startsWith("https://"),
    ).optional(),
  })
  .superRefine((environment, context) => {
    const invoiceXpressEnabled = Boolean(
      environment.INVOICEXPRESS_API_KEY ?? environment.INVOICE_XPRESS_API,
    );
    if (!invoiceXpressEnabled) return;
    for (const key of [
      "INVOICEXPRESS_ACCOUNT_NAME",
      "INVOICEXPRESS_DEFAULT_TAX_NAME",
    ] as const) {
      if (!environment[key]) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when InvoiceXpress is configured`,
        });
      }
    }
  });

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  values: Record<string, unknown>,
): Environment {
  const result = environmentSchema.safeParse(values);

  if (!result.success) {
    throw new Error(`Invalid environment: ${z.prettifyError(result.error)}`);
  }

  return {
    ...result.data,
    INVOICEXPRESS_API_KEY:
      result.data.INVOICEXPRESS_API_KEY ?? result.data.INVOICE_XPRESS_API,
  };
}
