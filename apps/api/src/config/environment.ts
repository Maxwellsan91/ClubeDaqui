import { z } from "zod";

const emptyAsUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

const environmentSchema = z.object({
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
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  values: Record<string, unknown>,
): Environment {
  const result = environmentSchema.safeParse(values);

  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");

    throw new Error(`Invalid API environment variables: ${fields}`);
  }

  return result.data;
}
