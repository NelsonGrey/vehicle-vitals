/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette matching the existing design tokens
        cream: '#fffaf3',
        charcoal: '#2b2b2b',
        'warm-gray': '#7a6f66',
        parchment: '#fff6e6',
        tan: '#e8decf',
        oxblood: '#8b1e2b',
        'primary-contrast': '#fff9f4',
        forest: '#0b5d3b',
        gold: '#b68c2c',
        danger: '#b42318',
        // Dark mode colors
        'deep-brown': '#14110f',
        'light-cream': '#f3efe7',
        'light-gray': '#c9c3b8',
        'dark-card': '#1d1916',
        'dark-border': '#2b2622',
        rust: '#e07a5f',
        'mint-green': '#81b29a',
        'light-gold': '#f2cc8f',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      borderRadius: {
        'xl': '0.625rem', // 10px to match existing --radius
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
  darkMode: 'media', // Use system preference for dark mode
}