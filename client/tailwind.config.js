/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: "#0a0a0c",
          card: "#121217",
          gold: "#d4af37",
          goldLight: "#f3e5ab",
          cyan: "#00f0ff",
          cyanLight: "#e0ffff",
          gray: "#71717a",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Orbitron", "sans-serif"],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(212, 175, 55, 0.4)',
        'cyan-glow': '0 0 15px rgba(0, 240, 255, 0.4)',
      }
    },
  },
  plugins: [],
}
