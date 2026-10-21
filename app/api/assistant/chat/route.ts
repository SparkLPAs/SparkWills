import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildAssistantSystemPrompt } from "@/lib/assistant/system-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

// Capped conversation length and message size: this is a public, unauthenticated
// endpoint, so these limits exist to bound cost/abuse, not for UX.
const Schema = z.object({
  messages: z.array(MessageSchema).min(1).max(20),
});

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Assistant is not configured." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-5-5",
        max_tokens: 1024,
        // Low effort: this is a short, friendly FAQ-style reply, not a
        // reasoning task — keeps thinking overhead out of the response.
        output_config: { effort: "low" },
        system: buildAssistantSystemPrompt(),
        messages: parsed.data.messages,
      }),
    });
  } catch (err) {
    console.error("[assistant] Fetch to Anthropic failed:", err);
    return NextResponse.json(
      { error: "The assistant is temporarily unavailable." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[assistant] Anthropic API error:", response.status, detail);
    return NextResponse.json(
      { error: "The assistant is temporarily unavailable." },
      { status: 502 },
    );
  }

  const data = await response.json();
  // Thinking may put a non-text block first — find the actual text reply
  // rather than assuming content[0] is it.
  const textBlock = Array.isArray(data.content)
    ? data.content.find((b: { type: string; text?: string }) => b.type === "text")
    : null;
  const reply = textBlock?.text ?? "";
  if (!reply) {
    console.error("[assistant] No text block in Anthropic response:", JSON.stringify(data));
  }

  return NextResponse.json({ reply });
}
