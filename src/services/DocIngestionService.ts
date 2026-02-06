import { Service } from "typedi";
import fs from "fs/promises";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { v4 as uuidv4 } from "uuid";
import { AppDataSource } from "../data/dataSource";
import { DocumentEntity } from "../entities/Document";
import { ChunkEntity } from "../entities/Chunk";
import type { AuthContext } from "../types/AuthContext";
import { EmbeddingsService } from "./EmbeddingsService";

function chunkText(text: string, maxChars = 900) {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    chunks.push(clean.slice(i, i + maxChars));
    i += maxChars;
  }
  return chunks;
}

@Service()
export class DocIngestionService {
  private docsRepo = AppDataSource.getMongoRepository(DocumentEntity);
  private chunksRepo = AppDataSource.getMongoRepository(ChunkEntity);

  constructor(private embeddings: EmbeddingsService) {}

  async registerUpload(auth: AuthContext, meta: { filename: string; mimeType: string; kind: any; source?: string | undefined }) {
    const now = new Date().toISOString();
    const docId = `d_${uuidv4()}`;

    await this.docsRepo.insertOne({
      orgId: auth.orgId,
      employeeId: auth.employeeId,
      docId,
      filename: meta.filename,
      mimeType: meta.mimeType,
      kind: meta.kind,
      source: meta.source,
      status: "uploaded",
      createdAt: now,
      updatedAt: now,
    } as any);

    return docId;
  }

  async processFile(auth: AuthContext, docId: string, filePath: string, mimeType: string) {
    const now = new Date().toISOString();

    try {
      const buffer = await fs.readFile(filePath);

      let text = "";
      if (mimeType === "application/pdf") {
        // @ts-ignore
        const parsed = await pdfParse(buffer);
        text = parsed.text ?? "";
      } else if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value ?? "";
      } else if (mimeType.startsWith("text/")) {
        text = buffer.toString("utf8");
      } else {
        throw new Error(`Unsupported mimeType: ${mimeType}`);
      }

      const pieces = chunkText(text, 900);

      // embed + store
      for (let idx = 0; idx < pieces.length; idx++) {
        const chunkId = `ch_${docId}_${idx}`;
        const piece = pieces[idx];
        if (!piece) continue;
        const emb = await this.embeddings.embed(piece);

        await this.chunksRepo.insertOne({
          orgId: auth.orgId,
          employeeId: auth.employeeId,
          docId,
          chunkId,
          text: pieces[idx],
          embedding: emb,
          createdAt: now,
        } as any);
      }

      // mark processed
      const doc = await this.docsRepo.findOneBy({ docId, orgId: auth.orgId, employeeId: auth.employeeId } as any);
      if (doc) {
        await this.docsRepo.update(doc._id as any, { ...doc, status: "processed", updatedAt: now } as any);
      }

      return { ok: true, chunks: pieces.length };
    } catch (e: any) {
      const doc = await this.docsRepo.findOneBy({ docId, orgId: auth.orgId, employeeId: auth.employeeId } as any);
      if (doc) {
        await this.docsRepo.update(doc._id as any, { ...doc, status: "failed", error: e?.message ?? "failed", updatedAt: now } as any);
      }
      throw e;
    }
  }
}
