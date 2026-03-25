/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#45A191',
        appBg: '#F1F2F4',
        appBgDark: '#22262A',
        appText: '#111827',
        appMuted: '#8A94A4',
        appStroke: '#DCE2E8',
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 6px 22px rgba(15, 23, 42, 0.06)',
        soft: '0 2px 10px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
}

