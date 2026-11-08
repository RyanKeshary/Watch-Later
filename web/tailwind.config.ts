import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        panel: "var(--surface-panel)",
        raised: "var(--surface-raised)",
        borderline: "var(--surface-border)",
        ink: {
          DEFAULT: "var(--ink)",
          muted: "var(--ink-muted)",
          subtle: "var(--ink-subtle)",
          tertiary: "var(--ink-tertiary)",
        },
        cyanbrand: "var(--accent-cyan)",
        amberbrand: "var(--accent-amber)",
      },
      fontFamily: {
        oughter: ["var(--font-oughter)", "var(--font-zolo)", "sans-serif"],
        zolo: ["var(--font-oughter)", "var(--font-zolo)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        sans: ["var(--font-sans)", "sans-serif"],
      }
    },
  },
  plugins: [],
};
export default config;
