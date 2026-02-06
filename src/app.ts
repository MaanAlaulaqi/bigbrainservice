import "reflect-metadata";
import express from "express";
import { useContainer, useExpressServer } from "routing-controllers";
import Container from "typedi";
import { ChatController } from "./controllers/ChatController";
import { DocsController } from "./controllers/DocsController";

export function createApp() {
  useContainer(Container);

  const app = express();
  app.use(express.json({ limit: "2mb" }));

  useExpressServer(app, {
    controllers: [ChatController, DocsController],
    defaultErrorHandler: true,
  });

  return app;
}
