import { Service } from "typedi";
import { env } from "../env";

type Msg = { role: "user" | "assistant" | "system"; content: string };

function buildAuthHeaders() {
  const headers: Record<string, string> = {};
  const apiKey = env.LLM_API_KEY;
  const user = env.LLM_USERNAME;
  const pass = env.LLM_PASSWORD;
  const ver = env.LLM_API_VERSION;

  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  if (user && pass) headers["Authorization"] = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
  if (ver) headers["x-api-version"] = ver;

  return headers;
}

@Service()
export class LLMClient {
  private baseUrl = env.LLM_BASE_URL;
  private model = env.LLM_MODEL;
  private embedModel = env.LLM_EMBED_MODEL;

  async embed(text: string): Promise<number[]> {
    const url = `${this.baseUrl}/v1/embeddings`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      body: JSON.stringify({ model: this.embedModel, input: text }),
    });
    if (!res.ok) throw new Error(`Embed failed: ${res.status} ${await res.text()}`);

    const json: any = await res.json();
    // OpenAI-compatible: data[0].embedding
    return json.data?.[0]?.embedding ?? [];
  }

  async complete(args: { system: string; messages: Msg[] }): Promise<string> {
    const url = `${this.baseUrl}/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        messages: [{ role: "system", content: args.system }, ...args.messages],
      }),
    });
    if (!res.ok) throw new Error(`LLM complete failed: ${res.status} ${await res.text()}`);
    const json: any = await res.json();
    return json.choices?.[0]?.message?.content ?? "";
  }

  async *stream(args: { system: string; messages: Msg[] }): AsyncGenerator<string> {
    const url = `${this.baseUrl}/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      body: JSON.stringify({
        model: this.model,
        stream: true,
        messages: [{ role: "system", content: args.system }, ...args.messages],
      }),
    });

    if (!res.ok || !res.body) throw new Error(`LLM stream failed: ${res.status} ${await res.text()}`);

    // Parse SSE coming from LLM: lines like "data: {...}\n\n"
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split on double newline boundaries
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part.split("\n").find(l => l.startsWith("data: "));
        if (!line) continue;
        const data = line.slice("data: ".length).trim();
        if (data === "[DONE]") return;

        let parsed: any;
        try { parsed = JSON.parse(data); } catch { continue; }

        const delta = parsed.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length) {
          yield delta;
        }
      }
    }
  }
}
