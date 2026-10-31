/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Articles can use classes in their JSX (a video embed's aspect-video).
    "./content/**/*.mdx",
    // tagColorVariants in data/tags.ts holds literal class strings
    // (text-blue-500, border-blue-600, ...) that components only ever
    // reference dynamically (tagColorVariants[tag.color]) — Tailwind's
    // scanner needs to see the literal strings somewhere, so data/ has to
    // be in the scan path too, not just where they're consumed.
    "./data/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // The neutrals follow the theme: each is a channel triple in globals.css
      // that [data-theme="dark"] redefines. <alpha-value> keeps bg-black/40
      // and bg-opacity-30 working. For a black that must stay black in both
      // themes (a scrim), use bg-[#000].
      colors: {
        white: 'rgb(var(--c-white) / <alpha-value>)',
        link: {
          DEFAULT: 'rgb(var(--c-link) / <alpha-value>)',
          hover: 'rgb(var(--c-link-hover) / <alpha-value>)',
        },
        black: 'rgb(var(--c-black) / <alpha-value>)',
        gray: {
          50: 'rgb(var(--c-gray-50) / <alpha-value>)',
          100: 'rgb(var(--c-gray-100) / <alpha-value>)',
          200: 'rgb(var(--c-gray-200) / <alpha-value>)',
          300: 'rgb(var(--c-gray-300) / <alpha-value>)',
          400: 'rgb(var(--c-gray-400) / <alpha-value>)',
          500: 'rgb(var(--c-gray-500) / <alpha-value>)',
          600: 'rgb(var(--c-gray-600) / <alpha-value>)',
          700: 'rgb(var(--c-gray-700) / <alpha-value>)',
          800: 'rgb(var(--c-gray-800) / <alpha-value>)',
          900: 'rgb(var(--c-gray-900) / <alpha-value>)',
          950: 'rgb(var(--c-gray-950) / <alpha-value>)',
        },
      },
      fontFamily: {
        // --font-serif is set in globals.css;
        // the system stack behind it covers the moment before it's defined.
        serif: ['var(--font-serif)', ...defaultTheme.fontFamily.serif],
      },
      keyframes: {
        // 'slide-up' lived here for the handprint form's entrance. That sheet
        // is now drag-driven and springs via Motion, and keyframes can't be
        // interrupted mid-gesture, so the class went with it.
        'float-z': {
          '0%': { 
            transform: 'translateY(10px)',
            opacity: '0'
          },
          '40%': { 
            transform: 'translateY(-4px)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateY(-20px)',
            opacity: '0'
          }
        }
      },
      animation: {
        'float-z': 'float-z 3s ease-out forwards'
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  // Rarely needed — the neutrals switch on their own — but dark: matches the
  // data-theme the theme script sets on <html>.
  darkMode: ["selector", '[data-theme="dark"]']
};
