import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f8fa",
          100: "#eef0f4",
          200: "#dde1e9",
          300: "#bcc3d0",
          400: "#8a93a6",
          500: "#5b6478",
          600: "#3f4757",
          700: "#2c323f",
          800: "#1c2029",
          900: "#0f1218",
        },
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#b8d0ff",
          300: "#8cb1ff",
          400: "#5d8aff",
          500: "#3a66f5",
          600: "#274ad6",
          700: "#1f3aa8",
          800: "#1c3286",
          900: "#1a2d6c",
        },
        success: {
          50: "#ecfdf5",
          500: "#10b981",
          700: "#047857",
        },
        danger: {
          50: "#fef2f2",
          500: "#ef4444",
          700: "#b91c1c",
        },
        warn: {
          50: "#fffbeb",
          500: "#f59e0b",
          700: "#b45309",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 18 24 / 0.04), 0 1px 3px 0 rgb(15 18 24 / 0.06)",
        soft: "0 4px 24px -8px rgb(15 18 24 / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
