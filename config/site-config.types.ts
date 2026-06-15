// Type contract for site.config.ts. Kept separate so the generator
// (scripts/generate-client.mjs) can write a clean value-only config file.

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400?: string;
  500?: string;
  600?: string;
  700?: string;
  800?: string;
  900?: string;
  950?: string;
}

export interface SiteConfig {
  business: {
    name: string;
    legalName: string;
    shortName: string;
    contactEmail: string;
  };

  brand: {
    logo: {
      src?: string;
      monogram: string;
    };
    palette: {
      primary: Required<ColorScale>;
      surface: ColorScale;
      background: string;
      foreground: string;
      success: string;
      warning: string;
      danger: string;
    };
    fonts: {
      display: string;
      body: string;
    };
  };

  legal: {
    jurisdiction: string;
    lawAsAt: string;
    disclaimer: string;
    disclaimerShort: string;
  };

  pricing: {
    single: { label: string; price: string; cadence: string };
    mirror: { label: string; price: string; cadence: string };
  };

  consultation: {
    signpost: string;
    leadsEmail: string;
  };

  executors: {
    /** Optional professional-executor partner offered in the Executors step. */
    recommendedExecutor: {
      /** When false, only "appoint your own" is offered. */
      enabled: boolean;
      name: string;
      address?: string;
      /** Short pitch shown when this option is selected. */
      blurb: string;
      /** Benefit bullet points. */
      benefits: string[];
      /** Exact appointment clause inserted into the will. If omitted, a standard
       *  "directors of <firm>" clause is generated from name + address. */
      clause?: string;
    };
  };

  /** Optional paid document-storage add-on offered at checkout. */
  storage: {
    enabled: boolean;
    label: string;
    price: string; // display, e.g. "£20"
    cadence: string; // "/year" | "one-off"
    blurb: string;
    /** Address the customer posts their signed original to. */
    postalAddress: string;
    instructions: string;
  };

  meta: {
    title: string;
    description: string;
  };
}
