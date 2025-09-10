/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
      colors: {
        primary: {
          DEFAULT: '#6366F1', // Indigo 500
          light: '#818CF8',   // Indigo 400
          dark: '#4F46E5',    // Indigo 600
        },
        secondary: {
          DEFAULT: '#10B981', // Emerald 500
          dark: '#059669',    // Emerald 600
        },
        accent: {
          DEFAULT: '#F59E0B', // Amber 500
          dark: '#D97706',    // Amber 600
        },
        neutral: {
          50: '#F9FAFB',  // Gray 50
          100: '#F3F4F6', // Gray 100
          200: '#E5E7EB', // Gray 200
          300: '#D1D5DB', // Gray 300
          400: '#9CA3AF', // Gray 400
          500: '#6B7280', // Gray 500
          600: '#4B5563', // Gray 600
          700: '#374151', // Gray 700
          800: '#1F2937', // Gray 800
          900: '#111827', // Gray 900
        },
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
      },
    }
  },
  plugins: [],
};
