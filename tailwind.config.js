/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        quest: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      animation: {
        "bounce-slow": "bounce 2s infinite",
        "pulse-slow":  "pulse 3s infinite",
        "float":       "float 3s ease-in-out infinite",
        "entry-pop":   "entryPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "slide-up":    "slideUp 0.4s ease-out forwards",
        "fade-in":     "fadeIn 0.3s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-6px)" },
        },
        entryPop: {
          "0%":   { transform: "scale(0) rotate(-10deg)", opacity: "0" },
          "100%": { transform: "scale(1) rotate(0deg)",  opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
