/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cricket: {
          pitch: '#1b4332',
          grass: '#2d6a4f',
          gold: '#eab308',
          accent: '#38bdf8'
        }
      }
    },
  },
  plugins: [],
}
