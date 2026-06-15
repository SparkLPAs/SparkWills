import type { Config } from "tailwindcss";

// Colours resolve from CSS variables injected by config/theme.ts (driven by
// config/site.config.ts). The `navy`/`cream` names are kept so existing markup
// is untouched; only the underlying values are now client-configurable.
const primary = (step: number) =>
  `rgb(var(--c-primary-${step}) / <alpha-value>)`;
const surface = (step: number) =>
  `rgb(var(--c-surface-${step}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: primary(50),
          100: primary(100),
          200: primary(200),
          300: primary(300),
          400: primary(400),
          500: primary(500),
          600: primary(600),
          700: primary(700),
          800: primary(800),
          900: primary(900),
          950: primary(950),
        },
        cream: {
          50: surface(50),
          100: surface(100),
          200: surface(200),
          300: surface(300),
        },
        success: "rgb(var(--c-success) / <alpha-value>)",
        warning: "rgb(var(--c-warning) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(16, 31, 56, 0.06), 0 8px 24px rgba(16, 31, 56, 0.06)",
      },
      maxWidth: {
        prose: "70ch",
      },
    },
  },
  plugins: [],
};
export default config;
