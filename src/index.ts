import "reflect-metadata";
import { AppDataSource } from "./data/dataSource";
import { createApp } from "./app";
import { env } from "./env";

async function main() {
  await AppDataSource.initialize();

  const app = createApp();
  const port = Number(env.port);

  app.listen(port, () => console.log(`bigbrainservice listening on :${port}`));
}

main().catch((e) => {
  console.error("Fatal startup error:", e);
  process.exit(1);
});
