import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)"
        },
        line: "var(--border)",
        "line-strong": "var(--border-strong)",
        content: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)"
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)"
        },
        gold: "var(--gold)",
        "player-one": "var(--player-one)",
        "player-two": "var(--player-two)",
        positive: "var(--positive)",
        warning: "var(--warning)",
        danger: "var(--danger)"
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)"
      },
      boxShadow: {
        e1: "0 1px 2px rgba(0,0,0,0.5)",
        e2: "0 10px 30px rgba(0,0,0,0.5)",
        e3: "0 26px 64px rgba(0,0,0,0.62)",
        glow: "0 0 0 1px var(--border-strong), 0 0 22px rgba(193,74,60,0.4)"
      },
      transitionDuration: {
        fast: "120ms",
        base: "200ms",
        slow: "320ms"
      }
    }
  },
  plugins: []
};

export default config;
