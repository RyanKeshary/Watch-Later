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
        canvas: "#090A0F",
        slate: {
          surface: "#12151F",
          elevated: "#181C2A",
          border: "rgba(255, 255, 255, 0.08)",
        },
        ink: {
          DEFAULT: "#F7F8F8",
          muted: "#D0D6E0",
          subtle: "#8A8F98",
          tertiary: "#5C616B",
        },
        accent: {
          cyan: "#00F0FF",
          amber: "#F59E0B",
        },
        surface: {
          base: "#090A0F",
          card: "#12151F",
          border: "rgba(255, 255, 255, 0.08)",
          muted: "#8A8F98",
          light: "#D0D6E0",
          pure: "#F7F8F8"
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
