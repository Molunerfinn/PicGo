/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    './public/index.html',
    './src/**/*.{js,ts,jsx,tsx,vue}'
  ],
  theme: {
    extend: {
      colors: {
        // Keep Tailwind's full color scales so utilities like `bg-blue-100` work.
        // Override the DEFAULT/500 tone to match PicGo's brand colors.
        blue: {
          ...colors.blue,
          DEFAULT: '#49B1F5',
          500: '#49B1F5'
        },
        green: {
          ...colors.green,
          DEFAULT: '#44B363',
          500: '#44B363'
        },
        red: {
          ...colors.red,
          DEFAULT: '#F15140',
          500: '#F15140'
        },
        yellow: {
          ...colors.yellow,
          DEFAULT: '#F1BE48',
          500: '#F1BE48'
        }
      }
    }
  },
  plugins: [],
  corePlugins: {
    // due to https://github.com/tailwindlabs/tailwindcss/issues/6602 - buttons disappear
    preflight: false
  }
}
