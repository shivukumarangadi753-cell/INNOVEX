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
          DEFAULT: '#F0F5F2',
          50: '#F8FAF9',
          100: '#F0F5F2',
          200: '#E2EDE7',
          300: '#D1E3D9',
        },
        navy: {
          DEFAULT: '#0D2822',
          light: '#143D34',
          dark: '#081C17',
          surface: '#061612',
        },
        forest: {
          DEFAULT: '#16A34A',
          light: '#22C55E',
          dark: '#0D2822',
          deep: '#081C17',
          bg: '#EAF5EE',
        },
        sidebar: {
          DEFAULT: '#0B241E',
          dark: '#071814',
          light: '#13382F',
          active: '#16A34A',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        teal: {
          DEFAULT: '#0D9488',
          light: '#14B8A6',
          dark: '#0F766E',
          bg: '#E6F7F5',
        },
        amber: {
          DEFAULT: '#D97706',
          light: '#F59E0B',
          dark: '#B45309',
          bg: '#FEF3C7',
        },
        rust: {
          DEFAULT: '#DC2626',
          light: '#EF4444',
          dark: '#B91C1C',
          bg: '#FEE2E2',
        },
      },
      borderRadius: {
        'DEFAULT': '12px',
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(11, 36, 30, 0.04), 0 1px 2px -1px rgba(11, 36, 30, 0.03)',
        'card': '0 4px 14px -2px rgba(11, 36, 30, 0.05), 0 2px 4px -2px rgba(11, 36, 30, 0.03)',
        'float': '0 12px 24px -4px rgba(11, 36, 30, 0.12), 0 4px 6px -4px rgba(11, 36, 30, 0.05)',
        'glow-emerald': '0 0 20px -3px rgba(22, 163, 74, 0.35)',
      },
    },
  },
  plugins: [],
}
