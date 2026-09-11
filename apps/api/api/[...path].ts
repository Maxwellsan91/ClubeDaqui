import "reflect-metadata";

import type { IncomingMessage, ServerResponse } from "node:http";

import { createApp } from "../src/bootstrap";

type ServerHandler = (
  request: IncomingMessage,
  response: ServerResponse,
) => void;

let appPromise: ReturnType<typeof createApp> | undefined;

function getApp() {
  appPromise ??= createApp();
  return appPromise;
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const app = await getApp();
  const expressHandler = app.getHttpAdapter().getInstance() as ServerHandler;
  expressHandler(request, response);
}
