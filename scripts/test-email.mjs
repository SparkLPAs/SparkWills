// Verifies the SMTP connection and sends a test email. Reads config from .env.local.
import { promises as fs } from "fs";
import nodemailer from "nodemailer";

const env = await fs.readFile(".env.local", "utf8");
const pick = (k) => env.match(new RegExp(`${k}="?([^"\\n\\r]*)"?`))?.[1] ?? "";

const host = pick("SMTP_HOST");
const port = Number(pick("SMTP_PORT")) || 465;
const user = pick("SMTP_USER");
const pass = pick("SMTP_PASS");
const from = pick("EMAIL_FROM") || user;
const to = process.argv[2] || "jasonstretch66@gmail.com";

if (!host || !user || !pass) {
  console.error(
    "SMTP not configured in .env.local. Need SMTP_HOST, SMTP_USER and SMTP_PASS (paste your mailbox password into SMTP_PASS).",
  );
  process.exit(1);
}

const t = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

console.log(`Connecting to ${host}:${port} as ${user} …`);
try {
  await t.verify();
  console.log("✅ SMTP login OK.");
} catch (err) {
  console.error("❌ SMTP login failed:", err.message);
  process.exit(1);
}

console.log(`Sending test email from ${from} to ${to} …`);
const r = await t.sendMail({
  from,
  to,
  subject: "SparkWills email test ✅",
  text: "If you can read this, SparkWills email (via Namecheap SMTP) is live.",
  html: "<p>If you can read this, <strong>SparkWills email</strong> (via Namecheap SMTP) is live.</p>",
});
console.log("✅ Sent. Message id:", r.messageId);
