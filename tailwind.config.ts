import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
        },
        ink: {
          900: '#1e1b4b',
          700: '#3730a3',
          500: '#6366f1',
          300: '#a5b4fc',
        },
        morning: {
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        caption: ['0.8125rem', { lineHeight: '1.4' }],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(109, 40, 217, 0.08)',
        'card-hover': '0 4px 20px rgba(109, 40, 217, 0.16)',
      },
      borderWidth: {
        3: '3px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
