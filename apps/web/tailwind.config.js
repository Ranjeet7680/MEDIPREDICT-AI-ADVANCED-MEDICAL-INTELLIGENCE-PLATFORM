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
        primary: {
          DEFAULT: "#00635e",
          foreground: "#ffffff",
          container: "#167d78",
          onContainer: "#cdfffa",
          fixed: "#9af2eb",
        },
        secondary: {
          DEFAULT: "#4e625f",
          foreground: "#ffffff",
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
          DEFAULT: "#f4faff",
          dim: "#c9ddea",
          bright: "#f4faff",
          low: "#e8f6ff",
          container: "#dcf1fe",
          high: "#d7ebf8",
          highest: "#d1e5f2",
          lowest: "#ffffff",
          variant: "#d1e5f2",
          on: "#0a1e27",
          onVariant: "#3e4948",
        },
        destructive: {
          DEFAULT: "#ba1a1a",
          foreground: "#ffffff",
          container: "#ffdad6",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#167d78",
          foreground: "#ffffff",
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
        wave: {
          "0%": { height: "4px" },
          "100%": { height: "24px" },
        },
      },
      animation: {
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        radar: "radar 8s linear infinite",
        scan: "scan 2.5s ease-in-out infinite",
        wave: "wave 1.2s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};
