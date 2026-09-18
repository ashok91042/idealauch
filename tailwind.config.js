/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#ff3038", light: "#ff5b62", dark: "#c2141c" },
        ink: { DEFAULT: "#08090b", card: "#111315", line: "#26292d" },
      },
      boxShadow: {
        glow: "0 8px 30px rgba(255,48,56,.35)",
        card: "0 18px 44px rgba(0,0,0,.6)",
      },
      keyframes: {
        fadeUp: { from: { opacity: "0", transform: "translateY(18px)" }, to: { opacity: "1", transform: "none" } },
        popIn: { from: { opacity: "0", transform: "scale(.92) translateY(14px)" }, to: { opacity: "1", transform: "none" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-28px)" } },
        slideIn: { from: { opacity: "0", transform: "translateY(24px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        fadeUp: "fadeUp .45s ease backwards",
        popIn: "popIn .3s cubic-bezier(.5,1.5,.7,1)",
        float: "float 9s ease-in-out infinite",
        slideIn: "slideIn .5s ease",
      },
    },
  },
  plugins: [],
};
