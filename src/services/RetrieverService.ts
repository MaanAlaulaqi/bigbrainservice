import { Service } from "typedi";
import { AppDataSource } from "../data/dataSource";
import { ChunkEntity } from "../entities/Chunk";
import type { AuthContext } from "../types/AuthContext";
import { EmbeddingsService } from "./EmbeddingsService";

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    // @ts-ignore
    dot += a[i] * b[i];
    // @ts-ignore
    na += a[i] * a[i];
    // @ts-ignore
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

@Service()
export class RetrieverService {
  private repo = AppDataSource.getMongoRepository(ChunkEntity);

  constructor(private embeddings: EmbeddingsService) {}

  async retrieve(auth: AuthContext, query: string, topK = 6) {
    const qEmb = await this.embeddings.embed(query);

    // KISS approach for local Mongo:
    // pull recent chunks for employee and score in app.
    // (Later, swap to Mongo Atlas vector search or a vector DB.)
    const chunks = await this.repo.find({
      where: { orgId: auth.orgId, employeeId: auth.employeeId } as any,
      take: 200,
      order: { createdAt: "DESC" } as any,
    } as any);

    const scored = chunks
      .map(c => ({ c, score: cosine(qEmb, c.embedding ?? []) }))
      .sort((x, y) => y.score - x.score)
      .slice(0, topK)
      .map(x => ({
        docId: x.c.docId,
        chunkId: x.c.chunkId,
        score: Number(x.score.toFixed(4)),
        text: x.c.text,
      }));

    return scored;
  }
}
