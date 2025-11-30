/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': '#00FF00',
        'neon-green-light': '#66FF66',
        'neon-green-dark': '#00CC00',
        'neon-purple': '#A020F0',
        'neon-purple-light': '#C066F5',
        'neon-purple-dark': '#8010D0',
        'soft-white': '#f8f9fa',
        'soft-navy': '#2d3748',
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

