/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          black: "#000000",
          dark: "#050a14",
          cyan: "#38bdf8",
          border: "#1e293b",
        }
      }
    },
  },
  plugins: [],
}