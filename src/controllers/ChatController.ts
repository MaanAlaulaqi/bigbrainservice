import {
  Get,
  Post,
  JsonController,
  QueryParam,
  Body,
  Req,
  Res,
  UseBefore,
} from "routing-controllers";
import { Service } from "typedi";
import type { Request, Response } from "express";
import { RequireProxyMiddleware } from "../middlewares/RequireProxyMiddleware";
import { AuthContextMiddleware } from "../middlewares/AuthContextMiddleware";
import { ChatInputSchema } from "../schemas/chat.schemas";
import { OrchestratorService } from "../services/OrchestratorService";

@Service()
@JsonController("/ai")
@UseBefore(RequireProxyMiddleware, AuthContextMiddleware)
export class ChatController {
  constructor(private orchestrator: OrchestratorService) {}

  @Post("/chat")
  async chatOnce(@Req() req: Request, @Body() body: any) {
    const input = ChatInputSchema.parse(body);
    return this.orchestrator.generateOnce({
      auth: req.auth!,
      conversationId: input.conversationId,
      userText: input.text,
    });
  }

  @Get("/chat/stream")
  async streamChat(
    @Req() req: Request,
    @Res() res: Response,
    @QueryParam("conversationId") conversationId: string | undefined,
    @QueryParam("text") text: string
  ) {
    const input = ChatInputSchema.parse({ conversationId, text });

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.write(`event: ready\ndata: ${JSON.stringify({ ok: true })}\n\n`);

    let closed = false;
    req.on("close", () => { closed = true; });

    try {
      for await (const evt of this.orchestrator.stream({
        auth: req.auth!,
        conversationId: input.conversationId,
        userText: input.text,
      })) {
        if (closed) break;
        res.write(`event: ${evt.type}\ndata: ${JSON.stringify(evt.data)}\n\n`);
      }
    } catch (err: any) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: err?.message ?? "stream error" })}\n\n`);
    } finally {
      res.write(`event: done\ndata: ${JSON.stringify({ ok: true })}\n\n`);
      res.end();
    }

    return res;
  }
}
