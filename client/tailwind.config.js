/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#DA291C',
          redLight: '#F9E2E0',
          white: '#FFFFFF',
          lightGrey: '#C7C9C7',
          silver: '#8A8D8F',
          charcoal: '#54585A',
          bg: '#F5F5F5',
          surface: '#FFFFFF',
          surfaceAlt: '#F0F0F0',
          border: '#C7C9C7',
          text: '#54585A',
          textMuted: '#8A8D8F',
          textLight: '#C7C9C7',
          green: '#16a34a',
          blue: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      borderRadius: {
        crm: '12px',
      },
    },
  },
  plugins: [],
}
