import { z } from "zod";

export const ChatInputSchema = z.object({
  conversationId: z.string().optional(),
  text: z.string().min(1),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;
