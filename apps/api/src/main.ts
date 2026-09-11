import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";

import { createApp } from "./bootstrap";
import type { Environment } from "./config/environment";

async function bootstrap() {
  const app = await createApp(NestFactory);
  const config = app.get(ConfigService<Environment, true>);

  await app.listen(config.getOrThrow("PORT", { infer: true }), "0.0.0.0");
}

void bootstrap();
