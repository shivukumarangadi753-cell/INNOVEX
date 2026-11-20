/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F7F3EA',
          50: '#FDFBF7',
          100: '#F7F3EA',
          200: '#EFE7D5',
          300: '#E4D8BB',
        },
        navy: {
          DEFAULT: '#12296B',
          light: '#1D3FA2',
          dark: '#0B1A45',
          surface: '#081333',
        },
        forest: {
          DEFAULT: '#2E7D4F',
          light: '#3BA065',
          dark: '#1E5234',
          bg: '#EBF5EF',
        },
        teal: {
          DEFAULT: '#1F6F8B',
          light: '#288EAF',
          dark: '#154B5E',
          bg: '#E8F3F6',
        },
        amber: {
          DEFAULT: '#B8860B',
          light: '#D99F0D',
          dark: '#825E08',
          bg: '#FAF4E4',
        },
        rust: {
          DEFAULT: '#C8441B',
          light: '#E1562B',
          dark: '#8C2F13',
          bg: '#FDF0EC',
        },
      },
      borderRadius: {
        'DEFAULT': '12px',
        'xl': '12px',
        '2xl': '16px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'card': '0 4px 20px -2px rgba(18, 41, 107, 0.07), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 25px -3px rgba(18, 41, 107, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        'float': '0 16px 32px -4px rgba(18, 41, 107, 0.12), 0 6px 12px -3px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
