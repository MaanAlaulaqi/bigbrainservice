import "reflect-metadata";
import { DataSource } from "typeorm";
import { Conversation } from "../entities/Conversation";
import { DocumentEntity } from "../entities/Document";
import { ChunkEntity } from "../entities/Chunk";
import { env } from "../env";

const mongoUrl = env.mongoUrl;
const mongoDb = env.db.database;

if (!mongoUrl) {
  throw new Error("MONGO_URL environment variable is not defined");
}
if (!mongoDb) {
  throw new Error("MONGO_DB environment variable is not defined");
}

export const AppDataSource = new DataSource({
  type: "mongodb",
  url: mongoUrl,
  database: mongoDb,
  entities: [Conversation, DocumentEntity, ChunkEntity],
  synchronize: true, // dev-only; for corp prod use migrations / controlled sync
});
