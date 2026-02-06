import { Service } from "typedi";
import { LLMClient } from "./LLMClient";

@Service()
export class EmbeddingsService {
  constructor(private llm: LLMClient) {}
  embed(text: string) {
    return this.llm.embed(text);
  }
}
