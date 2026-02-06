import { Service } from "typedi";
import { AppDataSource } from "../data/dataSource";
import { Conversation, ConversationMsg } from "../entities/Conversation";
import type { AuthContext } from "../types/AuthContext";

@Service()
export class ConversationStore {
  private repo = AppDataSource.getMongoRepository(Conversation);

  async createConversation(auth: AuthContext) {
    const now = new Date().toISOString();
    const conversationId = `c_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

    await this.repo.insertOne({
      orgId: auth.orgId,
      employeeId: auth.employeeId,
      conversationId,
      messages: [],
      createdAt: now,
      updatedAt: now,
    } as any);

    return conversationId;
  }

  async getRecentMessages(conversationId: string, auth: AuthContext, limit = 12) {
    const convo = await this.repo.findOneBy({ conversationId, orgId: auth.orgId, employeeId: auth.employeeId } as any);
    if (!convo) throw new Error("Conversation not found");
    return convo.messages.slice(-limit).map(m => ({ role: m.role, content: m.content }));
  }

  async appendMessage(conversationId: string, auth: AuthContext, msg: Omit<ConversationMsg, "ts">) {
    const now = new Date().toISOString();
    const item: ConversationMsg = { ...msg, ts: now };

    const convo = await this.repo.findOneBy({ conversationId, orgId: auth.orgId, employeeId: auth.employeeId } as any);
    if (!convo) throw new Error("Conversation not found");

    convo.messages.push(item);
    convo.updatedAt = now;

    await this.repo.update(convo._id as any, { ...convo } as any);
  }
}
