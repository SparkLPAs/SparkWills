import Link from "next/link";
import { DISCLAIMER } from "@/lib/constants";
import { siteConfig } from "@/config/site.config";

export function SiteFooter() {
  return (
    <footer className="border-t border-cream-300 bg-navy-900 text-cream-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <p className="font-serif text-lg text-cream-50">
              {siteConfig.business.name}
            </p>
            <p className="mt-1 text-sm text-cream-200">
              {siteConfig.legal.jurisdiction} only
            </p>
            <a
              href="https://www.sparklegal.co.uk"
              target="_blank"
              rel="noopener"
              className="mt-2 inline-block text-sm text-cream-200 hover:text-white"
            >
              Part of SparkLegal ↗
            </a>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/eligibility" className="hover:text-white">
              Get started
            </Link>
            <Link href="/consultation" className="hover:text-white">
              Expert consultation
            </Link>
            <Link href="/login" className="hover:text-white">
              Sign in
            </Link>
          </nav>
        </div>
        <p className="mt-8 border-t border-navy-700 pt-6 text-xs leading-relaxed text-cream-200">
          {DISCLAIMER}
        </p>
      </div>
    </footer>
  );
}
