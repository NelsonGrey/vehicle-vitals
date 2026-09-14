/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Slate Auto - Primary color palette. Steps 50/200/500/600/700/900
        // carry brand meaning (background/border/muted/primary/text) and
        // are repointed at the palette CSS variables defined in styles.css
        // -- every other step stays literal Tailwind, unaffected by the
        // active palette. See styles.css's "Color palettes" comment block
        // for the full rationale (in particular why dark:*-slate-700 etc.
        // elsewhere in the app are unaffected by this).
        slate: {
          50: 'var(--vv-slate-50)',
          100: '#f1f5f9',
          200: 'var(--vv-slate-200)',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: 'var(--vv-slate-500)',
          600: 'var(--vv-slate-600)',
          700: 'var(--vv-slate-700)',
          800: '#1e293b',
          900: 'var(--vv-slate-900)',
          950: '#020617',
        },
        // Brand accent -- Tailwind's default blue scale, except the two
        // steps actually used as solid accent color (600/700), which
        // follow the palette the same way slate-700 does above.
        blue: {
          600: 'var(--vv-blue-600)',
          700: 'var(--vv-blue-700)',
        },
        // Semantic colors using slate palette
        primary: {
          50: 'var(--vv-slate-50)',
          100: '#f1f5f9',
          200: 'var(--vv-slate-200)',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: 'var(--vv-slate-500)', // Main primary
          600: 'var(--vv-slate-600)',
          700: 'var(--vv-slate-700)',
          800: '#1e293b',
          900: 'var(--vv-slate-900)',
        },
        // Accent colors
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Main accent
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Warning/Danger colors
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Main warning
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Main danger
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
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