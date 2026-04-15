import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        background: "#0a0c10",
        surface: "#12151c",
        "surface-elevated": "#1a1e2a",
        foreground: "#e8ecf4",
        muted: "#6b7a90",
        primary: "#e8873a",
        "primary-dim": "#e8873a33",
        success: "#34c759",
        "success-dim": "#34c75933",
        border: "#1f2637",
        "border-subtle": "#171c28",
        danger: "#ef4444",
        "danger-dim": "#ef444433",
        info: "#3b82f6",
        "info-dim": "#3b82f633",
      },
      fontFamily: {
        display: ["var(--font-display)", "JetBrains Mono", "ui-monospace", "monospace"],
        body: ["var(--font-body)", "Inter", "ui-sans-serif", "system-ui"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        pill: "9999px",
      },
      letterSpacing: {
        tight: "-0.01em",
        normal: "0em",
        wide: "0.02em",
        wider: "0.05em",
      },
      boxShadow: {
        glow: "0 0 20px rgba(232, 135, 58, 0.15)",
        "glow-success": "0 0 20px rgba(52, 199, 89, 0.15)",
        "glow-danger": "0 0 20px rgba(239, 68, 68, 0.15)",
        subtle: "0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)",
        "subtle-lg": "0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.25)",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(100%)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        progressPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.4s ease-out both",
        slideUp: "slideUp 0.4s ease-out both",
        slideDown: "slideDown 0.3s ease-out both",
        scaleIn: "scaleIn 0.3s ease-out both",
        shimmer: "shimmer 2s ease-in-out infinite",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
        progressPulse: "progressPulse 2s ease-in-out infinite",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
