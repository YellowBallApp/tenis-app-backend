/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'soft-green': '#7ed957',
        'soft-mint': '#98e4b8',
        'soft-purple': '#b794f6',
        'soft-lavender': '#d5b4f7',
        'soft-white': '#f8f9fa',
        'soft-navy': '#2d3748',
        'soft-sage': '#8fbc8f',
      },
      backgroundImage: {
        'gradient-soft': 'linear-gradient(135deg, #2d3748 0%, #4a5568 50%, #5a67d8 100%)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

