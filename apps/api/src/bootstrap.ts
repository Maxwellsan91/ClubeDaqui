import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";

import { AppModule } from "./app.module.js";
import type { Environment } from "./config/environment.js";

export type NestApplicationFactory = Pick<typeof NestFactory, "create">;

export async function createApp(factory: NestApplicationFactory = NestFactory) {
  const app = await factory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService<Environment, true>);

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: [
      config.getOrThrow("WEB_URL", { infer: true }),
      "https://clube-daqui-web.vercel.app",
      "https://clube-ribatejo-web.vercel.app",
      "http://localhost:3000",
    ],
    credentials: true,
  });
  const requests = new Map<string, { count: number; resetAt: number }>();
  app.use(
    (
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
          path.includes("redemptions");
        if (limited) {
          const now = Date.now();
          const key = `${request.ip ?? "unknown"}:${path}`;
          const current = requests.get(key);
          const windowMs = 60_000;
          const entry =
            !current || current.resetAt <= now
              ? { count: 0, resetAt: now + windowMs }
              : current;
          entry.count += 1;
          requests.set(key, entry);
          if (requests.size > 10_000) {
            for (const [storedKey, stored] of requests) {
              if (stored.resetAt <= now) requests.delete(storedKey);
            }
          }
          if (entry.count > 30) {
            response.setHeader("Retry-After", "60");
            response.status(429).json({
              message: "Demasiados pedidos. Tente novamente mais tarde.",
            });
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
