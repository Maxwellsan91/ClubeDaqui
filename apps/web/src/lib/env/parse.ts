import type { ZodType } from "zod";

export function parseEnvironment<T>(
  schema: ZodType<T>,
  values: unknown,
  scope: string,
): T {
  const result = schema.safeParse(values);

  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");

    throw new Error(
      `Invalid ${scope} environment variables${fields ? `: ${fields}` : ""}`,
    );
  }

  return result.data;
}
