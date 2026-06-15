import { siteConfig } from "@/config/site.config";

/** "#162a4a" → "22 42 74" (space-separated RGB channels for `rgb(var(--x) / <alpha>)`). */
function hexToChannels(hex: string): string {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/**
 * Builds the `:root { … }` CSS that maps the configured brand palette onto the
 * CSS variables Tailwind references. Injected once in the root layout, so the
 * entire UI re-themes from site.config.ts with no per-component changes.
 */
export function brandThemeCss(): string {
  const { palette } = siteConfig.brand;
  const lines: string[] = [];

  for (const [step, hex] of Object.entries(palette.primary)) {
    lines.push(`--c-primary-${step}: ${hexToChannels(hex)};`);
  }
  for (const [step, hex] of Object.entries(palette.surface)) {
    if (hex) lines.push(`--c-surface-${step}: ${hexToChannels(hex)};`);
  }
  lines.push(`--c-success: ${hexToChannels(palette.success)};`);
  lines.push(`--c-warning: ${hexToChannels(palette.warning)};`);
  lines.push(`--c-danger: ${hexToChannels(palette.danger)};`);
  lines.push(`--background: ${palette.background};`);
  lines.push(`--foreground: ${palette.foreground};`);

  return `:root{${lines.join("")}}`;
}
