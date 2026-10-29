/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary: deep royal blue. Used on CTAs, links, headings.
        brand: {
          50: "#EEF2FA",
          100: "#D7E0F1",
          200: "#AEC0E3",
          300: "#829DD1",
          400: "#5679BE",
          500: "#325CAE",
          600: "#1A3A8F", // primary royal blue (headings, buttons, links)
          700: "#152E72",
          800: "#0F2256",
          900: "#0A163A",
        },
        // Accent: gold. Section labels, highlights, badges, button hover.
        accent: {
          50: "#FCF7E6",
          100: "#F8EDC2",
          200: "#F0D97E",
          300: "#E0B84C", // lighter gold — for dark backgrounds + photo overlays
          400: "#D4AC37",
          500: "#C9A227", // primary gold — for small accent text on light bg
          600: "#A68219",
          700: "#7A6013",
          800: "#4F3E0C",
          900: "#2A2107",
        },
        // Semantic ink + body + surface tokens.
        ink: "#1A3A8F",      // headings — deep royal blue
        muted: "#1E2A4A",    // body text — dark navy, high contrast on white
        paper: "#F7F8FB",    // page background — cool off-white
        line: "#DDE3EC",     // card border — soft blue-gray
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
        lift: "0 8px 24px -8px rgba(26, 58, 143, 0.22)",
        hero: "0 20px 40px -16px rgba(26, 58, 143, 0.35)",
      },
      transitionTimingFunction: {
        "out-smooth": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
