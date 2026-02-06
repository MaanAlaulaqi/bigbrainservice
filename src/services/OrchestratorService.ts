import { Service } from "typedi";
import type { AuthContext } from "../types/AuthContext";
import { ConversationStore } from "./ConversationStore";
import { LLMClient } from "./LLMClient";
import { RetrieverService } from "./RetrieverService";
import { PromptBuilderService } from "./PromptBuilderService";
import { env } from "../env";

type StreamEvent =
  | { type: "assistant_start"; data: { messageId: string; conversationId: string } }
  | { type: "assistant_delta"; data: { messageId: string; delta: string } }
  | { type: "assistant_end"; data: { messageId: string } }
  | { type: "context"; data: { usedSnippets: any[] } };

@Service()
export class OrchestratorService {
  constructor(
    private convo: ConversationStore,
    private llm: LLMClient,
    private retriever: RetrieverService,
    private prompts: PromptBuilderService
  ) {}

  async generateOnce(args: { auth: AuthContext; conversationId?: string | undefined; userText: string }) {
    const conversationId = args.conversationId ?? await this.convo.createConversation(args.auth);
    const history = await this.convo.getRecentMessages(conversationId, args.auth);

const snippets = env.RAG_ENABLED === "true"
  ? await this.retriever.retrieve(args.auth, args.userText, 6)
  : [];
    const contextBlock = this.prompts.buildContextBlock(snippets);

    const system = this.prompts.constitution();
    const reply = await this.llm.complete({
      system,
      messages: [
        ...history,
        { role: "system", content: `Context snippets:\n${contextBlock}` },
        { role: "user", content: args.userText },
      ],
    });

    await this.convo.appendMessage(conversationId, args.auth, { role: "user", content: args.userText });
    await this.convo.appendMessage(conversationId, args.auth, { role: "assistant", content: reply });

    return { conversationId, reply, usedSnippets: snippets };
  }

  async *stream(args: { auth: AuthContext; conversationId?: string | undefined; userText: string }): AsyncGenerator<StreamEvent> {
    const conversationId = args.conversationId ?? await this.convo.createConversation(args.auth);
    const messageId = `a_${Date.now().toString(36)}`;

    const history = await this.convo.getRecentMessages(conversationId, args.auth);

const snippets = env.RAG_ENABLED === "true"
  ? await this.retriever.retrieve(args.auth, args.userText, 6)
  : [];
    const contextBlock = this.prompts.buildContextBlock(snippets);
    const system = this.prompts.constitution();

    await this.convo.appendMessage(conversationId, args.auth, { role: "user", content: args.userText });

    yield { type: "assistant_start", data: { messageId, conversationId } };
    yield { type: "context", data: { usedSnippets: snippets } };

    let full = "";
    for await (const delta of this.llm.stream({
      system,
      messages: [
        ...history,
        { role: "system", content: `Context snippets:\n${contextBlock}` },
        { role: "user", content: args.userText },
      ],
    })) {
      full += delta;
      yield { type: "assistant_delta", data: { messageId, delta } };
    }

    yield { type: "assistant_end", data: { messageId } };

    await this.convo.appendMessage(conversationId, args.auth, { role: "assistant", content: full });
  }
}
