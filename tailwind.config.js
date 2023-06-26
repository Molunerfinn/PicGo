/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/index.html',
    './src/**/*.{js,ts,jsx,tsx,vue}'
  ],
  theme: {
    extend: {
      colors: {
        blue: '#49B1F5',
        green: '#44B363',
        red: '#F15140',
        yellow: '#F1BE48'
      }
    }
  },
  plugins: []
}
