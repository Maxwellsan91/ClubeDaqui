import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";

import { AppModule } from "./app.module.js";
import type { Environment } from "./config/environment.js";

export type NestApplicationFactory = Pick<typeof NestFactory, "create">;

export async function createApp(factory: NestApplicationFactory = NestFactory) {
  const app = await factory.create(AppModule);
  const config = app.get(ConfigService<Environment, true>);

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: config.getOrThrow("WEB_URL", { infer: true }),
    credentials: true,
  });
  app.enableShutdownHooks();

  await app.init();
  return app;
}
