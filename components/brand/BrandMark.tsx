import { siteConfig } from "@/config/site.config";

/** The brand logo — a client's image if configured, else a monogram tile. */
export function BrandMark({ className = "" }: { className?: string }) {
  const { logo } = siteConfig.brand;

  if (logo.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo.src}
        alt={siteConfig.business.name}
        className={className || "h-8 w-auto"}
      />
    );
  }

  return (
    <span
      className={`grid h-8 w-8 place-items-center rounded-md bg-navy-800 font-serif text-cream-50 ${className}`}
    >
      {logo.monogram}
    </span>
  );
}
