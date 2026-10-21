"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site.config";

// Marketing/sales assistant only — never shown once someone is inside the
// authenticated app actually creating their documents.
const HIDDEN_PREFIXES = ["/dashboard", "/projects", "/account", "/admin", "/login", "/register"];

const SUGGESTIONS = [
  "What does this cost?",
  "Am I eligible?",
  "How long does it take?",
  "Can someone call me instead?",
];

type ChatMessage = { role: "user" | "assistant"; content: string };

export function SiteAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) {
    return null;
  }

  async function sendText(text: string) {
    if (!text || sending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Sorry, I'm having trouble replying right now — please try again, or use the Contact Us option." },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, I'm having trouble replying right now — please try again, or use the Contact Us option." },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function sendLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    if (!name || !email) return;
    try {
      await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, source: "ai-assistant" }),
      });
      setLeadSent(true);
      setShowLeadForm(false);
    } catch {
      // Best-effort — no need to surface a failure here beyond staying on the form.
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[34rem] w-80 flex-col overflow-hidden rounded-xl border border-cream-300 bg-white shadow-card sm:w-96">
          <div className="flex items-center gap-3 border-b border-cream-300 bg-navy-800 px-4 py-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-base text-white">
              ✦
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-serif text-sm font-semibold text-white">
                {siteConfig.business.shortName} Assistant
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/85">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                AI assistant · replies in seconds
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-lg text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <p className="text-sm text-navy-700">
                Hi — ask me anything about pricing, how it works, or whether{" "}
                {siteConfig.business.shortName} is right for you.
              </p>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "ml-auto bg-navy-700 text-white"
                      : "bg-cream-100 text-navy-800"
                  }`}
                >
                  {m.content}
                </div>
              ))
            )}
            {sending && <p className="text-sm text-navy-500">Typing…</p>}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendText(q)}
                  disabled={sending}
                  className="rounded-full border border-navy-700 px-3 py-1.5 text-xs text-navy-700 hover:bg-cream-100"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t border-cream-300 px-4 py-3">
            {leadSent ? (
              <p className="text-sm text-success">Thanks — we&apos;ll be in touch.</p>
            ) : showLeadForm ? (
              <form
                onSubmit={sendLead}
                className="flex flex-col gap-2"
              >
                <input
                  name="name"
                  placeholder="Your name"
                  required
                  className="rounded border border-cream-300 px-2 py-1.5 text-sm"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Your email"
                  required
                  className="rounded border border-cream-300 px-2 py-1.5 text-sm"
                />
                <button type="submit" className="btn-secondary text-sm">
                  Request a call back
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowLeadForm(true)}
                className="text-xs text-navy-600 underline hover:text-navy-800"
              >
                Prefer to talk to a person? Leave your details
              </button>
            )}

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendText(input.trim())}
                placeholder={`Ask about ${siteConfig.business.shortName}…`}
                maxLength={2000}
                className="flex-1 rounded border border-cream-300 px-3 py-2 text-sm"
              />
              <button onClick={() => sendText(input.trim())} disabled={sending} className="btn-primary text-sm">
                Send
              </button>
            </div>
            <p className="text-center text-[10px] text-navy-500">
              AI can make mistakes. Please don&apos;t share sensitive personal data.{" "}
              <a href="/privacy" className="underline">
                Privacy
              </a>
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-primary rounded-full px-5 py-3 shadow-card"
        aria-label="Open chat assistant"
      >
        {open ? "Close" : "💬 Ask a question"}
      </button>
    </div>
  );
}
