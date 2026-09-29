import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { createHash, randomUUID } from "node:crypto";
import { Logger } from "@nestjs/common";

import { AppModule } from "./app.module.js";
import type { Environment } from "./config/environment.js";
import { SupabaseService } from "./infrastructure/supabase/supabase.service.js";

export type NestApplicationFactory = Pick<typeof NestFactory, "create">;

type RateLimitResult = {
  allowed: boolean;
  retry_after_seconds: number;
};

type SupabaseRateLimitResponse = {
  data: unknown;
  error: { message: string } | null;
};

function asRateLimitResult(value: unknown): RateLimitResult | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return typeof row.allowed === "boolean" &&
    typeof row.retry_after_seconds === "number"
    ? {
        allowed: row.allowed,
        retry_after_seconds: row.retry_after_seconds,
      }
    : null;
}

export async function createApp(factory: NestApplicationFactory = NestFactory) {
  const app = await factory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService<Environment, true>);

  app.setGlobalPrefix("api");
  const httpServer = app.getHttpAdapter().getInstance() as {
    disable?: (setting: string) => void;
  };
  httpServer.disable?.("x-powered-by");
  app.enableCors({
    origin: [
      config.getOrThrow("WEB_URL", { infer: true }),
      "https://clube-daqui-web.vercel.app",
      "https://clube-ribatejo-web.vercel.app",
      "http://localhost:3000",
    ],
    credentials: true,
  });
  const supabase = app.get(SupabaseService);
  const rateLimitLogger = new Logger("DistributedRateLimit");
  app.use(
    async (
      request: { method?: string; ip?: string; path?: string },
      response: {
        setHeader: (name: string, value: string) => void;
        status: (code: number) => { json: (body: unknown) => void };
      },
      next: () => void,
    ) => {
      const requestId = randomUUID();
      response.setHeader("X-Request-Id", requestId);
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader("X-Frame-Options", "DENY");
      response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      response.setHeader(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()",
      );
      if (request.method === "POST") {
        const path = request.path ?? "";
        const limited =
          path.includes("auth") ||
          path.includes("partner-inquiries") ||
          path.includes("redemptions") ||
          path.includes("payments/checkout");
        if (limited) {
          const rawKey = `${request.ip ?? "unknown"}:${path}`;
          const key = createHash("sha256").update(rawKey).digest("hex");
          try {
            const rpcResult = (await supabase
              .createAdminClient()
              .rpc("consume_api_rate_limit", {
                p_key: key,
                p_limit: 30,
                p_window_seconds: 60,
              })) as unknown as SupabaseRateLimitResponse;
            const result = asRateLimitResult(
              Array.isArray(rpcResult.data)
                ? rpcResult.data[0]
                : rpcResult.data,
            );
            const error = rpcResult.error;
            if (error || !result) {
              rateLimitLogger.error(
                `Rate limit backend unavailable${error ? `: ${error.message}` : ""}`,
              );
              if (config.get("NODE_ENV", { infer: true }) === "production") {
                response.status(503).json({
                  message: "Proteção contra abuso temporariamente indisponível.",
                });
                return;
              }
              // Do not turn a temporary rate-limit DB outage into a full API outage.
              next();
              return;
            }
            if (!result.allowed) {
              response.setHeader(
                "Retry-After",
                String(result.retry_after_seconds ?? 60),
              );
              response.status(429).json({
                message: "Demasiados pedidos. Tente novamente mais tarde.",
              });
              return;
            }
          } catch (error) {
            rateLimitLogger.error(
              `Rate limit backend unavailable: ${
                error instanceof Error ? error.message : "unknown error"
              }`,
            );
            if (config.get("NODE_ENV", { infer: true }) === "production") {
              response.status(503).json({
                message: "Proteção contra abuso temporariamente indisponível.",
              });
              return;
            }
            // Do not turn a temporary rate-limit DB outage into a full API outage.
            next();
            return;
          }
        }
      }
      next();
    },
  );
  app.enableShutdownHooks();

  await app.init();
  return app;
}
