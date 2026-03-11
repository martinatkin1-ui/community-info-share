import type { Config } from "tailwindcss";
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
        brand: {
          coral:  "#FF6B6B",
          amber:  "#FFB347",
          lime:   "#B5EAD7",
          sky:    "#A8D8EA",
          violet: "#C7B8EA",
          blush:  "#FFD6E0",
          cream:  "#FFFBF0",
          slate:  "#2D3142",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        ".masonry-2": { columnCount: "2", columnGap: "1rem" },
        ".masonry-3": { columnCount: "3", columnGap: "1rem" },
        ".masonry-4": { columnCount: "4", columnGap: "1rem" },
        ".break-inside-avoid": { breakInside: "avoid" },
      });
    }),
  ],
};
export default config;
