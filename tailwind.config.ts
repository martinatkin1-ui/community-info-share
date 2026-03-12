import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        wm: {
          slate: "#2b3139",
          iron: "#4c5966",
          mist: "#dbe3e7",
          recovery: "#7bbf9a",
          teal: "#3f8f8d",
          lake: "#77a7b7",
          cream: "#f7f3ea",
          clay: "#c97e63",
        },
        brand: {
          coral: "#c97e63",
          amber: "#f0b97a",
          lime: "#7bbf9a",
          sky: "#77a7b7",
          violet: "#a6b2cc",
          blush: "#f3d7ca",
          cream: "#f7f3ea",
          slate: "#2b3139",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Avenir Next", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        "wm-soft": "0 10px 30px rgba(26, 40, 53, 0.10)",
        "wm-glass": "0 10px 30px rgba(18, 28, 38, 0.18)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [
    forms,
    typography,
    plugin(({ addUtilities }) => {
      addUtilities({
        ".masonry-2": { columnCount: "2", columnGap: "1rem" },
        ".masonry-3": { columnCount: "3", columnGap: "1rem" },
        ".masonry-4": { columnCount: "4", columnGap: "1rem" },
        ".break-inside-avoid": { breakInside: "avoid" },
        ".text-shadow-soft": { textShadow: "0 1px 10px rgba(0,0,0,0.25)" },
      });
    }),
  ],
};
export default config;
