/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lime: {
          400: '#C4F135'
        },
        green: {
          900: '#25392B',
          950: '#0E2515',
          1000: '#07130B',
        }
      },
      fontFamily: {
        manrope: ['Manrope-Extrabold', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

