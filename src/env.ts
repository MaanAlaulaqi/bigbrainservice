import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 3002,
  mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/bigbrainservice",
  nodeEnv: process.env.NODE_ENV || "development",
  db: {
    url: process.env.DB_URL || "mongodb://localhost:27017/bigbrainservice",
    type: process.env.DB_TYPE || "mongodb",
    username: process.env.DB_USERNAME || "",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "bigbrainservice",
    replicaset: process.env.DB_REPLICASET || undefined,
    sslValidation: process.env.DB_SSL_VALIDATE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    runMigrations: process.env.DB_RUN_MIGRATIONS === 'true',
    dropSchema: process.env.DB_DROP_SCHEMA === 'true',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 27017,
  },
  dirs: {
    entities: [__dirname + "/models/*.{ts,js}"],
    migrations: [__dirname + "/migrations/*.{ts,js}"],
    uploadDir: process.env.UPLOAD_DIR || "./uploads",
    
  },
  LLM_API_KEY: process.env.LLM_API_KEY || "",
  LLM_USERNAME: process.env.LLM_USERNAME || "",
  LLM_PASSWORD: process.env.LLM_PASSWORD || "",
  LLM_BASE_URL: process.env.LLM_BASE_URL || "http://localhost:1234/v1",
  LLM_API_VERSION: process.env.LLM_API_VERSION || "",
  LLM_MODEL: process.env.LLM_MODEL || "local-model",
  LLM_EMBED_MODEL: process.env.LLM_EMBED_MODEL || "local-embed-model",
  MAX_UPLOAD_MB: process.env.MAX_UPLOAD_MB || "20",
  PROXY_SHARED_SECRET: process.env.PROXY_SHARED_SECRET || "",
  RAG_ENABLED: process.env.RAG_ENABLED || "false",

};
