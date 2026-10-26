/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary: deep campus green. Used sparingly on CTAs + active states.
        brand: {
          50: "#ECF4F1",
          100: "#D1E6DF",
          200: "#A6CFC2",
          300: "#6EAE9A",
          400: "#398D77",
          500: "#1E7560",
          600: "#0F5C4A",
          700: "#0C4A3C",
          800: "#0A3B30",
          900: "#082F27",
        },
        // Accent: warm amber. Highlights, badges, small details.
        accent: {
          50: "#FEF7E6",
          100: "#FDECBF",
          200: "#FBD98A",
          300: "#F7C352",
          400: "#F2A93B",
          500: "#D98F27",
          600: "#B47219",
          700: "#8E5712",
          800: "#6B410D",
          900: "#4A2C09",
        },
        // Semantic ink + body + surface tokens.
        ink: "#14213D",      // headings
        muted: "#4A5568",    // body
        paper: "#FAF8F3",    // page background
        line: "#E7E3DA",     // card border
        success: "#1E9E6A",
        danger: "#D64545",
      },
      fontFamily: {
        sans: [
          "DM Sans",
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "Bricolage Grotesque",
          "DM Sans",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 1px 3px rgb(0 0 0 / 0.06)",
        lift: "0 8px 24px -8px rgba(15, 92, 74, 0.18)",
        hero: "0 20px 40px -16px rgba(20, 33, 61, 0.35)",
      },
      transitionTimingFunction: {
        "out-smooth": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
