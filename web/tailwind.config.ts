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
