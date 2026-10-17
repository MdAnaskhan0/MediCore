export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        ink: { 950: '#0b2528', 900: '#0f2f33', 800: '#16414a', 700: '#1d535e' },
        brand: { 50: '#e8f6f3', 100: '#c9ebe4', 500: '#12a08a', 600: '#0e8a76', 700: '#0b7160' },
        paper: '#f2f6f6',
      },
    },
  },
  plugins: [],
};
