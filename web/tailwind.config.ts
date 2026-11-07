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
        paper: "var(--color-paper)",
        "paper-2": "var(--color-paper-2)",
        "paper-3": "var(--color-paper-3)",
        ink: "var(--color-ink)",
        "ink-2": "var(--color-ink-2)",
        muted: "var(--color-muted)",
        rule: "var(--color-rule)",
        accent: "var(--color-accent)",
        "accent-deep": "var(--color-accent-deep)",
        "accent-ink": "var(--color-accent-ink)",
        surface: {
          base: "#0B0B0B",
          card: "#1A1A1A",
          border: "#333333",
          muted: "#6B6B6B",
          light: "#D9D9D9",
          pure: "#FFFFFF"
        }
      },
      fontFamily: {
        zolo: ["var(--font-zolo)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        sans: ["var(--font-sans)", "sans-serif"],
      }
    },
  },
  plugins: [],
};
export default config;
