import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { Environment } from "../../../config/environment.js";

export class InvoiceXpressHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

@Injectable()
export class InvoiceXpressClient {
  private readonly logger = new Logger(InvoiceXpressClient.name);

  constructor(private readonly config: ConfigService<Environment, true>) {}

  async request<T>(
    path: string,
    init: RequestInit = {},
    query: Record<string, string> = {},
  ): Promise<T> {
    const apiKey = this.config.get("INVOICEXPRESS_API_KEY", { infer: true });
    const account = this.config.get("INVOICEXPRESS_ACCOUNT_NAME", {
      infer: true,
    });
    if (!apiKey || !account)
      throw new Error("InvoiceXpress credentials are missing");
    const configuredBase = this.config.get("INVOICEXPRESS_BASE_URL", {
      infer: true,
    });
    const base = configuredBase ?? `https://${account}.app.invoicexpress.com`;
    if (!base.startsWith("https://"))
      throw new Error("InvoiceXpress must use HTTPS");

    const url = new URL(path, `${base.replace(/\/$/, "")}/`);
    url.searchParams.set("api_key", apiKey);
    for (const [key, value] of Object.entries(query))
      url.searchParams.set(key, value);

    const method = init.method ?? "GET";
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(url, {
          ...init,
          signal: AbortSignal.timeout(10_000),
          headers: {
            Accept: "application/json",
            ...(init.body ? { "Content-Type": "application/json" } : {}),
            ...init.headers,
          },
        });
        if (response.ok) {
          if (response.status === 204) return undefined as T;
          if (response.status === 202) return { accepted: true } as T;
          return (await response.json()) as T;
        }
        const retryable = response.status === 429 || response.status >= 500;
        await response.body?.cancel();
        lastError = new InvoiceXpressHttpError(
          response.status,
          `InvoiceXpress ${method} ${path} failed (${response.status})`,
        );
        if (!retryable || attempt === 2) throw lastError;
      } catch (error) {
        lastError = error;
        if (
          error instanceof InvoiceXpressHttpError &&
          error.status < 500 &&
          error.status !== 429
        )
          throw error;
        if (attempt === 2) throw error;
      }
      this.logger.warn(
        `Retrying InvoiceXpress ${method} ${path} (attempt ${attempt + 2})`,
      );
      await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
    }
    throw lastError;
  }
}
