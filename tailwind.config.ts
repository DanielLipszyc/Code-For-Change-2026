import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e8f5e6",
          100: "#c5e6c0",
          200: "#9fd698",
          300: "#78c56f",
          400: "#5ab84f",
          500: "#3caa2f",
          600: "#2d9422",
          700: "#1f7d16",
          800: "#136207",
          900: "#0a4d03",
        },
        swamp: {
          orange: "#f97316",
          blue: "#0ea5e9",
          teal: "#136207",
          water: "#164e63",
        },
      },
    },
  },
  plugins: [],
};

export default config;
