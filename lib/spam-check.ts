// Lightweight, no-new-dependency spam defenses for public lead-capture
// forms — this endpoint has no auth/CSRF (it's a public consultation
// request form), so anything scriptable can POST directly to it. Same
// bot pattern seen hitting spark-solutions' demo form (Aug 2026):
// gibberish names, valid-format-but-fake emails — a scripted bot, not a
// human. Ported here unchanged for the same reason it was needed there.
//
// Two independent, free signals. Either one alone is enough to treat a
// submission as spam. If this isn't sufficient against more sophisticated
// bots (ones that skip the honeypot and pace their requests), the real next
// step is a managed challenge like Cloudflare Turnstile — that needs a new
// account/site key, deliberately not reached for here first.
const MIN_FILL_TIME_MS = 2500;

export function isLikelySpam(raw: { honeypot?: unknown; renderedAt?: unknown }): boolean {
  // A hidden field no real visitor can see or tab into — most generic
  // form-spam bots fill every input they find in the page's HTML,
  // including ones a human would never notice.
  if (typeof raw.honeypot === "string" && raw.honeypot.trim().length > 0) return true;

  // A real visitor takes at least a few seconds to read and fill the form.
  // A bot that POSTs straight to this API without ever rendering the page
  // typically submits within milliseconds of when the client would have
  // loaded — renderedAt is stamped client-side the moment the form mounts.
  if (typeof raw.renderedAt === "number") {
    const elapsed = Date.now() - raw.renderedAt;
    if (elapsed < MIN_FILL_TIME_MS) return true;
  }

  return false;
}
