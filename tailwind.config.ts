import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono:    ["'JetBrains Mono'", "monospace"],
        display: ["'Orbitron'", "sans-serif"],
        sans:    ["'DM Sans'", "sans-serif"],
      },
      colors: {
        void:    "#040608",
        surface: "#080C10",
        panel:   "#0C1118",
        border:  "#141C24",
        muted:   "#1A2430",
        neon: {
          cyan:   "#00F5FF",
          green:  "#00FF88",
          gold:   "#FFD700",
          red:    "#FF3366",
          purple: "#BF5FFF",
          blue:   "#0090FF",
          orange: "#FF6B35",
        },
        profit: "#00FF88",
        loss:   "#FF3366",
        warn:   "#FFD700",
        info:   "#00F5FF",
      },
      boxShadow: {
        "glow-cyan":   "0 0 8px rgba(0,245,255,0.4),  0 0 24px rgba(0,245,255,0.15)",
        "glow-green":  "0 0 8px rgba(0,255,136,0.4),  0 0 24px rgba(0,255,136,0.15)",
        "glow-red":    "0 0 8px rgba(255,51,102,0.4), 0 0 24px rgba(255,51,102,0.15)",
        "glow-gold":   "0 0 8px rgba(255,215,0,0.4),  0 0 24px rgba(255,215,0,0.15)",
        "glow-purple": "0 0 8px rgba(191,95,255,0.4), 0 0 24px rgba(191,95,255,0.15)",
        "panel-inset": "inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.4)",
        "card-lift":   "0 4px 24px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04)",
      },
      animation: {
        "pulse-neon": "pulseNeon 2s ease-in-out infinite",
        "ticker":     "ticker 35s linear infinite",
        "fade-in-up": "fadeInUp 0.4s ease-out forwards",
        "blink":      "blink 1.2s step-end infinite",
      },
      keyframes: {
        pulseNeon: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.55" },
        },
        ticker: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;