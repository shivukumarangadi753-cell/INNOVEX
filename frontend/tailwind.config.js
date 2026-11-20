/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F7F3EA",
        navy: "#12296B",
        forest: "#2E7D4F",
        water: "#1F6F8B",
        amber: "#B8860B",
        alertRust: "#C8441B",
      },
      borderRadius: {
        DEFAULT: "12px",
        lg: "12px",
        xl: "12px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
