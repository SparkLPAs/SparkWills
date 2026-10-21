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

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5-5",
      max_tokens: 400,
      system: buildAssistantSystemPrompt(),
      messages: parsed.data.messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[assistant] Anthropic API error:", response.status, detail);
    return NextResponse.json(
      { error: "The assistant is temporarily unavailable." },
      { status: 502 },
    );
  }

  const data = await response.json();
  const reply = data.content?.[0]?.type === "text" ? data.content[0].text : "";

  return NextResponse.json({ reply });
}
