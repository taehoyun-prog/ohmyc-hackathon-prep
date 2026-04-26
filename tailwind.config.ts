import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        omc: {
          tint: "var(--omc-tint)",
          "tint-deep": "var(--omc-tint-deep)",
          "tint-soft": "var(--omc-tint-soft)",
          "tint-paper": "var(--omc-tint-paper)",
        },
        canvas: {
          light: "var(--bg-canvas-light)",
          dark: "var(--bg-canvas-dark)",
          white: "var(--bg-canvas-white)",
        },
        graphite: {
          a: "var(--bg-graphite-a)",
          b: "var(--bg-graphite-b)",
          c: "var(--bg-graphite-c)",
          d: "var(--bg-graphite-d)",
        },
        fg: {
          1: "var(--fg-1)",
          2: "var(--fg-2)",
          3: "var(--fg-3)",
          "on-dark": "var(--fg-on-dark)",
        },
        border: {
          soft: "var(--border-soft)",
          mid: "var(--border-mid)",
        },
      },
      fontFamily: {
        display: "var(--font-display)",
        text: "var(--font-text)",
        mono: "var(--font-mono)",
      },
      fontSize: {
        "hero-xl": ["var(--t-hero-xl)", { lineHeight: "var(--lh-hero-xl)", letterSpacing: "var(--tr-hero-xl)" }],
        "hero-l": ["var(--t-hero-l)", { lineHeight: "var(--lh-hero-l)", letterSpacing: "var(--tr-hero-l)" }],
        "section": ["var(--t-section)", { lineHeight: "var(--lh-section)", letterSpacing: "var(--tr-section)" }],
        "product": ["var(--t-product)", { lineHeight: "var(--lh-product)", letterSpacing: "var(--tr-product)" }],
        "feature": ["var(--t-feature)", { lineHeight: "var(--lh-feature)", letterSpacing: "var(--tr-feature)" }],
        "promo": ["var(--t-promo)", { lineHeight: "var(--lh-promo)", letterSpacing: "var(--tr-promo)" }],
        "card-title": ["var(--t-card-title)", { lineHeight: "var(--lh-card)", letterSpacing: "var(--tr-card)" }],
        "utility": ["var(--t-utility)", { lineHeight: "var(--lh-utility)", letterSpacing: "var(--tr-utility)" }],
        "subhead": ["var(--t-subhead)", { lineHeight: "var(--lh-subhead)", letterSpacing: "var(--tr-subhead)" }],
        "body": ["var(--t-body)", { lineHeight: "var(--lh-body)", letterSpacing: "var(--tr-body)" }],
        "control": ["var(--t-control)", { lineHeight: "var(--lh-control)", letterSpacing: "var(--tr-control)" }],
        "micro": ["var(--t-micro)", { lineHeight: "var(--lh-micro)", letterSpacing: "var(--tr-micro)" }],
      },
      fontWeight: {
        light: "300",
        regular: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      borderRadius: {
        tag: "var(--r-tag)",
        control: "var(--r-control)",
        card: "var(--r-card)",
        "card-lg": "var(--r-card-lg)",
        module: "var(--r-module)",
        spotlight: "var(--r-spotlight)",
        capsule: "var(--r-capsule)",
      },
      spacing: {
        "s-1": "var(--s-1)",
        "s-2": "var(--s-2)",
        "s-3": "var(--s-3)",
        "s-4": "var(--s-4)",
        "s-5": "var(--s-5)",
        "s-6": "var(--s-6)",
        "s-7": "var(--s-7)",
        "s-8": "var(--s-8)",
        "s-9": "var(--s-9)",
        "s-10": "var(--s-10)",
        "s-11": "var(--s-11)",
        "s-12": "var(--s-12)",
        "s-13": "var(--s-13)",
      },
      boxShadow: {
        "el-1": "var(--el-1)",
        "el-2": "var(--el-2)",
        "el-3": "var(--el-3)",
        "el-warm": "var(--el-warm)",
      },
      animation: {
        breathe: "omc-breathe var(--dur-breathe) var(--ease-soft) infinite",
        "pulse-tap": "omc-pulse var(--dur-pulse) var(--ease-soft)",
      },
    },
  },
  plugins: [],
};

export default config;
