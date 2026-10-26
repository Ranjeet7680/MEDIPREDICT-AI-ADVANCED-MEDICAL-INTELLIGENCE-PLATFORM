/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          container: "#167d78",
          onContainer: "#cdfffa",
          fixed: "#9af2eb",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          container: "#d1e7e3",
          onContainer: "#546865",
        },
        tertiary: {
          DEFAULT: "#0f5a98",
          foreground: "#ffffff",
          container: "#3573b3",
          onContainer: "#f2f5ff",
        },
        surface: {
          DEFAULT: "hsl(var(--surface-default))",
          dim: "hsl(var(--surface-dim))",
          bright: "hsl(var(--surface-bright))",
          low: "hsl(var(--surface-low))",
          container: "hsl(var(--surface-container))",
          high: "hsl(var(--surface-high))",
          highest: "hsl(var(--surface-highest))",
          lowest: "hsl(var(--surface-lowest))",
          variant: "hsl(var(--surface-variant))",
          on: "hsl(var(--surface-on))",
          onVariant: "hsl(var(--surface-on-variant))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          container: "#ffdad6",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.02)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0, 180, 216, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 180, 216, 0.6)" },
        },
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        scan: {
          "0%, 100%": { top: "0%" },
          "50%": { top: "100%" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        ripple: {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "wave-bar": {
          "0%, 100%": { height: "12px" },
          "50%": { height: "36px" },
        },
      },
      animation: {
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        radar: "radar 4s linear infinite",
        scan: "scan 2s ease-in-out infinite",
        "float-slow": "float-slow 4s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        ripple: "ripple 2.4s cubic-bezier(0, 0.2, 0.8, 1) infinite",
        "wave-bar": "wave-bar 1.2s ease-in-out infinite",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
  plugins: [],
};
