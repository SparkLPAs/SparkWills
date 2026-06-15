import { DISCLAIMER_SHORT } from "@/lib/constants";
import { siteConfig } from "@/config/site.config";
import type { EmailMessage } from "@/lib/email/email";

// Emails can't use CSS variables, so brand colours are inlined from config.
const C = {
  primary: siteConfig.brand.palette.primary[800],
  onPrimary: siteConfig.brand.palette.surface[50] ?? "#ffffff",
  bg: siteConfig.brand.palette.background,
  border: siteConfig.brand.palette.surface[300] ?? "#e8dfcc",
  text: siteConfig.brand.palette.foreground,
};

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html><body style="margin:0;background:${C.bg};font-family:Arial,Helvetica,sans-serif;color:${C.text};">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:${C.primary};color:${C.onPrimary};padding:16px 20px;border-radius:8px 8px 0 0;font-size:18px;font-weight:bold;">
      ${siteConfig.business.name}
    </div>
    <div style="background:#ffffff;border:1px solid ${C.border};border-top:none;border-radius:0 0 8px 8px;padding:24px;">
      <h1 style="font-size:20px;margin:0 0 12px;">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="font-size:11px;color:#8a8a8a;padding:16px 4px;line-height:1.5;">
      ${DISCLAIMER_SHORT}
    </p>
  </div>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${C.primary};color:${C.onPrimary};text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:bold;">${label}</a>`;
}

export function welcomeEmail(to: string, name?: string): EmailMessage {
  const greeting = name ? `Hi ${name},` : "Hello,";
  const body = `
    <p>${greeting}</p>
    <p>Welcome to ${siteConfig.business.name}. Your account is ready, and your
    progress saves automatically as you build your wills — so you can stop and
    resume any time.</p>
    <p>${button(`${process.env.NEXTAUTH_URL || ""}/dashboard`, "Go to your dashboard")}</p>
    <p style="font-size:13px;color:#555;">This service provides legal information and
    document templates only — not legal advice.</p>`;
  const text = `${greeting}

Welcome to ${siteConfig.business.name}. Your account is ready, and your progress saves automatically.

Dashboard: ${process.env.NEXTAUTH_URL || ""}/dashboard

This service provides legal information and document templates only — not legal advice.`;
  return {
    to,
    subject: `Welcome to ${siteConfig.business.name}`,
    html: layout("Welcome", body),
    text,
  };
}

export function reviewReminderEmail(
  to: string,
  dashboardUrl: string,
  name?: string,
): EmailMessage {
  const greeting = name ? `Hi ${name},` : "Hello,";
  const body = `
    <p>${greeting}</p>
    <p>It's been around three years since you created your will. It's good
    practice to review your will every 3–5 years, or sooner after a big life
    change — a marriage, divorce, new child, house move, or a change in your
    wishes.</p>
    <p>Marriage automatically revokes a will, so if you've married since, your
    will may need redoing.</p>
    <p>${button(dashboardUrl, "Review your wills")}</p>
    <p style="font-size:13px;color:#555;">If everything is still correct, there's
    nothing to do. This is a friendly reminder only.</p>`;
  const text = `${greeting}

It's been around three years since you created your will. It's good practice to review it every 3–5 years, or sooner after a marriage, divorce, new child, house move, or change in your wishes. (Marriage automatically revokes a will.)

Review your wills: ${dashboardUrl}

If everything is still correct, there's nothing to do — this is a friendly reminder only.`;
  return {
    to,
    subject: "Time to review your will",
    html: layout("A quick reminder to review your will", body),
    text,
  };
}

export function documentsReadyEmail(
  to: string,
  downloadUrl: string,
  name?: string,
): EmailMessage {
  const greeting = name ? `Hi ${name},` : "Hello,";
  const body = `
    <p>${greeting}</p>
    <p>Thank you for your payment. Your will documents have been compiled and are
    ready to download, along with your signing and storage guides.</p>
    <p>${button(downloadUrl, "Download your documents")}</p>
    <p style="font-size:13px;color:#555;">Please print each will single-sided on
    white A4 paper and follow the Signing Guide carefully — a will signed or
    witnessed incorrectly may be invalid. We recommend a solicitor reviews your
    documents before you execute them.</p>`;
  const text = `${greeting}

Thank you for your payment. Your documents are compiled and ready to download.

Download: ${downloadUrl}

Print each will single-sided on white A4 paper and follow the Signing Guide carefully. We recommend a solicitor reviews your documents before you execute them.`;
  return {
    to,
    subject: "Your documents are ready to download",
    html: layout("Your documents are ready", body),
    text,
  };
}
