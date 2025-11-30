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
        'soft-green-light': '#9fe673',
        'soft-green-dark': '#5cb83a',
        'soft-purple': '#b794f6',
        'soft-purple-light': '#d0b4f9',
        'soft-purple-dark': '#9567e8',
        'soft-white': '#f8f9fa',
        'soft-navy': '#2d3748',
      },
      backgroundImage: {
        'gradient-soft': 'none',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

