import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";

import { AppModule } from "./app.module";
import type { Environment } from "./config/environment";

export async function createApp() {
  const app = await NestFactory.create(AppModule);
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
