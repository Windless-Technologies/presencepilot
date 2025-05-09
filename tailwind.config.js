module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './stories/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {}
  },
  variants: {
    extend: {}
  },
  plugins: []
}
