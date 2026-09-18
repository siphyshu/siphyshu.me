/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // tagColorVariants in data/tags.ts holds literal class strings
    // (text-blue-500, border-blue-600, ...) that components only ever
    // reference dynamically (tagColorVariants[tag.color]) — Tailwind's
    // scanner needs to see the literal strings somewhere, so data/ has to
    // be in the scan path too, not just where they're consumed.
    "./data/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
  darkMode: "class"
};
