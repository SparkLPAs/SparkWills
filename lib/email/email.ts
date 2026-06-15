import nodemailer, { type Transporter } from "nodemailer";

// Sends via SMTP (e.g. Namecheap Private Email). Configure in .env.local:
//   SMTP_HOST=mail.privateemail.com  SMTP_PORT=465
//   SMTP_USER=contact@sparkwills.co.uk  SMTP_PASS=<mailbox password>
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export const emailConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

// With SMTP auth, the From address should be the authenticated mailbox.
const FROM = process.env.EMAIL_FROM || "SparkWills <contact@sparkwills.co.uk>";
const REPLY_TO = process.env.EMAIL_REPLY_TO?.trim() || undefined;

let _transport: Transporter | null = null;
function transport(): Transporter {
  if (!_transport) {
    _transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // 465 = implicit TLS, 587 = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return _transport;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends an email via SMTP when configured; otherwise logs it (local stub).
 * Never throws — email failures must not break the calling flow.
 */
export async function sendEmail(msg: EmailMessage): Promise<{ sent: boolean }> {
  if (!emailConfigured) {
    console.log(
      `[email:stub] To: ${msg.to} | Subject: ${msg.subject}\n${msg.text}`,
    );
    return { sent: false };
  }
  try {
    await transport().sendMail({
      from: FROM,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    });
    return { sent: true };
  } catch (err) {
    console.error(`[email] Failed to send "${msg.subject}" to ${msg.to}:`, err);
    return { sent: false };
  }
}
