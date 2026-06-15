import Link from "next/link";
import { AuthNav } from "@/components/layout/AuthNav";
import { BrandMark } from "@/components/brand/BrandMark";
import { siteConfig } from "@/config/site.config";

export function SiteHeader() {
  return (
    <header className="border-b border-cream-300 bg-cream-50/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <BrandMark />
          <span className="font-serif text-lg font-semibold text-navy-800">
            {siteConfig.business.name}
          </span>
        </Link>
        <nav>
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
