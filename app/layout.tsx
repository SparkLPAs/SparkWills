import type { Metadata } from "next";
// Font swap for a client is done HERE (next/font requires static imports).
// Swap these two imports + the variable usages to change the type pairing.
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site.config";
import { brandThemeCss } from "@/config/theme";
import { Providers } from "@/components/providers/Providers";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.meta.title,
    template: `%s | ${siteConfig.business.shortName}`,
  },
  description: siteConfig.meta.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body className={`${display.variable} ${body.variable} min-h-screen flex flex-col`}>
        {/* Per-client brand palette → CSS variables (see config/site.config.ts) */}
        <style dangerouslySetInnerHTML={{ __html: brandThemeCss() }} />
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
